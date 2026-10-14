'use client';

import { useRouter } from 'next/navigation';
import { useOptimistic, useState, useTransition } from 'react';
import { toggleWatchlistAction } from '@/app/actions';

/** Optimistic toggle; reconciles with the server result and routes to sign-in when needed. */
export function WatchlistButton({ slug, initial, compact = false }: { slug: string; initial: boolean; compact?: boolean }) {
  const router = useRouter();
  const [saved, setSaved] = useState(initial);
  const [optimistic, setOptimistic] = useOptimistic(saved);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const toggle = () =>
    start(async () => {
      const next = !optimistic;
      setOptimistic(next);
      setError(null);
      const res = await toggleWatchlistAction(slug, next);
      if (res.error === 'signin') {
        router.push(`/login?next=${encodeURIComponent(`/title/${slug}`)}`);
        return;
      }
      if (res.error) setError(res.error);
      setSaved(res.inWatchlist);
    });

  const label = optimistic ? 'Remove from watchlist' : 'Add to watchlist';
  return (
    <span className="inline-flex flex-col items-start">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={optimistic}
        aria-label={label}
        title={label}
        disabled={pending}
        className={`grid place-items-center rounded-full border transition ${compact ? 'size-10' : 'size-12'} ${optimistic ? 'border-accent bg-accent/15 text-accent' : 'border-white/40 bg-black/30 text-white hover:border-white'}`}
      >
        {optimistic ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden><path d="m5 12 5 5 9-10" /></svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden><path d="M12 5v14M5 12h14" /></svg>
        )}
      </button>
      {error && <span role="alert" className="mt-1 max-w-48 text-xs text-danger">{error}</span>}
    </span>
  );
}
