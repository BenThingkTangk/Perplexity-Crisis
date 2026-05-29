/*
 * Akamai AI Grid // ATOM Copilot
 * Local deterministic copilot grounded in the AI Grid command-center brief.
 * Four modes: simple, cto, cfo, sales. Streams from /api/ask-atom when key
 * is configured; falls back to deterministic responses otherwise.
 */

const MODES = {
  simple: {
    label: 'Simple',
    greeting: '<strong>ATOM · Akamai AI Grid Command Center.</strong> Ask me to make the Akamai wedge for Perplexity obvious, clean, and impossible to misunderstand.',
    chips: [
      'Walk me through the end-to-end failure flow',
      'Summarize the May 7 incident sequence',
      'Why is Comet breaking on Cloudflare-protected sites?',
      'Why does Akamai matter here?',
    ],
  },
  cto: {
    label: 'CTO',
    greeting: 'CTO mode online. I will frame this as a runtime, placement, and orchestration problem — not a CDN sale.',
    chips: [
      'Custom-browser bot compatibility · Akamai vs CF detection',
      'May 7 GTM partial-resolve + re-escalation pattern',
      'API idempotency at the edge for billing endpoints',
      'Identity-aware rate limiting · stop session mis-attribution',
    ],
  },
  cfo: {
    label: 'CFO',
    greeting: 'CFO mode online. Token economics, egress drag, and SLA ownership — all in one cost-of-incidents story.',
    chips: [
      'Cost of a 4-hour multi-component incident',
      'What does the billing-cluster pattern cost?',
      'ROI for an Akamai convergence pilot',
      'Enterprise SLA risk · 2-week support gap',
    ],
  },
  sales: {
    label: 'Sales',
    greeting: 'Sales mode online. The wedge: keep the public edge, win the AI runtime. Here are the moves that close.',
    chips: [
      'Pitch in one sentence',
      'Comet · Cloudflare wall · displacement vs complement',
      'Can DataStream 2 ingest Discord support signal?',
      'Objection: "the public edge already does this"',
    ],
  },
};

/* Shared response that any mode can render — deep-links to #end-to-end-flow */
const WALKTHROUGH_HTML = `
  <p><strong>End-to-end failure flow</strong> — seven stages, click any of them in the <a href="#end-to-end-flow" data-atom-link="flow">Crisis Flow</a> section to drill in:</p>
  <ul>
    <li><strong>01 User request origin</strong> — distributed live-search demand, first-mile TTFT before inference (<em>Confirmed</em>)</li>
    <li><strong>02 DNS + front door</strong> — public-edge routing layer; exact implementation in front of api.perplexity.ai <em>Unknown</em></li>
    <li><strong>03 Cache decision</strong> — exact-match only at public CDN; semantic caching is the Akamai roadmap differentiator (<em>Likely</em>)</li>
    <li><strong>04 Auth / billing entitlement</strong> — credit-based metering in the critical path; 401/402 cascade is public record (<em>Confirmed</em>)</li>
    <li><strong>05 Inference placement</strong> — AWS + Foundry + CoreWeave, three independent control planes (<em>Confirmed</em>)</li>
    <li><strong>06 Model / search retrieval</strong> — 358&nbsp;ms median retrieval from us-east-1, P95 &lt; 800&nbsp;ms (<em>Confirmed</em>)</li>
    <li><strong>07 Streaming response</strong> — SSE last-mile, edge PoPs eliminate the geographic streaming penalty (<em>Confirmed</em>)</li>
  </ul>
  <p><a href="#end-to-end-flow" data-atom-link="flow">Open the Crisis Flow walkthrough →</a></p>
`;

/* ---------- Deterministic response library ---------- */
/* Keyed by mode + intent. Matching is keyword-based on the user's input.   */

const WALKTHROUGH_MATCH = { match: /walk.+through|end[- ]to[- ]end|failure flow|flow.*fail|crisis flow|stages?/i, html: WALKTHROUGH_HTML };

