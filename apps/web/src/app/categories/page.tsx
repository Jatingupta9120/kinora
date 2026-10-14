import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { Container, PageHeading } from '@/components/TitleGrid';
import { getGenres } from '@/lib/api';
import { getViewer, viewerMaturity } from '@/lib/session';

export const metadata: Metadata = { title: 'Categories' };

const COLLECTIONS = [
  { href: '/free', label: 'Free to watch' },
  { href: '/movies', label: 'Movies' },
  { href: '/tv', label: 'Series' },
];

export default function CategoriesPage() {
  return (
    <Container>
      <PageHeading>Categories</PageHeading>
      <h2 className="mb-3 text-lg font-semibold">Genres</h2>
      <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-surface" aria-busy="true" />}>
        <GenreList />
      </Suspense>
      <h2 className="mb-3 mt-10 text-lg font-semibold">Collections</h2>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {COLLECTIONS.map((c) => (
          <li key={c.href}>
            <Link href={c.href} className="block rounded-xl border border-line bg-surface p-5 font-semibold hover:border-accent">{c.label}</Link>
          </li>
        ))}
      </ul>
    </Container>
  );
}

async function GenreList() {
  const genres = await getGenres(viewerMaturity(await getViewer()));
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {genres.map((g) => (
        <li key={g.slug}>
          <Link href={`/genre/${g.slug}`} className="flex items-baseline justify-between rounded-xl border border-line bg-surface p-5 hover:border-accent">
            <span className="font-semibold">{g.name}</span>
            <span className="text-sm text-muted">{g.count}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
