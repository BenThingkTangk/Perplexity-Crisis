/* Visual QA — headless screenshots at 1842x912 and 1440x950.
 *   - Section snapshots: routing/cache, claims matrix, timeline, crisis flow,
 *     ATOM drawer open.
 *   - Asserts no horizontal scroll, FAB does not cover active panel,
 *     drawer input is visible.
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const TARGET = process.argv[2] || 'http://localhost:8765/';
const OUT    = process.argv[3] || '/home/user/workspace/Perplexity-Crisis-5b8eb7aa/qa-shots';
fs.mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { name: '1842x912', width: 1842, height: 912 },
  { name: '1440x950', width: 1440, height: 950 },
];

// Scroll target offsets: for each section, scroll so that the *content
// payload* is centered in the viewport — not just the heading.
const SECTIONS = [
  { id: 'cloudflare-routing-cache', file: 'routing-cache',  scrollSelector: '.cmd-scorecards' },
  { id: 'claims-risk',              file: 'claims-risk',    scrollSelector: '.risk-matrix__body' },
  { id: 'infra-timeline',           file: 'infra-timeline', scrollSelector: '.tl__steps' },
  { id: 'end-to-end-flow',          file: 'crisis-flow',    scrollSelector: '.flow-canvas' },
  { id: 'pilot',                    file: 'pilot',          scrollSelector: '.calc-grid' },
];

let failures = 0;
const note  = (msg) => console.log('  ' + msg);
const ok    = (msg) => console.log('  PASS ' + msg);
const fail  = (msg) => { console.error('  FAIL ' + msg); failures++; };

(async () => {
  const browser = await chromium.launch({ headless: true });

  for (const vp of VIEWPORTS) {
    console.log('\n=== VIEWPORT ' + vp.name + ' ===');
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();

    // Capture page errors
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

    await page.goto(TARGET, { waitUntil: 'networkidle', timeout: 30000 });
    // Dismiss boot splash explicitly
    await page.evaluate(() => {
      const b = document.getElementById('dtom-boot');
      if (b) { b.setAttribute('data-state', 'done'); b.style.display = 'none'; b.style.pointerEvents = 'none'; }
    });
    await page.waitForTimeout(500);

    // 1. Horizontal overflow
    const wScroll = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    note('scrollWidth=' + wScroll.scrollWidth + ' clientWidth=' + wScroll.clientWidth);
    if (wScroll.scrollWidth <= wScroll.clientWidth + 2) ok('no horizontal overflow');
    else fail('horizontal overflow by ' + (wScroll.scrollWidth - wScroll.clientWidth) + 'px');

    // 2. Section screenshots
    for (const s of SECTIONS) {
      await page.evaluate((args) => {
        const { id, selector } = args;
        const target = (selector && document.querySelector('#' + id + ' ' + selector)) || document.getElementById(id);
        if (target) target.scrollIntoView({ behavior: 'instant', block: 'center' });
      }, { id: s.id, selector: s.scrollSelector });
      await page.waitForTimeout(550);
      const outFile = path.join(OUT, vp.name + '_' + s.file + '.png');
      await page.screenshot({ path: outFile, fullPage: false });
      ok('captured ' + s.file + ' → ' + outFile);
    }

    // 3. FAB not covering the active flow panel (heuristic)
    await page.evaluate(() => document.getElementById('end-to-end-flow')?.scrollIntoView({ block: 'start' }));
    await page.waitForTimeout(300);
    const flowCheck = await page.evaluate(() => {
      const fab  = document.querySelector('.atom-fab');
      const panel = document.querySelector('.flow-panel');
      if (!fab || !panel) return { ok: false, reason: 'fab or panel missing' };
      const f = fab.getBoundingClientRect();
      const p = panel.getBoundingClientRect();
      // If FAB visually intersects the panel by more than 60% of FAB area, that's a cover.
      const ix = Math.max(0, Math.min(f.right, p.right) - Math.max(f.left, p.left));
      const iy = Math.max(0, Math.min(f.bottom, p.bottom) - Math.max(f.top, p.top));
      const inter = ix * iy;
      const fabArea = (f.width * f.height) || 1;
      return { ok: inter / fabArea < 0.6, ratio: (inter / fabArea).toFixed(2) };
    });
    if (flowCheck.ok) ok('FAB not covering flow panel (overlap ratio ' + flowCheck.ratio + ')');
    else fail('FAB overlaps flow panel too much (ratio ' + flowCheck.ratio + ')');

    // 4. Open ATOM drawer and screenshot + check input visibility
    await page.evaluate(() => document.querySelector('.atom-fab')?.click());
    await page.waitForTimeout(500);
    const inputCheck = await page.evaluate(() => {
      const input = document.getElementById('atom-input');
      const drawer = document.getElementById('atom-agent');
      if (!input || !drawer) return { ok: false, reason: 'missing' };
      const r = input.getBoundingClientRect();
      const dr = drawer.getBoundingClientRect();
      const cs = getComputedStyle(input);
      const visible = r.width > 50 && r.height >= 36 && cs.visibility !== 'hidden' && cs.display !== 'none';
      const insideDrawer = r.top >= dr.top - 2 && r.bottom <= dr.bottom + 2;
      return { ok: visible && insideDrawer, w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top), bottom: Math.round(r.bottom), drawerBottom: Math.round(dr.bottom) };
    });
    if (inputCheck.ok) ok('ATOM input visible & inside drawer (w=' + inputCheck.w + ' h=' + inputCheck.h + ')');
    else fail('ATOM input visibility issue: ' + JSON.stringify(inputCheck));
    const drawerOut = path.join(OUT, vp.name + '_atom-drawer.png');
    await page.screenshot({ path: drawerOut, fullPage: false });
    ok('captured atom-drawer → ' + drawerOut);

    // close drawer
    await page.evaluate(() => document.querySelector('.atom-backdrop')?.click());
    await page.waitForTimeout(200);

    if (errors.length) {
      console.warn('  console/page errors:', errors.slice(0, 4));
    }

    await ctx.close();
  }
  await browser.close();

  console.log('\n=== RESULT ===');
  if (failures === 0) console.log('All visual QA checks passed.');
  else { console.error(failures + ' check(s) failed.'); process.exitCode = 1; }
})();