/* Shared Discord-research response patterns reused across modes. Each is grounded
 * in the May 2026 public-Discord + status-channel extraction. Claim labels per
 * the playbook: CONFIRMED / LIKELY / UNKNOWN / ASK PERPLEXITY. No usernames. */
const COMET_CF_MATCH = { match: /comet.*cloudflare|cloudflare.*comet|cloudflare wall|bot.*detection|custom[- ]browser|bot compatibility|fingerprint/i, html: `
  <p><strong>Comet ↔ Cloudflare verification wall — community signal.</strong> Multiple independent reports on Perplexity's public Discord describe Comet failing Cloudflare bot-detection challenges on third-party Cloudflare-protected sites; reproduced across devices and networks with no recovery path [CONFIRMED — Discord, May 24–29, 2026]. Likely root cause: TLS/UA fingerprint mismatch with Cloudflare's JA3/JA4 + behavior signals [LIKELY].</p>
  <p>This is a Comet third-party-site compatibility signal — not a claim about Perplexity's own routing architecture.</p>
  <ul>
    <li>Akamai Bot Manager + Client Reputation use different signals than Cloudflare [CONFIRMED capability].</li>
    <li>A partner-grade compatibility lane could allow-list Comet on Akamai-protected sites [ASK PERPLEXITY · needs Akamai lab confirmation].</li>
    <li>Positioning: displacement of front-door bot-mitigation on sites Perplexity / Comet care about, additive to multi-cloud compute.</li>
  </ul>` };

const MAY7_MATCH = { match: /may 7|may7|may[- ]?7|website ?\+ ?api|website and api|re[- ]escalation|partial[- ]?resolve|auto[- ]?resolve|gtm.*partial/i, html: `
  <p><strong>May 7–8 status sequence — observable in the public record.</strong></p>
  <ul>
    <li>20:20 UTC · Website degraded; status briefly auto-resolved then re-opened to Investigating [CONFIRMED].</li>
    <li>20:30 UTC · API also degraded — scope expanded within 10 minutes (control-plane signal) [LIKELY].</li>
    <li>20:33 UTC · Identified · 22:01 UTC · Resolved · 22:12 UTC · re-opened to Identified · 00:22 UTC May 8 · final Resolved.</li>
    <li>Total window ~4 h 2 min with one false-resolve event [CONFIRMED].</li>
  </ul>
  <p><strong>Akamai move.</strong> GTM + DataStream 2 propagate per-edge health faster than DNS-TTL failover and reduce the risk of partial-edge "Resolved" while other edges still serve degraded responses. Status-system auto-resolve logic should be tied to real-user monitoring, not a single synthetic probe [ASK PERPLEXITY].</p>` };

const BILLING_IDEMPOTENCY_MATCH = { match: /idempot|billing.*(api|gateway|microservice|edge)|double[- ]charg|plan switch|plan transition|annual default|enterprise billing/i, html: `
  <p><strong>Billing state-machine pattern — three independent community signals.</strong></p>
  <ul>
    <li>Double-charge on an enterprise plan with an incorrect personal-Pro line item (€217 cited) [CONFIRMED report · Discord, ~7 d ago].</li>
    <li>Silent annual-default after pause/resume — no clear consent flow [CONFIRMED report · May 22].</li>
    <li>Critical UI failure when switching plans inside Comet [CONFIRMED report · May 20].</li>
  </ul>
  <p>All three are consistent with missing idempotency at the billing API and weak edge-side subscription-state verification [LIKELY].</p>
  <p><strong>Akamai move.</strong> API Gateway can enforce idempotency keys at the edge for the billing endpoint and use EdgeAuth to bind subscription state to a session token — single-execution of payment state transitions without backend changes [CONFIRMED capability].</p>` };

const RATE_LIMIT_MATCH = { match: /rate[- ]limit|identity[- ]aware|session.*(attribution|mis[- ]?attribut)|limit reached|throttl/i, html: `
  <p><strong>Rate-limit false positives — May 28–29 web reports.</strong> Authenticated users hit "limit reached" on basic web search; persistence across incognito, adblocker-disable, and login-cycle points to server-side session attribution by IP or fingerprint rather than identity-aware token throttling [LIKELY].</p>
  <ul>
    <li>Akamai API Gateway supports EdgeAuth-keyed identity-aware throttling — limits follow the user, not the IP [CONFIRMED capability].</li>
    <li>Reduces false positives for legitimate users while keeping real abuse enforcement at the edge.</li>
    <li>Discovery: what is today's rate-limit key — IP, fingerprint, or token? [ASK PERPLEXITY]</li>
  </ul>` };

