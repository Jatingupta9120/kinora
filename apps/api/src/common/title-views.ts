import type { Title } from '../schemas/title.schema.js';

/** Fields safe to show in any listing. Media ids are deliberately excluded. */
export interface TitleCard {
  slug: string;
  name: string;
  kind: Title['kind'];
  year: number;
  maturity: Title['maturity'];
  tier: Title['tier'];
  palette: [string, string];
  tagline: string;
  synopsis: string;
  genres: string[];
  badge?: string;
  durationMin?: number;
  seasonCount: number;
}

export interface TitleDetail extends TitleCard {
  cast: string[];
  directors: string[];
  hasTrailer: boolean;
  seasons: {
    number: number;
    episodes: { id: string; number: number; name: string; synopsis: string; durationMin: number }[];
  }[];
  related: TitleCard[];
}

/** Projection for card queries: never load seasons or media ids for listings. */
export const CARD_PROJECTION = {
  slug: 1, name: 1, kind: 1, year: 1, maturity: 1, tier: 1, palette: 1, tagline: 1,
  synopsis: 1, genres: 1, badge: 1, durationMin: 1, 'seasons.number': 1,
} as const;

/** Accepts a full title or a CARD_PROJECTION result. */
export function toCard(t: Partial<Title>): TitleCard {
  return {
    slug: t.slug!,
    name: t.name!,
    kind: t.kind!,
    year: t.year!,
    maturity: t.maturity!,
    tier: t.tier!,
    palette: t.palette!,
    tagline: t.tagline!,
    synopsis: t.synopsis!,
    genres: t.genres ?? [],
    badge: t.badge,
    durationMin: t.durationMin,
    seasonCount: t.seasons?.length ?? 0,
  };
}

export function toDetail(t: Title, related: TitleCard[]): TitleDetail {
  return {
    ...toCard(t),
    cast: t.cast,
    directors: t.directors,
    hasTrailer: Boolean(t.trailerMediaId),
    seasons: t.seasons.map((s) => ({
      number: s.number,
      episodes: s.episodes.map(({ id, number, name, synopsis, durationMin }) => ({
        id, number, name, synopsis, durationMin,
      })),
    })),
    related,
  };
}
