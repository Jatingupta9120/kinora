import { ForbiddenException, HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { allows } from '../common/maturity.js';
import { ProfilesService } from '../profiles/profiles.service.js';
import { Account, Progress } from '../schemas/account.schema.js';
import { Title } from '../schemas/title.schema.js';
import { MEDIA, type MediaAsset } from './media.registry.js';

export class UpgradeRequiredException extends HttpException {
  constructor() {
    super({ statusCode: 402, error: 'upgrade_required', message: 'This title needs Kinora Premium' }, HttpStatus.PAYMENT_REQUIRED);
  }
}

function describe(asset: MediaAsset) {
  return { manifestUrl: asset.manifestUrl, credit: asset.credit, license: asset.license };
}

/**
 * Resolves a title to a playable manifest. This is the single place where entitlement
 * (plan vs tier) and parental controls (profile vs maturity) are enforced.
 */
@Injectable()
export class PlaybackService {
  constructor(
    @InjectModel(Title.name) private readonly titles: Model<Title>,
    @InjectModel(Account.name) private readonly accounts: Model<Account>,
    @InjectModel(Progress.name) private readonly progress: Model<Progress>,
    private readonly profiles: ProfilesService,
  ) {}

  /** Trailers are promotional: no sign-in or plan needed. */
  async trailer(slug: string) {
    const title = await this.titles.findOne({ slug }, { trailerMediaId: 1, name: 1 }).lean();
    const asset = title?.trailerMediaId ? MEDIA[title.trailerMediaId] : undefined;
    if (!title || !asset) throw new NotFoundException('No trailer for this title');
    return { title: title.name, ...describe(asset) };
  }

  async start(accountId: string, profileId: string, slug: string, episodeId?: string) {
    const profile = await this.profiles.owned(accountId, profileId);
    const title = await this.titles.findOne({ slug }).lean();
    if (!title) throw new NotFoundException(`Unknown title: ${slug}`);

    if (!allows(ProfilesService.maxMaturity(profile), title.maturity)) {
      throw new ForbiddenException('This title is not available on a kids profile');
    }
    const account = await this.accounts.findById(accountId, { plan: 1 }).lean();
    if (title.tier === 'premium' && account?.plan !== 'premium') throw new UpgradeRequiredException();

    const saved = await this.progress.findOne({ profileId: profile._id, titleSlug: slug }).lean();
    let mediaId = title.mediaId;
    let episode: { id: string; label: string } | null = null;
    if (title.kind === 'series') {
      const episodes = title.seasons.flatMap((s) => s.episodes.map((e) => ({ ...e, season: s.number })));
      // Explicit episode, else resume the saved one, else start from S1E1.
      const chosen =
        episodes.find((e) => e.id === episodeId) ??
        episodes.find((e) => e.id === saved?.episodeId) ??
        episodes[0];
      if (!chosen) throw new NotFoundException('This series has no episodes yet');
      if (episodeId && chosen.id !== episodeId) throw new NotFoundException(`Unknown episode: ${episodeId}`);
      mediaId = chosen.mediaId;
      episode = { id: chosen.id, label: `S${chosen.season} E${chosen.number} · ${chosen.name}` };
    }
    const asset = mediaId ? MEDIA[mediaId] : undefined;
    if (!asset) throw new NotFoundException('No media for this title');

    const sameItem = saved && (episode ? saved.episodeId === episode.id : true);
    const resumeSec = sameItem && saved.positionSec < saved.durationSec * 0.95 ? saved.positionSec : 0;
    return { slug, title: title.name, episode, resumeSec, durationSec: asset.durationSec, ...describe(asset) };
  }
}
