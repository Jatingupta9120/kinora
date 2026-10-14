import { BadRequestException } from '@nestjs/common';
import type { Maturity } from './ratings.js';
import { isMaturity } from './maturity.js';

/** `?maxMaturity=` is optional and defaults to everything; kids profiles send `7+`. */
export function parseMaturity(value: string | undefined): Maturity {
  if (value === undefined || value === '') return '18+';
  if (!isMaturity(value)) throw new BadRequestException(`Invalid maxMaturity: ${value}`);
  return value;
}

export function parsePositiveInt(value: string | undefined, fallback: number, max: number): number {
  if (value === undefined || value === '') return fallback;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) throw new BadRequestException(`Expected a positive integer, got ${value}`);
  return Math.min(n, max);
}
