import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { maturitiesUpTo } from '../common/maturity.js';
import { CARD_PROJECTION, toCard, toDetail, type TitleCard } from '../common/title-views.js';
import { GENRES } from '../seed/data.js';
import { Collection } from '../schemas/collection.schema.js';
import { Title, type Maturity } from '../schemas/title.schema.js';

export interface PageRail {
  slug: string;
  name: string;
  style: Collection['style'];
  titles: TitleCard[];
}

@Injectable()
export class CatalogService {
  constructor(
    @InjectModel(Title.name) private readonly titles: Model<Title>,
    @InjectModel(Collection.name) private readonly collections: Model<Collection>,
  ) {}

  /** Hero + rails for a storefront page, filtered to the viewer's maturity ceiling. */
  async page(page: string, maxMaturity: Maturity): Promise<{ page: string; rails: PageRail[] }> {
    const rails = await this.collections.find({ pages: page }).sort({ order: 1 }).lean();
    const slugs = [...new Set(rails.flatMap((r) => r.titleSlugs))];
    const cards = await this.cardsBySlug(slugs, maxMaturity);
    return {
      page,
      rails: rails
        .map((r) => ({
          slug: r.slug,
          name: r.name,
          style: r.style,
          titles: r.titleSlugs.map((s) => cards.get(s)).filter((c): c is TitleCard => Boolean(c)),
        }))
        .filter((r) => r.titles.length > 0),
    };
  }

  async genres(maxMaturity: Maturity) {
    const counts = await this.titles.aggregate<{ _id: string; count: number }>([
      { $match: { maturity: { $in: maturitiesUpTo(maxMaturity) } } },
      { $unwind: '$genres' },
      { $group: { _id: '$genres', count: { $sum: 1 } } },
    ]);
    const bySlug = new Map(counts.map((c) => [c._id, c.count]));
    return GENRES.map((g) => ({ ...g, count: bySlug.get(g.slug) ?? 0 })).filter((g) => g.count > 0);
  }

  async genre(slug: string, maxMaturity: Maturity, page: number, pageSize: number) {
    const genre = GENRES.find((g) => g.slug === slug);
    if (!genre) throw new NotFoundException(`Unknown genre: ${slug}`);
    const filter = { genres: slug, maturity: { $in: maturitiesUpTo(maxMaturity) } };
    const [total, docs] = await Promise.all([
      this.titles.countDocuments(filter),
      this.titles
        .find(filter, CARD_PROJECTION)
        .sort({ popularity: -1, _id: 1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
    ]);
    return { genre, page, pageSize, total, items: docs.map(toCard) };
  }

  async title(slug: string) {
    const doc = await this.titles.findOne({ slug }).lean();
    if (!doc) throw new NotFoundException(`Unknown title: ${slug}`);
    // "Related": most popular titles sharing a genre, same maturity or lower.
    const related = await this.titles
      .find(
        { slug: { $ne: slug }, genres: { $in: doc.genres }, maturity: { $in: maturitiesUpTo(doc.maturity) } },
        CARD_PROJECTION,
      )
      .sort({ popularity: -1 })
      .limit(10)
      .lean();
    return toDetail(doc, related.map(toCard));
  }

  async cardsBySlug(slugs: string[], maxMaturity: Maturity = '18+'): Promise<Map<string, TitleCard>> {
    const docs = await this.titles
      .find({ slug: { $in: slugs }, maturity: { $in: maturitiesUpTo(maxMaturity) } }, CARD_PROJECTION)
      .lean();
    return new Map(docs.map((d) => [d.slug, toCard(d)]));
  }
}
