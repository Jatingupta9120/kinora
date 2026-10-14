import Link from 'next/link';
import { Suspense } from 'react';
import { getContinueWatching, getOverlay, getPage } from '@/lib/api';
import { getViewer, viewerMaturity } from '@/lib/session';
import { HeroCarousel } from './HeroCarousel';
import { Rail, RailItem } from './Rail';
import { TitleTile } from './TitleTile';
import { WatchlistButton } from './WatchlistButton';

/**
 * A storefront page = shared, cached rails (keyed by maturity ceiling) + a per-viewer layer
 * (continue watching, watchlist state) fetched at request time.
 */
export function Storefront({ page, heading }: { page: string; heading?: string }) {
  return (
    <Suspense fallback={<StorefrontSkeleton />}>
      <StorefrontContent page={page} heading={heading} />
    </Suspense>
  );
}

async function StorefrontContent({ page, heading }: { page: string; heading?: string }) {
  const viewer = await getViewer();
  const { rails } = await getPage(page, viewerMaturity(viewer));
  const hero = rails.find((r) => r.style === 'hero');
  const others = rails.filter((r) => r.style !== 'hero');

  // Per-viewer overlay for the hero's watchlist buttons (the only place the button shows on a storefront).
  let heroActions: Record<string, React.ReactNode> | undefined;
  if (hero && viewer.token && viewer.profile) {
    const overlay = await getOverlay(viewer.token, viewer.profile.id, hero.titles.map((t) => t.slug)).catch(() => null);
    if (overlay) {
      heroActions = Object.fromEntries(
        hero.titles.map((t) => [t.slug, <WatchlistButton key={t.slug} slug={t.slug} initial={overlay.watchlist.includes(t.slug)} />]),
      );
    }
  }

  return (
    <div className="space-y-10 pb-6">
      {hero ? (
        <HeroCarousel titles={hero.titles} actions={heroActions} />
      ) : (
        heading && <h1 className="px-4 pt-8 font-[family-name:var(--font-display)] text-4xl font-extrabold sm:px-6 lg:px-10">{heading}</h1>
      )}
      {viewer.profile?.kids && (
        <p className="mx-4 rounded-lg border border-warn/40 bg-warn/10 px-4 py-2 text-sm text-warn sm:mx-6 lg:mx-10">
          Kids profile: showing titles rated ALL and 7+ only.
        </p>
      )}
      {viewer.token && viewer.profile && (
        <Suspense fallback={null}>
          <ContinueWatching token={viewer.token} profileId={viewer.profile.id} />
        </Suspense>
      )}
      {others.map((rail) => (
        <Rail key={rail.slug} heading={rail.name}>
          {rail.titles.map((t, i) => (
            <RailItem key={t.slug} wide={rail.style === 'top10'}>
              <TitleTile title={t} rank={rail.style === 'top10' ? i + 1 : undefined} />
            </RailItem>
          ))}
        </Rail>
      ))}
      {others.length === 0 && <p className="px-4 text-muted sm:px-6 lg:px-10">Nothing here yet.</p>}
    </div>
  );
}

async function ContinueWatching({ token, profileId }: { token: string; profileId: string }) {
  const items = await getContinueWatching(token, profileId).catch(() => []);
  if (items.length === 0) return null;
  return (
    <Rail heading="Continue watching" action={<Link href="/watchlist" className="text-sm text-muted hover:text-text">Watchlist ›</Link>}>
      {items.map((t) => (
        <RailItem key={t.slug}>
          <TitleTile title={t} progressPct={t.progressPct} href={`/watch/${t.slug}${t.episodeId ? `?ep=${t.episodeId}` : ''}`} />
        </RailItem>
      ))}
    </Rail>
  );
}

function StorefrontSkeleton() {
  return (
    <div className="space-y-10" aria-busy="true" aria-label="Loading">
      <div className="h-[56vw] max-h-[620px] min-h-[300px] animate-pulse bg-surface" />
      {[0, 1].map((r) => (
        <div key={r} className="px-4 sm:px-6 lg:px-10">
          <div className="mb-3 h-6 w-48 animate-pulse rounded bg-surface" />
          <div className="flex gap-3 overflow-hidden">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="aspect-video w-[60%] shrink-0 animate-pulse rounded-xl bg-surface sm:w-[34%] md:w-[26%] lg:w-[18%]" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
