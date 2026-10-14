'use client';

import Link from 'next/link';
import { useId, useState, type KeyboardEvent, type ReactNode } from 'react';
import type { TitleDetail } from '@/lib/types';

type Tab = 'episodes' | 'related' | 'details';

/** Accessible tabs (arrow-key navigation) with a season selector for series. */
export function DetailTabs({
  title,
  related,
  progressEpisodeId,
}: {
  title: TitleDetail;
  related: ReactNode;
  progressEpisodeId: string | null;
}) {
  const tabs: Tab[] = title.kind === 'series' ? ['episodes', 'related', 'details'] : ['related', 'details'];
  const [tab, setTab] = useState<Tab>(tabs[0]);
  const initialSeason = title.seasons.find((s) => s.episodes.some((e) => e.id === progressEpisodeId))?.number ?? 1;
  const [season, setSeason] = useState(initialSeason);
  const id = useId();

  const onKey = (e: KeyboardEvent) => {
    const i = tabs.indexOf(tab);
    if (e.key === 'ArrowRight') setTab(tabs[(i + 1) % tabs.length]);
    if (e.key === 'ArrowLeft') setTab(tabs[(i - 1 + tabs.length) % tabs.length]);
  };
  const episodes = title.seasons.find((s) => s.number === season)?.episodes ?? [];

  return (
    <div className="px-4 sm:px-6 lg:px-10">
      <div className="flex flex-wrap items-center gap-4 border-b border-line">
        {title.kind === 'series' && title.seasons.length > 1 && (
          <label className="text-sm">
            <span className="sr-only">Season</span>
            <select
              value={season}
              onChange={(e) => setSeason(Number(e.target.value))}
              className="rounded-lg border border-line bg-surface px-3 py-2 font-semibold"
            >
              {title.seasons.map((s) => (
                <option key={s.number} value={s.number}>Season {s.number}</option>
              ))}
            </select>
          </label>
        )}
        <div role="tablist" aria-label={`${title.name} sections`} className="flex gap-6" onKeyDown={onKey}>
          {tabs.map((t) => (
            <button
              key={t}
              role="tab"
              id={`${id}-tab-${t}`}
              aria-controls={`${id}-panel-${t}`}
              aria-selected={tab === t}
              tabIndex={tab === t ? 0 : -1}
              onClick={() => setTab(t)}
              className={`-mb-px border-b-2 py-3 text-sm font-semibold capitalize ${tab === t ? 'border-text text-text' : 'border-transparent text-muted hover:text-text'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div role="tabpanel" id={`${id}-panel-${tab}`} aria-labelledby={`${id}-tab-${tab}`} className="py-6">
        {tab === 'episodes' && (
          <ol className="divide-y divide-line">
            {episodes.map((e) => (
              <li key={e.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start">
                <Link
                  href={`/watch/${title.slug}?ep=${e.id}`}
                  className="flex shrink-0 items-center gap-2 self-start rounded-full border border-white/30 px-4 py-2 text-sm font-semibold hover:border-white"
                  aria-label={`Play episode ${e.number}, ${e.name}`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M7 4v16l13-8z" /></svg>
                  Play
                </Link>
                <div className="min-w-0">
                  <h3 className="font-semibold">
                    {e.number}. {e.name}
                    {e.id === progressEpisodeId && <span className="ml-2 rounded bg-accent/15 px-1.5 py-0.5 text-xs font-bold text-accent">IN PROGRESS</span>}
                  </h3>
                  <p className="mt-1 text-sm text-muted">{e.synopsis}</p>
                  <p className="mt-1 text-xs text-muted">{e.durationMin} min</p>
                </div>
              </li>
            ))}
          </ol>
        )}
        {tab === 'related' && <div className="-mx-4 sm:-mx-6 lg:-mx-10">{related}</div>}
        {tab === 'details' && (
          <dl className="grid max-w-3xl gap-x-8 gap-y-4 text-sm sm:grid-cols-[10rem_1fr]">
            <dt className="text-muted">Synopsis</dt>
            <dd>{title.synopsis}</dd>
            <dt className="text-muted">Cast</dt>
            <dd>{title.cast.map((c, i) => <PersonLink key={c} name={c} last={i === title.cast.length - 1} />)}</dd>
            <dt className="text-muted">Directed by</dt>
            <dd>{title.directors.map((d, i) => <PersonLink key={d} name={d} last={i === title.directors.length - 1} />)}</dd>
            <dt className="text-muted">Genres</dt>
            <dd className="capitalize">{title.genres.map((g) => g.replace('-', ' ')).join(', ')}</dd>
            <dt className="text-muted">Maturity</dt>
            <dd>{title.maturity === 'all' ? 'Suitable for all ages' : `Suitable for ages ${title.maturity}`}</dd>
          </dl>
        )}
      </div>
    </div>
  );
}

function PersonLink({ name, last }: { name: string; last: boolean }) {
  return (
    <>
      <Link href={`/search?q=${encodeURIComponent(name.replace(/^(Voices|Narrated by|Hosted by|Featuring):?\s*/i, ''))}`} className="underline decoration-line underline-offset-4 hover:decoration-text">
        {name}
      </Link>
      {last ? '' : ', '}
    </>
  );
}
