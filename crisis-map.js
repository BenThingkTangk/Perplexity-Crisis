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
})();
