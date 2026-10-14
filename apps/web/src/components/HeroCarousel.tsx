'use client';

import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import type { TitleCard } from '@/lib/types';
import { Artwork } from './Artwork';
import { MaturityBadge, TierMark } from './TitleTile';

/**
 * Featured carousel. Auto-advances every 8s unless the user prefers reduced motion,
 * is hovering/focused inside it, or has paused it.
 */
export function HeroCarousel({ titles, actions }: { titles: TitleCard[]; actions?: Record<string, ReactNode> }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [held, setHeld] = useState(false);

  useEffect(() => {
    if (paused || held || titles.length < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % titles.length), 8000);
    return () => clearInterval(id);
  }, [paused, held, titles.length]);

  const t = titles[index];
  if (!t) return null;
  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured titles"
      className="relative"
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={() => setHeld(false)}
    >
      <div aria-live={paused ? 'polite' : 'off'} aria-roledescription="slide" aria-label={`${index + 1} of ${titles.length}: ${t.name}`} className="relative">
        <Artwork title={t} size="hero" showName={false} fill />
        <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent" />
        <div className="relative flex min-h-[340px] flex-col justify-end px-4 pb-12 pt-[30vw] sm:min-h-[min(56vw,620px)] sm:px-6 sm:pb-16 lg:px-10">
          <div className="max-w-xl">
            {t.badge && <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-accent">{t.badge}</p>}
            <h2 className="font-[family-name:var(--font-display)] text-4xl font-extrabold leading-none tracking-tight sm:text-6xl">{t.name}</h2>
            <p className="mt-3 text-base text-text/90 sm:text-lg">{t.tagline}</p>
            <p className="mt-2 flex items-center gap-2 text-sm text-muted">
              <TierMark tier={t.tier} />
              <span>·</span> {t.year} <span>·</span> {t.kind === 'series' ? `${t.seasonCount} seasons` : `${t.durationMin} min`}
              <MaturityBadge rating={t.maturity} />
            </p>
            <div className="mt-5 flex items-center gap-3">
              <Link href={`/watch/${t.slug}`} className="inline-flex items-center gap-2 rounded-full bg-text px-6 py-3 font-semibold text-bg hover:bg-white">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M7 4v16l13-8z" /></svg>
                Play
              </Link>
              <Link href={`/title/${t.slug}`} className="rounded-full border border-white/40 bg-black/30 px-5 py-3 font-semibold hover:border-white">
                Details
              </Link>
              {actions?.[t.slug]}
            </div>
          </div>
        </div>
      </div>
      <div className="absolute bottom-3 right-4 flex items-center gap-2 sm:right-6 lg:right-10">
        {titles.map((x, i) => (
          <button
            key={x.slug}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Show ${x.name}`}
            aria-current={i === index}
            className={`h-1.5 rounded-full transition-all ${i === index ? 'w-6 bg-text' : 'w-1.5 bg-white/40 hover:bg-white/70'}`}
          />
        ))}
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-label={paused ? 'Resume slideshow' : 'Pause slideshow'}
          className="ml-2 grid size-7 place-items-center rounded-full border border-white/30 text-xs text-white/80 hover:border-white"
        >
          {paused ? '▶' : '❚❚'}
        </button>
      </div>
    </section>
  );
}
