/*
 * Akamai AI Grid // END-TO-END FAILURE FLOW
 * Cinematic, clickable seven-stage walkthrough from user request to streaming response.
 * Source: public incident records, first-party API evidence, confirmed architectural disclosures.
 * Claim labels: Confirmed / Likely / Unknown / Ask Perplexity.
 */

const STAGES = [
  {
    id: 'origin',
    num: '01',
    label: 'User request origin',
    title: 'Distributed live-search demand · multi-region',
    icon: 'users',
    accent: '#5aa4f7',
    sub: 'DNS · TTFT · session',
    what: 'A user fires a live-search or agentic query from a distributed region. The request hits a DNS resolver and begins the first-mile traversal toward the inference backend.',
    failure: 'Geographic concentration of origin servers means distant users absorb the first-mile latency before the request ever reaches inference. Agentic browsers compound this with sub-request chains that each accumulate latency.',
    metric: 'DNS resolution time by region · client-perceived TTFT · session establishment time',
    move: 'Route the request to the nearest of 4,400+ Akamai PoPs and eliminate the geographic first-mile penalty before inference begins.',
    discovery: 'Which regions show the worst client-perceived TTFT in the last 30 days?',
    status: 'confirmed',
    statusLabel: 'Confirmed',
  },
  {
    id: 'frontdoor',
    num: '02',
    label: 'DNS + front door',
    title: 'Public-edge routing layer · implementation unconfirmed',
    icon: 'shield',
    accent: '#f5984a',
    sub: 'CDN · WAF · LB',
    what: 'The request resolves to an ingress — CDN edge, WAF, or load balancer. The exact front-door implementation in front of api.perplexity.ai is not publicly confirmed.',
    failure: 'Single-CDN dependency means a front-door incident propagates to every downstream stage. WAF false positives under anomalous traffic can drop legitimate API calls. Front-door routing logic is opaque from the outside.',
    metric: 'HTTPS connection establishment latency by region · TLS handshake time · DNS TTL',
    move: 'App &amp; API Protector provides WAF + bot management + DDoS mitigation at Akamai\'s edge. Ion provides dynamic acceleration with 100% availability SLA. Akamai owns the front door and eliminates single-CDN dependency.',
    discovery: 'Which CDN and WAF sit in front of api.perplexity.ai today? Is the routing layer a managed Worker, a custom reverse proxy, or a hyperscaler load balancer?',
    status: 'unknown',
    statusLabel: 'Unknown',
  },
  {
    id: 'cache',
    num: '03',
    label: 'Cache decision',
    title: 'Front-door cache · exact-match only, no semantic coverage',
    icon: 'database',
    accent: '#00e6d3',
    sub: 'exact-match vs semantic',
    what: 'The front-door layer checks whether the request can be served from cache. Public CDN AI Gateway products provide exact-match cache only — identical request bodies hit cache, anything semantically equivalent misses.',
    failure: 'Near-zero cache hit rate on search/agentic queries because prompts vary constantly. Cache-miss storms during traffic spikes amplify origin load. Stale cache responses on time-sensitive queries degrade answer freshness.',
    metric: 'Cache hit rate by query class · origin RPS during traffic spikes · answer-freshness signal',
    move: 'Akamai AI Grid targets semantic caching at the edge — embedding-indexed lookup serves semantically equivalent queries from cache, dramatically increasing effective hit rate for common patterns.',
    discovery: 'What is the current cache hit rate at the front door for AI inference requests, broken down by query class?',
    status: 'likely',
    statusLabel: 'Likely',
  },
  {
    id: 'auth',
    num: '04',
    label: 'Auth / billing entitlement',
    title: 'Credit-based entitlement is in the critical path',
    icon: 'key',
    accent: '#ef4444',
    sub: '401 / 402 cascade',
    what: 'The inference request must pass Bearer-token authentication and a credit-entitlement check. Credit exhaustion or billing-system failure produces 401/402 responses that immediately block the API call.',
    failure: 'Credit exhaustion gates API access for every downstream integration — no graceful degradation. Billing-system outage blocks authenticated requests even for funded accounts. The retry chain takes 25–120 seconds to propagate a user-visible error.',
    metric: '401/402 rate per minute · retry-chain depth · time-to-user-visible-error · refund/credit-issuance frequency',
    move: 'EdgeWorkers implements a circuit breaker at the edge: detect repeated 401/402, activate a sub-500&nbsp;ms policy swap (route to fallback, serve cached responses, return graceful error), and restore traffic when billing recovers.',
    discovery: 'Is the billing entitlement check in the critical path of every API request, or asynchronous? What is the recovery time between credit failure and automatic retry eligibility?',
    status: 'confirmed',
    statusLabel: 'Confirmed',
  },
  {
    id: 'inference',
    num: '05',
    label: 'Inference placement',
    title: 'Three independent compute planes · no unified runtime',
    icon: 'cpu',
    accent: '#a855f7',
    sub: 'AWS · Foundry · CoreWeave',
    what: 'The authenticated request reaches an inference orchestration layer. Public deal history confirms three independent compute planes: AWS (primary), CoreWeave (GB200 NVL72 dedicated clusters), and Microsoft Foundry (model catalog). Each is a separate operational and billing graph.',
    failure: 'Public benchmarks were initiated from AWS us-east-1, suggesting regional concentration of the search-retrieval path. Three independent control planes mean no unified SLA — any single-plane incident creates a multi-vendor support spiral. Cross-cloud egress accumulates as volume scales.',
    metric: 'Regional inference latency · plane-level error rates · cross-cloud egress GB · multi-vendor incident MTTR',
    move: 'AI Grid intelligent orchestrator routes inference to the right compute tier (Akamai edge GPU, AWS, CoreWeave) based on cost-per-token, TTFT target, queue depth, and data locality — a single distribution layer above all three providers.',
    discovery: 'Is inference load-balanced across CoreWeave and AWS, or is AWS primary with CoreWeave as dedicated capacity? What is the failover time on a us-east-1 event?',
    status: 'confirmed',
    statusLabel: 'Confirmed',
  },
  {
    id: 'model',
    num: '06',
    label: 'Model / search retrieval',
    title: 'Search retrieval + generation · latency compounds',
    icon: 'alert',
    accent: '#f5b942',
    sub: '358ms median retrieval',
    what: 'The model executes: query intent is parsed, web-search retrieval runs against the 200B+ URL index, results are ranked through a multi-stage pipeline, and generation begins. Median retrieval latency is 358&nbsp;ms from us-east-1; P95 stays under 800&nbsp;ms.',
    failure: 'Retrieval latency compounds with generation latency: 358&nbsp;ms + LLM TTFT + streaming adds up quickly for distant users. Index freshness can degrade if crawlers are blocked at scale. Large retrieval sets in long-context models materially increase response time.',
    metric: 'Retrieval P50 / P95 · generation TTFT · context size vs response time · crawl-coverage signal',
    move: 'Semantic caching at the AI Grid edge intercepts high-entropy, repeated query patterns before they reach the search-retrieval pipeline, reducing load on the 200B URL index chain.',
    discovery: 'How does retrieval P95 vary by region today, and where would the AI Grid pilot show the strongest TTFT delta?',
    status: 'confirmed',
    statusLabel: 'Confirmed',
  },
  {
    id: 'stream',
    num: '07',
    label: 'Streaming response',
    title: 'SSE last-mile · regional routing penalty',
    icon: 'check',
    accent: '#00e6d3',
    sub: 'SSE · token delivery',
    what: 'Tokens stream via Server-Sent Events from the inference endpoint to the client. TTFT and inter-token latency are the primary UX signals; long streaming responses hold connection slots through every proxy hop.',
    failure: 'SSE stream interruption mid-response is more disruptive than a failed non-streaming request. Streaming through multiple proxy hops accumulates buffering that delays first-token visibility. A user in Europe receiving tokens routed through us-east-1 adds ~80–120&nbsp;ms to every token delivery.',
    metric: 'TTFT by region · inter-token latency · SSE disconnect rate · stream-hold duration at the gateway',
    move: 'Akamai\'s edge PoPs serve as the last-mile streaming endpoint — tokens stream from the nearest PoP, not from a centralized us-east-1 origin, eliminating the geographic streaming penalty.',
    discovery: 'What is the international vs domestic TTFT delta on streaming responses today?',
    status: 'confirmed',
    statusLabel: 'Confirmed',
  },
];

