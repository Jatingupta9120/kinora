# Prime Video web — observable architecture study

Date: 2026-10-14 · Tooling: REA 6.5.0 (`inspect-web-page`, `capture-browser-scenario`), Chromium 153 headless/headed, signed out, marketplace served as India (amazon.in).

**Tags:** **[O]** observed directly, with the evidence file named. **[H]** hypothesis: an inference from observations or from common industry practice. It has not been verified.

## 0. Scope and method

| In scope | Out of scope (deliberately) |
|---|---|
| Public, signed-out pages: `/`, `/detail/<id>`, `/genre/action`, `/categories`, `/tv`, search flow | Signing in, any account/profile/billing page |
| DOM/accessibility outline, screenshots (desktop 1440×900, phone 390×844) | JavaScript bundle analysis, source maps, code coverage (`analyze-web-bundle`, `export-web-scripts`): excluded because the Prime Video Terms of Use forbid reverse engineering |
| Network **metadata**: method, URL, query-parameter **names**, status, resource type | Request/response bodies, header values, cookies, storage values (never captured) |
| Storage **key names** (values redacted by REA) | DRM, licence exchange contents, media download |

Evidence files live in `research/evidence/` (REA Evidence JSON), with screenshots and accessibility outlines in `research/screens/`. The network roll-up is in `research/evidence-network-summary.txt`. Scripts that regenerate everything are in `research/scripts/` and `research/scenarios/`.

## 1. Navigation and information architecture

- **[O]** The top bar has: Home → `/storefront`, Free to me → `/collection/streamfree`, Movies → `/movie`, TV shows → `/tv`, Live TV → `/livetv`, Subscriptions → `/addons`, Search button, language picker ("EN"), Categories (`/categories`), Profile/Settings/Account menu, and a "Join Prime" CTA → `/signup`. Evidence: `screens/10-home-desktop.ax.txt`.
- **[O]** At 390 px wide the bar collapses to "Menu ▾ · logo · search · EN · avatar", and the Join CTA moves out of the bar. Evidence: `screens/11-home-mobile.png`. The exact breakpoint was not measured.
- **[O]** Route families seen in links: `/detail/<26-char ID>`, `/genre/<slug>`, `/collection/<slug>`, `/search?phrase=…`, `/browse?serviceToken=…`, `/storefront?serviceToken=…`, `/signup?return_url=…`, `/auth-redirect`, `/kids`, `/help`. Evidence: `01-home.json` → `metadata.dom_urls`.
- **[O]** `/categories` has two groups: "Genres" (Action and adventure, Anime, Comedy, Documentary, Drama, Fantasy, Horror, Kids, Mystery and thrillers, Romance, Science fiction) and "Featured collections" (Home Premiere, New Releases, MX Player, …). Evidence: `screens/15-categories.ax.txt`.
- **[O]** Links carry attribution query parameters: `ref_` (placement code, e.g. `atv_hm_hom_c_<rail>_<slot>`) and `jic` (journey ingress context). **[H]** These feed click-through attribution for ranking and A/B analysis.

## 2. Page structure

### Home / storefront
- **[O]** A full-bleed **hero carousel** (5 dots), whose slides have a title logo, a badge ("#1 in India", "NEW EPISODE | DAILY 12 PM"), a primary CTA ("Episode 19 Watch now" or "Join Prime Watch now"), Add-to-Watchlist (+), and Details (i). It shows an entitlement line ("Watch for free" or "Watch with a Prime membership") and a maturity rating (U/A 16+). Evidence: `10-home-desktop.png/.ax.txt`.
- **[O]** Below the hero sits a vertical stack of **horizontal rails** ("Trending in VDesi: Watch for Free", "Top 10 …" with large rank numerals, "Binge-worthy TV", "Recently added TV", …). Each rail has a "See more ›" link and corner badges on cards (TRENDING, NEW SERIES, RECENTLY ADDED, MOST LIKED).
- **[O]** Each card is an `<article>` containing an image, a title link, a level-2 heading, a synopsis, a Watch/Join CTA, "Add to Watchlist", and "More details". There are many `<form>` elements in card markup. **[H]** Watchlist and other card actions are progressively-enhanced forms (they still work without JavaScript).
- **[O]** On phones the cards grow to about 56 % of the viewport width, so roughly 1.7 cards show per row, and rail titles wrap. Evidence: `11-home-mobile.png`.