const DATASTREAM_DISCORD_MATCH = { match: /datastream|discord.*ingest|ingest.*discord|webhook.*observab|community signal/i, html: `
  <p><strong>Auxiliary observability — Discord signal into the incident loop.</strong></p>
  <ul>
    <li>Akamai DataStream 2 streams edge events with low latency to downstream ingestion [CONFIRMED capability].</li>
    <li>Discord webhooks (Perplexity's #status, #bug-reports) could feed a side-channel into the same observability pipeline as edge telemetry [ASK PERPLEXITY · integration design needed].</li>
    <li>Value: community-reported issues (Comet/CF wall, billing cluster, rate-limit false positives) surface in the same dashboard as edge incidents — proactive enterprise signal, not reactive support.</li>
  </ul>` };

const SUPPORT_MATCH = { match: /enterprise.*support|support.*enterprise|2[- ]?week|support gap|sla.*risk|blackout|mpulse/i, html: `
  <p><strong>Enterprise support blackout — operational signal.</strong> Multiple Enterprise-tier customers report ~2 weeks with no human support response; wire-transfer license issues also unresolved through bot triage [CONFIRMED · Discord, May 15–29].</p>
  <ul>
    <li>This is an enterprise deal-velocity risk, not a technical defect.</li>
    <li>Akamai mPulse RUM + DataStream 2 give per-tenant proactive observability — degradations surface before enterprise customers file tickets [CONFIRMED capability].</li>
    <li>Positioning: "Perplexity Enterprise, powered by Akamai edge monitoring" — a tier differentiator, not a CDN upsell.</li>
  </ul>` };

