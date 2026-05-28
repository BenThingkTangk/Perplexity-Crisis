/*
 * ΔTOM // ATOM AGENT - DEAL COPILOT
 * Local deterministic copilot grounded in the Perplexity / Akamai thesis
 * on this page. No external calls. Four modes: simple, cto, cfo, sales.
 */

const MODES = {
  simple: {
    label: 'Simple',
    greeting: 'Simple mode online. Ask me to make the Akamai thesis obvious, clean, and impossible to misunderstand.',
    chips: [
      'Explain this like I have 30 seconds',
      'What is the crisis in plain English?',
      'Why does Akamai matter here?',
      'What should I remember after reading this?',
    ],
  },
  cto: {
    label: 'CTO',
    greeting: 'CTO mode online. I will frame this as a runtime, placement, and orchestration problem — not a CDN sale.',
    chips: [
      'Where does Perplexity actually break?',
      'What does the convergence layer own?',
      'How does Akamai change TTFT?',
      'Semantic cache vs Cloudflare AI Gateway?',
    ],
  },
  cfo: {
    label: 'CFO',
    greeting: 'CFO mode online. Token economics, egress drag, and SLA ownership — all in one cost-of-incidents story.',
    chips: [
      'Where is the budget bleeding?',
      'What does this cost if we do nothing?',
      'ROI for an Akamai convergence pilot',
      'Cloudflare overlap vs incremental spend',
    ],
  },
  sales: {
    label: 'Sales',
    greeting: 'Sales mode online. The wedge: keep Cloudflare, win the AI runtime. Here are the moves that close.',
    chips: [
      'Pitch in one sentence',
      'How to open with the CTO',
      'How to open with the CFO',
      'Objection: "Cloudflare already does this"',
    ],
  },
};

/* ---------- Deterministic response library ---------- */
/* Keyed by mode + intent. Matching is keyword-based on the user's input.   */

