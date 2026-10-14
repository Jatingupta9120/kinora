import { MATURITY, type Maturity } from './ratings.js';

export function isMaturity(value: unknown): value is Maturity {
  return typeof value === 'string' && (MATURITY as readonly string[]).includes(value);
}

/** Ratings at or below `max`, for Mongo `$in` filters. */
export function maturitiesUpTo(max: Maturity): Maturity[] {
  return MATURITY.slice(0, MATURITY.indexOf(max) + 1);
}

export function allows(max: Maturity, rating: Maturity): boolean {
  return MATURITY.indexOf(rating) <= MATURITY.indexOf(max);
}
