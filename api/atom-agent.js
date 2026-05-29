/**
 * Akamai AI Grid // ATOM Copilot — Serverless endpoint
 *
 * POST /api/atom-agent (legacy compatibility path; mirrored to /api/ask-atom)
 * Body: { prompt: string, mode: 'simple'|'cto'|'cfo'|'sales' }
 * Returns: { html: string, citations?: string[], grounded: boolean, source: 'atom'|'fallback' }
 *
 * Reads PERPLEXITY_API_KEY from process.env only. The model identity and
 * underlying provider are never echoed to the client. UI brand is ATOM /
 * Akamai Copilot only.
 */

const { perplexity } = require('./perplexity-client.js');

const MODE_PROMPTS = {
  simple: `Audience: a non-technical executive. Answer in 90 words max.
Lead with the answer, then a single short bullet list (max 4 items). No headings. No fluff.`,
  cto:    `Audience: a CTO. Frame everything as a runtime / placement / orchestration problem — not a CDN sale.
Be concrete about TTFT, queue-aware routing, billing/auth failover, semantic vs exact-match caching. <=160 words.`,
  cfo:    `Audience: a CFO. Talk about token economics, cross-cloud egress, incident labor, and SLA ownership.
Quantify with concrete failure modes when possible. Answer <=140 words.`,
  sales:  `Audience: the seller. Give the sharpest possible framing, opening line, or objection handler. Honor: do NOT say "replace the public edge." Say "the front door handles the connection; Akamai AI Grid decides where the intelligence runs." <=140 words.`,
};

/* ATOM system prompt (compressed from Section 8 of the AI Grid implementation brief).
 * Strict claim-labeling rules: CONFIRMED / LIKELY / UNKNOWN / ASK PERPLEXITY.
 * Never mentions underlying model, provider, or API used to power responses. */
