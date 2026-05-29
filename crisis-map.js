/* Akamai AI Grid // CRISIS MAP — interactive donut, micro-store, auto-cycle
 * Source-neutral copy: public incident records, first-party API evidence,
 * confirmed architectural disclosures. Claim labels per the AI Grid brief. */
(() => {
  'use strict';
  const CRISES = [
    {
      id: 0, color: '#ef4444',
      eyebrow: '01 / BILLING CASCADE',
      title: 'Credit entitlement is in the critical path of every API call',
      weight: '28% of failure surface',
      body: 'Perplexity API authentication uses Bearer tokens with per-token credit metering. Credit exhaustion or billing-system failure produces 401/402 responses that immediately block the API call — with no graceful degradation path for downstream integrations.',
      evidence: [
        'Billing Cascade — First-Party Evidence · documented API access interruptions correlated with Perplexity billing-system events',
        'Billing System Incident Confirmed · Perplexity confirmed a billing system failure; credits refunded for the impact period, bonus credits granted',
        'StatusGator public record · 25+ Perplexity API outages tracked since May 2025, including Sonar API down-severity incidents',
      ],
      fixes: [
        'EdgeWorkers circuit breaker · detect repeated 401/402 at the edge in real time',
        'Sub-500&nbsp;ms policy swap · route to fallback, serve cached responses, return graceful error',
        'Automatic restoration when the billing endpoint recovers — no full retry chain reaches the user',
      ],
      metrics: [{ val: '<500ms', label: 'Failover time' }, { val: '25+', label: 'Public outages' }, { val: '1', label: 'SLA owner' }],
    },
    {
      id: 1, color: '#f5b942',
      eyebrow: '02 / ORCHESTRATION CHAOS',
      title: 'Three independent compute planes · no unified runtime above them',
      weight: '24% of failure surface',
      body: 'Public deal history confirms three independent compute planes: AWS (primary cloud), Microsoft Foundry ($750M / 3-year model-acquisition platform), and CoreWeave (GB200 NVL72 dedicated inference). Each is a separate operational, billing, and SLA graph — no shared abstraction layer above them today.',
      evidence: [
        'AWS confirmed as primary cloud · Reuters January 2026 + AWS case study',
        'Microsoft Foundry · Reuters · $750M / 3-year commitment for model acquisition',
        'CoreWeave · press release March 4, 2026 · dedicated GB200 NVL72-powered clusters',
      ],
      fixes: [
        'Akamai AI Grid as single convergence fabric above AWS / Foundry / CoreWeave',
        'Workload-aware routing · cost-per-token, TTFT, provider health, queue depth',
        'One operational owner for user-facing distribution — one SLA',
      ],
      metrics: [{ val: '3→1', label: 'Control planes' }, { val: '4,400+', label: 'Edge POPs' }, { val: '2.5×', label: 'Latency reduction' }],
    },
    {
      id: 2, color: '#00e6d3',
      eyebrow: '03 / LATENCY & TTFT SPIKES',
      title: 'Geographic concentration · the first-mile penalty before inference',
      weight: '22% of failure surface',
      body: 'Public benchmarks were initiated from AWS us-east-1, with reported median Search API latency of 358&nbsp;ms and P95 under 800&nbsp;ms — strongly suggesting regional concentration of the search-retrieval path. Distant users absorb the first-mile latency before inference begins.',
      evidence: [
        'Perplexity Research May 2026 · median 358&nbsp;ms / P95 &lt; 800&nbsp;ms · benchmarked from us-east-1',
        'Regional Demand Distribution — Field Observations · active API usage across Texas, Atlanta, Palo Alto, Montreal, and Switzerland',
        'CoreWeave GB200 NVL72 · high-density inference still suffers centralized first-mile latency',
      ],
      fixes: [
        'Distribute inference to nearest of 4,400+ Akamai edge PoPs',
        'Sub-50&nbsp;ms TTFT target for select real-time workloads via AI Grid',
        'Semantic caching at edge · eliminate repeat-token compute (roadmap)',
      ],
      metrics: [{ val: '<50ms', label: 'TTFT target' }, { val: '86%', label: 'Cost savings' }, { val: '358ms', label: 'Search retrieval P50' }],
    },
    {
      id: 3, color: '#5aa4f7',
      eyebrow: '04 / SUPPORT FRAGMENTATION',
      title: 'Incidents straddle three independent SLA boundaries',
      weight: '15% of failure surface',
      body: 'When an incident touches AWS, Foundry, and CoreWeave, escalations open with three vendors — each pointing at the others. No single throat to choke. Akamai Field Engagement: active infrastructure evaluation between Akamai and Perplexity teams covering multi-cloud orchestration and reliability recovery.',
      evidence: [
        'Akamai Field Engagement · active infrastructure evaluation threads · multi-cloud orchestration and reliability recovery',
        'Public Perplexity status page tracks only API and Website — billing, Comet, and search are not separately tracked',
        'Recent acknowledgment of incident occurred 12 minutes after public detection · "service unavailable due to internal server error"',
      ],
      fixes: [
        'Akamai becomes single point of accountability for user-facing distribution',
        'Unified observability · one dashboard for routing, latency, incidents, billing health',
        'Region-aware routing keeps compliance traffic geographically contained',
      ],
      metrics: [{ val: '1', label: 'SLA owner' }, { val: '3→1', label: 'Vendor escalation chain' }, { val: '24/7', label: 'NOC coverage' }],
    },
    {
      id: 4, color: '#a855f7',
      eyebrow: '05 / EGRESS COST DRAG',
      title: 'Cross-cloud traffic quietly compounds at scale',
      weight: '11% of failure surface',
      body: 'Every query traversing AWS ↔ Foundry ↔ CoreWeave boundaries carries cross-cloud egress costs that compound as volume scales. At Perplexity traffic levels (200M daily queries on the Search API alone), fractional per-GB cross-cloud costs accumulate into material spend drag — invisible short-term, structural at scale.',
      evidence: [
        'Akamai-cited up to 86% AI inference cost savings vs. traditional hyperscaler infrastructure',
        'Industry standard cross-region egress · $0.08–$0.12/GB · scales linearly with traffic',
        'Supply-Chain Expansion Signal · Perplexity added Polytomic Inc. as a data sub-processor (announced via official email · effective June 8, 2026)',
      ],
      fixes: [
        'Semantic caching at the edge · eliminate repeat cross-cloud token fetches (roadmap)',
        'Intelligent routing minimizes cross-provider traffic from nearest PoP',
        'Token-economics control plane · workload-aware cost-per-token optimization',
      ],
      metrics: [{ val: '86%', label: 'Inference savings' }, { val: '200M', label: 'Daily queries' }, { val: '4,400+', label: 'Edge PoPs' }],
    },
  ];

  let _i = 0;
  const _s = new Set();
  const store = {
    get: () => _i,
    set: (i) => { if (i === _i) return; _i = i; _s.forEach(f => f(i)); },
    subscribe: (f) => { _s.add(f); return () => _s.delete(f); },
  };

  function render(idx) {
    const d = CRISES[idx], el = document.getElementById('crisis-detail-inner');
    if (!el) return;
    el.innerHTML = `<div class="cd-eyebrow" style="color:${d.color}"><span class="cd-pip" style="background:${d.color}"></span>${d.eyebrow}</div><div class="cd-title">${d.title}</div><div class="cd-weight">${d.weight}</div><p class="cd-body">${d.body}</p><div class="cd-evidence"><strong>// Evidence</strong>${d.evidence.map(e => `<div>${e}</div>`).join('')}</div><div class="cd-fix-label">// Akamai convergence fix</div><ul class="cd-fix-list">${d.fixes.map(f => `<li style="color:${d.color}">${f}</li>`).join('')}</ul><div class="cd-metrics">${d.metrics.map(m => `<div class="cd-metric" style="border-color:color-mix(in srgb,${d.color} 30%,transparent)"><b style="color:${d.color}">${m.val}</b><span>${m.label}</span></div>`).join('')}</div>`;
    el.style.animation = 'none'; void el.offsetHeight; el.style.animation = '';
    const p = document.getElementById('crisis-detail');
    if (p) p.style.borderColor = `color-mix(in srgb,${d.color} 35%,transparent)`;
  }

  function sync(i) {
    document.querySelectorAll('.crisis-seg').forEach(s => s.classList.toggle('active', parseInt(s.dataset.seg, 10) === i));
    document.querySelectorAll('.crisis-pill').forEach(p => p.classList.toggle('active', parseInt(p.dataset.seg, 10) === i));
    render(i);
  }

  let _t = null;
  const go = () => { _t = setInterval(() => store.set((store.get() + 1) % CRISES.length), 5200); };
  const stop = () => { clearInterval(_t); _t = null; };

  function init() {
    document.querySelectorAll('.crisis-seg').forEach(s => s.addEventListener('click', () => { stop(); store.set(parseInt(s.dataset.seg, 10)); }));
    document.querySelectorAll('.crisis-pill').forEach(p => p.addEventListener('click', () => { stop(); store.set(parseInt(p.dataset.seg, 10)); }));
    const stage = document.getElementById('crisis-donut-stage');
    if (stage) {
      stage.setAttribute('tabindex', '0');
      stage.addEventListener('keydown', (e) => {
        const c = store.get();
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); store.set((c + 1) % CRISES.length); }
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); store.set((c - 1 + CRISES.length) % CRISES.length); }
        else if (e.key >= '1' && e.key <= '5') store.set(Number(e.key) - 1);
      });
      stage.addEventListener('mouseenter', stop);
      stage.addEventListener('mouseleave', go);
    }
    store.subscribe(sync); sync(0); go();
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
  window.CrisisMapStore = store; window.CRISIS_DATA = CRISES;

  /* ============ FIELD SIGNALS — Discord + status-channel patterns (May 2026) ============
   * Six community-sourced operational signals from Perplexity's public Discord
   * and official status channel. Each carries an Akamai opportunity label:
   *   - "Displacement"  : front-door / bot / API gateway lane where Akamai could
   *                       offer a better experience than the current public-edge stack.
   *   - "Convergence"   : multi-cloud orchestration / API gateway / idempotency lane
   *                       where the AI Grid runtime layer adds value WITHOUT touching
   *                       Perplexity's AWS + Foundry + CoreWeave compute graph.
   *   - "Observability" : DataStream / mPulse / RUM lane — proactive enterprise signal.
   *
   * All labels per the Discord-research playbook: CONFIRMED / LIKELY / UNKNOWN / ASK.
   * No verbatim user quotes, no usernames, no claims about Perplexity's own routing.
   */
  const FIELD_SIGNALS = [
    {
      id: 'fs-comet-cf',
      lane: 'Displacement',
      laneColor: '#ef4444',
      eyebrow: 'May 24, 2026 · Comet desktop · ongoing',
      title: 'Comet ↔ Cloudflare verification wall',
      body: 'Community-reported pattern: Comet browser fails Cloudflare bot-detection on third-party sites; users blocked at the challenge page across devices and networks. This is a Comet third-party-site compatibility signal — not a claim about Perplexity\'s own routing.',
      claim: 'LIKELY — TLS/UA fingerprint mismatch with Cloudflare bot mitigation',
      move: 'Akamai Bot Manager + Client Reputation use different signals — Comet could be whitelisted at the edge by a partner-grade compatibility lane.',
    },
    {
      id: 'fs-may7',
      lane: 'Convergence',
      laneColor: '#f5b942',
      eyebrow: 'May 7–8, 2026 · Website + API · 4 h window',
      title: 'Multi-component degradation with re-escalation',
      body: 'Status channel record: Website degraded at 20:20 UTC, API degraded ten minutes later, "Resolved" at 22:01, re-opened to "Identified" at 22:12, final resolved 00:22 UTC May 8. Re-escalation pattern suggests partial-edge consistency, not just origin recovery.',
      claim: 'CONFIRMED — status sequence is public; auto-resolve misfire observable',
      move: 'Akamai GTM + DataStream 2 propagate per-edge health faster than DNS-TTL failover and prevent false-positive auto-resolutions on the status surface.',
    },
    {
      id: 'fs-billing',
      lane: 'Convergence',
      laneColor: '#f5b942',
      eyebrow: 'May 14–22, 2026 · Billing · multiple reports',
      title: 'Billing state-machine cluster',
      body: 'Independent community reports of double-charge on enterprise plan, silent annual-default after pause/resume, and a critical UI failure when switching plans inside Comet. Pattern is consistent with missing idempotency at the billing API.',
      claim: 'LIKELY — billing microservice lacks edge-enforced idempotency',
      move: 'Akamai API Gateway idempotency keys + EdgeAuth subscription-state token prevent replay and protect the billing path without Perplexity backend changes.',
    },
    {
      id: 'fs-support',
      lane: 'Observability',
      laneColor: '#5aa4f7',
      eyebrow: 'May 15–29, 2026 · Enterprise + wire-transfer customers',
      title: 'Enterprise support blackout',
      body: 'Multiple Enterprise-tier customers report ~2 weeks with no human support response. Wire-transfer license issues also unresolved via bot triage. Pattern is operational, not technical — but it puts every enterprise deal at risk.',
      claim: 'CONFIRMED — multiple independent reports across channels',
      move: 'Akamai mPulse RUM + DataStream 2 give Perplexity per-tenant proactive monitoring — degradations surface before enterprise customers file tickets.',
    },
    {
      id: 'fs-rate',
      lane: 'Convergence',
      laneColor: '#f5b942',
      eyebrow: 'May 28–29, 2026 · Web · authenticated users',
      title: 'Rate-limit false positives on web search',
      body: 'Authenticated users hit "limit reached" on basic web search. Persistence across incognito, adblocker-disable and login cycle indicates server-side session mis-attribution (IP or fingerprint), not client cookies.',
      claim: 'LIKELY — IP/fingerprint-keyed rate limiting mis-attributing sessions',
      move: 'Akamai API Gateway token-based identity-aware rate limiting (EdgeAuth-keyed) reduces false positives without weakening enforcement.',
    },
    {
      id: 'fs-connectors',
      lane: 'Observability',
      laneColor: '#5aa4f7',
      eyebrow: 'May 21–29, 2026 · Web · multiple connectors',
      title: 'Connector OAuth lifecycle failures',
      body: 'Airtable connector reported broken with active multi-reply thread; Google Drive connector responds but cannot read or acknowledge files. Pattern is consistent with token-refresh / scope drift at the OAuth layer.',
      claim: 'LIKELY — connector OAuth tokens expiring or losing scope silently',
      move: 'Akamai API Security observes OAuth token flows at the edge and alerts on expiry / scope-loss patterns without backend instrumentation.',
    },
  ];

  function renderFieldSignals() {
    const root = document.getElementById('field-signals-grid');
    if (!root) return;
    root.innerHTML = FIELD_SIGNALS.map((s) => `
      <article class="fs-card" data-fs-id="${s.id}" style="--c:${s.laneColor}">
        <div class="fs-card__top">
          <span class="fs-card__lane" style="--c:${s.laneColor}"><span class="pip" style="background:${s.laneColor}"></span>${s.lane}</span>
          <span class="fs-card__eyebrow">${s.eyebrow}</span>
        </div>
        <h3 class="fs-card__title">${s.title}</h3>
        <p class="fs-card__body">${s.body}</p>
        <div class="fs-card__claim">${s.claim}</div>
        <div class="fs-card__move"><span class="fs-card__move-label">Akamai move</span><span class="fs-card__move-text">${s.move}</span></div>
      </article>
    `).join('');
  }

  function initFieldSignals() { renderFieldSignals(); }
  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', initFieldSignals)
    : initFieldSignals();
  window.FIELD_SIGNALS = FIELD_SIGNALS;
})();
