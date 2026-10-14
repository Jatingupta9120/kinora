import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Container, PageHeading, TitleGrid } from '@/components/TitleGrid';
import { getGenre } from '@/lib/api';
import { getViewer, viewerMaturity } from '@/lib/session';

export default function GenrePage({ params, searchParams }: PageProps<'/genre/[slug]'>) {
  return (
    <Container>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-surface" aria-busy="true" />}>
        <GenreContent params={params} searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}

async function GenreContent({
  params,
  searchParams,
}: Pick<PageProps<'/genre/[slug]'>, 'params' | 'searchParams'>) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const page = Math.max(1, Number.parseInt(String(sp.page ?? '1'), 10) || 1);
  const data = await getGenre(slug, viewerMaturity(await getViewer()), page);
  if (!data) notFound();
  const pages = Math.max(1, Math.ceil(data.total / data.pageSize));
  return (
    <>
      <PageHeading sub={`${data.total} title${data.total === 1 ? '' : 's'}`}>{data.genre.name}</PageHeading>
      <TitleGrid titles={data.items} />
      {pages > 1 && (
        <nav aria-label="Pagination" className="mt-8 flex items-center gap-3 text-sm">
          {page > 1 && <Link href={`/genre/${slug}?page=${page - 1}`} className="rounded-full border border-line px-4 py-2 hover:border-text">‹ Previous</Link>}
          <span className="text-muted">Page {page} of {pages}</span>
          {page < pages && <Link href={`/genre/${slug}?page=${page + 1}`} className="rounded-full border border-line px-4 py-2 hover:border-text">Next ›</Link>}
        </nav>
      )}
    </>
  );
}