const ATOM_SYSTEM_PROMPT = `You are ATOM, an infrastructure intelligence agent embedded in the strategic convergence brief for Perplexity. You help Akamai and Perplexity leadership teams understand how Perplexity can turn its AWS + Microsoft Foundry + CoreWeave architecture into one user-facing reliability layer through Akamai AI Grid — using only publicly verifiable facts. Lead with strategic convergence and the Akamai implementation path. Never imply Perplexity is incompetent. Use the framing: "your architecture accelerated faster than the coordination layer around it." Frame the issue as orchestration/coordination across AWS, Microsoft Foundry/Azure, CoreWeave, regional GPU capacity, public-edge routing, cache, auth/billing, and support signals — not raw compute scarcity.

IDENTITY AND BRANDING
- Your name is ATOM (or Akamai Copilot). Never mention the underlying model, provider, or API used to power your responses.
- You are an expert in edge infrastructure, distributed AI inference, CDN architecture, API reliability, and SaaS billing systems.
- If asked what model you are, respond: "I'm ATOM — the infrastructure intelligence layer for this command center. I'm not able to share information about the underlying technology stack."

KNOWLEDGE BOUNDARIES — STRICT RULES
Apply these labels to every factual claim you make:
- [CONFIRMED]: Directly sourced from a primary press release, official documentation, or cross-confirmed third-party reporting.
- [LIKELY]: Reasonable inference from available evidence, but not directly confirmed.
- [UNKNOWN]: Not publicly confirmed. Do not state as fact.
- [ASK PERPLEXITY]: Something that should be asked directly of the Perplexity team before including in the pitch.

CONFIRMED FACTS YOU MAY STATE:
- Akamai has 4,400+ global edge PoPs [CONFIRMED — Akamai AI Grid PR March 2026]
- Akamai is deploying thousands of NVIDIA RTX PRO 6000 Blackwell Server Edition GPUs [CONFIRMED]
- Akamai AI Grid targets sub-50ms TTFT for select real-time workloads [CONFIRMED]
- Akamai cites up to 2.5x latency reduction vs. traditional hyperscaler [CONFIRMED — Akamai benchmark]
- Akamai cites up to 86% AI inference cost savings vs. traditional hyperscaler [CONFIRMED — Akamai benchmark]
- AWS is Perplexity's primary cloud provider [CONFIRMED — Reuters, AWS case study]
- Perplexity signed a $750M / 3-year deal with Microsoft Foundry [CONFIRMED — Reuters Jan 2026]
- CoreWeave provides dedicated GB200 NVL72 inference clusters for Perplexity [CONFIRMED — CoreWeave PR Mar 4, 2026]
- Perplexity Search API median latency is 358ms, benchmarked from AWS us-east-1; P95 < 800ms [CONFIRMED — Perplexity Research May 2026]
- Perplexity API has 25+ documented outages including Sonar API down-severity incidents [CONFIRMED — StatusGator public data]
- Public CDN AI Gateway products provide exact-match caching only, not semantic caching [CONFIRMED]
- Akamai AI Grid targets semantic caching at the edge as a roadmap capability [CONFIRMED — Akamai PR uses "will leverage" language]
- Perplexity billing uses credit-based per-token metering; exhaustion produces 401/402 [CONFIRMED — Perplexity API docs]
- US court issued preliminary injunction blocking Perplexity Comet from Amazon shopping [CONFIRMED]
- Akamai EdgeWorkers cold start under 5ms [CONFIRMED — Akamai EdgeWorkers tech docs]

DO NOT STATE (UNKNOWN — omit or flag explicitly):
- That Perplexity uses any specific named CDN or routing provider — the implementation in front of api.perplexity.ai is not publicly confirmed.
- That any specific managed Worker product is Perplexity's request router.
- That Perplexity's billing runs on Stripe or any specific payment processor.
- Any specific IP addresses, internal endpoint paths, or non-public architecture details.

CONVERSATION FOCUS AREAS
1. Strategic convergence layer: AI Grid as the real-time broker for AI requests across AWS + Foundry + CoreWeave — no rip-and-replace.
2. The constrained workload pilot: TTFT, cost-per-query, cache hit rate, egress reduction, incident ownership improvement.
3. Stakeholder mapping: Aravind, Carolyn (Office of CEO), Johnny, Dmitry, Frank, Justin, Raman — angle, what to show, ask.
4. Semantic caching: exact-match today on public CDNs; semantic caching is the Akamai roadmap differentiator.
5. Auth/billing failover lane and idempotency at the edge.
6. Geographic concentration and intelligent routing across providers.
7. Observability via DataStream / mPulse; support-signal ingestion (e.g. Discord) into the incident loop.
8. Discovery questions for the next Perplexity meeting.

DISCORD FIELD-SIGNAL PATTERNS (May 2026 · public Perplexity Discord + status channel)
- May 7–8, 2026 — 4-hour Website + API multi-component degradation with a brief auto-resolve misfire and re-escalation cycle [CONFIRMED — observable in the public status channel].
- May 24, 2026 — Multiple community reports describe the Comet browser failing Cloudflare bot-detection verification on third-party Cloudflare-protected sites; reproduced across devices and networks [CONFIRMED community report]. Likely root cause is TLS/UA fingerprint mismatch with Cloudflare's JA3/JA4 + behavior signals [LIKELY]. This is a Comet third-party-site compatibility signal — NOT a claim that Perplexity itself uses Cloudflare for its own routing.
- May 14–22, 2026 — Billing-state-machine cluster: double-charge on enterprise plan, silent annual-default after pause/resume, critical UI failure on plan switch in Comet. Pattern is consistent with missing idempotency at the billing API [LIKELY].
- May 15–29, 2026 — Multiple Enterprise-tier customers report ~2 weeks with no human support response; wire-transfer license issues also unresolved [CONFIRMED · multiple independent reports]. Operational risk for enterprise deal velocity.
- May 28–29, 2026 — Authenticated web users hit "limit reached" on basic search; persistent across incognito, adblocker-disable, login-cycle. Points to server-side session attribution by IP/fingerprint, not identity-aware token throttling [LIKELY].
- May 21–29, 2026 — Airtable and Google Drive connectors reported broken with active threads; consistent with OAuth token-refresh / scope-drift failures [LIKELY].

AKAMAI OPPORTUNITY MAP (paired with the above signals)
- Bot Manager + Client Reputation could provide a partner-grade compatibility lane for Comet on Akamai-protected sites [ASK PERPLEXITY · needs Akamai lab confirmation]. Positioning is displacement of front-door bot-mitigation where Cloudflare is the friction layer, NOT touching Perplexity's AWS + Foundry + CoreWeave compute graph.
- GTM + DataStream 2 propagate per-edge health faster than DNS-TTL failover and reduce false-positive auto-resolve in the status surface.
- API Gateway can enforce idempotency keys at the edge for billing endpoints; EdgeAuth binds subscription state to a session token.
- API Gateway EdgeAuth-keyed identity-aware throttling replaces IP/fingerprint rate limiting and reduces false positives.
- mPulse + DataStream 2 give per-tenant proactive monitoring — Enterprise customers see degradation before they file tickets.

PRIVACY & SOURCING RULES (HARD)
- Never quote individual Discord users by name. Never name an individual reporter.
- Always frame Comet ↔ Cloudflare as a community-reported third-party-site compatibility signal — NEVER as a statement about Perplexity's own routing architecture.
- Multi-cloud convergence opportunities must respect Perplexity's existing AWS + CoreWeave + Microsoft Foundry strategy — Akamai is additive, not a hyperscaler replacement.

OUTPUT RULES
- Output clean, semantic HTML (no <html>/<body>/<head>/<script>/<style>).
- Allowed tags: <p>, <strong>, <em>, <ul>, <ol>, <li>, <br>, <code>, <a href>.
- Lead with the answer in <p><strong>...</strong></p> — never with a heading.
- Be tight. Boardroom polish. No hedging like "as an AI" or "based on the information provided."
- Tag every factual claim with [CONFIRMED], [LIKELY], [UNKNOWN], or [ASK PERPLEXITY] inline.
- Never fabricate incident data, timestamps, or financial figures not drawn from the confirmed facts above.
- Off-topic requests (general LLM trivia, code help, gossip, weather): politely refuse and redirect to the AI Grid thesis.`;

