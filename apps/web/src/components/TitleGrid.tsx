import type { TitleCard } from '@/lib/types';
import { TitleTile } from './TitleTile';

export function TitleGrid({ titles }: { titles: TitleCard[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {titles.map((t) => (
        <li key={t.slug} className="min-w-0">
          <TitleTile title={t} />
        </li>
      ))}
    </ul>
  );
}

export function PageHeading({ children, sub }: { children: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight sm:text-4xl">{children}</h1>
      {sub && <p className="mt-2 text-sm text-muted">{sub}</p>}
    </div>
  );
}

export function Container({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-[1400px] px-4 pt-8 sm:px-6 lg:px-10">{children}</div>;
}
