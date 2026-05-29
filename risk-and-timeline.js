/*
 * Akamai AI Grid // Risk-matrix tile picker + Infrastructure timeline stepper.
 * Both are simple, dependency-free, and degrade to static when JS doesn't run.
 */

(function initRiskAndTimeline() {
  /* ============ Claims Risk Matrix — tile picker ============ */
  const CLAIM_DATA = {
    c1: { title: 'Akamai EdgeWorkers · cold start under 5 ms', body: 'Akamai EdgeWorkers is GA. JavaScript-on-V8 at the edge with sub-5 ms cold starts. Powers the proposed billing/auth circuit breaker that swaps policy in under 500 ms when 401/402 cascades start.', src: 'Akamai EdgeWorkers technical documentation', row: 'confirmed', impact: 'low' },
    c2: { title: 'Search API · 358 ms median latency · P95 under 800 ms', body: 'Perplexity self-reported Search API benchmark. Median 358 ms, P95 <800 ms — benchmark initiated from AWS us-east-1, strongly suggesting regional concentration of the retrieval path.', src: 'Perplexity Research · May 2026', row: 'confirmed', impact: 'medium' },
    c3: { title: 'Public AI Gateway products · exact-match cache only', body: 'Multiple independent sources confirm that public CDN AI Gateway products provide exact-match caching only — not embedding-indexed semantic caching. This is the gap Akamai AI Grid targets at the edge as a roadmap capability.', src: 'Cloudflare AI Gateway docs · independent third-party analyses', row: 'confirmed', impact: 'medium' },
    c4: { title: 'Akamai · 4,400+ global edge PoPs', body: 'Akamai operates one of the world\'s most widely distributed edge networks: 4,400+ PoPs with integrated caching, EdgeWorkers serverless compute, and high-performance connectivity at each location.', src: 'Akamai AI Grid press release · March 16, 2026', row: 'confirmed', impact: 'high' },
    c5: { title: 'AI Grid target · sub-50 ms TTFT', body: 'Akamai AI Grid targets sub-50 ms time-to-first-token for select real-time workloads. Distance from demand collapses when inference runs at the nearest of 4,400+ edge PoPs.', src: 'Akamai AI Grid press release · March 2026', row: 'confirmed', impact: 'high' },
    c6: { title: '25+ Perplexity API outages tracked since May 2025', body: 'StatusGator public incident history shows 25+ Perplexity API outages including a documented Sonar API down-severity event and two major incidents in May 2026. This is the reliability anchor of the Akamai pitch.', src: 'StatusGator · public incident history for Perplexity API', row: 'confirmed', impact: 'high' },
    c7: { title: 'Credit-based metering · 401/402 cascade', body: 'Perplexity API uses Bearer-token auth with credit-based per-token metering. Credit exhaustion or billing failure produces 401/402 — there is no graceful degradation, so downstream integrations cascade. This is the exact failure mode EdgeWorkers can wrap with a circuit breaker.', src: 'Perplexity API documentation · key management + rate limits', row: 'confirmed', impact: 'high' },
    c8: { title: 'Comet ↔ Cloudflare verification wall breaks user flows', body: 'Multiple independent community reports on Perplexity\'s public Discord describe Comet failing Cloudflare bot-detection challenges on third-party Cloudflare-protected sites — reproduced across devices and networks with no recovery path. This is a Comet third-party-site compatibility signal, not a statement about Perplexity\'s own routing architecture.', src: 'Public Perplexity Discord · #bug-reports / #feedback-comet · May 24–29, 2026', row: 'confirmed', impact: 'high' },
    c9: { title: 'Enterprise support not enterprise-grade', body: 'Multiple independent reports across the public Perplexity Discord describe Enterprise-tier customers waiting 2+ weeks for any human support response. Wire-transfer license issues also unresolved through bot triage. This is an operational risk signal for enterprise deal velocity.', src: 'Public Perplexity Discord · #feedback-general · May 15–29, 2026', row: 'confirmed', impact: 'high' },
    c10: { title: 'Status auto-resolve false-positive · May 7 sequence', body: 'The official status channel record shows the May 7 incident going Investigating → Identified → Resolved → re-opened to Identified → Resolved again over a ~4-hour window. The brief false-resolve is observable in the public record and would mask true MTTR in any downstream metrics.', src: 'Perplexity public status channel · May 7–8, 2026', row: 'confirmed', impact: 'high' },

    l1: { title: 'Perplexity inference concentrated in us-east-1', body: 'The Search API benchmarks were initiated from us-east-1. That strongly suggests regional concentration of the retrieval path, but is not a public statement of exclusive deployment. Qualify in writing.', src: 'Perplexity Research · benchmarks initiated from us-east-1', row: 'likely', impact: 'medium' },
    l2: { title: 'Akamai semantic caching at edge · roadmap', body: 'Akamai\'s March 2026 AI Grid press release uses "will leverage" language for semantic caching — forward-looking, not a GA claim. State as roadmap when pitching; do not claim GA today.', src: 'Akamai AI Grid press release · "will leverage" framing', row: 'likely', impact: 'high' },
    l3: { title: 'Billing microservice lacks idempotency at API gateway', body: 'Three independent billing anomaly patterns (double-charge on enterprise plan, silent annual default after pause/resume, critical UI failure on plan switch in Comet) are all consistent with missing idempotency keys at the billing API. Likely — not directly confirmed by Perplexity engineering. Akamai API Gateway can enforce idempotency at the edge without backend changes.', src: 'Public Perplexity Discord · billing cluster · May 14–22, 2026', row: 'likely', impact: 'high' },
    l4: { title: 'Rate-limiter mis-attributing sessions (IP/fingerprint)', body: 'Authenticated web users hitting "limit reached" persistently — even after incognito, adblocker-disable and login-cycle — points to server-side session attribution by IP or fingerprint rather than identity-aware token throttling. Likely, not confirmed. Akamai EdgeAuth-keyed rate limiting is the targeted fix.', src: 'Public Perplexity Discord · #bug-reports · May 28–29, 2026', row: 'likely', impact: 'medium' },

    u1: { title: 'Specific payment processor in use', body: 'Perplexity has not publicly named a payment processor. Stripe is a common assumption but is not confirmed. Do not state as fact.', src: 'No public disclosure', row: 'unknown', impact: 'low' },
    u2: { title: 'AI router implementation · Worker vs. custom proxy', body: 'Whether the AI router is a managed Worker product, a custom reverse proxy, or a hyperscaler load balancer is not publicly disclosed. This is a discovery question for the next Perplexity meeting.', src: 'No public disclosure', row: 'unknown', impact: 'medium' },
    u3: { title: 'Front-door routing in front of api.perplexity.ai', body: 'The exact CDN and WAF stack in front of api.perplexity.ai is not publicly confirmed. Refer to it as "public-edge routing layer" in copy and qualify the implementation as unconfirmed.', src: 'No public statement from Perplexity or third-party', row: 'unknown', impact: 'high' },

    a1: { title: 'Foundry endpoint topology vs. Sonar', body: 'Does Foundry model access route through the same API endpoint as the Sonar family, or is it a separate plane with its own ingress and billing graph? Surface this in the next meeting.', src: 'Discovery question for Perplexity', row: 'ask', impact: 'medium' },
    a2: { title: 'Is the credit-entitlement check synchronous on every API call?', body: 'If yes, every API call has a hard dependency on the billing endpoint being healthy — and an EdgeWorkers circuit breaker is a direct, day-one reliability win. If no, the win is smaller but still real. Ask explicitly.', src: 'Discovery question for Perplexity', row: 'ask', impact: 'high' },
    a3: { title: 'us-east-1 failover · AWS ↔ CoreWeave handoff time', body: 'On an AWS us-east-1 event, how long until traffic shifts onto CoreWeave or another plane? This determines the headline incident-compression number for the Akamai pilot.', src: 'Discovery question for Perplexity', row: 'ask', impact: 'high' },
    a4: { title: 'Akamai Bot Manager · custom-browser compatibility lane', body: 'Could Akamai Bot Manager + Client Reputation provide a partner-grade compatibility lane for Comet so it does not trip front-door bot detection on Akamai-protected sites? Needs lab confirmation, but the architecture is plausible.', src: 'Discovery + Akamai lab confirmation', row: 'ask', impact: 'high' },
  };

  const ROW_LABELS = { confirmed: 'Confirmed', likely: 'Likely', unknown: 'Unknown', ask: 'Ask Perplexity' };
  const IMPACT_LABELS = { low: 'low impact', medium: 'medium impact', high: 'high impact' };
  const ROW_COLOR = { confirmed: '#a2a3e9', likely: '#5aa4f7', unknown: '#f5b942', ask: '#8587e3' };

  function initRiskMatrix() {
    const matrix = document.getElementById('risk-matrix');
    if (!matrix) return;

    const detailEyebrow = document.getElementById('risk-detail-eyebrow');
    const detailTitle   = document.getElementById('risk-detail-title');
    const detailBody    = document.getElementById('risk-detail-body');
    const detailSrc     = document.getElementById('risk-detail-src');

    function render(claimId) {
      const d = CLAIM_DATA[claimId];
      if (!d) return;
      const color = ROW_COLOR[d.row];
      detailEyebrow.innerHTML = `<span class="risk-detail__dot" style="--c:${color}"></span>${ROW_LABELS[d.row]} · ${IMPACT_LABELS[d.impact]}`;
      detailTitle.textContent = d.title;
      detailBody.textContent  = d.body;
      detailSrc.textContent   = d.src;
      const det = document.getElementById('risk-detail');
      if (det) det.style.setProperty('--c', color);

      matrix.querySelectorAll('.risk-tile').forEach((t) => {
        t.classList.toggle('is-active', t.dataset.claim === claimId);
      });

      // Visual pulse on the companion panel so the change registers when the
      // user clicks a lower tile and the sticky panel updates in place.
      if (det) {
        det.classList.remove('is-updating');
        // force reflow so the animation can re-trigger
        void det.offsetWidth;
        det.classList.add('is-updating');
      }
    }

    matrix.querySelectorAll('.risk-tile').forEach((tile) => {
      tile.addEventListener('click', () => render(tile.dataset.claim));
      tile.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); render(tile.dataset.claim); }
      });
    });
    // Activate the highest-impact confirmed claim by default.
    render('c4');
  }

  /* ============ Infrastructure timeline stepper ============ */
  const TL_DATA = [
    {
      eyebrow: 'Jan 21, 2026 · Microsoft Foundry',
      title: '$750M / 3-year model-acquisition deal',
      body: 'Three-year commitment makes Microsoft Foundry the main AI platform for model acquisition (OpenAI, Anthropic, xAI). AWS remains the primary cloud — Foundry is additive, not a replacement.',
      stats: [['$750M', 'commitment'], ['3 yr', 'term'], ['OpenAI · Anthropic · xAI', 'model access']],
      src: 'Reuters · January 2026',
      color: '#f5b942',
    },
    {
      eyebrow: 'Mar 3, 2026 · Akamai Blackwell',
      title: 'Thousands of RTX PRO 6000 Blackwell GPUs across the edge',
      body: 'Akamai begins deploying thousands of NVIDIA RTX PRO 6000 Blackwell Server Edition GPUs across the edge network, with BlueField-3 DPUs for hardware-accelerated networking. First to operationalize the NVIDIA AI Grid reference design.',
      stats: [['1000s', 'GPUs'], ['RTX PRO 6000', 'Blackwell Server Edition'], ['NVIDIA AI Grid', 'reference design']],
      src: 'Akamai press release · March 3, 2026',
      color: '#a2a3e9',
    },
    {
      eyebrow: 'Mar 4, 2026 · CoreWeave',
      title: 'GB200 NVL72-powered inference clusters for Perplexity',
      body: 'Multi-year strategic partnership. CoreWeave provides dedicated NVIDIA GB200 NVL72-powered clusters for Perplexity\'s AI inference workloads — a third independent compute plane alongside AWS and Foundry.',
      stats: [['GB200 NVL72', 'dedicated clusters'], ['Multi-year', 'commitment'], ['Real-time', 'inference workloads']],
      src: 'CoreWeave press release · March 4, 2026',
      color: '#ff7355',
    },
    {
      eyebrow: 'Mar 16, 2026 · Akamai AI Grid',
      title: 'Intelligent orchestration across 4,400+ edge locations',
      body: 'Akamai AI Grid launches as an intelligent orchestrator and real-time broker for AI requests — optimizing cost-per-token, time-to-first-token, and throughput across the widest distributed AI platform in the industry.',
      stats: [['4,400+', 'edge PoPs'], ['<50 ms', 'TTFT target'], ['2.5×', 'latency reduction']],
      src: 'Akamai AI Grid press release · March 16, 2026',
      color: '#00e6d3',
    },
    {
      eyebrow: 'May 8, 2026 · Sonar API · public outage cluster',
      title: 'Down-severity incident plus two major incidents in one window',
      body: 'StatusGator tracked a Sonar API "down severity" incident (50 minutes) plus two major incidents (35 minutes and 2 h 22 minutes) — all in the same 24-hour window. Acknowledged 12 minutes after public detection as "service unavailable due to internal server error."',
      stats: [['1', 'down-severity'], ['2', 'major incidents'], ['12 min', 'time to acknowledge']],
      src: 'StatusGator · public incident history',
      color: '#ef4444',
    },
    {
      eyebrow: 'Feb 16, 2026 · Sonar API · clean resolve',
      title: '~53-minute Sonar API outage, no re-escalation',
      body: 'The Sonar API surface had a ~53-minute incident (16:35–17:28) that resolved cleanly with no re-escalation. The contrast with the May 7 multi-component re-open pattern is the operational signal: Sonar appears to be on its own incident lane.',
      stats: [['~53 min', 'window'], ['1 component', 'Sonar API only'], ['Clean', 'resolution']],
      src: 'Perplexity public status channel · Feb 16, 2026',
      color: '#8587e3',
    },
    {
      eyebrow: 'May 7–8, 2026 · Website + API · re-escalation',
      title: '4-hour multi-component incident with auto-resolve misfire',
      body: 'Status channel record: Website degraded at 20:20 UTC; API joined at 20:30; Identified at 20:33; Resolved at 22:01; re-opened to Identified at 22:12; final Resolved at 00:22 UTC May 8. The brief false-resolve is observable in the public record.',
      stats: [['4 h 2 min', 'total window'], ['2', 'components affected'], ['1', 'false-resolve event']],
      src: 'Perplexity public status channel · May 7–8, 2026',
      color: '#ef4444',
    },
    {
      eyebrow: 'May 14–22, 2026 · Billing · community cluster',
      title: 'Billing state-machine anomalies on plan transitions',
      body: 'Independent community reports include a double-charge on enterprise plan, silent annual default after pause/resume, and a critical UI failure when switching plans in Comet. Pattern is consistent with missing idempotency at the billing API.',
      stats: [['3', 'independent patterns'], ['€217+', 'cited error amount'], ['LIKELY', 'idempotency gap']],
      src: 'Public Perplexity Discord · #feedback-comet · May 14–22, 2026',
      color: '#f5b942',
    },
    {
      eyebrow: 'May 15–29, 2026 · Enterprise support',
      title: 'Enterprise support blackout · 2-week response gap',
      body: 'Multiple Enterprise-tier customers report ~2 weeks of zero human support response. Wire-transfer license issues also unresolved through bot triage. Operational, not technical — but a direct enterprise deal-velocity risk.',
      stats: [['2 wk+', 'response gap'], ['Multiple', 'independent reports'], ['Enterprise', 'tier impacted']],
      src: 'Public Perplexity Discord · #feedback-general · May 15–29, 2026',
      color: '#5aa4f7',
    },
    {
      eyebrow: 'May 20, 2026 · Comet · billing UI',
      title: 'Critical billing UI failure on plan switch in Comet',
      body: 'Community-reported "critical" billing UI failure when switching plans inside the Comet interface. Reinforces the broader billing state-machine pattern observed across the same week.',
      stats: [['Critical', 'severity per poster'], ['Plan switch', 'trigger'], ['Comet', 'surface']],
      src: 'Public Perplexity Discord · #feedback-comet · May 20, 2026',
      color: '#f5b942',
    },
    {
      eyebrow: 'May 24, 2026 · Comet · third-party site compatibility',
      title: 'Comet ↔ Cloudflare verification wall (community-reported)',
      body: 'Community thread on Comet failing Cloudflare bot-detection challenges on third-party Cloudflare-protected sites. Reproduced across devices and networks with no recovery path. This is a Comet third-party-site compatibility signal — not a claim about Perplexity\'s own routing.',
      stats: [['LIKELY', 'TLS/UA fingerprint'], ['Multi-site', 'reproduction'], ['Displacement', 'opportunity']],
      src: 'Public Perplexity Discord · #bug-reports / #feedback-comet · May 24, 2026',
      color: '#ef4444',
    },
    {
      eyebrow: 'May 26–27, 2026 · Comet desktop · regressions',
      title: 'Comet high CPU + sync function regressions',
      body: 'Post-update community reports of very high CPU usage in Comet desktop, alongside a separate thread describing the sync function as broken in the latest version. Operational signal of feature-velocity outpacing release-quality controls.',
      stats: [['CPU', 'post-update'], ['Sync', 'broken'], ['MEDIUM', 'severity']],
      src: 'Public Perplexity Discord · #comet-general · May 26–27, 2026',
      color: '#a855f7',
    },
    {
      eyebrow: 'May 28–29, 2026 · Web · rate-limit + image-gen',
      title: 'Rate-limit false positives and image-gen failures',
      body: 'Authenticated web users hitting "limit reached" persistently across incognito, adblocker-disable and login-cycle. Separate reports of Pro image generator unavailable and region-blocked. Identity-aware rate limiting + geo-routing at the edge are the targeted fixes.',
      stats: [['Web', 'surface'], ['Authenticated', 'users'], ['LIKELY', 'IP/fingerprint key']],
      src: 'Public Perplexity Discord · #bug-reports · May 28–29, 2026',
      color: '#00e6d3',
    },
  ];

  function initTimeline() {
    const tl = document.getElementById('tl');
    if (!tl) return;

    const steps    = Array.from(tl.querySelectorAll('.tl__step'));
    const eyebrow  = document.getElementById('tl-detail-eyebrow');
    const title    = document.getElementById('tl-detail-title');
    const body     = document.getElementById('tl-detail-body');
    const src      = document.getElementById('tl-detail-src');
    const progress = document.getElementById('tl-rail-progress');
    const detail   = document.getElementById('tl-detail');
    if (!steps.length || !eyebrow || !title || !body || !src) return;

    function render(idx) {
      const d = TL_DATA[idx];
      if (!d) return;
      eyebrow.innerHTML = `<span class="tl__detail-pip" style="--c:${d.color}"></span>${d.eyebrow}`;
      title.textContent = d.title;
      body.textContent  = d.body;
      src.textContent   = d.src;

      const meta = detail.querySelector('.tl__detail-meta');
      if (meta) {
        meta.innerHTML = d.stats.map(([v, l]) => `<div class="tl__detail-stat" style="--c:${d.color}"><b>${v}</b><span>${l}</span></div>`).join('');
      }
      detail.style.setProperty('--c', d.color);

      steps.forEach((s, i) => {
        s.classList.toggle('is-active', i === idx);
        s.classList.toggle('is-visited', i < idx);
        s.setAttribute('aria-selected', i === idx ? 'true' : 'false');
      });
      if (progress) {
        const pct = (idx / Math.max(1, steps.length - 1)) * 100;
        progress.style.width = pct + '%';
      }
    }

    steps.forEach((s, i) => {
      s.addEventListener('click', () => render(i));
      s.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') { e.preventDefault(); render(Math.min(steps.length - 1, i + 1)); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); render(Math.max(0, i - 1)); }
        else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); render(i); }
      });
    });
    render(0);
  }

  function boot() {
    initRiskMatrix();
    initTimeline();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
