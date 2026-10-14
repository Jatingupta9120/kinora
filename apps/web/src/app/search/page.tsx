import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { Container, PageHeading, TitleGrid } from '@/components/TitleGrid';
import { searchTitles } from '@/lib/api';
import { getViewer, viewerMaturity } from '@/lib/session';

export const metadata: Metadata = { title: 'Search' };

export default function SearchPage({ searchParams }: PageProps<'/search'>) {
  return (
    <Container>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-surface" aria-busy="true" />}>
        <Results searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}

function one(v: string | string[] | undefined) {
  return (Array.isArray(v) ? v[0] : v)?.trim() ?? '';
}

async function Results({ searchParams }: { searchParams: PageProps<'/search'>['searchParams'] }) {
  const sp = await searchParams;
  const q = one(sp.q);
  const genre = one(sp.genre);
  const kind = one(sp.kind);
  const viewer = await getViewer();

  if (!q) {
    return (
      <>
        <PageHeading>Search</PageHeading>
        <form action="/search" role="search" className="flex max-w-xl gap-2">
          <label htmlFor="q" className="sr-only">Search titles and people</label>
          <input id="q" name="q" type="search" placeholder="Titles, people, genres" className="h-11 flex-1 rounded-full border border-line bg-surface px-4 outline-none focus:border-accent" />
          <button className="rounded-full bg-accent px-5 font-semibold text-accent-ink">Search</button>
        </form>
      </>
    );
  }

  const result = await searchTitles(q, viewerMaturity(viewer), genre || undefined, kind || undefined);
  const href = (patch: Record<string, string>) => {
    const p = new URLSearchParams({ q, ...(genre ? { genre } : {}), ...(kind ? { kind } : {}), ...patch });
    for (const [k, v] of [...p]) if (!v) p.delete(k);
    return `/search?${p}`;
  };

  return (
    <>
      <PageHeading sub={`${result.total} result${result.total === 1 ? '' : 's'}`}>Results for “{q}”</PageHeading>
      <nav aria-label="Filters" className="mb-6 flex flex-wrap gap-2">
        {[['', 'All'], ['movie', 'Movies'], ['series', 'Series']].map(([value, label]) => (
          <Chip key={label} href={href({ kind: value })} active={kind === value}>{label}</Chip>
        ))}
        <span className="mx-1 w-px bg-line" aria-hidden />
        {genre && <Chip href={href({ genre: '' })} active>✕ {genre.replace('-', ' ')}</Chip>}
        {!genre && result.facets.genres.map((g) => (
          <Chip key={g.slug} href={href({ genre: g.slug })} active={false}>
            {g.slug.replace('-', ' ')} <span className="text-muted">{g.count}</span>
          </Chip>
        ))}
      </nav>
      {result.items.length ? (
        <TitleGrid titles={result.items} />
      ) : (
        <p className="text-muted">
          Nothing matched. Try a title, an actor, or browse <Link href="/categories" className="underline">categories</Link>.
        </p>
      )}
    </>
  );
}

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? 'true' : undefined}
      className={`rounded-full border px-3 py-1.5 text-sm capitalize ${active ? 'border-text bg-text text-bg' : 'border-line text-text hover:border-text'}`}
    >
      {children}
    </Link>
  );
}
