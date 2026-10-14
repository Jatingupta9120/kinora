import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthForm } from '@/components/AuthForm';
import { safeNext } from '@/lib/session';
import { loginAction } from '../actions';

export const metadata: Metadata = { title: 'Sign in' };

export default function LoginPage({ searchParams }: PageProps<'/login'>) {
  return (
    <div className="px-4">
      {/* Non-interactive fallback: a working form here would submit without `next`. */}
      <Suspense fallback={<div className="mx-auto mt-12 h-96 w-full max-w-sm animate-pulse rounded-2xl bg-surface" aria-busy="true" />}>
        <LoginWithNext searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function LoginWithNext({ searchParams }: { searchParams: PageProps<'/login'>['searchParams'] }) {
  const { next } = await searchParams;
  return <AuthForm mode="login" action={loginAction} next={safeNext(typeof next === 'string' ? next : undefined)} />;
}
