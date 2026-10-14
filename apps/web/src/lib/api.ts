import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import type {
  ContinueItem, Genre, Maturity, Overlay, PlaybackGrant, Profile, Rail, SearchResult,
  Subscription, TitleCard, TitleDetail,
} from './types';

const API_URL = process.env.API_URL ?? 'http://localhost:4000';

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit & { token?: string } = {}): Promise<T> {
  const { token, headers, ...rest } = init;
  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      ...(rest.body ? { 'content-type': 'application/json' } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string | string[] } | null;
    const message = Array.isArray(body?.message) ? body.message.join(', ') : body?.message;
    throw new ApiError(res.status, message ?? res.statusText);
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

// ---- Shared catalog: identical for every viewer with the same maturity ceiling, so cached. ----

export async function getPage(page: string, maxMaturity: Maturity) {
  'use cache';
  cacheLife('minutes');
  cacheTag('catalog');
  return request<{ page: string; rails: Rail[] }>(`/catalog/pages/${page}?maxMaturity=${encodeURIComponent(maxMaturity)}`);
}

export async function getTitle(slug: string): Promise<TitleDetail | null> {
  'use cache';
  cacheLife('minutes');
  cacheTag('catalog', `title-${slug}`);
  try {
    return await request<TitleDetail>(`/catalog/titles/${encodeURIComponent(slug)}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export async function getGenres(maxMaturity: Maturity) {
  'use cache';
  cacheLife('hours');
  cacheTag('catalog');
  return request<Genre[]>(`/catalog/genres?maxMaturity=${encodeURIComponent(maxMaturity)}`);
}

export async function getGenre(slug: string, maxMaturity: Maturity, page: number) {
  'use cache';
  cacheLife('minutes');
  cacheTag('catalog');
  try {
    return await request<{ genre: { slug: string; name: string }; page: number; pageSize: number; total: number; items: TitleCard[] }>(
      `/catalog/genres/${encodeURIComponent(slug)}?maxMaturity=${encodeURIComponent(maxMaturity)}&page=${page}&pageSize=18`,
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export async function searchTitles(q: string, maxMaturity: Maturity, genre?: string, kind?: string) {
  'use cache';
  cacheLife('minutes');
  const params = new URLSearchParams({ q, maxMaturity });
  if (genre) params.set('genre', genre);
  if (kind) params.set('kind', kind);
  return request<SearchResult>(`/search?${params}`);
}

export async function getTrailer(slug: string) {
  'use cache';
  cacheLife('hours');
  return request<{ title: string; manifestUrl: string; credit: string; license: string }>(
    `/playback/${encodeURIComponent(slug)}/trailer`,
  );
}

// ---- Per-viewer: never cached on the server. ----

export const login = (email: string, password: string) =>
  request<{ token: string }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });

export const register = (email: string, password: string) =>
  request<{ token: string }>('/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) });

export const getMe = (token: string) =>
  request<{ email: string; plan: 'basic' | 'premium'; planRenewsAt: string | null }>('/auth/me', { token });

export const listProfiles = (token: string) => request<Profile[]>('/profiles', { token });

export const createProfile = (token: string, name: string, kids: boolean) =>
  request<Profile>('/profiles', { method: 'POST', token, body: JSON.stringify({ name, kids }) });

export const deleteProfile = (token: string, id: string) =>
  request<void>(`/profiles/${id}`, { method: 'DELETE', token });

export const getOverlay = (token: string, profileId: string, slugs: string[]) =>
  request<Overlay>(`/profiles/${profileId}/overlay?slugs=${encodeURIComponent(slugs.join(','))}`, { token });

export const getWatchlist = (token: string, profileId: string) =>
  request<TitleCard[]>(`/profiles/${profileId}/watchlist`, { token });

export const setWatchlist = (token: string, profileId: string, slug: string, add: boolean) =>
  request(`/profiles/${profileId}/watchlist/${encodeURIComponent(slug)}`, { method: add ? 'PUT' : 'DELETE', token });

export const getContinueWatching = (token: string, profileId: string) =>
  request<ContinueItem[]>(`/profiles/${profileId}/continue`, { token });

export const saveProgress = (
  token: string, profileId: string, slug: string,
  body: { episodeId?: string; positionSec: number; durationSec: number },
) => request(`/profiles/${profileId}/progress/${encodeURIComponent(slug)}`, { method: 'PUT', token, body: JSON.stringify(body) });

export const startPlayback = (token: string, profileId: string, slug: string, episodeId?: string) =>
  request<PlaybackGrant>(`/playback/${encodeURIComponent(slug)}`, {
    method: 'POST', token, body: JSON.stringify({ profileId, ...(episodeId ? { episodeId } : {}) }),
  });

export const getSubscription = (token: string) => request<Subscription>('/subscription', { token });

export const changePlan = (token: string, plan: 'basic' | 'premium') =>
  request<Subscription>('/subscription', { method: 'PUT', token, body: JSON.stringify({ plan }) });
