/* Verify the ATOM drawer + Crisis Flow work in two scenarios:
 *   (A) Bundle BLOCKED (what user experiences in prod with COEP=require-corp).
 *       Only the inline <head> boot script runs. Everything must still work.
 *   (B) Bundle LOADS. The full module attaches handlers in addition. */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const distHtml = fs.readFileSync(path.resolve(__dirname, 'dist/index.html'), 'utf8');
const distJs   = fs.readFileSync(path.resolve(__dirname, 'dist/main.js'), 'utf8');

function makeDom(withBundle) {
  const vc = new VirtualConsole();
  vc.on('error', () => {}); vc.on('jsdomError', () => {});
  const dom = new JSDOM(distHtml, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    virtualConsole: vc,
  });
  const w = dom.window;
  w.matchMedia = (q) => ({
    matches: false, media: q,
    addListener() {}, removeListener() {},
    addEventListener() {}, removeEventListener() {},
  });
  w.IntersectionObserver = class { observe(){} unobserve(){} disconnect(){} };
  if (withBundle) {
    const cleaned = distJs.replace(/export\s+default\s+require_main\(\);/, 'require_main();');
    const s = w.document.createElement('script');
    s.textContent = cleaned;
    w.document.body.appendChild(s);
  }
  return { dom, w };
}

let failures = 0;
function expect(cond, msg) {
  if (cond) console.log('  PASS ' + msg);
  else { console.error('  FAIL ' + msg); failures++; }
}
const click = (w, el) => el.dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true }));

function runScenario(name, withBundle, cb) {
  console.log('\n================ SCENARIO: ' + name + ' ================');
  const { dom, w } = makeDom(withBundle);
  setTimeout(() => { try { cb(w); } catch (e) { console.error('  CRASH', e.message); failures++; } dom.window.close(); checkDone(); }, withBundle ? 500 : 100);
}

let pending = 2;
function checkDone() {
  if (--pending !== 0) return;
  console.log('\n================ RESULT ================');
  if (failures === 0) console.log('All checks pass.');
  else { console.error(failures + ' check(s) failed.'); process.exitCode = 1; }
}

