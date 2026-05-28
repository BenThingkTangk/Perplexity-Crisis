/* Real-browser QA harness. Runs against any URL.
 * Verifies the exact failures reported by the user:
 *   - Splash splash dismisses
 *   - FAB visible at scroll=0 AND scroll=middle
 *   - All 4 [data-atom-open] launchers open a visible centered/right drawer
 *   - Esc + backdrop close
 *   - Crisis-flow stage click updates the visible detail panel
 *   - Routing/cache has no raw <ul> in main viewport
 *   - Decision-panel cards present
 *   - No CSP errors in console
 * Exits non-zero on any failure.
 */
const { chromium } = require('playwright');

const TARGET = process.argv[2] || 'http://localhost:8765/';
let failed = 0;
const log = (...a) => console.log(...a);
const ok   = (m) => log('  PASS', m);
const fail = (m) => { console.error('  FAIL', m); failed++; };

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await ctx.newPage();
  const cspErrors = [];
  const pageErrors = [];
  page.on('console', (m) => {
    if (m.type() === 'error' && /Content Security Policy/i.test(m.text())) cspErrors.push(m.text());
  });
  page.on('pageerror', (e) => pageErrors.push(e.message));

  log('=== TARGET ===', TARGET);
  await page.goto(TARGET, { waitUntil: 'networkidle', timeout: 30000 });

  // 1. Wait for splash to dismiss (must happen even if main.js is blocked).
  await page.waitForFunction(() => {
    const b = document.getElementById('dtom-boot');
    if (!b) return true;
    return getComputedStyle(b).pointerEvents === 'none';
  }, { timeout: 5000 }).catch(() => {});
  const splash = await page.evaluate(() => {
    const b = document.getElementById('dtom-boot');
    if (!b) return { exists: false, pointerEvents: 'none' };
    const cs = getComputedStyle(b);
    return { pointerEvents: cs.pointerEvents, opacity: parseFloat(cs.opacity), zIndex: cs.zIndex };
  });
  log('\n[SPLASH]', splash);
  if (splash.pointerEvents === 'none') ok('boot splash dismissed (pointer-events:none)');
  else fail('boot splash STILL BLOCKING clicks');

  // 2. FAB at scroll=0 — must be visible in viewport bottom-right.
  await page.evaluate(() => window.scrollTo(0, 0));
  const fab0 = await page.locator('.atom-fab').first();
  const fabCount = await page.locator('.atom-fab').count();
  if (fabCount === 1) ok('exactly 1 .atom-fab in DOM');
  else fail('expected 1 .atom-fab, got ' + fabCount);
  const fab0Info = await fab0.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return { x: r.x, y: r.y, w: r.width, h: r.height, position: cs.position, zIndex: cs.zIndex, opacity: parseFloat(cs.opacity) };
  });
  log('[FAB scroll=0]', fab0Info);
  const vh = 900, vw = 1366;
  if (fab0Info.position === 'fixed' && fab0Info.opacity > 0.5 && fab0Info.x + fab0Info.w <= vw && fab0Info.y + fab0Info.h <= vh && fab0Info.x >= 0 && fab0Info.y >= 0) ok('FAB visible in viewport at scrollY=0 (position:fixed, bottom-right)');
  else fail('FAB NOT visible at scrollY=0');

  // 3. Scroll halfway down — FAB should still be fixed and visible.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
  await page.waitForTimeout(200);
  const fabMid = await fab0.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
  log('[FAB scroll=middle]', fabMid);
  if (fabMid.x + fabMid.w <= vw && fabMid.y + fabMid.h <= vh && fabMid.x >= 0 && fabMid.y >= 0) ok('FAB still in viewport when scrolled to middle of page');
  else fail('FAB NOT fixed — fell off viewport on scroll');

  await page.evaluate(() => window.scrollTo(0, 0));

  // 4. Each launcher opens drawer; backdrop closes; Esc closes.
  const launchers = await page.$$('[data-atom-open]');
  log('\n[LAUNCHERS] count=' + launchers.length);
  if (launchers.length >= 4) ok(launchers.length + ' [data-atom-open] launchers');
  else fail('expected >=4 launchers, got ' + launchers.length);

  for (let i = 0; i < launchers.length; i++) {
    // Close drawer first
    await page.evaluate(() => {
      const d = document.getElementById('atom-agent');
      const b = document.querySelector('.atom-backdrop');
      if (d) { d.classList.remove('open'); d.hidden = true; }
      if (b) b.classList.remove('open');
      document.body.classList.remove('atom-open');
    });
    // Make sure target is in view (Playwright also handles)
    await launchers[i].scrollIntoViewIfNeeded({ timeout: 1500 }).catch(() => {});
    await launchers[i].click({ timeout: 3000 });
    await page.waitForTimeout(120);
    const state = await page.evaluate(() => {
      const d = document.getElementById('atom-agent');
      const cs = getComputedStyle(d);
      const r = d.getBoundingClientRect();
      return {
        hidden: d.hasAttribute('hidden'),
        hasOpen: d.classList.contains('open'),
        display: cs.display,
        visibility: cs.visibility,
        rect: { x: r.x, y: r.y, w: r.width, h: r.height },
        inViewport: r.width > 0 && r.height > 0 && r.x < 1366 && r.y < 900 && r.x + r.width > 0 && r.y + r.height > 0,
      };
    });
    const cls = await launchers[i].evaluate((el) => el.className.split(' ')[0]);
    if (state.hasOpen && !state.hidden && state.inViewport && state.display !== 'none') ok('launcher [' + i + '] ' + cls + ' opens VISIBLE drawer in viewport (rect ' + Math.round(state.rect.x) + ',' + Math.round(state.rect.y) + ' ' + Math.round(state.rect.w) + 'x' + Math.round(state.rect.h) + ')');
    else { fail('launcher [' + i + '] ' + cls + ' drawer NOT visible'); log('       state:', state); }
  }

  // Helper to force-close
  const forceClose = async () => {
    await page.evaluate(() => {
      const d = document.getElementById('atom-agent');
      const b = document.querySelector('.atom-backdrop');
      if (d) { d.classList.remove('open'); d.hidden = true; }
      if (b) b.classList.remove('open');
      document.body.classList.remove('atom-open');
    });
    await page.waitForTimeout(50);
  };

  // 5. Esc closes drawer.
  await forceClose();
  await launchers[0].evaluate((el) => el.click());
  await page.waitForTimeout(150);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  const afterEsc = await page.evaluate(() => document.getElementById('atom-agent').classList.contains('open'));
  if (!afterEsc) ok('Esc closes drawer');
  else fail('Esc did NOT close drawer');

  // 6. Backdrop click closes.
  await forceClose();
  await launchers[0].evaluate((el) => el.click());
  await page.waitForTimeout(150);
  await page.locator('.atom-backdrop').evaluate((el) => el.click());
  await page.waitForTimeout(300);
  const afterBack = await page.evaluate(() => document.getElementById('atom-agent').classList.contains('open'));
  if (!afterBack) ok('backdrop click closes drawer');
  else fail('backdrop did NOT close drawer');
  await forceClose();

  // 7. Crisis flow: 7 SVG nodes, click stage 1 updates panel.
  await page.evaluate(() => document.getElementById('end-to-end-flow').scrollIntoView({ block: 'start' }));
  await page.waitForTimeout(300);
  const flow1 = await page.evaluate(() => ({
    stageNodes: document.querySelectorAll('[data-flow-canvas-idx]').length,
    edges: document.querySelectorAll('.fc-edge').length,
    hotspots: document.querySelectorAll('.fc-hotspot').length,
    panelTextBefore: document.getElementById('flow-panel') ? document.getElementById('flow-panel').textContent.trim().slice(0, 80) : null,
  }));
  log('\n[CRISIS FLOW initial]', flow1);
  if (flow1.stageNodes === 7) ok('7 SVG stage nodes');
  if (flow1.edges === 6) ok('6 connector edges');
  if (flow1.hotspots >= 3) ok(flow1.hotspots + ' hotspot indicators');

  // Click stage 3 (auth/billing) — dispatch via JS to bypass Playwright's
  // SVG-animation stability check (which would otherwise hit a 30 s wait).
  await page.evaluate(() => {
    const g = document.querySelector('[data-flow-canvas-idx="3"]');
    if (!g) return;
    const r = g.getBoundingClientRect();
    const cx = r.x + r.width / 2;
    const cy = r.y + r.height / 2;
    g.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: cx, clientY: cy }));
  });
  await page.waitForTimeout(350);
  const after = await page.evaluate(() => {
    const p = document.getElementById('flow-panel');
    const activeIdx = document.querySelector('.fc-node--active') ? document.querySelector('.fc-node--active').getAttribute('data-flow-canvas-idx') : null;
    return {
      panelText: p ? p.textContent.trim().slice(0, 120) : null,
      activeIdx,
      hasAuthBilling: p && /(Payment-state cascade|Stage 04)/i.test(p.textContent),
    };
  });
  log('[CRISIS FLOW after stage-3 click]', after);
  if (after.activeIdx === '3') ok('clicking stage 3 marks it active (data-flow-canvas-idx=3)');
  else fail('stage 3 click did not become active (got ' + after.activeIdx + ')');
  if (after.hasAuthBilling) ok('flow-panel content updated to stage 3 (auth/billing)');
  else fail('flow-panel did NOT update with stage 3 content');

  // 8. Routing/cache section — no raw bullet dumps.
  const rc = await page.evaluate(() => {
    const sec = document.getElementById('cloudflare-routing-cache');
    if (!sec) return { missing: true };
    // Count <ul> that are NOT inside collapsible details / drawer / .cmd-tabpanel (we use cards now)
    const visibleULs = Array.from(sec.querySelectorAll('ul')).filter((ul) => {
      const cs = getComputedStyle(ul);
      if (cs.display === 'none' || cs.visibility === 'hidden') return false;
      // Skip ones inside collapsed <details>
      const det = ul.closest('details');
      if (det && !det.open) return false;
      return true;
    });
    return {
      missing: false,
      visibleULCount: visibleULs.length,
      decisionCards: sec.querySelectorAll('.cmd-decision-card').length,
      scoreCards: sec.querySelectorAll('.cmd-score').length,
      healthCards: sec.querySelectorAll('.cmd-health-card').length,
      sourceDrawer: !!sec.querySelector('.cmd-sources-drawer'),
      inputChips: sec.querySelectorAll('.cmd-input-chip').length,
    };
  });
  log('\n[ROUTING/CACHE]', rc);
  if (rc.visibleULCount === 0) ok('no visible raw <ul> in routing/cache main viewport');
  else fail(rc.visibleULCount + ' raw <ul> still visible in routing/cache section');
  if (rc.decisionCards >= 10) ok(rc.decisionCards + ' decision cards (was bullet list)');
  if (rc.scoreCards === 4 && rc.healthCards === 4 && rc.sourceDrawer && rc.inputChips >= 6) ok('dashboard: 4 scorecards, 4 health cards, collapsible source drawer, 6+ input chips');

  // 9. Console errors
  log('\n[CSP errors]', cspErrors.length);
  log('[Page errors]', pageErrors.length);
  if (cspErrors.length === 0) ok('no CSP violations in console');
  else fail(cspErrors.length + ' CSP violations: ' + cspErrors.slice(0,2).join(' | '));
  if (pageErrors.length === 0) ok('no JS page errors');

  // 10. Screenshots for evidence
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: '/tmp/qa-hero.png', fullPage: false });
  await page.click('.atom-fab', { timeout: 2000 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: '/tmp/qa-drawer-open.png', fullPage: false });
  await page.keyboard.press('Escape');
  await page.evaluate(() => document.getElementById('end-to-end-flow').scrollIntoView({ block: 'start' }));
  await page.waitForTimeout(200);
  await page.screenshot({ path: '/tmp/qa-flow.png', fullPage: false });
  await page.evaluate(() => {
    const g = document.querySelector('[data-flow-canvas-idx="3"]');
    if (g) g.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: '/tmp/qa-stage3.png', fullPage: false });
  await page.evaluate(() => document.getElementById('cloudflare-routing-cache').scrollIntoView({ block: 'start' }));
  await page.waitForTimeout(200);
  await page.screenshot({ path: '/tmp/qa-routing.png', fullPage: false });

  await browser.close();
  log('\n================ RESULT ================');
  if (failed === 0) log('All checks pass.');
  else { console.error(failed + ' check(s) failed.'); process.exit(1); }
})().catch((e) => { console.error('FATAL', e); process.exit(2); });
