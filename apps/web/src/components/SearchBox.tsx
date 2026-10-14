'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import type { Maturity, Suggestions } from '@/lib/types';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type Option = { kind: 'title'; slug: string; label: string; meta: string } | { kind: 'person'; label: string };

export function SearchBox({ maxMaturity }: { maxMaturity: Maturity }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [options, setOptions] = useState<Option[]>([]);
  const [active, setActive] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const query = q.trim();
  // Suggestions only apply to queries of 2+ characters; shorter input shows nothing.
  const shown = query.length >= 2 ? options : [];

  // Debounced type-ahead; aborts the previous request so stale results never land.
  useEffect(() => {
    if (query.length < 2) return;
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `${API}/search/suggest?q=${encodeURIComponent(query)}&maxMaturity=${encodeURIComponent(maxMaturity)}`,
          { signal: ctrl.signal },
        );
        if (!res.ok) return;
        const data = (await res.json()) as Suggestions;
        setOptions([
          ...data.titles.map((t): Option => ({ kind: 'title', slug: t.slug, label: t.name, meta: `${t.kind === 'series' ? 'Series' : 'Movie'} · ${t.year}` })),
          ...data.people.map((p): Option => ({ kind: 'person', label: p })),
        ]);
        setActive(-1);
      } catch {
        /* aborted or offline: keep previous suggestions */
      }
    }, 180);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [query, maxMaturity]);

  function go(option?: Option) {
    setOpen(false);
    setQ('');
    if (option?.kind === 'title') router.push(`/title/${option.slug}`);
    else {
      const query = option?.label ?? q.trim();
      if (query) router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          requestAnimationFrame(() => inputRef.current?.focus());
        }}
        aria-label="Search Kinora"
        className="grid size-9 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-text"
      >
        <SearchIcon />
      </button>
    );
  }

  return (
    <form
      role="search"
      className="relative"
      onSubmit={(e) => {
        e.preventDefault();
        go(active >= 0 ? shown[active] : undefined);
      }}
    >
      <label htmlFor={`${listId}-input`} className="sr-only">
        Search titles and people
      </label>
      <input
        ref={inputRef}
        id={`${listId}-input`}
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onBlur={() => setTimeout(() => !q && setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive((i) => Math.min(i + 1, shown.length - 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive((i) => Math.max(i - 1, -1));
          } else if (e.key === 'Escape') {
            setQ('');
            setOpen(false);
          }
        }}
        placeholder="Titles, people, genres"
        role="combobox"
        aria-expanded={shown.length > 0}
        aria-controls={listId}
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        aria-autocomplete="list"
        autoComplete="off"
        className="h-9 w-44 rounded-full border border-line bg-surface pl-9 pr-3 text-sm outline-none placeholder:text-muted focus:border-accent sm:w-72"
      />
      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted">
        <SearchIcon />
      </span>
      {shown.length > 0 && (
        <ul id={listId} role="listbox" className="absolute right-0 mt-2 w-72 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-2xl sm:left-0">
          {shown.map((o, i) => (
            <li
              key={`${o.kind}-${o.label}`}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                go(o);
              }}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-baseline justify-between gap-3 px-4 py-2 text-sm ${i === active ? 'bg-surface-2' : ''}`}
            >
              <span className="truncate">{o.label}</span>
              <span className="shrink-0 text-xs text-muted">{o.kind === 'title' ? o.meta : 'Person'}</span>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