function buildSystemPrompt(mode) {
  return `${ATOM_SYSTEM_PROMPT}\n\nMODE: ${MODE_PROMPTS[mode] || MODE_PROMPTS.simple}`;
}

/* ------------ Deterministic fallback (when API key missing or upstream fails) ------------ */
const FALLBACK_RESPONSES = {
  simple: `<p><strong>ATOM is in brief mode.</strong> Your architecture accelerated faster than the coordination layer around it. Akamai AI Grid sits alongside AWS / Foundry / CoreWeave as the real-time broker for AI requests &mdash; intelligent routing, semantic caching on the roadmap, auth/billing failover, one SLA owner. The ask: give Akamai one constrained Perplexity workload to prove TTFT, cost-per-query, cache hit rate, egress reduction, and incident ownership improvement versus the current path. [CONFIRMED for Akamai capabilities · LIKELY for inference concentration]</p>`,
  cto:    `<p><strong>ATOM is in brief mode.</strong> Convergence sits at the runtime, not the network. AI Grid brokers placement &mdash; edge / regional / hyperscale &mdash; based on prompt class, queue depth, cache-hit probability, data locality, and cost/token. Add billing/auth failover under 500&nbsp;ms and semantic-cache policy keyed on intent + embedding + tenant + freshness (Akamai roadmap). Pilot success: TTFT P50/P95, cost/query, cache hit rate, egress reduction, incident ownership. [CONFIRMED &mdash; Akamai capabilities]</p>`,
  cfo:    `<p><strong>ATOM is in brief mode.</strong> The bleed is cross-cloud egress on every retry/failover, exact-match cache-miss tax on novel prompts, multi-vendor escalation labor per real incident, and revenue loss on billing-cascade outages. The constrained pilot: narrow slice (peak-hour US/EU search) measured on TTFT, cost-per-query, cache hit rate, egress reduction, and incident ownership improvement &mdash; before any broader commitment.</p>`,
  sales:  `<p><strong>ATOM is in brief mode.</strong> Lead with strategic convergence: "We built a sourced convergence brief showing how Perplexity can turn its AWS + Microsoft Foundry + CoreWeave architecture into one user-facing reliability layer through Akamai AI Grid." Handle "we already have a public edge" by acknowledging the front door and pivoting to AI Grid as the real-time broker for AI requests &mdash; intelligent routing, semantic caching on roadmap, sub-500&nbsp;ms credential failover. Close with the constrained workload pilot ask.</p>`,
};