const RESPONSES = {
  simple: [
    { match: /30\s*seconds|tl;?dr|short|brief|explain/i, html: `
      <p><strong>30-second version.</strong> Perplexity wired itself to AWS + Microsoft Foundry + CoreWeave in under five weeks. The architecture is fast — the coordination model isn't. When billing, GPUs, or providers wobble, the user feels it as a slow or broken answer.</p>
      <p>Cloudflare protects the front door. <strong>Akamai becomes the runtime layer above the hyperscalers</strong> — it decides where inference runs, fails over billing/auth in under 500ms, and gives Perplexity one SLA owner across the whole stack.</p>` },
    { match: /crisis|plain english|what.+wrong/i, html: `
      <p><strong>The crisis in plain English.</strong> Perplexity has world-class AI factories (AWS, Foundry, CoreWeave) but no single user-facing operator above them.</p>
      <ul>
        <li>A $50 billing charge fails → API access cascades</li>
        <li>Three GPU clouds, none of them decides <em>where</em> a request actually runs</li>
        <li>Cloudflare guards the perimeter but cannot pick placement, cache semantically, or own multi-cloud SLA</li>
      </ul>
      <p>That gap is the entire Akamai opening.</p>` },
    { match: /akamai|why.+matter|why.+here/i, html: `
      <p><strong>Why Akamai.</strong> 4,400+ edge POPs and an existing security surface — but more importantly, the position is right: <em>above</em> the GPU clouds, <em>beside</em> Cloudflare, <em>inside</em> the user path.</p>
      <p>Akamai owns request placement, semantic cache policy, failover state, and SLA reporting. The hyperscalers keep doing what they do best.</p>` },
    { match: /remember|takeaway|leave with/i, html: `
      <p><strong>What to remember.</strong></p>
      <ul>
        <li>Don't say "replace Cloudflare." Say <strong>convergence layer above the hyperscalers</strong>.</li>
        <li>The crisis lives in <em>orchestration</em>, not in compute or CDN.</li>
        <li>Pilot framing: narrow slice (peak-hour US/EU search), measure TTFT, egress, incident ownership.</li>
      </ul>` },
  ],

  cto: [
    { match: /break|fail|where.+breaks?/i, html: `
      <p><strong>Where it actually breaks.</strong></p>
      <ul>
        <li><strong>Billing Cascade.</strong> Two $50 charges failed at 20:22:47 and 20:23:12 UTC → API access broke → ATOM/AntimatterAI integrations went dark. Auth and payment state aren't behind a circuit breaker.</li>
        <li><strong>Orchestration Chaos.</strong> AWS + Foundry + CoreWeave, no policy engine above them.</li>
        <li><strong>TTFT Spikes.</strong> Edge proximity is a CDN concern. Placement — <em>where</em> the inference runs — is a runtime concern. Cloudflare answers the first, not the second.</li>
        <li><strong>Support Fragmentation.</strong> Five vendor tickets per real incident.</li>
        <li><strong>Egress Drag.</strong> Cross-cloud bytes priced like a tax on novelty.</li>
      </ul>` },
    { match: /convergence|own|layer|what.+do/i, html: `
      <p><strong>What the convergence layer owns.</strong></p>
      <ul>
        <li>Request placement (edge / regional / hyperscale)</li>
        <li>Provider health + queue-aware routing</li>
        <li>Billing &amp; auth-state failover (sub-500ms policy swap)</li>
        <li>Semantic / embedding-aware cache policy</li>
        <li>Cross-cloud egress minimization</li>
        <li>One SLA report across runtime + providers</li>
      </ul>
      <p>It sits <strong>above</strong> AWS / Foundry / CoreWeave, <strong>beside</strong> Cloudflare's public edge — not instead of either.</p>` },
    { match: /ttft|latency|first[- ]token/i, html: `
      <p><strong>How TTFT improves.</strong> Cloudflare cuts network distance. Akamai decides whether the request belongs at the edge POP, in a regional inference cluster, or at the hyperscaler — based on prompt class, queue depth, cache hit probability, and data locality. That's a runtime decision, not a routing decision.</p>` },
    { match: /semantic|cache|ai gateway|gateway/i, html: `
      <p><strong>Semantic cache vs AI Gateway cache.</strong></p>
      <ul>
        <li>AI Gateway default cache hashes provider + endpoint + model + auth + full body → effectively exact-match.</li>
        <li>Real Perplexity traffic varies constantly — exact-match hit rate is low.</li>
        <li>Semantic cache keys on intent + embedding + tenant + freshness — hit rates climb without breaking authenticated isolation.</li>
      </ul>` },
  ],

  cfo: [
    { match: /bleed|cost|spend|budget/i, html: `
      <p><strong>Where the money leaks.</strong></p>
      <ul>
        <li><strong>Cross-cloud egress</strong> on every retry, every failover, every model fallback — priced per GB across AWS, Foundry, CoreWeave.</li>
        <li><strong>Cache miss tax.</strong> Exact-match caching gives near-zero hit rate on novel prompts; every miss is a full token round-trip.</li>
        <li><strong>Incident labor.</strong> Five vendor tickets per real incident — engineering hours, not infrastructure.</li>
        <li><strong>Billing-cascade revenue loss.</strong> 20:22-20:23 UTC outage took down ATOM/AntimatterAI integrations on a payment-state hiccup.</li>
      </ul>` },
    { match: /nothing|do nothing|status quo/i, html: `
      <p><strong>Cost of doing nothing.</strong> Token economics, egress, and incident labor compound monthly. Each new GPU provider adds an orchestration seam, not capacity. The next billing-cascade incident is a question of when, not if — and it lands on customer-visible surfaces.</p>` },
    { match: /roi|pilot|return|invest/i, html: `
      <p><strong>Pilot ROI framing.</strong></p>
      <ul>
        <li>Scope: peak-hour US/EU search, ~one narrow demand slice.</li>
        <li>Measure: TTFT, egress GB, incident ownership, cache hit rate.</li>
        <li>Win condition: incident compression + edge-served share materially up vs. baseline.</li>
        <li>Cost: incremental against existing AWS / Foundry / CoreWeave spend — not on top of them.</li>
      </ul>` },
    { match: /cloudflare|overlap|incremental/i, html: `
      <p><strong>Cloudflare overlap.</strong> Minimal where it matters. Cloudflare keeps DNS, WAF, bot, public CDN cache, exact-match AI Gateway. Akamai adds the layer Cloudflare doesn't sell: inference placement, semantic cache, billing/auth failover, single-SLA. The spend lines aren't competing — they're stacked.</p>` },
  ],

  sales: [
    { match: /pitch|one sentence|elevator/i, html: `
      <p><strong>One-sentence pitch.</strong></p>
      <p>"Cloudflare routes the request. <strong>Akamai decides where the intelligence should run.</strong>"</p>` },
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
    { match: /objection|already does|cloudflare.+do/i, html: `
      <p><strong>Objection: "Cloudflare already does this."</strong></p>
      <p>Acknowledge first — Cloudflare keeps the front door fast and protected. Then pivot:</p>
      <ul>
        <li>Cloudflare's AI Gateway caches exact matches. Perplexity traffic is rarely exact.</li>
        <li>Cloudflare load-balances pools. It does not pick whether inference belongs at the edge, regional, or hyperscale.</li>
        <li>Cloudflare cannot fail over billing/auth state across providers in under 500ms.</li>
      </ul>
      <p>Close with: <strong>Cloudflare is the public shield. Akamai is the AI convergence fabric.</strong></p>` },
  ],
};

