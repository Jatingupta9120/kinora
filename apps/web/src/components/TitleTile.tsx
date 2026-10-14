import Link from 'next/link';
import type { TitleCard } from '@/lib/types';
import { Artwork } from './Artwork';

export function MaturityBadge({ rating }: { rating: TitleCard['maturity'] }) {
  return (
    <span className="rounded border border-white/40 px-1 text-[11px] font-semibold leading-4 text-white/90" aria-label={`Rated ${rating === 'all' ? 'all ages' : rating}`}>
      {rating === 'all' ? 'ALL' : rating}
    </span>
  );
}

export function TierMark({ tier, entitled }: { tier: TitleCard['tier']; entitled?: boolean }) {
  if (tier === 'free') return <span className="text-xs font-semibold text-accent">Free</span>;
  return (
    <span className={`text-xs font-semibold ${entitled ? 'text-text' : 'text-warn'}`}>
      {entitled ? 'Included with Premium' : 'Premium'}
    </span>
  );
}

/** 16:9 tile used in rails and grids. `progressPct` draws a resume bar. */
export function TitleTile({
  title,
  progressPct,
  rank,
  href,
}: {
  title: TitleCard;
  progressPct?: number;
  rank?: number;
  /** Defaults to the detail page; "continue watching" links straight to the player. */
  href?: string;
}) {
  const meta = title.kind === 'series' ? `${title.seasonCount} season${title.seasonCount === 1 ? '' : 's'}` : `${title.durationMin} min`;
  return (
    <article className="group relative">
      <Link
        href={href ?? `/title/${title.slug}`}
        className="block rounded-xl outline-offset-4"
        aria-label={`${progressPct !== undefined ? 'Resume ' : ''}${title.name}, ${title.year}, ${meta}${title.tier === 'premium' ? ', Premium' : ', free to watch'}`}
      >
        <div className="relative">
          <Artwork title={title} className="aspect-video rounded-xl ring-1 ring-white/5 transition duration-200 group-hover:ring-accent/70" />
          {title.badge && (
            <span className="absolute right-2 top-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              {title.badge}
            </span>
          )}
          {rank !== undefined && (
            <span className="absolute -left-1 bottom-1 font-[family-name:var(--font-display)] text-6xl font-extrabold text-transparent [-webkit-text-stroke:2px_rgb(255_255_255/0.9)]" aria-hidden>
              {rank}
            </span>
          )}
          {progressPct !== undefined && (
            <div className="absolute inset-x-3 bottom-2 h-1 overflow-hidden rounded-full bg-white/25" role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100} aria-label="Watched">
              <div className="h-full bg-accent" style={{ width: `${progressPct}%` }} />
            </div>
          )}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 px-0.5 text-xs text-muted">
          <TierMark tier={title.tier} />
          <span>·</span>
          <span>{title.year}</span>
          <span>·</span>
          <span>{meta}</span>
          <span className="ml-auto">
            <MaturityBadge rating={title.maturity} />
          </span>
        </div>
      </Link>
    </article>
  );
}
