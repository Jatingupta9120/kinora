# Kinora: a streaming-catalog prototype

An original streaming-catalog app built with **Next.js 16** (App Router, Cache Components), **NestJS 12**, **MongoDB 8** and TypeScript. Its UX patterns come from a public, signed-out study of Prime Video's website (see [`research/REPORT.md`](research/REPORT.md)). Kinora's name, catalog, artwork and code are original. Video comes from openly licensed sample streams.

## Features

- **Storefronts**: a hero carousel, a Top 10 rail and themed rails for Home, Movies, Series and Free.
- **Title pages**: season selector, episode list, Related and Details tabs, trailer, and cast and genre links into search.
- **Search**: debounced type-ahead (titles and people, keyboard navigable) and full-text search with type and genre facets.
- **Accounts and profiles**: email/password sign-up, up to 5 profiles per account, and kids profiles limited to ALL and 7+ ratings.
- **Watchlist and continue watching**, kept separately for each profile.
- **Plans**: Free and Premium (mock billing). Premium titles show an upsell on the Free plan.
- **Playback**: HLS through hls.js (native HLS on Safari). The API checks the plan and the profile's maturity limit before returning a stream URL. Playback resumes where it stopped, and progress is saved while you watch.

## Architecture

```
Browser ──► Next.js (apps/web, :3000) ──server-to-server, Bearer JWT──► NestJS (apps/api, :4000) ──► MongoDB
   │           • catalog reads: 'use cache' + cacheLife, keyed by maturity ceiling
   │           • per-viewer reads (overlay, continue watching): request time, inside <Suspense>
   │           • mutations: Server Actions; JWT kept in an httpOnly cookie
   └──► API /search/suggest (public, CORS) for type-ahead
   └──► HLS sample CDNs (manifest URL returned only by POST /playback/:slug)
```

The split follows what the research observed: a cacheable catalog page, with a per-viewer overlay (watchlist, progress, entitlement) fetched separately (`GET /profiles/:id/overlay`).

| API module | Endpoints |
|---|---|
| catalog | `GET /catalog/pages/:page`, `/catalog/genres`, `/catalog/genres/:slug?page=`, `/catalog/titles/:slug` (all accept `?maxMaturity=`) |
| search | `GET /search/suggest?q=`, `GET /search?q=&genre=&kind=` |
| auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` |
| profiles | `GET/POST /profiles`, `DELETE /profiles/:id`, `GET /profiles/:id/overlay?slugs=`, `GET/PUT/DELETE /profiles/:id/watchlist[/:slug]`, `GET /profiles/:id/continue`, `PUT /profiles/:id/progress/:slug` |
| subscription | `GET/PUT /subscription` |
| playback | `GET /playback/:slug/trailer` (public), `POST /playback/:slug` → `200` grant, `402` upgrade required, `403` kids restriction |

MongoDB collections: `titles` (seasons and episodes embedded, text index), `collections` (rails), `accounts`, `profiles`, `watchlistitems`, `progresses`.

## Run it

Requirements: Node 22+, Docker. On this machine the Ubuntu npm 9.2 has a workspace bug, so commands use `npx npm@11`. A system npm 10+ works the same.

```bash
npx npm@11 install          # first time
npm run db:up               # MongoDB 8 in Docker, bound to 127.0.0.1:27017
cp apps/api/.env.example apps/api/.env    # then set JWT_SECRET
cp apps/web/.env.example apps/web/.env.local
npm run seed                # 26 titles, 8 rails, 2 demo accounts
npm run dev                 # API :4000 + web :3000
```

Demo accounts (password `kinora-demo`): `demo@kinora.test` (Free plan, with a Kids profile) and `premium@kinora.test` (Premium).

## Tests

| Command | What it covers | Last result |
|---|---|---|
| `npm test` | API unit tests: maturity rules, query parsing, seed integrity (every rail slug, genre and media ID resolves) | 10/10 pass |
| `npm run test:smoke` | 21 HTTP checks against a running API: entitlement (402), kids limits (403), access to other accounts' data (403), resume, idempotent watchlist, validation. Uses fresh accounts each run. | 21/21 pass |
| `CHROMIUM_PATH=… npm run test:e2e` | 14 browser checks: storefront, type-ahead, detail tabs, search facets, sign-up, sign-in with return URL, upsell, watchlist, HLS playback and resume, upgrade/downgrade, kids filtering, sign-out, no horizontal overflow at phone width | 14/14 pass |

`npm run test:e2e` needs a Chromium build, for example `~/.cache/ms-playwright/chromium-*/chrome-linux64/chrome`, plus running web and API servers. Screenshots go to `e2e/screens/`.

## Known limitations

- **Mock billing.** The plan changes immediately, with no payment provider and no webhook.
- **No DRM.** The sample streams are clear HLS. The entitlement check guards the URL, not the media bytes.
- **Not-found status.** Unknown titles render the 404 page with HTTP **200**, because `notFound()` runs inside a streamed Suspense boundary after the response has started. Next adds `noindex`. Moving the lookup out of the boundary, or into `generateStaticParams`, would fix this.
- **API types are copied by hand** into `apps/web/src/lib/types.ts`. A shared package or OpenAPI codegen would remove the drift risk.
- **Search** uses Mongo text search plus a regex fallback. Fine for a small catalog; a real one would use Atlas Search or OpenSearch.
- **No rate limiting** on login or sign-up.

## Media credits

- *Big Buck Bunny* (2008) and *Tears of Steel* (2012) © Blender Foundation, CC BY 3.0. Streamed from `test-streams.mux.dev` and `demo.unified-streaming.com`.
- Apple HLS "bipbop" example stream, from `devstreaming-cdn.apple.com`.