const RESPONSES = {
  simple: [
    WALKTHROUGH_MATCH,
    COMET_CF_MATCH, MAY7_MATCH, BILLING_IDEMPOTENCY_MATCH, RATE_LIMIT_MATCH, DATASTREAM_DISCORD_MATCH, SUPPORT_MATCH,
    { match: /30\s*seconds|tl;?dr|short|brief|explain/i, html: `
      <p><strong>30-second version.</strong> Perplexity wired itself to AWS + Microsoft Foundry + CoreWeave inside a year. The architecture is fast — the coordination model isn't. When billing, GPUs, or providers wobble, the user feels it as a slow or broken answer.</p>
      <p>The public edge handles the connection. <strong>Akamai AI Grid is the runtime layer above the hyperscalers</strong> — it decides where inference runs, fails over billing/auth in under 500&nbsp;ms, and gives Perplexity one SLA owner across the whole stack. [CONFIRMED for Akamai capabilities · LIKELY for inference concentration]</p>` },
    { match: /crisis|plain english|what.+wrong/i, html: `
      <p><strong>The crisis in plain English.</strong> Perplexity has world-class AI factories (AWS, Foundry, CoreWeave) but no single user-facing operator above them.</p>
      <ul>
        <li>Credit-based billing is in the critical path; 401/402 cascades to API outage [CONFIRMED]</li>
        <li>Three GPU clouds, none of them decides <em>where</em> a request runs [CONFIRMED]</li>
        <li>Public AI Gateway products cache exact-match only — semantic caching is not available [CONFIRMED NO]</li>
      </ul>
      <p>That gap is the entire Akamai opening.</p>` },
    { match: /akamai|why.+matter|why.+here/i, html: `
      <p><strong>Why Akamai.</strong> 4,400+ edge PoPs and thousands of NVIDIA RTX PRO 6000 Blackwell GPUs deployed across the edge [CONFIRMED]. The position is right: <em>above</em> the GPU clouds, <em>alongside</em> the public edge, <em>inside</em> the user path.</p>
      <p>Akamai owns request placement, semantic cache policy (roadmap), failover state, and SLA reporting. The hyperscalers keep doing what they do best.</p>` },
    { match: /remember|takeaway|leave with/i, html: `
      <p><strong>What to remember.</strong></p>
      <ul>
        <li>Don't replace the front door. Add the <strong>runtime layer above the hyperscalers</strong>.</li>
        <li>The crisis lives in <em>orchestration</em>, not in compute or CDN.</li>
        <li>Pilot framing: narrow slice (peak-hour US/EU search), measure TTFT, egress, incident ownership.</li>
      </ul>` },
  ],

  cto: [
    WALKTHROUGH_MATCH,
    COMET_CF_MATCH, MAY7_MATCH, BILLING_IDEMPOTENCY_MATCH, RATE_LIMIT_MATCH, DATASTREAM_DISCORD_MATCH, SUPPORT_MATCH,
    { match: /break|fail|where.+breaks?/i, html: `
      <p><strong>Where it actually breaks.</strong></p>
      <ul>
        <li><strong>Billing Cascade.</strong> Credit-based per-token metering produces 401/402 on exhaustion or billing-system failure. StatusGator tracks 25+ public Perplexity API outages since May 2025 [CONFIRMED].</li>
        <li><strong>Orchestration Chaos.</strong> AWS + Foundry + CoreWeave, no policy engine above them [CONFIRMED].</li>
        <li><strong>TTFT Spikes.</strong> Edge proximity is a CDN concern. Placement — <em>where</em> the inference runs — is a runtime concern.</li>
        <li><strong>Support Fragmentation.</strong> Three independent SLA boundaries per real incident.</li>
        <li><strong>Egress Drag.</strong> Cross-cloud bytes priced like a tax on novelty.</li>
      </ul>` },
    { match: /convergence|own|layer|what.+do/i, html: `
      <p><strong>What the convergence layer owns.</strong></p>
      <ul>
        <li>Request placement (edge / regional / hyperscale)</li>
        <li>Provider health + queue-aware routing</li>
        <li>Billing &amp; auth-state failover (sub-500&nbsp;ms policy swap via EdgeWorkers)</li>
        <li>Semantic / embedding-aware cache policy (Akamai AI Grid roadmap)</li>
        <li>Cross-cloud egress minimization</li>
        <li>One SLA report across runtime + providers</li>
      </ul>
      <p>It sits <strong>above</strong> AWS / Foundry / CoreWeave, <strong>alongside</strong> the public edge — not instead of either.</p>` },
    { match: /ttft|latency|first[- ]token/i, html: `
      <p><strong>How TTFT improves.</strong> The public edge cuts network distance. Akamai decides whether the request belongs at the edge PoP, in a regional inference cluster, or at the hyperscaler — based on prompt class, queue depth, cache hit probability, and data locality. That's a runtime decision, not a routing decision.</p>` },
    { match: /semantic|cache|ai gateway|gateway/i, html: `
      <p><strong>Semantic cache vs public AI Gateway cache.</strong></p>
      <ul>
        <li>Public AI Gateway products provide <strong>exact-match cache only</strong> — confirmed by docs and independent analysis [CONFIRMED].</li>
        <li>Real AI search traffic varies constantly — exact-match hit rate is low by definition.</li>
        <li>Akamai AI Grid <strong>targets semantic caching at the edge</strong> as a roadmap capability — keys on intent + embedding + tenant + freshness.</li>
      </ul>` },
  ],

  cfo: [
    WALKTHROUGH_MATCH,
    MAY7_MATCH, BILLING_IDEMPOTENCY_MATCH, SUPPORT_MATCH, DATASTREAM_DISCORD_MATCH, COMET_CF_MATCH,
    { match: /bleed|cost|spend|budget/i, html: `
      <p><strong>Where the money leaks.</strong></p>
      <ul>
        <li><strong>Cross-cloud egress</strong> on every retry, every failover, every model fallback — priced per GB across AWS, Foundry, CoreWeave.</li>
        <li><strong>Cache miss tax.</strong> Exact-match caching gives near-zero hit rate on novel prompts; every miss is a full token round-trip.</li>
        <li><strong>Incident labor.</strong> Three independent SLA boundaries per real incident — engineering hours, not infrastructure.</li>
        <li><strong>Billing-cascade revenue loss.</strong> Confirmed billing-system events have triggered credit refunds and bonus-credit issuance.</li>
      </ul>` },
    { match: /nothing|do nothing|status quo/i, html: `
      <p><strong>Cost of doing nothing.</strong> Token economics, egress, and incident labor compound monthly. Each new GPU provider adds an orchestration seam, not capacity. The next billing-cascade incident is when, not if — and it lands on customer-visible surfaces.</p>` },
    { match: /roi|pilot|return|invest/i, html: `
      <p><strong>Pilot ROI framing.</strong></p>
      <ul>
        <li>Scope: peak-hour US/EU search, ~one narrow demand slice.</li>
        <li>Measure: TTFT, egress GB, incident ownership, cache hit rate.</li>
        <li>Win condition: incident compression + edge-served share materially up vs. baseline.</li>
        <li>Cost: incremental against existing AWS / Foundry / CoreWeave spend — not on top of them.</li>
      </ul>` },
    { match: /overlap|incremental|public edge|cdn/i, html: `
      <p><strong>Public-edge overlap.</strong> Minimal where it matters. The public edge keeps DNS, WAF, bot, public CDN cache, exact-match AI Gateway. Akamai adds the layer no CDN sells today: inference placement, semantic cache (roadmap), billing/auth failover, single-SLA. The spend lines aren't competing — they're stacked.</p>` },
  ],

  sales: [
    WALKTHROUGH_MATCH,
    COMET_CF_MATCH, MAY7_MATCH, BILLING_IDEMPOTENCY_MATCH, RATE_LIMIT_MATCH, DATASTREAM_DISCORD_MATCH, SUPPORT_MATCH,
    { match: /pitch|one sentence|elevator/i, html: `
      <p><strong>One-sentence pitch.</strong></p>
      <p>"The front door handles the connection. <strong>Akamai AI Grid decides where the intelligence runs — and owns the outcome.</strong>"</p>` },
    { match: /open.+cto|cto/i, html: `
      <p><strong>Opening with the CTO.</strong></p>
      <ul>
        <li>Lead with the billing cascade — concrete, dated, public.</li>
        <li>Frame as runtime + placement problem, not a CDN problem.</li>
        <li>Ask: "Who owns the SLA when AWS, Foundry, and CoreWeave disagree?"</li>
      </ul>` },
    { match: /open.+cfo|cfo/i, html: `
      <p><strong>Opening with the CFO.</strong></p>
      <ul>
        <li>Lead with token economics + cross-cloud egress drag.</li>
        <li>Position Akamai as incremental against existing GPU spend, not on top of it.</li>
        <li>Anchor pilot to a narrow, measurable slice.</li>
      </ul>` },
    { match: /objection|already does|public.+edge.+do|cdn.+do/i, html: `
      <p><strong>Objection: "the public edge already does this."</strong></p>
      <p>Acknowledge first — the public edge keeps the front door fast and protected. Then pivot:</p>
      <ul>
        <li>Public AI Gateway products cache exact matches. AI search traffic is rarely exact.</li>
        <li>The public edge load-balances pools. It does not pick whether inference belongs at the edge, regional, or hyperscale.</li>
        <li>The public edge cannot fail over billing/auth state across providers in under 500&nbsp;ms.</li>
      </ul>
      <p>Close with: <strong>The front door handles the connection. Akamai is the AI convergence fabric.</strong></p>` },
  ],
};