### Title detail (`/detail/<id>`)
- **[O]** It has an H1 title, a brand line ("prime original"), and an action row (Trailer, Add to Watchlist, Like, Not for me, Share). Below that are a primary "Watch now" button and a secondary "prime · Subscribe" upsell ("First episode free, Terms apply"), plus a badge (NEW SEASON, #4 in India), the synopsis, genre links, year, season count, and cast links.
- **[O]** Genre, cast and director names link to **search** (`/search?phrase=Comedy&ref_=atv_dp_pd_gen`), not to dedicated person or genre pages.
- **[O]** For series there is a season selector and the tabs **Episodes | Related | Details**. Each episode row has its own Watch now button, "More ways to watch", a heading "N. Title", a synopsis and a rating. Below that is a "Customers also watched" rail. Evidence: `12-detail-desktop.ax.txt`.
- **[O]** A trailer starts loading automatically on the detail page (see §5).

### Search
- **[O]** The search icon expands into an inline `input[type=search]`. There are two inputs in the DOM (desktop and phone variants).
- **[O]** While typing, `GET /api/searchSuggestions?phrase,type` fires (type-ahead).
- **[O]** Pressing Enter changes the URL to `/search?ie=UTF8&ref_=atv_nb_sug&phrase=reacher` *without a full document load*. The client fetches `GET /search?…&dvWebAppClientVersion=…`, which is the same route requested as data for client-side navigation. Evidence: `16-search-flow.json`.
- **[O]** The results page shows "Top results" (a grid with badges and an entitlement icon), a **Filter** dropdown, "Similar to Reacher ✦ AI beta", and "Reacher viewers also watched". Evidence: `16-search-flow.png`.

### Genre page
- **[O]** `/genre/action` loads its rail content through `GET /api/getGenre?genreId,pageNumber,pageSize,startIndex,serviceToken,…`, so the server paginates genre rails. Evidence: `14-genre-action.json`.

## 3. Client/network architecture (observed request map)

| Host (role) | Endpoints (query **names** only) | Tag |
|---|---|---|
| `www.primevideo.com` (web app/BFF) | Document routes; `POST /api/clientHandshake`; `POST /auth/guest/register`; `GET /api/enrichNav?enrichmentType`; `POST|GET /api/enrichItemMetadata?titleIDsToEnrich,metadataToEnrich,…`; `GET /api/searchSuggestions?phrase,type`; `GET /api/getGenre?…`; `GET /api/paginateCollection?pageId,pageType,paginationTargetId,…`; `GET /<route>?dvWebAppClientVersion` | [O] |
| `atv-ps-eu.primevideo.com` (device/platform services) | `/acm/GetConfiguration/{WebClient,AppResiliency,atvweb-player-config,xpPlayerconfigs}`; `/cdp/usage/{GetAppStartupConfig,GetWeblabTreatment,Clickstream,ClientsideImpression,ReportEvent}`; `/cdp/insights/reportEvent/v1/dvwebnode`; `/cdp/lumina/playerChromeResources/v1`; `/playback/prs/GetVodPlaybackResources?titleId,…`; `/playback/drm-vod/GetWidevineLicense?titleId,…` | [O] |
| `m.media-amazon.com`, `images-na.ssl-images-amazon.com` | Images (about 55 per home load), fonts, CSS, shared scripts | [O] |
| `cloudfront.xp-assets.aiv-cdn.net` | `ATVWebPlayerSDK.js`, player locale JSON (`languages/en-GB.json`) | [O] |
| `*.pop-vod-dash.main.amazon.pv-cdn.net`, `*.vod-dash.main.amazon.pv-cdn.net` | MPEG-DASH: `.mpd` manifests, `video_init.mp4`/`audio_init.mp4`, numbered fMP4 segments (206 range responses) | [O] |
| `cf-trickplay.aux.pv-cdn.net` | `*_320w.bif` (scrub-preview thumbnail sheet) | [O] |
| `www.amazon.in` | `GET /ax/signin/crossDomainAuthContext` | [O] |
| `unagi-*.amazon.com`, `global.telemetry.insights.video.a2z.com`, `*.minerva.devices.a2z.com`, `fls-na.amazon.com` | Event, metric and beacon ingestion (`/1/events/com.amazon.csm.*`, `…xpplayer.prod`, `/v2/metric-batch`) | [O] |

What this suggests:

1. **[H] Server-rendered first paint with progressive enrichment.** The document request returns a populated page (cards appear in the a11y tree right after load). Then `enrichItemMetadata` fills in per-viewer details for the visible titles (`titleIDsToEnrich`). That probably means entitlement ("Watch for free" vs "Join Prime"), watchlist state and progress, which keeps the base HTML cacheable.
2. **[O]** Client-side navigation fetches the same route with `dvWebAppClientVersion` and keeps Cache Storage buckets named `pageProps` and `pagination`. **[H]** This is an SSR app with a "page props as JSON" convention, conceptually like Next.js `getServerSideProps` data routes, and the version parameter guards against deploy skew.
3. **[O]** Device bootstrap: `GetAppStartupConfig`, `GetConfiguration/*`, and `GetWeblabTreatment` (Weblab is Amazon's experimentation system). **[H]** That covers remote config, feature flags and A/B assignment per device ID, separate from page rendering.
4. **[O]** Signed-out visitors still get an identity: `POST /auth/guest/register`, the localStorage key `pvweb:guestFlowCounted`, and a player device ID (`atvwebplayersdk_atvwebplayer_deviceid`). **[H]** A guest session lets the site personalise and run experiments before sign-in.
5. **[O]** Authentication goes through the Amazon retail account domain (`amazon.in/ax/signin/crossDomainAuthContext`, localStorage `cross-domain-sso-auth-context-state`). **[H]** Prime Video depends on the central Amazon identity service and does not own its own credential store.
6. **[O]** Analytics is a separate concern with several sinks: clickstream, client-side impressions, CSM page metrics (`csm-*` keys) and player QoS telemetry.

## 4. Backend responsibilities (inferred decomposition)

All of this section is **[H]**, built from the request map above plus standard streaming-platform practice.

| Domain | Responsibility | Evidence trail |
|---|---|---|
| **Identity & accounts** | Sign-in, SSO with the parent retail account, guest sessions, device registration | `crossDomainAuthContext`, `/auth/guest/register`, device IDs |
| **Profiles** | Several viewers per account, kid profiles, profile lock | "Profile, Settings, and Account" menu; `excludeProfileLockRestrictions` parameter on `playerChromeResources` |
| **Catalog / metadata** | Titles, seasons, episodes, cast, genres, ratings, artwork, regional availability | Detail page structure; `titleId`; `/genre/*`; maturity badges per region (U/A 16+) |
| **Merchandising / storefront** | Builds rails/collections per page and viewer, badges ("#1 in India", MOST LIKED), Top 10 | `/collection/*`, `paginateCollection`, `pageId/pageType` |
| **Enrichment / entitlement** | Per-viewer overlay: can watch? free / Prime / channel add-on / rent; watchlist state | `enrichItemMetadata`, "Watch for free" vs "Watch with a Prime membership", `/addons` |
| **Search** | Type-ahead, full search, filters, "AI beta" similarity, co-watch recommendations | `searchSuggestions`, results page sections |
| **Recommendations** | "Customers also watched", "Viewers also watched", "Similar to …" | Detail and search rails |
| **Watchlist & progress** | Add/remove, continue-watching position | Watchlist buttons; "Episode 19 Watch now" resume CTA |
| **Subscriptions & billing** | Prime membership, add-on channels (`/addons`), free tier (`/collection/streamfree`, MX Player) | Nav and CTAs |
| **Playback resources** | Resolve title → manifest URLs, CDN choice, subtitles, trickplay | `GetVodPlaybackResources`, `.mpd`, `.bif` |
| **DRM licensing** | Widevine licence issuance after entitlement | `GetWidevineLicense` (observed **only as a URL**, contents not inspected) |
| **Config & experiments** | Remote config, resiliency config, Weblab A/B | `acm/GetConfiguration/*`, `GetWeblabTreatment` |
| **Telemetry** | Clickstream, impressions, QoS, metrics | unagi / telemetry / minerva hosts |

## 5. Playback integration (as observed from outside)

- **[O]** On the detail page, and on search results (hero preview), a trailer loads automatically. The sequence is: player SDK script → `GetVodPlaybackResources?titleId` → `.mpd` from a regional DASH CDN → init segments → media segments as HTTP 206 range responses. On the detail page a `GetWidevineLicense` call also happens, so **even trailers are DRM-protected**.
- **[O]** The player is a separate SDK (`ATVWebPlayerSDK-1.0/wave2`) loaded from its own CDN and configured through `GetConfiguration/atvweb-player-config` and `xpPlayerconfigs`.
- **[O]** Trickplay previews come from `.bif` files at 320 px wide.
- **[H]** The full-episode path works the same way, with entitlement enforced at `GetVodPlaybackResources` and again at licence issuance. That is two gates, so a URL alone is useless without a licence.
- Not investigated by design: licence request/response contents, key systems beyond the URL name, or any attempt to fetch media outside the normal page flow.

## 6. Responsive UI notes

- **[O]** Desktop is 1440 px wide with about 72 px side gutters, rails of about 5.5 visible 16:9 cards (251×141 px) on a dark navy background (about `#0f171e`), white primary CTAs and a blue "Join Prime".
- **[O]** On phones (390 px) the hero is 16:9 at full width, the CTA moves below, and the rails show about 1.7 cards. The "See more ›" link stays on the right of each rail title.
- **[O]** Accessibility: landmarks (banner, navigation "Navigation Bar", main, contentinfo), carousel buttons labelled "Move back/forward to title number N", rating images with alt text "This content is rated U/A 16+", and a season selector exposed as "Season Selector. Season 2 is selected". Good patterns to copy.

## 7. Limitations

- **Single region, signed out.** Everything reflects the India marketplace, unauthenticated. Profiles, watchlist persistence, billing and the full-episode playback path were not observed.
- **Metadata only.** No bodies or header values were captured, so the shapes of `/api/*` responses are unknown and every data-model claim is [H].
- **No code analysis** (by choice). Framework identification, state management and routing internals are inferred from network behaviour alone.
- **Point in time.** Weblab experiments mean another session may get a different layout or different endpoints.
- `inspect-web-page` cannot observe across a reload (`target_changed`), so network evidence comes from REA's own scenario browser (`capture-browser-scenario`), whose fingerprint (headless, UTC→Asia/Kolkata, reduced motion) differs from a real user's browser.
- Two captures are marked `incomplete`: requests still in flight at the end (streaming segments) were recorded as `request-unfinished`.

## 8. How the prototype maps to this

| Observed concept | Prototype (Kinora, original) |
|---|---|
| SSR page + per-viewer enrichment | Next.js server components render the catalog. A per-profile overlay (watchlist, progress, entitlement) is fetched separately. |
| Storefront rails / collections | `collections` documents (ordered title IDs) → `GET /catalog/home` |
| Genre pages with server pagination | `GET /catalog/genres/:slug?page=` |
| Type-ahead + full search | `GET /search/suggest?q=` (prefix, top 6) and `GET /search?q=&genre=` (Mongo text index) |
| Detail with seasons/episodes, Related tab | `GET /titles/:slug` with embedded seasons and a `related` list |
| Profiles, kid profiles | `profiles` collection, max 5 per account, `kids` flag filters by maturity |
| Watchlist, continue watching | `watchlist` and `progress` collections keyed by profile |
| Free vs paid entitlement, upsell CTA | `title.tier` (`free`/`premium`) vs `account.plan` → "Watch free" / "Upgrade to watch" |
| PlaybackResources → manifest | `POST /playback/:titleId` checks entitlement, then returns an HLS URL for **openly licensed** test media. No DRM. |

## 9. Recommended next steps

1. If you need real API shapes, design your own. Copying Amazon's is unnecessary and not advisable. The [H] decomposition in §4 is a reasonable service map.
2. Possible follow-up captures (still signed out and public): `/livetv` (live schedule UI), `/addons` (channel-subscription merchandising), `/kids`, and an observation window while scrolling to see `paginateCollection` lazy loading.
3. For real DRM in your own product, licence a packager and DRM service (e.g. Shaka Packager + a multi-DRM vendor). Don't reverse engineer anyone else's.
4. Run a usability comparison of your prototype against these screenshots: CTA hierarchy, how readable the rails are on phones, and how fast type-ahead feels.

## 10. Evidence index

All captures were made on 2026-10-14 with REA 6.5.0, signed out. Files are REA Evidence JSON unless noted.

| File | Tool | What it shows |
|---|---|---|
| `evidence/01-home.json` | `inspect-web-page` (attached to a dedicated Chromium, 3 s window, a11y text, JSON body *shapes*, storage *key names*) | Home DOM (3,524 nodes) and a11y tree (1,586), `dom_urls` route map, script inventory (28, all first-party), storage keys, IndexedDB and Cache Storage names |
| `evidence/02-home-reload.json` | `inspect-web-page` across a reload | **Failed by design** (`target_changed`): passive inspection won't span navigations. This is why the scenario tool below was used. |
| `evidence/10…17-*.json` | `capture-browser-scenario` (REA-owned headless Chromium; network metadata and page errors; no bodies or header values) | Full request timelines for home (desktop and phone), detail (desktop and phone), `/genre/action`, `/categories`, the search flow (open → type "reacher" → Enter) and `/tv` |
| `scenarios/*.json` | inputs to the above | Exact viewport, locale, timezone and actions used; regenerate with `scripts/make-scenarios.py` |
| `screens/*.png`, `screens/*.ax.txt` | extracted from the scenario Evidence (SHA-256 verified on extraction) | Screenshots and accessibility outlines for each page |
| `evidence-network-summary.txt` | `scripts/summarize-scenario.py` | Requests grouped by host and type, endpoint paths with IDs collapsed and only query *names* kept |
| `scripts/cdp-nav.mjs` | helper | Minimal CDP navigate/reload used for the attempted reload capture |

Not captured on purpose: request or response bodies, header values, cookies, storage values, script sources, source maps, licence payloads, and media segments outside normal page loads.
