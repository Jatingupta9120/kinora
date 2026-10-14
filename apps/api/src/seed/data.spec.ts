import { MEDIA } from '../playback/media.registry.js';
import { COLLECTIONS, GENRES, TITLES } from './data.js';

describe('seed catalog', () => {
  const slugs = new Set(TITLES.map((t) => t.slug));

  it('has unique slugs', () => {
    expect(slugs.size).toBe(TITLES.length);
  });

  it('only references existing titles from collections', () => {
    for (const c of COLLECTIONS) for (const s of c.titleSlugs) expect(slugs, `${c.slug} -> ${s}`).toContain(s);
  });

  it('only uses known genres', () => {
    const genres = new Set(GENRES.map((g) => g.slug));
    for (const t of TITLES) for (const g of t.genres) expect(genres, `${t.slug} -> ${g}`).toContain(g);
  });

  it('gives every playable item registered media', () => {
    for (const t of TITLES) {
      if (t.kind === 'movie') expect(MEDIA[t.mediaId!], t.slug).toBeDefined();
      else for (const s of t.seasons ?? []) for (const e of s.episodes) expect(MEDIA[e.mediaId], e.id).toBeDefined();
      if (t.trailerMediaId) expect(MEDIA[t.trailerMediaId], t.slug).toBeDefined();
    }
  });

  it('gives every series at least one episode', () => {
    for (const t of TITLES.filter((x) => x.kind === 'series')) {
      expect(t.seasons?.flatMap((s) => s.episodes).length ?? 0, t.slug).toBeGreaterThan(0);
    }
  });
});
