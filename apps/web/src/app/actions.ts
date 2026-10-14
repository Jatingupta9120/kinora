'use server';

import { refresh } from 'next/cache';
import { redirect } from 'next/navigation';
import * as api from '@/lib/api';
import { ApiError } from '@/lib/api';
import { clearSession, getViewer, safeNext, setActiveProfile, setToken } from '@/lib/session';

export interface FormState {
  error?: string;
}

function credentials(form: FormData) {
  return { email: String(form.get('email') ?? '').trim(), password: String(form.get('password') ?? '') };
}

export async function loginAction(_: FormState, form: FormData): Promise<FormState> {
  const { email, password } = credentials(form);
  try {
    const { token } = await api.login(email, password);
    await setToken(token);
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : 'Sign-in failed, please try again' };
  }
  redirect(`/profiles?next=${encodeURIComponent(safeNext(form.get('next')))}`);
}

export async function signupAction(_: FormState, form: FormData): Promise<FormState> {
  const { email, password } = credentials(form);
  if (password.length < 8) return { error: 'Use at least 8 characters for your password' };
  try {
    const { token } = await api.register(email, password);
    await setToken(token);
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : 'Sign-up failed, please try again' };
  }
  redirect('/profiles');
}

export async function logoutAction() {
  await clearSession();
  redirect('/');
}

export async function selectProfileAction(form: FormData) {
  const { token } = await getViewer();
  if (!token) redirect('/login');
  const id = String(form.get('profileId') ?? '');
  // Re-fetch from the API rather than trusting the form: the profile must belong to this account.
  const profile = (await api.listProfiles(token)).find((p) => p.id === id);
  if (!profile) redirect('/profiles');
  await setActiveProfile(profile);
  redirect(safeNext(form.get('next')));
}

export async function createProfileAction(_: FormState, form: FormData): Promise<FormState> {
  const { token } = await getViewer();
  if (!token) redirect('/login');
  const name = String(form.get('name') ?? '').trim();
  if (!name) return { error: 'Enter a name' };
  try {
    await api.createProfile(token, name, form.get('kids') === 'on');
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : 'Could not add profile' };
  }
  refresh();
  return {};
}

export async function deleteProfileAction(form: FormData) {
  const viewer = await getViewer();
  if (!viewer.token) redirect('/login');
  const id = String(form.get('profileId') ?? '');
  await api.deleteProfile(viewer.token, id);
  if (viewer.profile?.id === id) {
    const [first] = await api.listProfiles(viewer.token);
    if (first) await setActiveProfile(first);
  }
  refresh();
}

/** Returns the new state so the client can reconcile its optimistic toggle. */
export async function toggleWatchlistAction(slug: string, add: boolean): Promise<{ inWatchlist: boolean; error?: string }> {
  const { token, profile } = await getViewer();
  if (!token || !profile) return { inWatchlist: !add, error: 'signin' };
  try {
    await api.setWatchlist(token, profile.id, slug, add);
    return { inWatchlist: add };
  } catch (err) {
    return { inWatchlist: !add, error: err instanceof ApiError ? err.message : 'Could not update watchlist' };
  }
}

export async function changePlanAction(form: FormData) {
  const { token } = await getViewer();
  if (!token) redirect('/login?next=/plans');
  const plan = form.get('plan') === 'premium' ? 'premium' : 'basic';
  await api.changePlan(token, plan);
  const next = form.get('next');
  if (typeof next === 'string' && next) redirect(safeNext(next));
  refresh();
}

export async function saveProgressAction(input: {
  slug: string; episodeId?: string; positionSec: number; durationSec: number;
}) {
  const { token, profile } = await getViewer();
  if (!token || !profile) return;
  const positionSec = Math.max(0, Math.floor(input.positionSec));
  const durationSec = Math.max(1, Math.floor(input.durationSec));
  await api.saveProgress(token, profile.id, input.slug, { episodeId: input.episodeId, positionSec, durationSec });
}
