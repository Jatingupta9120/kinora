'use client';

import { useRef, type ReactNode } from 'react';

/** Horizontal rail with keyboard-reachable paging buttons over a native scroll-snap track. */
export function Rail({ heading, action, children }: { heading: string; action?: ReactNode; children: ReactNode }) {
  const track = useRef<HTMLUListElement>(null);
  const page = (dir: 1 | -1) => {
    const el = track.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: 'smooth' });
  };
  return (
    <section aria-label={heading} className="group/rail relative">
      <div className="mb-3 flex items-baseline gap-4 px-4 sm:px-6 lg:px-10">
        <h2 className="text-lg font-semibold sm:text-xl">{heading}</h2>
        {action}
        <div className="ml-auto hidden gap-1 sm:flex">
          <PageButton label={`Scroll ${heading} back`} onClick={() => page(-1)}>‹</PageButton>
          <PageButton label={`Scroll ${heading} forward`} onClick={() => page(1)}>›</PageButton>
        </div>
      </div>
      <ul ref={track} className="rail-track flex gap-3 overflow-x-auto scroll-px-4 px-4 pb-2 sm:scroll-px-6 sm:px-6 lg:scroll-px-10 lg:px-10">
        {children}
      </ul>
    </section>
  );
}

/** Rail item widths: ~1.6 per row on phones, ~5.5 on wide desktops (matches the observed density). */
export function RailItem({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <li className={`shrink-0 ${wide ? 'w-[70%] sm:w-[42%] lg:w-[28%]' : 'w-[60%] sm:w-[34%] md:w-[26%] lg:w-[18%]'}`}>
      {children}
    </li>
  );
}

function PageButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-8 place-items-center rounded-full border border-line text-lg text-muted hover:border-text hover:text-text"
    >
      {children}
    </button>
  );
}
