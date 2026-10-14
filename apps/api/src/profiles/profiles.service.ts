import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, isValidObjectId } from 'mongoose';
import { allows } from '../common/maturity.js';
import type { TitleCard } from '../common/title-views.js';
import { CatalogService } from '../catalog/catalog.service.js';
import { AVATAR_COLORS } from '../auth/auth.service.js';
import {
  Account, KIDS_MAX_MATURITY, Profile, Progress, WatchlistItem, type ProfileDocument,
} from '../schemas/account.schema.js';
import { Title, type Maturity } from '../schemas/title.schema.js';

export const MAX_PROFILES = 5;

@Injectable()
export class ProfilesService {
  constructor(
    @InjectModel(Account.name) private readonly accounts: Model<Account>,
    @InjectModel(Profile.name) private readonly profiles: Model<Profile>,
    @InjectModel(WatchlistItem.name) private readonly watchlist: Model<WatchlistItem>,
    @InjectModel(Progress.name) private readonly progress: Model<Progress>,
    @InjectModel(Title.name) private readonly titles: Model<Title>,
    private readonly catalog: CatalogService,
  ) {}

  static maxMaturity(profile: Pick<Profile, 'kids'>): Maturity {
    return profile.kids ? KIDS_MAX_MATURITY : '18+';
  }

  async list(accountId: string) {
    const docs = await this.profiles.find({ accountId: new Types.ObjectId(accountId) }).sort({ createdAt: 1 }).lean();
    return docs.map((p) => ({
      id: p._id.toString(), name: p.name, kids: p.kids, avatarColor: p.avatarColor,
      maxMaturity: ProfilesService.maxMaturity(p),
    }));
  }

  async create(accountId: string, name: string, kids: boolean) {
    const owner = new Types.ObjectId(accountId);
    const count = await this.profiles.countDocuments({ accountId: owner });
    if (count >= MAX_PROFILES) throw new BadRequestException(`An account can have at most ${MAX_PROFILES} profiles`);
    const p = await this.profiles.create({
      accountId: owner, name: name.trim(), kids, avatarColor: AVATAR_COLORS[count % AVATAR_COLORS.length],
    });
    return { id: p._id.toString(), name: p.name, kids: p.kids, avatarColor: p.avatarColor, maxMaturity: ProfilesService.maxMaturity(p) };
  }

  async remove(accountId: string, profileId: string) {
    await this.owned(accountId, profileId);
    const count = await this.profiles.countDocuments({ accountId: new Types.ObjectId(accountId) });
    if (count <= 1) throw new BadRequestException('An account needs at least one profile');
    const pid = new Types.ObjectId(profileId);
    await Promise.all([
      this.profiles.deleteOne({ _id: pid }),
      this.watchlist.deleteMany({ profileId: pid }),
      this.progress.deleteMany({ profileId: pid }),
    ]);
  }

  /** Every profile-scoped call goes through here: the profile must belong to the signed-in account. */
  async owned(accountId: string, profileId: string): Promise<ProfileDocument> {
    if (!isValidObjectId(profileId)) throw new NotFoundException('Profile not found');
    const profile = await this.profiles.findById(profileId);
    if (!profile) throw new NotFoundException('Profile not found');
    if (!profile.accountId.equals(accountId)) throw new ForbiddenException('Not your profile');
    return profile;
  }

  /**
   * Per-viewer overlay for titles already rendered from the shared catalog:
   * watchlist membership, resume progress and whether the account's plan covers each title.
   */
  async overlay(accountId: string, profileId: string, slugs: string[]) {
    const profile = await this.owned(accountId, profileId);
    const unique = [...new Set(slugs)].slice(0, 200);
    const [account, inList, prog, tiers] = await Promise.all([
      this.accounts.findById(accountId, { plan: 1 }).lean(),
      this.watchlist.find({ profileId: profile._id, titleSlug: { $in: unique } }, { titleSlug: 1 }).lean(),
      this.progress.find({ profileId: profile._id, titleSlug: { $in: unique } }).lean(),
      this.titles.find({ slug: { $in: unique } }, { slug: 1, tier: 1 }).lean(),
    ]);
    const plan = account?.plan ?? 'basic';
    return {
      plan,
      watchlist: inList.map((w) => w.titleSlug),
      progress: Object.fromEntries(
        prog.map((p) => [p.titleSlug, { episodeId: p.episodeId ?? null, positionSec: p.positionSec, pct: pct(p) }]),
      ),
      entitled: Object.fromEntries(tiers.map((t) => [t.slug, t.tier === 'free' || plan === 'premium'])),
    };
  }

  async getWatchlist(accountId: string, profileId: string): Promise<TitleCard[]> {
    const profile = await this.owned(accountId, profileId);
    const rows = await this.watchlist.find({ profileId: profile._id }).sort({ createdAt: -1 }).lean();
    const cards = await this.catalog.cardsBySlug(rows.map((r) => r.titleSlug), ProfilesService.maxMaturity(profile));
    return rows.map((r) => cards.get(r.titleSlug)).filter((c): c is TitleCard => Boolean(c));
  }

  async addToWatchlist(accountId: string, profileId: string, slug: string) {
    const profile = await this.owned(accountId, profileId);
    const title = await this.titles.findOne({ slug }, { maturity: 1 }).lean();
    if (!title) throw new NotFoundException(`Unknown title: ${slug}`);
    if (!allows(ProfilesService.maxMaturity(profile), title.maturity)) {
      throw new ForbiddenException('This title is not available on a kids profile');
    }
    await this.watchlist.updateOne(
      { profileId: profile._id, titleSlug: slug },
      { $setOnInsert: { profileId: profile._id, titleSlug: slug } },
      { upsert: true },
    );
    return { slug, inWatchlist: true };
  }

  async removeFromWatchlist(accountId: string, profileId: string, slug: string) {
    const profile = await this.owned(accountId, profileId);
    await this.watchlist.deleteOne({ profileId: profile._id, titleSlug: slug });
    return { slug, inWatchlist: false };
  }

  async saveProgress(
    accountId: string, profileId: string, slug: string,
    body: { episodeId?: string; positionSec: number; durationSec: number },
  ) {
    const profile = await this.owned(accountId, profileId);
    if (!(await this.titles.exists({ slug }))) throw new NotFoundException(`Unknown title: ${slug}`);
    const positionSec = Math.min(body.positionSec, body.durationSec);
    await this.progress.updateOne(
      { profileId: profile._id, titleSlug: slug },
      { $set: { episodeId: body.episodeId, positionSec, durationSec: body.durationSec } },
      { upsert: true },
    );
    return { slug, positionSec };
  }

  /** "Continue watching": started but not finished (5–95%), most recent first. */
  async continueWatching(accountId: string, profileId: string) {
    const profile = await this.owned(accountId, profileId);
    const rows = (await this.progress.find({ profileId: profile._id }).sort({ updatedAt: -1 }).limit(30).lean())
      .filter((p) => pct(p) >= 5 && pct(p) <= 95);
    const cards = await this.catalog.cardsBySlug(rows.map((r) => r.titleSlug), ProfilesService.maxMaturity(profile));
    return rows.flatMap((r) => {
      const card = cards.get(r.titleSlug);
      return card ? [{ ...card, progressPct: pct(r), episodeId: r.episodeId ?? null }] : [];
    });
  }
}

function pct(p: Pick<Progress, 'positionSec' | 'durationSec'>) {
  return p.durationSec > 0 ? Math.round((p.positionSec / p.durationSec) * 100) : 0;
}
