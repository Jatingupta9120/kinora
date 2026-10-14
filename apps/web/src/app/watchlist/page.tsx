import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { Container, PageHeading, TitleGrid } from '@/components/TitleGrid';
import { getWatchlist } from '@/lib/api';
import { requireProfile } from '@/lib/session';

export const metadata: Metadata = { title: 'Watchlist' };

export default function WatchlistPage() {
  return (
    <Container>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-surface" aria-busy="true" />}>
        <WatchlistContent />
      </Suspense>
    </Container>
  );
}

async function WatchlistContent() {
  const { token, profile } = await requireProfile('/watchlist');
  const titles = await getWatchlist(token, profile.id);
  return (
    <>
      <PageHeading sub={`${profile.name}'s list`}>Watchlist</PageHeading>
      {titles.length ? (
        <TitleGrid titles={titles} />
      ) : (
        <p className="text-muted">
          Nothing saved yet. Use <span className="font-semibold text-text">+</span> on any title to add it here.{' '}
          <Link href="/" className="underline">Browse Kinora</Link>
        </p>
      )}
    </>
  );
}
