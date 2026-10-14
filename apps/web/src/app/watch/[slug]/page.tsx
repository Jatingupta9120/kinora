import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Suspense } from 'react';
import { Player } from '@/components/Player';
import { ApiError, getTrailer, startPlayback } from '@/lib/api';
import { requireProfile } from '@/lib/session';
import type { PlaybackGrant } from '@/lib/types';

export const metadata: Metadata = { title: 'Watch' };

export default function WatchPage({ params, searchParams }: PageProps<'/watch/[slug]'>) {
  return (
    <Suspense fallback={<div className="aspect-video w-full animate-pulse bg-black" aria-busy="true" />}>
      <Watch params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Watch({ params, searchParams }: Pick<PageProps<'/watch/[slug]'>, 'params' | 'searchParams'>) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const backHref = `/title/${slug}`;

  if (sp.trailer) {
    const trailer = await getTrailer(slug).catch(() => null);
    if (!trailer) notFound();
    return <Player manifestUrl={trailer.manifestUrl} title={trailer.title} subtitle="Trailer" backHref={backHref} credit={trailer.credit} license={trailer.license} />;
  }

  const episodeId = typeof sp.ep === 'string' ? sp.ep : undefined;
  const here = `/watch/${slug}${episodeId ? `?ep=${encodeURIComponent(episodeId)}` : ''}`;
  const { token, profile } = await requireProfile(here);

  // Entitlement and parental controls are decided by the API, not the page.
  let grant: PlaybackGrant;
  try {
    grant = await startPlayback(token, profile.id, slug, episodeId);
  } catch (err) {
    if (!(err instanceof ApiError)) throw err;
    if (err.status === 402) redirect(`/plans?next=${encodeURIComponent(here)}`);
    if (err.status === 404) notFound();
    return (
      <div className="mx-auto max-w-lg px-4 pt-20 text-center">
        <h1 className="text-2xl font-bold">{err.status === 403 ? 'Not available on this profile' : 'Playback unavailable'}</h1>
        <p className="mt-3 text-muted">{err.message}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/profiles" className="rounded-full border border-line px-5 py-2.5 hover:border-text">Switch profile</Link>
          <Link href={backHref} className="rounded-full bg-text px-5 py-2.5 font-semibold text-bg">Back</Link>
        </div>
      </div>
    );
  }

  return (
    <Player
      manifestUrl={grant.manifestUrl}
      title={grant.title}
      subtitle={grant.episode?.label}
      backHref={backHref}
      credit={grant.credit}
      license={grant.license}
      resumeSec={grant.resumeSec}
      track={{ slug, episodeId: grant.episode?.id }}
    />
  );
}
