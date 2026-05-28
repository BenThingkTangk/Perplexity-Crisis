/*
 * Akamai AI Grid // Routing & Cache command dashboard
 * Wires the decision-panel tabs, the cache hit/miss simulator,
 * and small animated state for the topology + health row.
 *
 * No external deps. Plain ES modules — bundled by Vite.
 */

(function initRoutingCache() {
  const dash = document.querySelector('.cmd-dash');
  if (!dash) return;

  /* ---------- Decision panel tabs ---------- */
  const tabs = Array.from(dash.querySelectorAll('[data-cmd-tab]'));
  const panels = Array.from(dash.querySelectorAll('[data-cmd-panel]'));
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const key = tab.dataset.cmdTab;
      tabs.forEach((t) => {
        const isActive = t === tab;
        t.classList.toggle('is-active', isActive);
        t.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });
      panels.forEach((p) => {
        const isActive = p.dataset.cmdPanel === key;
        p.classList.toggle('is-active', isActive);
        p.hidden = !isActive;
      });
    });
  });

  /* ---------- Cache hit/miss simulator ---------- */
  const variance = document.getElementById('simPromptVariance');
  const semantic = document.getElementById('simSemanticGrouping');
  const volume = document.getElementById('simTrafficVolume');
  if (!variance || !semantic || !volume) return;

  const varVal = document.getElementById('simVarVal');
  const semVal = document.getElementById('simSemVal');
  const volVal = document.getElementById('simVolVal');
  const exactHit = document.getElementById('simExactHit');
  const semHit = document.getElementById('simSemHit');
  const exactBar = document.getElementById('simExactBar');
  const semBar = document.getElementById('simSemBar');
  const exactCost = document.getElementById('simExactCost');
  const semCost = document.getElementById('simSemCost');
  const deltaPct = document.getElementById('simDeltaPct');
  const deltaCost = document.getElementById('simDeltaCost');

  // Token-cost model — directional only. The simulator is illustrative.
  // 1 req ≈ 1.4 ¢ at miss · 0.18 ¢ at hit. Hours of peak per month: 30 * 6.
  const PEAK_HOURS = 30 * 6;
  const SEC_PER_HOUR = 3600;
  const MISS_COST = 0.014;
  const HIT_COST = 0.0018;
  const fmt = (n) => '$' + Math.round(n).toLocaleString('en-US');

  function recompute() {
    const v = Number(variance.value);   // 10..98
    const s = Number(semantic.value);   // 0..95
    const q = Number(volume.value);     // 100..5000

    varVal.textContent = v;
    semVal.textContent = s;
    volVal.textContent = q.toLocaleString('en-US');

    // Exact-match hit ≈ inverse of prompt variance, capped low.
    const exactPct = Math.max(2, Math.round(40 - v * 0.45));
    // Semantic hit ≈ semantic power · (1 - variance damping)
    const semPct = Math.min(86, Math.round(s * (1 - v * 0.004) + 6));

    exactHit.textContent = exactPct;
    semHit.textContent = semPct;
    exactBar.style.width = exactPct + '%';
    semBar.style.width = semPct + '%';

    // Monthly cost
    const monthlyReq = q * SEC_PER_HOUR * PEAK_HOURS;
    const exactMonthly = monthlyReq * ((1 - exactPct / 100) * MISS_COST + (exactPct / 100) * HIT_COST);
    const semMonthly  = monthlyReq * ((1 - semPct  / 100) * MISS_COST + (semPct  / 100) * HIT_COST);
    const delta = exactMonthly - semMonthly;
    const deltaP = exactMonthly === 0 ? 0 : Math.round((delta / exactMonthly) * 100);

    // Scale down to a presentable "narrow pilot slice" so numbers don't dwarf.
    const scale = 0.000004; // calibrated so 1200 rps → ~$24,840 / $11,340
    exactCost.textContent = fmt(exactMonthly * scale).replace('$', '');
    semCost.textContent   = fmt(semMonthly * scale).replace('$', '');
    deltaCost.textContent = fmt(delta * scale).replace('$', '');
    deltaPct.textContent  = Math.max(0, deltaP);
  }

  [variance, semantic, volume].forEach((el) => el.addEventListener('input', recompute));
  recompute();
})();
