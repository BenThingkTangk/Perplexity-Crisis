/*
 * ΔTOM // END-TO-END CRISIS FLOW
 * Cinematic, clickable walkthrough from user request to Akamai convergence.
 * Source: Plaud call 2026-05-28 12:59 + this brief's evidence trail.
 * Status labels: Confirmed / Unconfirmed / Next question.
 */

const STAGES = [
  {
    id: 'demand',
    num: '01',
    label: 'User demand',
    title: 'Distributed live-search demand',
    icon: 'users',
    accent: '#5aa4f7',
    sub: 'Comet · API · Perplexity web',
    what: 'Comet, the Perplexity API, and Perplexity.ai users fire live-search and agentic prompts from distributed regions — Texas, Atlanta, Palo Alto, Montreal, Switzerland. Each request expects sub-second time-to-first-token and a fresh, sourced answer.',
    failure: 'Regional concentration of inference + cross-cloud egress turns "near the user" into "near a hyperscaler region." TTFT and answer freshness diverge by geography.',
    evidence: 'Plaud call 2026-05-28 — users explicitly identified across TX, ATL, PA, Montreal, CH; regional pulse promised by Perplexity for Ben\'s org tier.',
    move: 'Map TTFT and cache behavior by region before pitching. Anchor the Akamai value on the regions where the user pain is strongest.',
    status: 'confirmed',
  },
  {
    id: 'frontdoor',
    num: '02',
    label: 'Front-door routing',
    title: 'Cloudflare edge · routing logic unknown',
    icon: 'shield',
    accent: '#f5984a',
    sub: 'DNS · WAF · LB · ???',
    what: 'Public subdomains (www, api, console, status, enterprise, shopping) resolve through Cloudflare reverse-proxy. DNS, WAF, bot management, and static CDN cache are the well-understood layer.',
    failure: '<b>The AI routing logic above that is unconfirmed.</b> Cloudflare Workers? Custom router? Ad-hoc? Today we don\'t know — and "haphazard toss-it-here, toss-it-there" is a live hypothesis from the call.',
    evidence: '"Do you know how they\'re doing that routing today? Is that happening at Cloudflare? Are they using like Workers for that? Did they build their own? … or is it like guessing haphazardly, toss it here, toss it there." — Plaud 2026-05-28',
    move: 'Make the first Perplexity meeting answer this exact question. Bring the table of Cloudflare-provides vs Akamai-wedge so the conversation lands on placement, not perimeter.',
    status: 'unconfirmed',
  },
  {
    id: 'cache',
    num: '03',
    label: 'Cache decision',
    title: 'Static cache works · AI cache does not (yet)',
    icon: 'database',
    accent: '#00e6d3',
    sub: 'exact-match vs semantic',
    what: 'Static web shell, JS/CSS, status assets, and exact-repeat AI Gateway calls are cacheable. Cache Reserve / R2 helps when the content is byte-identical.',
    failure: 'Real Perplexity prompts vary constantly. Exact-match caches give near-zero hit rate. Authenticated and org-specific answers must isolate by tenant, model, freshness, source policy. <b>Whether any semantic / embedding-aware cache exists today is unconfirmed.</b>',
    evidence: '"If you can ascertain if there\'s any kind of caching going on there as well … Caching and semantic caching were on the list too. We\'ll get a better deep dive of that as well." — Plaud 2026-05-28',
    move: 'Reliability first — do not lead with semantic cache. Land the reliability win, then fast-follow with semantic cache as the cost / hit-rate lever.',
    status: 'next',
  },
  {
    id: 'auth',
    num: '04',
    label: 'Auth / billing',
    title: 'Payment-state cascade is a single point of failure',
    icon: 'key',
    accent: '#ef4444',
    sub: '$50 charge → API outage',
    what: 'Authenticated API access depends on payment-state webhooks succeeding. When the billing endpoint stutters, downstream API calls fail open and integrations break.',
    failure: 'At <b>20:22:47 UTC</b> and <b>20:23:12 UTC</b> two $50.00 charges failed against the Perplexity billing endpoint. API access broke. The ATOM / AntimatterAI integrations cascaded into outage on a payment-state hiccup.',
    evidence: 'First-party billing-cascade timestamps (this brief, evidence dossier). Plaud call: "this has a direct revenue impact" — refunds, credits, and reputational damage compound.',
    move: 'Pitch a <b>credential and payment-webhook circuit breaker with sub-500ms policy swap</b>. This is the single most concrete reliability story Akamai can tell on day one.',
    status: 'confirmed',
  },
  {
    id: 'inference',
    num: '05',
    label: 'Inference placement',
    title: 'Three GPU clouds. No runtime above them.',
    icon: 'cpu',
    accent: '#a855f7',
    sub: 'AWS · Foundry · CoreWeave',
    what: 'AWS provides the backbone (P4de / P5 / HyperPod). Microsoft Foundry ($750M, Jan 29 2026) added model access. CoreWeave (GB200 NVL72, Mar 4 2026) added dedicated inference clusters.',
    failure: 'No layer above the hyperscalers decides <em>where</em> a given request should run. Queue depth, regional load, cache hit probability, and data locality are not unified policy inputs.',
    evidence: 'Public deal history; this brief\'s architecture and crisis-map sections. Plaud: routing decisions are "haphazardly across the board" today.',
    move: '<b>Akamai AI Grid as convergence fabric</b> above AWS / Foundry / CoreWeave — queue-aware routing, edge / regional inference placement, one policy engine.',
    status: 'confirmed',
  },
  {
    id: 'crisis',
    num: '06',
    label: 'User-visible crisis',
    title: 'Refunds, credits, reputation, support drag',
    icon: 'alert',
    accent: '#f5b942',
    sub: 'revenue + reputation',
    what: 'Slow answers, broken integrations, and inconsistent regional behavior surface as user complaints, refund / credit issuance, and reputational signal in public channels.',
    failure: 'Persistent Discord complaints were flagged as a major signal in the Plaud call. Reputation compounds independently of any single incident.',
    evidence: '<b>Discord complaints were discussed in the Plaud call</b> as a reputational signal — the Discord connector was <b>not</b> scanned and no Discord content is reproduced here. Revenue impact was explicitly acknowledged: "this has a direct revenue impact."',
    move: 'Tie every Akamai metric back to <b>incident compression + refund/credit reduction</b>. Reliability is the wedge; reputation recovery is the dividend.',
    status: 'next',
  },
  {
    id: 'fix',
    num: '07',
    label: 'Akamai fix',
    title: 'Akamai Functions cutover · one SLA',
    icon: 'check',
    accent: '#00e6d3',
    sub: 'reliability now · semantic cache next',
    what: 'Akamai AI Grid / Functions sits above AWS / Foundry / CoreWeave and beside Cloudflare. It routes by health, TTFT, cache-hit probability, cost/token, data locality, and billing/auth state. One SLA owner spans runtime + providers.',
    failure: 'Doing nothing means each new provider is one more orchestration seam. The next billing cascade is a question of when, not if — and it lands on customer-visible surfaces.',
    evidence: '"I would say just repoint your LLM to use Akamai functions instead of Vercel, and you can go much faster." / "That\'s one of the cutover I have to do." — Plaud 2026-05-28',
    move: 'POC scope: a narrow but painful slice of real-time search demand at peak hours US/EU. Measure TTFT, egress, incident ownership, cache-hit. Reliability first. Semantic cache fast-follow. Add Neil &amp; Lior to the engagement team. Open the path via Johnny Love.',
    status: 'confirmed',
  },
];

