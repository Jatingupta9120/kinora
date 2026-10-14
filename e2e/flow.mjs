// End-to-end browser check of the main Kinora flows against running web + API servers.
// Usage: CHROMIUM_PATH=/path/to/chrome node e2e/flow.mjs   (WEB_URL defaults to http://localhost:3000)
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';

const WEB = process.env.WEB_URL ?? 'http://localhost:3000';
const SHOTS = process.env.SHOTS_DIR ?? 'e2e/screens';
mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, headless: true });
const results = [];
let current; // page used by the running step, for failure diagnostics
async function step(name, fn) {
  try {
    await fn();
    results.push(['PASS', name]);
  } catch (err) {
    const where = current ? ` @ ${current.url()}` : '';
    if (current) await current.screenshot({ path: `${SHOTS}/FAIL-${name.replace(/\W+/g, '-')}.png` }).catch(() => {});
    results.push(['FAIL', name, err.message.split('\n')[0] + where]);
  }
}
const expectVisible = (locator, timeout = 10_000) => locator.first().waitFor({ state: 'visible', timeout });
// Next keeps previously visited routes mounted but hidden (React <Activity>), so act on visible matches only.
const visible = (locator) => locator.filter({ visible: true });

try {
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await desktop.newPage();
  current = page;
  const consoleErrors = [];
  page.on('pageerror', (e) => consoleErrors.push(e.message));

  await step('home renders hero and rails', async () => {
    await page.goto(WEB);
    await expectVisible(page.getByRole('heading', { name: 'Top 10 on Kinora this week' }));
    await expectVisible(page.getByRole('region', { name: 'Featured titles' }));
    await page.screenshot({ path: `${SHOTS}/home-desktop.png` });
  });

  await step('type-ahead suggests and opens a title', async () => {
    await page.getByRole('button', { name: 'Search Kinora' }).click();
    await page.getByRole('combobox').fill('har');
    await expectVisible(page.getByRole('option', { name: /Harbor Lights/ }));
    await page.screenshot({ path: `${SHOTS}/typeahead.png` });
    await page.getByRole('combobox').press('ArrowDown');
    await page.getByRole('combobox').press('Enter');
    await page.waitForURL('**/title/harbor-lights');
    await expectVisible(page.getByRole('heading', { level: 1, name: 'Harbor Lights' }));
  });

  await step('detail: season selector, episode list and tabs', async () => {
    await expectVisible(page.getByRole('tab', { name: 'episodes' }));
    await page.getByRole('combobox').last().selectOption('2');
    await expectVisible(page.getByRole('heading', { name: '1. Two Lights' }));
    await page.screenshot({ path: `${SHOTS}/detail-desktop.png` });
    await page.getByRole('tab', { name: 'details' }).click();
    await expectVisible(page.getByText('Mara Quist'));
  });

  await step('full search with facet filter', async () => {
    await page.goto(`${WEB}/search?q=thriller`);
    await expectVisible(page.getByRole('heading', { name: /Results for/ }));
    await page.getByRole('navigation', { name: 'Filters' }).getByRole('link', { name: 'Movies' }).click();
    await page.waitForURL(/kind=movie/);
    await expectVisible(page.getByRole('link', { name: /Iron Meridian/ }));
    await page.screenshot({ path: `${SHOTS}/search.png` });
  });

  // A fresh account per run keeps the test independent of earlier runs and of the demo data.
  const email = `e2e${Date.now()}@kinora.test`;
  const me = email.split('@')[0].slice(0, 20);

  await step('sign up creates an account with a default profile', async () => {
    await page.goto(`${WEB}/signup`);
    await visible(page.getByLabel('Email', { exact: true })).fill(email);
    await visible(page.getByLabel('Password', { exact: true })).fill('e2e-password');
    await visible(page.getByRole('button', { name: 'Create account' })).click();
    await page.waitForURL(/\/profiles/, { waitUntil: 'commit' });
    await expectVisible(visible(page.getByRole('button', { name: `Watch as ${me}` })));
  });

  await step('add a kids profile', async () => {
    await visible(page.getByLabel('New profile name')).fill('Kids');
    await visible(page.getByLabel('Kids profile')).check();
    await visible(page.getByRole('button', { name: 'Add profile' })).click();
    await expectVisible(visible(page.getByRole('button', { name: 'Watch as Kids (kids profile)' })));
    await page.screenshot({ path: `${SHOTS}/profiles.png` });
  });

  await step('sign in returns to the requested page (free plan -> premium upsell)', async () => {
    await page.context().clearCookies();
    await page.goto(`${WEB}/watch/iron-meridian`);
    await page.waitForURL(/\/login\?next=/, { waitUntil: 'commit' });
    await visible(page.getByLabel('Email', { exact: true })).fill(email);
    await visible(page.getByLabel('Password', { exact: true })).fill('e2e-password');
    await visible(page.getByRole('button', { name: 'Sign in' })).click();
    await page.waitForURL(/\/profiles\?next=%2Fwatch%2Firon-meridian/, { waitUntil: 'commit' });
    await visible(page.getByRole('button', { name: `Watch as ${me}` })).click();
    await page.waitForURL(/\/plans\?next=/, { waitUntil: 'commit' });
    await expectVisible(visible(page.getByRole('button', { name: 'Upgrade to Premium' })));
  });

  await step('free plan: upsell on detail page, watchlist toggle persists', async () => {
    await page.goto(`${WEB}/title/iron-meridian`);
    await expectVisible(visible(page.getByRole('link', { name: 'Get Premium to watch' })));
    await visible(page.getByRole('button', { name: 'Add to watchlist' })).click();
    await expectVisible(visible(page.getByRole('button', { name: 'Remove from watchlist' })));
    await page.goto(`${WEB}/watchlist`);
    await expectVisible(visible(page.getByRole('link', { name: /Iron Meridian/ })));
  });

  await step('free title plays via HLS and saves progress', async () => {
    await page.goto(`${WEB}/watch/paper-comets`);
    const video = page.locator('video');
    await video.waitFor();
    await page.waitForFunction(() => {
      const v = document.querySelector('video');
      return v && v.readyState >= 2;
    }, null, { timeout: 30_000 });
    await video.evaluate((v) => { v.muted = true; v.currentTime = 120; return v.play(); });
    await page.waitForTimeout(1500);
    await video.evaluate((v) => v.pause());
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${SHOTS}/player.png` });
    await page.goto(WEB);
    await expectVisible(visible(page.getByRole('heading', { name: 'Continue watching' })));
    await expectVisible(visible(page.getByRole('link', { name: /Resume Paper Comets/ })));
    await page.screenshot({ path: `${SHOTS}/home-signed-in.png` });
  });

  await step('upgrade unlocks premium playback, downgrade restores the gate', async () => {
    await page.goto(`${WEB}/plans?next=/watch/iron-meridian`);
    await visible(page.getByRole('button', { name: 'Upgrade to Premium' })).click();
    await page.waitForURL('**/watch/iron-meridian', { waitUntil: 'commit' });
    await page.locator('video').waitFor();
    await page.goto(`${WEB}/plans`);
    await visible(page.getByRole('button', { name: 'Switch to Free' })).click();
    await expectVisible(visible(page.getByRole('button', { name: 'Upgrade to Premium' })));
    await page.goto(`${WEB}/title/iron-meridian`);
    await expectVisible(visible(page.getByRole('link', { name: 'Get Premium to watch' })));
  });

  await step('kids profile filters catalog and blocks mature titles', async () => {
    await page.goto(`${WEB}/profiles`);
    await visible(page.getByRole('button', { name: 'Watch as Kids (kids profile)' })).click();
    await page.waitForURL(WEB + '/', { waitUntil: 'commit' });
    await expectVisible(visible(page.getByText('Kids profile: showing titles rated ALL and 7+ only.')));
    const ratings = await visible(page.locator('[aria-label^="Rated"]')).allInnerTexts();
    if (ratings.length === 0) throw new Error('no titles rendered');
    if (ratings.some((r) => !['ALL', '7+'].includes(r))) throw new Error(`unexpected ratings ${[...new Set(ratings)]}`);
    await page.goto(`${WEB}/watch/hollow-pines`);
    await expectVisible(visible(page.getByRole('heading', { name: 'Not available on this profile' })));
  });

  await step('sign out', async () => {
    await page.goto(WEB);
    await visible(page.getByLabel('Account menu')).click();
    await visible(page.getByRole('button', { name: 'Sign out' })).click();
    await expectVisible(visible(page.getByRole('link', { name: 'Sign in' })));
  });

  await step('no uncaught page errors', async () => {
    if (consoleErrors.length) throw new Error(consoleErrors.join(' | '));
  });

  const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const mp = await phone.newPage();
  current = mp;
  await step('phone layout: no horizontal page overflow', async () => {
    for (const path of ['/', '/title/harbor-lights', '/search?q=drama']) {
      await mp.goto(WEB + path);
      await mp.waitForLoadState('networkidle');
      const overflow = await mp.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (overflow > 1) throw new Error(`${path} overflows by ${overflow}px`);
    }
    await mp.goto(WEB);
    await expectVisible(visible(mp.getByRole('heading', { name: 'Top 10 on Kinora this week' })));
    await mp.screenshot({ path: `${SHOTS}/home-phone.png`, fullPage: true });
    await mp.goto(`${WEB}/title/harbor-lights`);
    await expectVisible(visible(mp.getByRole('heading', { level: 1, name: 'Harbor Lights' })));
    await mp.screenshot({ path: `${SHOTS}/detail-phone.png` });
  });
} finally {
  await browser.close();
}

for (const r of results) console.log(r.join('  '));
process.exit(results.some((r) => r[0] === 'FAIL') ? 1 : 0);
