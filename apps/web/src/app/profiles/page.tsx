import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AddProfileForm } from '@/components/AddProfileForm';
import { listProfiles } from '@/lib/api';
import { getViewer, requireToken, safeNext } from '@/lib/session';
import { deleteProfileAction, selectProfileAction } from '../actions';

export const metadata: Metadata = { title: "Who's watching?" };

export default function ProfilesPage({ searchParams }: PageProps<'/profiles'>) {
  return (
    <div className="mx-auto max-w-4xl px-4 pt-16 text-center">
      <h1 className="font-[family-name:var(--font-display)] text-4xl font-extrabold">Who’s watching?</h1>
      <Suspense fallback={<div className="mx-auto mt-10 h-40 max-w-xl animate-pulse rounded-xl bg-surface" aria-busy="true" />}>
        <ProfilePicker searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function ProfilePicker({ searchParams }: { searchParams: PageProps<'/profiles'>['searchParams'] }) {
  const { next: rawNext } = await searchParams;
  const next = safeNext(typeof rawNext === 'string' ? rawNext : undefined);
  const token = await requireToken('/profiles');
  const [profiles, viewer] = await Promise.all([listProfiles(token), getViewer()]);
  return (
    <>
      <ul className="mt-10 flex flex-wrap justify-center gap-6">
        {profiles.map((p) => (
          <li key={p.id} className="flex flex-col items-center gap-2">
            <form action={selectProfileAction}>
              <input type="hidden" name="profileId" value={p.id} />
              <input type="hidden" name="next" value={next} />
              <button
                className={`group flex flex-col items-center gap-3 rounded-2xl p-2 ${viewer.profile?.id === p.id ? 'ring-2 ring-accent' : ''}`}
                aria-label={`Watch as ${p.name}${p.kids ? ' (kids profile)' : ''}`}
              >
                <span
                  className="grid size-24 place-items-center rounded-2xl text-4xl font-extrabold text-black transition group-hover:scale-105 sm:size-28"
                  style={{ background: p.avatarColor }}
                >
                  {p.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="font-semibold">{p.name}</span>
              </button>
            </form>
            {p.kids && <span className="rounded bg-warn px-1.5 text-xs font-bold text-black">KIDS · up to 7+</span>}
            {profiles.length > 1 && (
              <form action={deleteProfileAction}>
                <input type="hidden" name="profileId" value={p.id} />
                <button className="text-xs text-muted underline hover:text-danger" aria-label={`Delete profile ${p.name}`}>Delete</button>
              </form>
            )}
          </li>
        ))}
      </ul>
      {profiles.length < 5 && <AddProfileForm />}
    </>
  );
}
