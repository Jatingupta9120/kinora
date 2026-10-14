'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/movies', label: 'Movies' },
  { href: '/tv', label: 'Series' },
  { href: '/free', label: 'Free' },
  { href: '/categories', label: 'Categories' },
];

/** Highlights the current section; the pathname is request data, so this sits behind Suspense. */
export function NavLinks() {
  return <NavLinksView pathname={usePathname()} />;
}

/** `pathname: null` renders the prerendered fallback with no active item. */
export function NavLinksView({ pathname }: { pathname: string | null }) {
  return (
    <>
      <ul className="hidden items-center gap-1 md:flex">
        {LINKS.map((l) => {
          const active = pathname !== null && (l.href === '/' ? pathname === '/' : pathname.startsWith(l.href));
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={active ? 'page' : undefined}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${active ? 'bg-surface-2 text-text' : 'text-muted hover:text-text'}`}
              >
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
      {/* Small screens: the same destinations in a disclosure menu. */}
      <details className="relative md:hidden">
        <summary className="cursor-pointer list-none rounded-full px-3 py-1.5 text-sm font-medium text-muted [&::-webkit-details-marker]:hidden">
          Menu ▾
        </summary>
        <ul className="absolute left-0 mt-2 w-44 overflow-hidden rounded-xl border border-line bg-surface shadow-2xl">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="block px-4 py-2.5 text-sm hover:bg-surface-2">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </details>
    </>
  );
}
