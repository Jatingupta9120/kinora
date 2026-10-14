import { allows, isMaturity, maturitiesUpTo } from './maturity.js';
import { parseMaturity, parsePositiveInt } from './query.js';

describe('maturity', () => {
  it('lists ratings up to and including the ceiling', () => {
    expect(maturitiesUpTo('7+')).toEqual(['all', '7+']);
    expect(maturitiesUpTo('18+')).toHaveLength(5);
  });

  it('allows ratings at or below the ceiling only', () => {
    expect(allows('7+', 'all')).toBe(true);
    expect(allows('7+', '7+')).toBe(true);
    expect(allows('7+', '13+')).toBe(false);
    expect(allows('18+', '18+')).toBe(true);
  });

  it('recognises valid ratings', () => {
    expect(isMaturity('16+')).toBe(true);
    expect(isMaturity('21+')).toBe(false);
    expect(isMaturity(undefined)).toBe(false);
  });
});

describe('query parsing', () => {
  it('defaults maturity to unrestricted and rejects junk', () => {
    expect(parseMaturity(undefined)).toBe('18+');
    expect(parseMaturity('7+')).toBe('7+');
    expect(() => parseMaturity('PG')).toThrow();
  });

  it('clamps page sizes and rejects non-positive integers', () => {
    expect(parsePositiveInt(undefined, 24, 60)).toBe(24);
    expect(parsePositiveInt('500', 24, 60)).toBe(60);
    expect(() => parsePositiveInt('0', 24, 60)).toThrow();
    expect(() => parsePositiveInt('2.5', 24, 60)).toThrow();
  });
});