const STATUS_META = {
  confirmed:   { label: 'Confirmed',     color: '#a2a3e9' },
  likely:      { label: 'Likely',        color: '#5aa4f7' },
  unknown:     { label: 'Unknown',       color: '#f5b942' },
  next:        { label: 'Ask Perplexity', color: '#8587e3' },
};

const ICONS = {
  users:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  shield:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  database: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v6c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 11v6c0 1.66 4 3 9 3s9-1.34 9-3v-6"/></svg>',
  key:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 2l-9.6 9.6"/><circle cx="7.5" cy="15.5" r="5.5"/><path d="M15.5 7.5l3 3"/></svg>',
  cpu:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>',
  alert:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  check:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>',
};

(function initCrisisFlow() {
  const canvas = document.getElementById('flow-canvas');
  const rail = document.getElementById('flow-rail');
  const panel = document.getElementById('flow-panel');
  if (!rail || !panel) return;

  let activeIdx = 0;
  let userInteracted = false;

  /* ---------- Hero pipeline canvas (real graphical pipeline) ---------- */
  function renderCanvas() {
    if (!canvas) return;
    const W = 1200;
    const H = 380;
    const padX = 80;
    const innerW = W - padX * 2;
    const step = innerW / (STAGES.length - 1);
    const cy = 200;
    const nodeR = 38;

    const connectors = STAGES.slice(1).map((_, i) => {
      const x1 = padX + step * i + nodeR;
      const x2 = padX + step * (i + 1) - nodeR;
      const done = i < activeIdx;
      const active = i === activeIdx - 1;
      const color = done ? 'var(--atom-secondary, #a2a3e9)' : 'rgba(140,150,170,.28)';
      const width = done ? 2.6 : 1.6;
      return `
        <g class="fc-edge ${done ? 'fc-edge--done' : ''} ${active ? 'fc-edge--active' : ''}">
          <line x1="${x1}" y1="${cy}" x2="${x2}" y2="${cy}"
                stroke="${color}" stroke-width="${width}"
                stroke-dasharray="${done ? '0' : '6 6'}"/>
          ${done ? `<circle class="fc-pulse" cx="${x1}" cy="${cy}" r="3" fill="var(--atom-secondary, #a2a3e9)">
              <animate attributeName="cx" from="${x1}" to="${x2}" dur="1.6s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0;1;0" dur="1.6s" repeatCount="indefinite"/>
            </circle>` : ''}
        </g>`;
    }).join('');

    const nodes = STAGES.map((s, i) => {
      const cx = padX + step * i;
      const active = i === activeIdx;
      const done = i < activeIdx;
      const isFail = ['unknown', 'next', 'likely'].includes(s.status) || s.id === 'auth';
      const statusColor = STATUS_META[s.status].color;
      return `
        <g class="fc-node ${active ? 'fc-node--active' : ''} ${done ? 'fc-node--done' : ''}"
           data-flow-canvas-idx="${i}" role="button" tabindex="0"
           aria-label="Stage ${s.num} ${s.label}: ${s.title}"
           style="--accent:${s.accent}; --status:${statusColor}">
          <rect class="fc-node__hit" x="${cx - nodeR - 14}" y="${cy - nodeR - 22}"
                width="${(nodeR + 14) * 2}" height="${(nodeR + 22) * 2 + 36}"
                fill="transparent" pointer-events="all"/>
          ${isFail ? `<circle class="fc-hotspot" cx="${cx}" cy="${cy - 56}" r="6" fill="${statusColor}">
              <animate attributeName="r" values="5;9;5" dur="2.4s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="1;.35;1" dur="2.4s" repeatCount="indefinite"/>
            </circle>` : ''}
          <circle class="fc-node__halo" cx="${cx}" cy="${cy}" r="${nodeR + 14}" fill="none"
                  stroke="${s.accent}" stroke-opacity="${active ? .55 : .12}" stroke-width="${active ? 1.4 : 1}"
                  stroke-dasharray="${active ? '4 6' : '2 8'}">
            ${active ? `<animateTransform attributeName="transform" type="rotate"
              from="0 ${cx} ${cy}" to="360 ${cx} ${cy}" dur="14s" repeatCount="indefinite"/>` : ''}
          </circle>
          <circle class="fc-node__ring" cx="${cx}" cy="${cy}" r="${nodeR}"
                  fill="${active ? 'rgba(8,12,18,.92)' : 'rgba(8,12,18,.7)'}"
                  stroke="${s.accent}" stroke-width="${active ? 2.4 : 1.6}"
                  ${active ? `filter="drop-shadow(0 0 16px ${s.accent})"` : ''}/>
          <text x="${cx}" y="${cy - 4}" text-anchor="middle"
                font-family="JetBrains Mono" font-size="10" letter-spacing="2"
                fill="${active ? s.accent : '#8a93a3'}">${s.num}</text>
          <text x="${cx}" y="${cy + 12}" text-anchor="middle"
                font-family="Plus Jakarta Sans" font-size="11" font-weight="800"
                fill="${active ? '#eef2f6' : '#c4cdda'}">${s.label.toUpperCase()}</text>
          <text x="${cx}" y="${cy + 64}" text-anchor="middle"
                font-family="Plus Jakarta Sans" font-size="11" fill="${active ? '#eef2f6' : '#7a8497'}">${s.sub}</text>
          <g transform="translate(${cx - 44} ${cy + 78})">
            <rect width="88" height="20" rx="10" fill="rgba(8,12,18,.85)" stroke="${statusColor}" stroke-opacity=".7"/>
            <text x="44" y="14" text-anchor="middle"
                  font-family="JetBrains Mono" font-size="9" letter-spacing="1.4"
                  fill="${statusColor}">${STATUS_META[s.status].label.toUpperCase()}</text>
          </g>
        </g>`;
    }).join('');

    canvas.innerHTML = `
      <div class="flow-canvas__label">
        <span class="pip"></span> SEVEN STAGE PIPELINE · USER REQUEST → STREAMING RESPONSE
        <span class="flow-canvas__hint">Click any node · arrow keys to navigate</span>
      </div>
      <svg class="flow-canvas__svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" aria-hidden="false">
        <defs>
          <radialGradient id="fc-bg" cx="50%" cy="50%">
            <stop offset="0%" stop-color="rgba(133,135,227,.08)"/>
            <stop offset="100%" stop-color="rgba(133,135,227,0)"/>
          </radialGradient>
        </defs>
        <rect x="0" y="0" width="${W}" height="${H}" fill="url(#fc-bg)" />
        <text x="${W/2}" y="42" text-anchor="middle"
              font-family="JetBrains Mono" font-size="10" letter-spacing="3" fill="#5a6478">
          USER REGION  →  PUBLIC EDGE  →  CACHE  →  AUTH/BILLING  →  PLACEMENT  →  RETRIEVAL  →  STREAM
        </text>
        ${connectors}
        ${nodes}
      </svg>
    `;

    canvas.querySelectorAll('[data-flow-canvas-idx]').forEach((g) => {
      g.addEventListener('click', (e) => {
        const host = (e.target && e.target.closest) ? e.target.closest('[data-flow-canvas-idx]') : g;
        const idx = Number((host || g).getAttribute('data-flow-canvas-idx'));
        if (!Number.isFinite(idx)) return;
        userInteracted = true;
        setActive(idx);
      });
      g.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          userInteracted = true;
          setActive(Number(g.getAttribute('data-flow-canvas-idx')));
        } else if (e.key === 'ArrowRight') {
          e.preventDefault(); userInteracted = true;
          setActive((activeIdx + 1) % STAGES.length, true);
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault(); userInteracted = true;
          setActive((activeIdx - 1 + STAGES.length) % STAGES.length, true);
        }
      });
    });
  }

  /* ---------- Rail ---------- */
  function renderRail() {
    rail.innerHTML = STAGES.map((s, i) => `
      <button class="flow-stage" role="tab" type="button"
              data-flow-idx="${i}"
              aria-selected="${i === activeIdx ? 'true' : 'false'}"
              aria-controls="flow-panel"
              style="--accent:${s.accent}">
        <span class="flow-stage__num">${s.num}</span>
        <span class="flow-stage__icon" aria-hidden="true">${ICONS[s.icon] || ''}</span>
        <span class="flow-stage__label">${s.label}</span>
        <span class="flow-stage__sub">${s.sub}</span>
        <span class="flow-stage__status flow-stage__status--${s.status}">${STATUS_META[s.status].label}</span>
      </button>
      ${i < STAGES.length - 1 ? '<span class="flow-stage__arrow" aria-hidden="true">→</span>' : ''}
    `).join('');

    rail.querySelectorAll('[data-flow-idx]').forEach((btn) => {
      btn.addEventListener('click', () => {
        userInteracted = true;
        setActive(Number(btn.dataset.flowIdx));
      });
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          userInteracted = true;
          setActive((activeIdx + 1) % STAGES.length, true);
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          userInteracted = true;
          setActive((activeIdx - 1 + STAGES.length) % STAGES.length, true);
        }
      });
    });
  }

  function syncRail() {
    rail.querySelectorAll('[data-flow-idx]').forEach((btn) => {
      const i = Number(btn.dataset.flowIdx);
      btn.setAttribute('aria-selected', i === activeIdx ? 'true' : 'false');
      btn.classList.toggle('is-active', i === activeIdx);
      btn.classList.toggle('is-visited', i < activeIdx);
    });
  }

  function renderStageDiagram(idx) {
    const cx = (i) => 50 + i * 64;
    const dots = STAGES.map((st, i) => {
      const active = i === idx;
      const done = i < idx;
      const color = active ? st.accent : (done ? 'rgba(162,163,233,.55)' : 'rgba(140,150,170,.32)');
      return `
        <g transform="translate(${cx(i)} 80)">
          <circle r="${active ? 14 : 8}" fill="${active ? st.accent : 'transparent'}" stroke="${color}" stroke-width="${active ? 0 : 2}" ${active ? `filter="drop-shadow(0 0 12px ${st.accent})"` : ''}/>
          <text y="36" text-anchor="middle" font-family="JetBrains Mono" font-size="10" letter-spacing="2" fill="${active ? st.accent : '#8a93a3'}">${st.num}</text>
          <text y="52" text-anchor="middle" font-family="Plus Jakarta Sans" font-size="10" fill="${active ? '#eef2f6' : '#7a8497'}">${st.label}</text>
        </g>`;
    }).join('');
    const lines = STAGES.slice(1).map((_, i) => `
      <line x1="${cx(i) + 10}" y1="80" x2="${cx(i + 1) - 10}" y2="80"
            stroke="${i < idx ? 'rgba(162,163,233,.55)' : 'rgba(140,150,170,.18)'}"
            stroke-width="${i < idx ? 2 : 1.4}" stroke-dasharray="${i < idx ? '0' : '4 6'}"/>
    `).join('');
    return `
      <svg class="flow-panel__diagram" viewBox="0 0 ${cx(STAGES.length - 1) + 50} 110" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        ${lines}
        ${dots}
      </svg>
    `;
  }

  /* ---------- Detail panel ---------- */
  function renderPanel() {
    const s = STAGES[activeIdx];
    const status = STATUS_META[s.status];
    panel.style.setProperty('--accent', s.accent);
    panel.innerHTML = `
      <div class="flow-panel__head">
        <div class="flow-panel__num">${s.num} / 07</div>
        <div class="flow-panel__title-stack">
          <div class="flow-panel__label">Stage ${s.num} · ${s.label}</div>
          <h3 class="flow-panel__title">${s.title}</h3>
        </div>
        <div class="flow-panel__status" style="--c:${status.color}">
          <span class="flow-panel__status-dot"></span>${status.label}
        </div>
      </div>

      ${renderStageDiagram(activeIdx)}

      <div class="flow-panel__grid">
        <section class="flow-panel__cell">
          <div class="flow-panel__cell-label">What happens</div>
          <p>${s.what}</p>
        </section>
        <section class="flow-panel__cell flow-panel__cell--fail">
          <div class="flow-panel__cell-label">Failure mode</div>
          <p>${s.failure}</p>
        </section>
        <section class="flow-panel__cell">
          <div class="flow-panel__cell-label">Metric to watch</div>
          <p>${s.metric}</p>
        </section>
        <section class="flow-panel__cell flow-panel__cell--move">
          <div class="flow-panel__cell-label">What Akamai fixes</div>
          <p>${s.move}</p>
        </section>
        <section class="flow-panel__cell flow-panel__cell--ask">
          <div class="flow-panel__cell-label">Discovery question</div>
          <blockquote>${s.discovery}</blockquote>
        </section>
      </div>

      <div class="flow-panel__progress" aria-hidden="true">
        ${STAGES.map((_, i) => `<span class="${i === activeIdx ? 'is-active' : (i < activeIdx ? 'is-done' : '')}"></span>`).join('')}
      </div>
    `;
    panel.classList.remove('flow-panel--enter');
    void panel.offsetWidth;
    panel.classList.add('flow-panel--enter');
  }

  function setActive(idx, focusBtn = false) {
    activeIdx = ((idx % STAGES.length) + STAGES.length) % STAGES.length;
    syncRail();
    renderCanvas();
    renderPanel();
    if (focusBtn) {
      const btn = rail.querySelector(`[data-flow-idx="${activeIdx}"]`);
      if (btn) btn.focus({ preventScroll: true });
    }
  }

  renderCanvas();
  renderRail();
  renderPanel();

  // Expose a hook so ATOM copilot can deep-link into a stage.
  window.dtomCrisisFlow = {
    open: (idxOrId) => {
      let i = 0;
      if (typeof idxOrId === 'string') {
        const found = STAGES.findIndex((s) => s.id === idxOrId);
        if (found >= 0) i = found;
      } else if (typeof idxOrId === 'number') {
        i = idxOrId;
      }
      userInteracted = true;
      setActive(i);
      const section = document.getElementById('end-to-end-flow');
      if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
  };
})();
