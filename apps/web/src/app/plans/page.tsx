import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Container, PageHeading } from '@/components/TitleGrid';
import { getSubscription } from '@/lib/api';
import { requireToken, safeNext } from '@/lib/session';
import type { Plan } from '@/lib/types';
import { changePlanAction } from '../actions';

export const metadata: Metadata = { title: 'Plans' };

export default function PlansPage({ searchParams }: PageProps<'/plans'>) {
  return (
    <Container>
      <PageHeading sub="Prototype billing: switching plans is instant and no payment is taken.">Choose your plan</PageHeading>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-surface" aria-busy="true" />}>
        <PlanCards searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}

async function PlanCards({ searchParams }: { searchParams: PageProps<'/plans'>['searchParams'] }) {
  const { next: rawNext } = await searchParams;
  const next = typeof rawNext === 'string' ? safeNext(rawNext, '') : '';
  const token = await requireToken(`/plans${next ? `?next=${encodeURIComponent(next)}` : ''}`);
  const sub = await getSubscription(token);
  return (
    <div className="grid max-w-3xl gap-4 sm:grid-cols-2">
      {(Object.keys(sub.plans) as Plan[]).map((key) => {
        const plan = sub.plans[key];
        const current = sub.plan === key;
        return (
          <section key={key} className={`flex flex-col rounded-2xl border p-6 ${current ? 'border-accent bg-accent/5' : 'border-line bg-surface'}`} aria-label={plan.name}>
            <h2 className="text-xl font-bold">{plan.name}</h2>
            <p className="mt-2 text-3xl font-extrabold">
              {plan.priceMonthly === 0 ? 'Free' : `$${plan.priceMonthly.toFixed(2)}`}
              {plan.priceMonthly > 0 && <span className="text-base font-normal text-muted"> / month</span>}
            </p>
            <ul className="mt-4 flex-1 space-y-2 text-sm">
              {plan.perks.map((perk) => (
                <li key={perk} className="flex gap-2"><span className="text-accent" aria-hidden>✓</span>{perk}</li>
              ))}
            </ul>
            {current ? (
              <p className="mt-6 text-sm font-semibold text-accent">
                Current plan{sub.renewsAt && ` · renews ${new Date(sub.renewsAt).toLocaleDateString('en', { dateStyle: 'medium' })}`}
              </p>
            ) : (
              <form action={changePlanAction} className="mt-6">
                <input type="hidden" name="plan" value={key} />
                <input type="hidden" name="next" value={key === 'premium' ? next : ''} />
                <button className={`w-full rounded-full py-3 font-semibold ${key === 'premium' ? 'bg-warn text-black hover:brightness-110' : 'border border-line hover:border-text'}`}>
                  {key === 'premium' ? 'Upgrade to Premium' : 'Switch to Free'}
                </button>
              </form>
            )}
          </section>
        );
      })}
    </div>
  );
}