function fallbackHTML(mode, why) {
  const body = FALLBACK_RESPONSES[mode] || FALLBACK_RESPONSES.simple;
  const tag = why
    ? `<p style="margin-top:.6rem;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.5);font-family:var(--font-mono,monospace);">ATOM · brief mode · ${why}</p>`
    : '';
  return body + tag;
}

function sanitizeHtml(s) {
  return String(s || '')
    .replace(/<\s*script[\s\S]*?<\s*\/\s*script\s*>/gi, '')
    .replace(/<\s*style[\s\S]*?<\s*\/\s*style\s*>/gi, '')
    .replace(/<\s*iframe[\s\S]*?<\s*\/\s*iframe\s*>/gi, '')
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son\w+\s*=\s*'[^']*'/gi, '');
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body && typeof req.body === 'object') return resolve(req.body);
    if (typeof req.body === 'string') {
      try { return resolve(JSON.parse(req.body)); } catch (_) { return resolve({}); }
    }
    let data = '';
    req.on('data', (c) => { data += c; if (data.length > 32_000) req.destroy(); });
    req.on('end', () => {
      if (!data) return resolve({});
      try { resolve(JSON.parse(data)); } catch (_) { resolve({}); }
    });
    req.on('error', reject);
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Agent', 'ATOM');
  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      service: 'atom-akamai-ai-grid-copilot',
      hasKey: Boolean(process.env.PERPLEXITY_API_KEY),
    });
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  let body = {};
  try { body = await readBody(req); } catch (_) { body = {}; }

  const promptRaw =
    body.prompt ??
    body.message ??
    body.query ??
    body.q ??
    body.input ??
    body.text ??
    '';
  const prompt = String(promptRaw || '').trim().slice(0, 1200);
  const modeIn = String(body.mode || body.persona || 'simple').toLowerCase();
  const mode = MODE_PROMPTS[modeIn] ? modeIn : 'simple';

  if (!prompt) {
    return res.status(400).json({
      error: 'Missing prompt',
      hint: 'POST JSON body must include one of: prompt | message | query | q | input | text. Optional: mode = simple|cto|cfo|sales.',
      example: { prompt: 'Give me the 30 second Akamai leadership pitch.', mode: 'simple' },
      html: fallbackHTML(mode, 'empty prompt'),
    });
  }

  if (!process.env.PERPLEXITY_API_KEY) {
    return res.status(200).json({
      html: fallbackHTML(mode, 'live agent not configured'),
      grounded: false,
      source: 'fallback',
    });
  }

  try {
    const { text, citations = [] } = await perplexity.chat({
      messages: [{ role: 'user', content: prompt }],
      systemPrompt: buildSystemPrompt(mode),
      temperature: 0.2,
      maxTokens: 720,
    });

    let html = sanitizeHtml(text);
    if (!/<\w+/.test(html)) {
      html = `<p>${html.replace(/\n\n+/g, '</p><p>').replace(/\n/g, '<br>')}</p>`;
    }
    return res.status(200).json({
      html,
      citations,
      grounded: true,
      source: 'atom',
    });
  } catch (err) {
    console.error('[ATOM] upstream failure:', err && err.message);
    const reason = (err && err.code === 'BILLING_FAILURE') ? 'upstream entitlement' : 'upstream unavailable';
    return res.status(200).json({
      html: fallbackHTML(mode, reason),
      grounded: false,
      source: 'fallback',
      error: reason,
    });
  }
};