const FALLBACK = {
  simple: `<p>Ask me to <strong>explain the crisis</strong>, <strong>why Akamai</strong>, or <strong>what to remember</strong>. I will keep it boardroom-clean.</p>`,
  cto: `<p>Ask about <strong>where it breaks</strong>, <strong>what the convergence layer owns</strong>, <strong>TTFT</strong>, or <strong>semantic cache</strong>. I'll keep it runtime-shaped, not CDN-shaped.</p>`,
  cfo: `<p>Ask about <strong>where the money leaks</strong>, <strong>the cost of doing nothing</strong>, <strong>pilot ROI</strong>, or <strong>Cloudflare overlap</strong>. I'll answer in dollars and incidents.</p>`,
  sales: `<p>Ask for the <strong>one-sentence pitch</strong>, how to <strong>open with the CTO</strong> or <strong>CFO</strong>, or how to handle the <strong>"Cloudflare already does this"</strong> objection.</p>`,
};

(function initAtomAgent() {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const launcher = $('.atom-fab');
  const drawer = $('#atom-agent');
  const backdrop = $('.atom-backdrop');
  if (!launcher || !drawer || !backdrop) return;

  const closeBtns = $$('[data-atom-close]');
  const openBtns = $$('[data-atom-open]');
  const tabBtns = $$('.atom-tab');
  const body = $('#atom-body');
  const messageText = $('#atom-message-text');
  const chipsRoot = $('#atom-chips');
  const form = $('#atom-form');
  const input = $('#atom-input');

  let currentMode = 'simple';
  let lastFocus = null;

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
    tabBtns.forEach((btn) => {
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
      <div class="atom-message__who">${role === 'user' ? 'You' : 'ATOM'}</div>
      <div class="atom-message__text">${html}</div>
    `;
    body.appendChild(msg);
    // Smooth scroll to bottom
    requestAnimationFrame(() => {
      body.scrollTo({ top: body.scrollHeight, behavior: 'smooth' });
    });
    return msg;
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

  function submitPrompt(rawPrompt) {
    const prompt = (rawPrompt || '').trim();
    if (!prompt) return;
    appendMessage('user', `<p>${escapeHtml(prompt)}</p>`);
    input.value = '';

    // Tiny "thinking" placeholder to feel agentic (no real network call).
    const thinking = appendMessage('assistant', '<p style="color: var(--ink-muted);">analyzing…</p>');
    const delay = 280 + Math.random() * 260;
    window.setTimeout(() => {
      thinking.querySelector('.atom-message__text').innerHTML = pickResponse(currentMode, prompt);
    }, delay);
  }

  /* ------------ Open / close ------------ */
  function openAgent() {
    lastFocus = document.activeElement;
    drawer.hidden = false;
    // force reflow so transition runs
    void drawer.offsetWidth;
    drawer.classList.add('open');
    backdrop.classList.add('open');
    document.body.classList.add('atom-open');
    // focus the input for keyboard-first users
    window.setTimeout(() => input.focus({ preventScroll: true }), 60);
  }

  function closeAgent() {
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

  openBtns.forEach((b) => b.addEventListener('click', openAgent));
  closeBtns.forEach((b) => b.addEventListener('click', closeAgent));
  backdrop.addEventListener('click', closeAgent);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !drawer.hidden) closeAgent();
  });

  tabBtns.forEach((btn) =>
    btn.addEventListener('click', () => setMode(btn.dataset.atomMode))
  );

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submitPrompt(input.value);
  });

  // Initial render
  setMode('simple');
})();
