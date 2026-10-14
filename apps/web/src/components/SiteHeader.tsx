import Link from 'next/link';
import { Suspense } from 'react';
import { getViewer, viewerMaturity } from '@/lib/session';
import { logoutAction } from '@/app/actions';
import { NavLinks, NavLinksView } from './NavLinks';
import { SearchBox } from './SearchBox';

/**
 * The bar itself is static and prerendered; the viewer-dependent end (search scope,
 * avatar menu) streams in behind Suspense.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-bg/85 backdrop-blur supports-[backdrop-filter]:bg-bg/70">
      <nav aria-label="Primary" className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4 sm:gap-6 sm:px-6 lg:px-10">
        <Link href="/" className="font-[family-name:var(--font-display)] text-2xl font-extrabold tracking-tight text-text">
          kin<span className="text-accent">o</span>ra
        </Link>
        <Suspense fallback={<NavLinksView pathname={null} />}>
          <NavLinks />
        </Suspense>
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <Suspense fallback={<HeaderEndFallback />}>
            <HeaderEnd />
          </Suspense>
        </div>
      </nav>
    </header>
  );
}

function HeaderEndFallback() {
  return <div className="h-9 w-40 animate-pulse rounded-full bg-surface" aria-hidden />;
}

async function HeaderEnd() {
  const viewer = await getViewer();
  return (
    <>
      <SearchBox maxMaturity={viewerMaturity(viewer)} />
      {viewer.token ? (
        <details className="relative">
          <summary
            className="flex cursor-pointer list-none items-center gap-2 rounded-full p-0.5 [&::-webkit-details-marker]:hidden"
            aria-label="Account menu"
          >
            <span
              className="grid size-9 place-items-center rounded-full text-sm font-bold text-black"
              style={{ background: viewer.profile?.avatarColor ?? 'var(--muted)' }}
            >
              {viewer.profile?.name.slice(0, 1).toUpperCase() ?? '?'}
            </span>
          </summary>
          <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-line bg-surface shadow-2xl">
            {viewer.profile && (
              <p className="border-b border-line px-4 py-3 text-sm text-muted">
                Watching as <span className="font-semibold text-text">{viewer.profile.name}</span>
                {viewer.profile.kids && <span className="ml-2 rounded bg-warn px-1.5 text-xs font-bold text-black">KIDS</span>}
              </p>
            )}
            <MenuLink href="/profiles">Switch profile</MenuLink>
            <MenuLink href="/watchlist">Watchlist</MenuLink>
            <MenuLink href="/plans">Plan &amp; billing</MenuLink>
            <form action={logoutAction}>
              <button className="w-full px-4 py-2.5 text-left text-sm hover:bg-surface-2">Sign out</button>
            </form>
          </div>
        </details>
      ) : (
        <Link href="/login" className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-ink hover:brightness-110">
          Sign in
        </Link>
      )}
    </>
  );
}

function MenuLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="block px-4 py-2.5 text-sm hover:bg-surface-2">
      {children}
    </Link>
  );
}
