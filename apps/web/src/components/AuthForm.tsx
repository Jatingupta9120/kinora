'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import type { FormState } from '@/app/actions';

export function AuthForm({
  mode,
  action,
  next,
}: {
  mode: 'login' | 'signup';
  action: (state: FormState, form: FormData) => Promise<FormState>;
  next?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const isLogin = mode === 'login';
  return (
    <form action={formAction} className="mx-auto mt-12 w-full max-w-sm space-y-4 rounded-2xl border border-line bg-surface p-6 sm:p-8">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold">{isLogin ? 'Sign in' : 'Create account'}</h1>
      {next && <input type="hidden" name="next" value={next} />}
      <Field label="Email" name="email" type="email" autoComplete="email" />
      <Field label="Password" name="password" type="password" autoComplete={isLogin ? 'current-password' : 'new-password'} minLength={8} />
      {state.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
      <button disabled={pending} className="w-full rounded-full bg-accent py-3 font-semibold text-accent-ink hover:brightness-110 disabled:opacity-60">
        {pending ? 'Please wait…' : isLogin ? 'Sign in' : 'Create account'}
      </button>
      <p className="text-center text-sm text-muted">
        {isLogin ? (
          <>New to Kinora? <Link href="/signup" className="text-text underline">Create an account</Link></>
        ) : (
          <>Already have an account? <Link href="/login" className="text-text underline">Sign in</Link></>
        )}
      </p>
      {isLogin && (
        <p className="rounded-lg bg-surface-2 p-3 text-xs text-muted">
          Demo accounts (password <code>kinora-demo</code>): <code>demo@kinora.test</code> (Free plan, has a Kids profile) ·{' '}
          <code>premium@kinora.test</code> (Premium)
        </p>
      )}
    </form>
  );
}

function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-muted">{label}</span>
      <input required {...props} className="h-11 w-full rounded-lg border border-line bg-bg px-3 outline-none focus:border-accent" />
    </label>
  );
}
