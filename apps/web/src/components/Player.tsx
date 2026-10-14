'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { saveProgressAction } from '@/app/actions';

interface Props {
  manifestUrl: string;
  title: string;
  subtitle?: string;
  backHref: string;
  credit: string;
  license: string;
  resumeSec?: number;
  /** When set, progress is saved for this title (not for trailers). */
  track?: { slug: string; episodeId?: string };
}

const SAVE_EVERY_MS = 15_000;

export function Player({ manifestUrl, title, subtitle, backHref, credit, license, resumeSec = 0, track }: Props) {
  const video = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  // Attach the stream: native HLS (Safari) or hls.js (everything else), loaded on demand.
  useEffect(() => {
    const el = video.current;
    if (!el) return;
    let destroyed = false;
    let hls: { destroy(): void } | undefined;
    const seek = () => {
      if (resumeSec > 0 && resumeSec < el.duration - 5) el.currentTime = resumeSec;
    };
    el.addEventListener('loadedmetadata', seek, { once: true });

    if (el.canPlayType('application/vnd.apple.mpegurl')) {
      el.src = manifestUrl;
    } else {
      import('hls.js').then(({ default: Hls }) => {
        if (destroyed) return;
        if (!Hls.isSupported()) {
          setError('This browser cannot play HLS video.');
          return;
        }
        const instance = new Hls({ capLevelToPlayerSize: true });
        instance.on(Hls.Events.ERROR, (_e, data) => {
          if (data.fatal) setError(`Playback error: ${data.details}`);
        });
        instance.loadSource(manifestUrl);
        instance.attachMedia(el);
        hls = instance;
      });
    }
    return () => {
      destroyed = true;
      el.removeEventListener('loadedmetadata', seek);
      hls?.destroy();
    };
  }, [manifestUrl, resumeSec]);

  // Save progress periodically while playing, on pause/end, and when leaving the page.
  const slug = track?.slug;
  const episodeId = track?.episodeId;
  useEffect(() => {
    const el = video.current;
    if (!el || !slug) return;
    let lastSaved = -1;
    const save = () => {
      if (!Number.isFinite(el.duration) || el.duration <= 0) return;
      const position = Math.floor(el.currentTime);
      if (position === lastSaved) return;
      lastSaved = position;
      void saveProgressAction({ slug, episodeId, positionSec: position, durationSec: Math.floor(el.duration) }).catch(() => {});
    };
    const interval = setInterval(() => !el.paused && save(), SAVE_EVERY_MS);
    el.addEventListener('pause', save);
    el.addEventListener('ended', save);
    window.addEventListener('pagehide', save);
    return () => {
      save();
      clearInterval(interval);
      el.removeEventListener('pause', save);
      el.removeEventListener('ended', save);
      window.removeEventListener('pagehide', save);
    };
  }, [slug, episodeId]);

  return (
    <div className="bg-black">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex items-center gap-4 px-4 py-3 sm:px-6">
          <Link href={backHref} className="rounded-full border border-white/30 px-3 py-1.5 text-sm hover:border-white" aria-label="Back to title">
            ← Back
          </Link>
          <div className="min-w-0">
            <h1 className="truncate font-semibold">{title}</h1>
            {subtitle && <p className="truncate text-sm text-muted">{subtitle}</p>}
          </div>
        </div>
        <div className="relative aspect-video w-full bg-black">
          <video ref={video} controls autoPlay playsInline className="size-full" aria-label={`${title}${subtitle ? `, ${subtitle}` : ''}`} />
          {error && (
            <p role="alert" className="absolute inset-x-0 top-1/2 mx-auto w-fit -translate-y-1/2 rounded-lg bg-black/80 px-4 py-3 text-danger">
              {error}
            </p>
          )}
        </div>
        <p className="px-4 py-3 text-xs text-muted sm:px-6">
          Sample stream: {credit} · {license}
        </p>
      </div>
    </div>
  );
}