const FALLBACK = {
  simple: `<p>Ask me to <strong>explain the crisis</strong>, <strong>why Akamai</strong>, or <strong>what to remember</strong>. I keep claims labeled CONFIRMED / LIKELY / UNKNOWN / ASK PERPLEXITY.</p>`,
  cto: `<p>Ask about <strong>where it breaks</strong>, <strong>what the convergence layer owns</strong>, <strong>TTFT</strong>, or <strong>semantic cache</strong>. I'll keep it runtime-shaped, not CDN-shaped.</p>`,
  cfo: `<p>Ask about <strong>where the money leaks</strong>, <strong>the cost of doing nothing</strong>, <strong>pilot ROI</strong>, or <strong>public-edge overlap</strong>. I'll answer in dollars and incidents.</p>`,
  sales: `<p>Ask for the <strong>one-sentence pitch</strong>, how to <strong>open with the CTO</strong> or <strong>CFO</strong>, or how to handle the <strong>"the public edge already does this"</strong> objection.</p>`,
};

/* Bootstraps the ATOM agent. Uses document-level event delegation so clicks
 * fire regardless of when launchers mount, even if other init scripts throw.
 * Safe to run before DOMContentLoaded — handlers walk the DOM at click time. */
function bootAtomAgent() {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const drawer = $('#atom-agent');
  const backdrop = $('.atom-backdrop');
  // Drawer + backdrop are required; absent of either means the page is broken.
  if (!drawer || !backdrop) return;

  const body = $('#atom-body');
  const chipsRoot = $('#atom-chips');
  const form = $('#atom-form');
  const input = $('#atom-input');

  let currentMode = 'simple';
  let lastFocus = null;
  let isOpen = false;

  function renderChips(mode) {
    const chips = MODES[mode].chips;
    chipsRoot.innerHTML = chips
      .map((c) => `<button type="button" class="atom-chip" data-atom-chip>${c}</button>`)
      .join('');
    $$('[data-atom-chip]', chipsRoot).forEach((btn) => {
      btn.addEventListener('click', () => {
        input.value = btn.textContent;
        submitPrompt(btn.textContent);
      });
    });
  }

  function setMode(mode) {
    if (!MODES[mode]) return;
    currentMode = mode;
    $$('.atom-tab').forEach((btn) => {
      const isActive = btn.dataset.atomMode === mode;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    // Reset the conversation when switching mode — keeps the brief tight.
    resetConversation(mode);
    renderChips(mode);
  }

  function resetConversation(mode) {
    body.innerHTML = '';
    appendMessage('assistant', MODES[mode].greeting);
  }

  function appendMessage(role, html) {
    const msg = document.createElement('div');
    msg.className = 'atom-message';
    msg.dataset.role = role;
    msg.innerHTML = `
      <div class="atom-message__who">${role === 'user' ? 'You' : 'ATOM · Akamai Copilot'}</div>
      <div class="atom-message__text">${html}</div>
    `;
    body.appendChild(msg);
    wireMessageLinks(msg);
    // Smooth scroll to bottom
    requestAnimationFrame(() => {
      body.scrollTo({ top: body.scrollHeight, behavior: 'smooth' });
    });
    return msg;
  }

  function wireMessageLinks(root) {
    root.querySelectorAll('a[data-atom-link="flow"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        closeAgent();
        // Defer so the close animation can begin before scrolling.
        window.setTimeout(() => {
          if (window.dtomCrisisFlow && typeof window.dtomCrisisFlow.open === 'function') {
            window.dtomCrisisFlow.open(0);
          } else {
            const target = document.getElementById('end-to-end-flow');
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 120);
      });
    });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function pickResponse(mode, prompt) {
    const candidates = RESPONSES[mode] || [];
    for (const c of candidates) {
      if (c.match.test(prompt)) return c.html;
    }
    return FALLBACK[mode];
  }

  async function submitPrompt(rawPrompt) {
    const prompt = (rawPrompt || '').trim();
    if (!prompt) return;
    appendMessage('user', `<p>${escapeHtml(prompt)}</p>`);
    input.value = '';
    input.disabled = true;

    const thinking = appendMessage('assistant', '<p style="color: var(--ink-muted);"><span class="atom-typing"><i></i><i></i><i></i></span> ATOM is analyzing…</p>');
    const textEl = thinking.querySelector('.atom-message__text');

    // Always have a deterministic answer ready — we'll only show it on failure.
    const deterministic = pickResponse(currentMode, prompt);

    // Try /api/ask-atom first, fall back to /api/atom-agent for compatibility.
    async function callEndpoint(path) {
      const r = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, mode: currentMode }),
      });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }

    try {
      let data;
      try { data = await callEndpoint('/api/ask-atom'); }
      catch (_) { data = await callEndpoint('/api/atom-agent'); }
      const live = (data && typeof data.html === 'string' && data.html.trim()) ? data.html : deterministic;
      const isLive = data && (data.source === 'atom' || data.source === 'perplexity' || data.grounded);
      const badge = isLive
        ? '<div class="atom-badge atom-badge--live"><span class="pip"></span>ATOM · live</div>'
        : '<div class="atom-badge atom-badge--offline"><span class="pip"></span>ATOM · brief mode</div>';
      const citationsHtml = Array.isArray(data && data.citations) && data.citations.length
        ? '<div class="atom-citations"><div class="atom-citations__label">Sources</div><ol>' +
            data.citations.slice(0, 6).map((c) => {
              const url = typeof c === 'string' ? c : (c && c.url) || '';
              if (!/^https?:\/\//i.test(url)) return '';
              const host = url.replace(/^https?:\/\//, '').split('/')[0];
              return `<li><a href="${url}" target="_blank" rel="noopener noreferrer">${host}</a></li>`;
            }).join('') +
          '</ol></div>'
        : '';
      textEl.innerHTML = badge + live + citationsHtml;
      wireMessageLinks(thinking);
    } catch (err) {
      textEl.innerHTML =
        '<div class="atom-badge atom-badge--offline"><span class="pip"></span>Brief mode · offline copilot</div>' +
        deterministic;
      wireMessageLinks(thinking);
    } finally {
      input.disabled = false;
      input.focus({ preventScroll: true });
    }
  }

  /* ------------ Open / close ------------ */
  function openAgent() {
    if (isOpen) return;
    isOpen = true;
    lastFocus = document.activeElement;
    drawer.hidden = false;
    // force reflow so transition runs
    void drawer.offsetWidth;
    drawer.classList.add('open');
    backdrop.classList.add('open');
    document.body.classList.add('atom-open');
    window.setTimeout(() => { if (input) input.focus({ preventScroll: true }); }, 60);
  }

  function closeAgent() {
    if (!isOpen) return;
    isOpen = false;
    drawer.classList.remove('open');
    backdrop.classList.remove('open');
    document.body.classList.remove('atom-open');
    window.setTimeout(() => {
      drawer.hidden = true;
      if (lastFocus && typeof lastFocus.focus === 'function') {
        try { lastFocus.focus({ preventScroll: true }); } catch (_) { /* noop */ }
      }
    }, 240);
  }

  /* ------------ Document-level event delegation ------------
   * One listener at document covers every launcher anywhere on the page,
   * including elements rendered later by other scripts. Click target may be
   * an inner <svg> / <span> — Element.closest() walks up to find the trigger. */
  document.addEventListener('click', (e) => {
    const t = e.target;
    if (!(t instanceof Element)) return;
    const open  = t.closest('[data-atom-open]');
    const close = t.closest('[data-atom-close]');
    const mode  = t.closest('.atom-tab[data-atom-mode]');
    const chip  = t.closest('[data-atom-chip]');
    if (open)  { e.preventDefault(); openAgent(); return; }
    if (close) { e.preventDefault(); closeAgent(); return; }
    if (mode)  { setMode(mode.dataset.atomMode); return; }
    if (chip && chipsRoot && chipsRoot.contains(chip)) {
      const text = chip.textContent || '';
      if (input) input.value = text;
      submitPrompt(text);
    }
  }, { capture: false });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) closeAgent();
  });

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      submitPrompt(input ? input.value : '');
    });
  }

  // Initial render
  setMode('simple');

  // Expose a global hook for emergency / external callers.
  window.dtomAtomAgent = { open: openAgent, close: closeAgent, setMode };
}

/* Run as early as possible, then again on DOMContentLoaded to handle late
 * insertion. boot is idempotent because openAgent guards on isOpen. */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootAtomAgent, { once: true });
} else {
  bootAtomAgent();
}
