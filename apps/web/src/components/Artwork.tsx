import type { CSSProperties } from 'react';
import type { TitleCard } from '@/lib/types';

/** Generated artwork: the title's two-colour palette plus its name set in the display face. */
export function Artwork({
  title,
  size = 'card',
  showName = true,
  fill = false,
  className = '',
}: {
  title: Pick<TitleCard, 'name' | 'palette'>;
  size?: 'card' | 'hero' | 'poster';
  showName?: boolean;
  /** Cover the nearest positioned ancestor (used as a backdrop). */
  fill?: boolean;
  className?: string;
}) {
  const style = { '--a1': title.palette[0], '--a2': title.palette[1] } as CSSProperties;
  const nameClass =
    size === 'hero'
      ? 'text-4xl sm:text-6xl lg:text-7xl'
      : size === 'poster'
        ? 'text-3xl'
        : 'text-lg sm:text-xl';
  return (
    <div className={`art overflow-hidden ${fill ? 'absolute inset-0' : 'relative'} ${className}`} style={style} aria-hidden>
      {showName && (
        <span
          className={`absolute inset-x-0 bottom-0 p-3 font-[family-name:var(--font-display)] font-extrabold leading-[0.95] tracking-tight text-white drop-shadow-[0_2px_10px_rgb(0_0_0/0.5)] ${nameClass}`}
        >
          {title.name}
        </span>
      )}
    </div>
  );
}
