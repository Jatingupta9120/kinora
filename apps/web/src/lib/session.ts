import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Maturity, Profile } from './types';

/**
 * Data access layer for the viewer. The API token lives only in an httpOnly cookie and is
 * forwarded server-to-server; client code never sees it.
 */
const TOKEN = 'kinora_token';
const PROFILE = 'kinora_profile';

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 24 * 7,
};

export interface ActiveProfile {
  id: string;
  name: string;
  kids: boolean;
  avatarColor: string;
  maxMaturity: Maturity;
}

export interface Viewer {
  token: string | null;
  profile: ActiveProfile | null;
}

export async function getViewer(): Promise<Viewer> {
  const jar = await cookies();
  const token = jar.get(TOKEN)?.value ?? null;
  const raw = jar.get(PROFILE)?.value;
  let profile: ActiveProfile | null = null;
  if (token && raw) {
    try {
      profile = JSON.parse(raw) as ActiveProfile;
    } catch {
      profile = null;
    }
  }
  return { token, profile };
}

/** Maturity ceiling for catalog reads: kids profiles see `7+` and below; everyone else sees all. */
export function viewerMaturity(viewer: Viewer): Maturity {
  return viewer.profile?.maxMaturity ?? '18+';
}

/** For pages that need a signed-in viewer with a chosen profile. */
export async function requireProfile(next?: string): Promise<{ token: string; profile: ActiveProfile }> {
  const viewer = await getViewer();
  if (!viewer.token) redirect(`/login${next ? `?next=${encodeURIComponent(next)}` : ''}`);
  if (!viewer.profile) redirect(`/profiles${next ? `?next=${encodeURIComponent(next)}` : ''}`);
  return { token: viewer.token, profile: viewer.profile };
}

export async function requireToken(next?: string): Promise<string> {
  const { token } = await getViewer();
  if (!token) redirect(`/login${next ? `?next=${encodeURIComponent(next)}` : ''}`);
  return token;
}

// Writers: only callable from Server Actions / Route Handlers.

export async function setToken(token: string) {
  const jar = await cookies();
  jar.set(TOKEN, token, cookieOptions);
  jar.delete(PROFILE);
}

/** The profile is stored only after the API confirmed it belongs to this account. */
export async function setActiveProfile(profile: Profile) {
  const value: ActiveProfile = {
    id: profile.id, name: profile.name, kids: profile.kids,
    avatarColor: profile.avatarColor, maxMaturity: profile.maxMaturity,
  };
  (await cookies()).set(PROFILE, JSON.stringify(value), cookieOptions);
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(TOKEN);
  jar.delete(PROFILE);
}

/** Only allow same-site relative redirects. */
export function safeNext(next: FormDataEntryValue | string | null | undefined, fallback = '/'): string {
  return typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') ? next : fallback;
}
