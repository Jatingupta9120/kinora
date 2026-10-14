import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Artwork } from '@/components/Artwork';
import { DetailTabs } from '@/components/DetailTabs';
import { Rail, RailItem } from '@/components/Rail';
import { MaturityBadge, TitleTile } from '@/components/TitleTile';
import { WatchlistButton } from '@/components/WatchlistButton';
import { getOverlay, getTitle } from '@/lib/api';
import { getViewer } from '@/lib/session';
import type { Overlay, TitleDetail } from '@/lib/types';

export async function generateMetadata({ params }: PageProps<'/title/[slug]'>): Promise<Metadata> {
  const title = await getTitle((await params).slug);
  return title ? { title: title.name, description: title.tagline } : { title: 'Not found' };
}

export default function TitlePage({ params }: PageProps<'/title/[slug]'>) {
  return (
    <Suspense fallback={<div className="h-[70vh] animate-pulse bg-surface" aria-busy="true" />}>
      <TitleContent params={params} />
    </Suspense>
  );
}

async function TitleContent({ params }: { params: PageProps<'/title/[slug]'>['params'] }) {
  const { slug } = await params;
  const title = await getTitle(slug);
  if (!title) notFound();

  const viewer = await getViewer();
  const overlay: Overlay | null =
    viewer.token && viewer.profile ? await getOverlay(viewer.token, viewer.profile.id, [slug]).catch(() => null) : null;
  const blockedForKids = viewer.profile?.kids && !['all', '7+'].includes(title.maturity);
  const entitled = overlay?.entitled[slug] ?? title.tier === 'free';
  const progress = overlay?.progress[slug];

  return (
    <article>
      <header className="relative">
        {/* Backdrop is absolute; the text stays in flow so the hero grows with its content on small screens. */}
        <Artwork title={title} size="hero" showName={false} fill />
        <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/75 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/10 to-transparent" />
        <div className="relative flex min-h-[340px] flex-col justify-end px-4 pb-8 pt-[30vw] sm:min-h-[min(62vw,560px)] sm:px-6 lg:px-10">
          <div className="max-w-2xl">
            {title.badge && <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-accent">{title.badge}</p>}
            <h1 className="font-[family-name:var(--font-display)] text-4xl font-extrabold leading-none tracking-tight sm:text-6xl">{title.name}</h1>
            <p className="mt-3 text-lg text-text/90">{title.tagline}</p>
            <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
              {title.genres.map((g) => (
                <Link key={g} href={`/genre/${g}`} className="capitalize underline decoration-line underline-offset-4 hover:text-text">
                  {g.replace('-', ' ')}
                </Link>
              ))}
              <span>·</span> {title.year}
              <span>·</span> {title.kind === 'series' ? `${title.seasons.length} season${title.seasons.length === 1 ? '' : 's'}` : `${title.durationMin} min`}
              <MaturityBadge rating={title.maturity} />
            </p>
            <PlayActions title={title} entitled={entitled} blockedForKids={Boolean(blockedForKids)} progress={progress} overlay={overlay} />
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-text/85 sm:text-base">{title.synopsis}</p>
          </div>
        </div>
      </header>

      <DetailTabs
        title={title}
        progressEpisodeId={progress?.episodeId ?? null}
        related={
          title.related.length ? (
            <Rail heading="More like this">
              {title.related.map((t) => (
                <RailItem key={t.slug}>
                  <TitleTile title={t} />
                </RailItem>
              ))}
            </Rail>
          ) : (
            <p className="text-muted">No related titles yet.</p>
          )
        }
      />
    </article>
  );
}

function PlayActions({
  title,
  entitled,
  blockedForKids,
  progress,
  overlay,
}: {
  title: TitleDetail;
  entitled: boolean;
  blockedForKids: boolean;
  progress?: Overlay['progress'][string];
  overlay: Overlay | null;
}) {
  const resumeHref = `/watch/${title.slug}${progress?.episodeId ? `?ep=${progress.episodeId}` : ''}`;
  const resumeLabel = progress && progress.pct >= 5 && progress.pct <= 95 ? `Resume · ${progress.pct}%` : 'Play';
  return (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      {blockedForKids ? (
        <p className="rounded-full border border-warn/50 bg-warn/10 px-5 py-3 text-sm font-semibold text-warn">Not available on a kids profile</p>
      ) : entitled ? (
        <Link href={resumeHref} className="inline-flex items-center gap-2 rounded-full bg-text px-7 py-3 font-semibold text-bg hover:bg-white">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M7 4v16l13-8z" /></svg>
          {resumeLabel}
        </Link>
      ) : (
        <Link href={`/plans?next=${encodeURIComponent(`/title/${title.slug}`)}`} className="rounded-full bg-warn px-6 py-3 font-semibold text-black hover:brightness-110">
          Get Premium to watch
        </Link>
      )}
      {title.hasTrailer && (
        <Link href={`/watch/${title.slug}?trailer=1`} className="rounded-full border border-white/40 bg-black/30 px-5 py-3 font-semibold hover:border-white">
          Trailer
        </Link>
      )}
      {!blockedForKids && <WatchlistButton slug={title.slug} initial={overlay?.watchlist.includes(title.slug) ?? false} />}
      {title.tier === 'free' && <span className="text-sm font-semibold text-accent">Free to watch</span>}
    </div>
  );
}
