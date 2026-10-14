import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, type QueryFilter } from 'mongoose';
import { maturitiesUpTo } from '../common/maturity.js';
import { CARD_PROJECTION, toCard } from '../common/title-views.js';
import { Title, type Maturity } from '../schemas/title.schema.js';

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

@Injectable()
export class SearchService {
  constructor(@InjectModel(Title.name) private readonly titles: Model<Title>) {}

  /**
   * Type-ahead: cheap word-prefix match on names, plus people whose name starts with the query.
   * Kept separate from full search so it can stay fast and heavily cached.
   */
  async suggest(q: string, maxMaturity: Maturity) {
    const query = q.trim();
    if (query.length < 2) return { titles: [], people: [] };
    const prefix = new RegExp(`(^|\\s)${escapeRegex(query)}`, 'i');
    const maturity = { $in: maturitiesUpTo(maxMaturity) };
    const [titles, people] = await Promise.all([
      this.titles.find({ name: prefix, maturity }, { slug: 1, name: 1, kind: 1, year: 1, palette: 1 })
        .sort({ popularity: -1 }).limit(6).lean(),
      this.titles.aggregate<{ _id: string }>([
        { $match: { maturity } },
        { $project: { people: { $concatArrays: ['$cast', '$directors'] } } },
        { $unwind: '$people' },
        { $match: { people: prefix } },
        { $group: { _id: '$people' } },
        { $limit: 4 },
      ]),
    ]);
    return {
      titles: titles.map(({ slug, name, kind, year, palette }) => ({ slug, name, kind, year, palette })),
      people: people.map((p) => p._id),
    };
  }

  /** Full search: Mongo text index ranked by relevance, then popularity; optional facets. */
  async search(q: string, maxMaturity: Maturity, genre?: string, kind?: 'movie' | 'series') {
    const query = q.trim();
    const filter: QueryFilter<Title> = { maturity: { $in: maturitiesUpTo(maxMaturity) } };
    if (genre) filter.genres = genre;
    if (kind) filter.kind = kind;
    if (!query) return { query, total: 0, items: [], facets: { genres: [] } };

    let docs = await this.titles
      .find({ ...filter, $text: { $search: query } }, { ...CARD_PROJECTION, score: { $meta: 'textScore' } })
      .sort({ score: { $meta: 'textScore' }, popularity: -1 })
      .limit(48)
      .lean();
    // Text search matches whole words only; fall back to a substring match for partial input.
    if (docs.length === 0) {
      const contains = new RegExp(escapeRegex(query), 'i');
      docs = await this.titles
        .find({ ...filter, $or: [{ name: contains }, { cast: contains }, { directors: contains }] }, CARD_PROJECTION)
        .sort({ popularity: -1 })
        .limit(48)
        .lean();
    }
    const items = docs.map(toCard);
    const genreCounts = new Map<string, number>();
    for (const item of items) for (const g of item.genres) genreCounts.set(g, (genreCounts.get(g) ?? 0) + 1);
    return {
      query,
      total: items.length,
      items,
      facets: { genres: [...genreCounts].sort((a, b) => b[1] - a[1]).map(([slug, count]) => ({ slug, count })) },
    };
  }
}
