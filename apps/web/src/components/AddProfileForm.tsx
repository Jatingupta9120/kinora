'use client';

import { useActionState, useEffect, useRef } from 'react';
import { createProfileAction, type FormState } from '@/app/actions';

export function AddProfileForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(createProfileAction, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (!pending && !state.error) ref.current?.reset();
  }, [pending, state]);
  return (
    <form ref={ref} action={action} className="mt-10 flex flex-wrap items-end justify-center gap-3">
      <label className="text-sm">
        <span className="mb-1 block text-muted">New profile name</span>
        <input name="name" required maxLength={20} className="h-11 w-56 rounded-lg border border-line bg-surface px-3 outline-none focus:border-accent" />
      </label>
      <label className="flex h-11 items-center gap-2 text-sm">
        <input type="checkbox" name="kids" className="size-4 accent-[var(--accent)]" /> Kids profile
      </label>
      <button disabled={pending} className="h-11 rounded-full border border-line px-5 font-semibold hover:border-text disabled:opacity-60">
        Add profile
      </button>
      {state.error && <p role="alert" className="w-full text-center text-sm text-danger">{state.error}</p>}
    </form>
  );
}