const STATUS_META = {
  confirmed:   { label: 'Confirmed',     color: 'var(--plasma)' },
  unconfirmed: { label: 'Unconfirmed',   color: '#f5b942' },
  next:        { label: 'Next question', color: '#5aa4f7' },
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
  const rail = document.getElementById('flow-rail');
  const panel = document.getElementById('flow-panel');
  if (!rail || !panel) return;

  let activeIdx = 0;
  let autoTimer = null;
  let userInteracted = false;

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
        stopAutoplay();
        setActive(Number(btn.dataset.flowIdx));
      });
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          userInteracted = true;
          stopAutoplay();
          setActive((activeIdx + 1) % STAGES.length, true);
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          userInteracted = true;
          stopAutoplay();
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

  /* ---------- Stage diagram ----------
   * A tiny SVG visualization that shows the request state at this stage:
   * a horizontal pipeline of seven nodes, with the active node lit.
   */
  function renderStageDiagram(idx) {
    const cx = (i) => 50 + i * 64;
    const dots = STAGES.map((st, i) => {
      const active = i === idx;
      const done = i < idx;
      const color = active ? st.accent : (done ? 'rgba(0,230,211,.55)' : 'rgba(140,150,170,.32)');
      return `
        <g transform="translate(${cx(i)} 80)">
          <circle r="${active ? 14 : 8}" fill="${active ? st.accent : 'transparent'}" stroke="${color}" stroke-width="${active ? 0 : 2}" ${active ? `filter="drop-shadow(0 0 12px ${st.accent})"` : ''}/>
          <text y="36" text-anchor="middle" font-family="JetBrains Mono" font-size="10" letter-spacing="2" fill="${active ? st.accent : '#8a93a3'}">${st.num}</text>
          <text y="52" text-anchor="middle" font-family="Satoshi" font-size="10" fill="${active ? '#eef2f6' : '#7a8497'}">${st.label}</text>
        </g>`;
    }).join('');
    const lines = STAGES.slice(1).map((_, i) => `
      <line x1="${cx(i) + 10}" y1="80" x2="${cx(i + 1) - 10}" y2="80"
            stroke="${i < idx ? 'rgba(0,230,211,.55)' : 'rgba(140,150,170,.18)'}"
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
          <div class="flow-panel__cell-label">Evidence</div>
          <blockquote>${s.evidence}</blockquote>
        </section>
        <section class="flow-panel__cell flow-panel__cell--move">
          <div class="flow-panel__cell-label">Akamai move</div>
          <p>${s.move}</p>
        </section>
      </div>

      <div class="flow-panel__progress" aria-hidden="true">
        ${STAGES.map((_, i) => `<span class="${i === activeIdx ? 'is-active' : (i < activeIdx ? 'is-done' : '')}"></span>`).join('')}
      </div>
    `;
    // Re-trigger the cinematic fade
    panel.classList.remove('flow-panel--enter');
    void panel.offsetWidth;
    panel.classList.add('flow-panel--enter');
  }

  function setActive(idx, focusBtn = false) {
    activeIdx = ((idx % STAGES.length) + STAGES.length) % STAGES.length;
    syncRail();
    renderPanel();
    if (focusBtn) {
      const btn = rail.querySelector(`[data-flow-idx="${activeIdx}"]`);
      if (btn) btn.focus({ preventScroll: true });
    }
  }

  /* ---------- Autoplay (until user interacts) ---------- */
  function startAutoplay() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    stopAutoplay();
    autoTimer = window.setInterval(() => {
      if (userInteracted) { stopAutoplay(); return; }
      setActive((activeIdx + 1) % STAGES.length);
    }, 5200);
  }
  function stopAutoplay() {
    if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
  }

  /* ---------- Boot when section enters viewport ---------- */
  renderRail();
  renderPanel();

  const section = document.getElementById('end-to-end-flow');
  if (section && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !userInteracted) {
          startAutoplay();
        } else {
          stopAutoplay();
        }
      });
    }, { threshold: 0.35 });
    io.observe(section);
  }

  // Expose a tiny hook so the ATOM copilot can deep-link into a stage.
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
      stopAutoplay();
      setActive(i);
      const section = document.getElementById('end-to-end-flow');
      if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
  };
})();