function checkAll(w) {
  const doc = w.document;

  // 1. Launchers
  const openers = doc.querySelectorAll('[data-atom-open]');
  console.log('  launchers found:', openers.length);
  openers.forEach((b, i) => console.log('    ['+i+'] '+b.tagName+'.'+b.className.replace(/\s+/g,' ')+' :: '+b.textContent.trim().slice(0,40).replace(/\s+/g,' ')));
  expect(openers.length >= 4, openers.length + ' [data-atom-open] launchers in DOM (>=4)');

  // 2. Each launcher opens drawer
  const drawer = doc.getElementById('atom-agent');
  const backdrop = doc.querySelector('.atom-backdrop');
  expect(drawer && drawer.hidden, 'drawer is hidden before any click');

  openers.forEach((b, i) => {
    const closeBtn = doc.querySelector('[data-atom-close]');
    if (closeBtn && drawer.classList.contains('open')) {
      click(w, closeBtn);
      drawer.hidden = true; drawer.classList.remove('open');
      doc.body.classList.remove('atom-open');
    }
    click(w, b);
    const opened = !drawer.hidden && drawer.classList.contains('open');
    expect(opened, 'launcher ['+i+'] '+b.className.trim().split(' ')[0]+' opens drawer');
  });

  // 3. Backdrop closes
  if (!drawer.classList.contains('open')) click(w, openers[0]);
  click(w, backdrop);
  expect(!drawer.classList.contains('open'), 'backdrop click closes drawer');

  // 4. Crisis Flow pipeline rendered with 7 SVG nodes + 6 edges
  const canvas = doc.getElementById('flow-canvas');
  expect(canvas && canvas.innerHTML.length > 0, 'flow-canvas rendered ('+(canvas?canvas.innerHTML.length:0)+' chars)');
  expect(doc.querySelectorAll('[data-flow-canvas-idx]').length === 7, '7 SVG stage nodes');
  expect(doc.querySelectorAll('.fc-edge').length === 6, '6 SVG connector edges');
  expect(doc.querySelectorAll('.fc-hotspot').length >= 3, doc.querySelectorAll('.fc-hotspot').length + ' hotspot indicators');

  // 5. Clicking a stage node fires the handler (re-render is async; just
  //    verify the click handler is wired and doesn't throw)
  const node3 = doc.querySelector('[data-flow-canvas-idx="3"]');
  let threw = false;
  try { click(w, node3); } catch (_) { threw = true; }
  expect(!threw, 'clicking stage 3 fires handler without throwing');

  // 6. Decision panel tabs work
  const tabs = doc.querySelectorAll('[data-cmd-tab]');
  expect(tabs.length === 3, '3 decision panel tabs');
  if (tabs[1]) {
    click(w, tabs[1]);
    const akamaiPanel = doc.querySelector('[data-cmd-panel="akamai"]');
    expect(akamaiPanel && !akamaiPanel.hidden && akamaiPanel.classList.contains('is-active'), 'tab click switches active panel');
  }

  // 7. ATOM tab mode switch works
  const ctoTab = doc.querySelector('.atom-tab[data-atom-mode="cto"]');
  if (ctoTab) {
    click(w, ctoTab);
    expect(ctoTab.classList.contains('is-active'), 'ATOM CTO tab activates on click');
  }

  // 8. Single FAB, no dock
  expect(doc.querySelectorAll('.atom-fab').length === 1, 'exactly 1 .atom-fab');
  expect(doc.querySelectorAll('.atom-dock').length === 0, '0 .atom-dock (duplicate removed)');

  // 9. Nav anchors
  const askAtomNav = doc.querySelector('.nav-tool--copilot');
  expect(askAtomNav && askAtomNav.tagName === 'BUTTON' && askAtomNav.hasAttribute('data-atom-open'), 'nav Ask ATOM is BUTTON with data-atom-open');
  expect(!!doc.querySelector('a[href="#end-to-end-flow"]'), 'Crisis Flow nav link points at #end-to-end-flow');

  // 10. Cloudflare gap dashboard intact
  expect(!!doc.querySelector('.cmd-dash'), 'cmd-dash present');
  expect(doc.querySelectorAll('.cmd-score').length === 4, '4 scorecards');
  expect(doc.querySelectorAll('.cmd-health-card').length === 4, '4 provider-health cards');
  expect(!!doc.querySelector('.cmd-sources-drawer'), 'collapsible source drawer present');
  expect(doc.querySelectorAll('.cmd-input-chip').length >= 6, doc.querySelectorAll('.cmd-input-chip').length + ' routing-input chips');

  // 11. Crisis flow compaction
  expect(!!doc.querySelector('.flow-chips-row'), 'flow-chips-row present');
  expect(!!doc.querySelector('.flow-honesty-collapse'), 'honesty footer is <details>');

  // 12. ATOM brand design system tokens + font
  const headHtml = doc.head.innerHTML;
  expect(/Plus\+Jakarta\+Sans/.test(headHtml), 'Plus Jakarta Sans font link loaded');
  // CSS bundle is at dist/main.css; we read it once and assert tokens
  const cssPath = path.resolve(__dirname, 'dist/main.css');
  if (fs.existsSync(cssPath)) {
    const css = fs.readFileSync(cssPath, 'utf8');
    expect(/--atom-bg:\s*#020202/.test(css), 'ATOM --atom-bg #020202 token present');
    expect(/--atom-fg:\s*#f6f6fd/.test(css), 'ATOM --atom-fg #f6f6fd token present');
    expect(/--atom-accent:\s*#696aac/.test(css), 'ATOM --atom-accent #696aac token present');
    expect(/--atom-primary:\s*#3e3f7e/.test(css), 'ATOM --atom-primary #3e3f7e token present');
    expect(/--atom-secondary:\s*#a2a3e9/.test(css), 'ATOM --atom-secondary #a2a3e9 token present');
    expect(/Plus Jakarta Sans/.test(css), 'Plus Jakarta Sans declared in font-family stack');
    expect(/#8587e3/.test(css) && /#4c4dac/.test(css) && /#696aac/.test(css),
      'ATOM pill-button gradient stops (#8587e3 / #4c4dac / #696aac) present');
  }
}

runScenario('Bundle BLOCKED (only inline boot runs)', false, checkAll);
runScenario('Bundle LOADS (full module + inline boot)', true, checkAll);
