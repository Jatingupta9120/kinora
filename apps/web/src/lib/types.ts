// Response shapes of the Kinora API (apps/api). Kept in sync by hand for the prototype.

export type Maturity = 'all' | '7+' | '13+' | '16+' | '18+';
export type Plan = 'basic' | 'premium';

export interface TitleCard {
  slug: string;
  name: string;
  kind: 'movie' | 'series';
  year: number;
  maturity: Maturity;
  tier: 'free' | 'premium';
  palette: [string, string];
  tagline: string;
  synopsis: string;
  genres: string[];
  badge?: string;
  durationMin?: number;
  seasonCount: number;
}

export interface Episode {
  id: string;
  number: number;
  name: string;
  synopsis: string;
  durationMin: number;
}

export interface TitleDetail extends TitleCard {
  cast: string[];
  directors: string[];
  hasTrailer: boolean;
  seasons: { number: number; episodes: Episode[] }[];
  related: TitleCard[];
}

export interface Rail {
  slug: string;
  name: string;
  style: 'hero' | 'rail' | 'top10';
  titles: TitleCard[];
}

export interface Genre {
  slug: string;
  name: string;
  count: number;
}

export interface Profile {
  id: string;
  name: string;
  kids: boolean;
  avatarColor: string;
  maxMaturity: Maturity;
}

export interface Overlay {
  plan: Plan;
  watchlist: string[];
  progress: Record<string, { episodeId: string | null; positionSec: number; pct: number }>;
  entitled: Record<string, boolean>;
}

export interface ContinueItem extends TitleCard {
  progressPct: number;
  episodeId: string | null;
}

export interface PlaybackGrant {
  slug: string;
  title: string;
  episode: { id: string; label: string } | null;
  resumeSec: number;
  durationSec: number;
  manifestUrl: string;
  credit: string;
  license: string;
}

export interface Suggestions {
  titles: Pick<TitleCard, 'slug' | 'name' | 'kind' | 'year' | 'palette'>[];
  people: string[];
}

export interface SearchResult {
  query: string;
  total: number;
  items: TitleCard[];
  facets: { genres: { slug: string; count: number }[] };
}

export interface PlanInfo {
  name: string;
  priceMonthly: number;
  currency: string;
  perks: string[];
}

export interface Subscription {
  plan: Plan;
  renewsAt: string | null;
  plans: Record<Plan, PlanInfo>;
}
