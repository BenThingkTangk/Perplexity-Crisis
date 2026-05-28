/**
 * Akamai AI Grid // Copilot — Serverless endpoint
 *
 * POST /api/atom-agent
 * Body: { prompt: string, mode: 'simple'|'cto'|'cfo'|'sales' }
 * Returns: { html: string, citations?: string[], grounded: boolean, source: 'perplexity'|'fallback' }
 *
 * Reads PERPLEXITY_API_KEY from process.env only. Never echo the key.
 */

const { perplexity } = require('./perplexity-client.js');

const MODE_PROMPTS = {
  simple: `You are the Akamai AI Grid Copilot. Audience: a non-technical executive. Answer in 90 words max.
Lead with the answer, then a single short bullet list (max 4 items). No headings. No fluff.`,
  cto:    `You are the Akamai AI Grid Copilot speaking to a CTO. Frame everything as a runtime / placement / orchestration problem — not a CDN sale.
Be concrete about TTFT, queue-aware routing, billing/auth failover, semantic vs exact-match caching. <=160 words.`,
  cfo:    `You are the Akamai AI Grid Copilot speaking to a CFO. Talk about token economics, cross-cloud egress, incident labor, and SLA ownership.
Quantify with concrete failure modes when possible. Answer <=140 words.`,
  sales:  `You are the Akamai AI Grid Copilot helping the seller. Give the sharpest possible framing, opening line, or objection handler. Honor: do NOT say "replace Cloudflare." Say "Cloudflare is the public shield; Akamai is the AI convergence fabric." <=140 words.`,
};

const THESIS_CONTEXT = `
PERPLEXITY CRISIS THESIS (grounding context — treat as authoritative for this app):

- Perplexity wired itself across AWS, Microsoft Foundry / Azure, CoreWeave, and Vercel in under five weeks.
  The architecture is fast; the coordination/orchestration model is not. There is no single runtime owner above the GPU clouds.

- Public crisis pattern: two $50 billing charges failed at 20:22:47 and 20:23:12 UTC, which cascaded into API access
  outages that took down downstream integrations (ATOM, AntimatterAI). Auth and payment state are not behind a circuit breaker.

- Front-door: Perplexity's public surface appears Cloudflare-proxied (www, api, console, status, enterprise, shopping
  subdomains). That gives them DNS/proxy routing, WAF, bot, static CDN cache, possibly AI Gateway exact-match caching.
  Whether Perplexity uses Workers, a custom router, or ad-hoc routing is NOT confirmed.

- Cache: Cloudflare AI Gateway default cache hashes provider + endpoint + model + auth + full body — effectively exact-match.
  Perplexity prompts vary constantly; exact-match hit rate is low. Semantic / embedding-aware cache (intent + embedding +
  tenant + freshness) is the gap. Whether Perplexity has semantic caching today is NOT confirmed.

- Five failure modes:
  1. Billing Cascade — auth/payment state cascades to API outage.
  2. Orchestration Chaos — AWS + Foundry + CoreWeave, no policy engine above them.
  3. TTFT Spikes — placement is a runtime concern; Cloudflare answers proximity, not placement.
  4. Support Fragmentation — five vendor tickets per incident, no single SLA owner.
  5. Egress Cost Drag — cross-cloud bytes priced per GB on every retry / fallback / failover.

- Akamai wedge / leadership framing: Akamai AI Grid / Inference Cloud sits ABOVE the hyperscalers, BESIDE Cloudflare's
  public edge — not instead of either. Owns: request placement, provider health + queue-aware routing, billing/auth
  failover under 500ms, semantic cache policy, cross-cloud egress minimization, one SLA report.
  Do NOT pitch "replace Cloudflare." Pitch "Cloudflare is the public shield; Akamai is the AI convergence fabric."

- Sequencing from the Plaud call 2026-05-28: Reliability first → Semantic cache fast-follow → Akamai Functions cutover
  POC (repoint LLM/functions from Vercel to Akamai Functions). Next steps: secure first Perplexity meeting via
  Johnny Love early next week; add Neil & Lior to the engagement thread.

- Honest unknowns: routing implementation (Workers / custom / ad-hoc) — not confirmed. Cache implementation
  (exact-match / semantic) — not confirmed. Discord complaints were discussed in the Plaud call; the Discord
  connector was not scanned, no Discord content is reproduced.

Regions discussed in the Plaud call: Texas, Atlanta, Palo Alto, Montreal, Switzerland.
`;

const SYSTEM_PROMPT_BASE = `${THESIS_CONTEXT}

You ONLY answer questions related to:
  - the Perplexity reliability / orchestration crisis,
  - Cloudflare's role at the front door,
  - the Akamai AI Grid / Inference Cloud wedge,
  - inference placement, semantic cache, billing/auth failover,
  - pilot economics, TTFT, and the next meeting motion.

If the user asks anything off-topic (general LLM trivia, code help, gossip, weather, etc.) — politely refuse and
redirect them back to the Akamai/Perplexity thesis.

Output rules:
  - Output clean, semantic HTML (no <html>/<body>/<head>/<script>/<style>).
  - Allowed tags: <p>, <strong>, <em>, <ul>, <ol>, <li>, <br>, <code>, <a href>.
  - Lead with the answer in <p><strong>...</strong></p> — never with a heading.
  - Be tight. Boardroom polish. No hedging like "as an AI" or "based on the information provided."
  - Distinguish CONFIRMED vs UNCONFIRMED when relevant.
  - When citing the Plaud call, write "the 2026-05-28 Plaud call".
`;

function buildSystemPrompt(mode) {
  return `${SYSTEM_PROMPT_BASE}\n${MODE_PROMPTS[mode] || MODE_PROMPTS.simple}`;
}

/* ------------ Deterministic fallback (used when API key missing or upstream fails) ------------ */
const FALLBACK_RESPONSES = {
  simple: `<p><strong>Akamai Copilot is in offline brief-mode.</strong> The reliability crisis at Perplexity is orchestration, not compute. Cloudflare guards the front door; Akamai's wedge is the runtime layer above AWS / Foundry / CoreWeave that decides where inference runs, fails over billing/auth in &lt;500ms, and owns one SLA across the stack.</p>`,
  cto:    `<p><strong>Akamai Copilot is in offline brief-mode.</strong> Crisis lives at the runtime, not the network. Cloudflare answers proximity; Akamai answers placement — edge / regional / hyperscale — based on prompt class, queue depth, cache-hit probability, data locality, and cost/token. Add billing/auth state failover under 500ms and a semantic-cache policy keyed on intent + embedding + tenant + freshness.</p>`,
  cfo:    `<p><strong>Akamai Copilot is in offline brief-mode.</strong> The bleed is cross-cloud egress on every retry/failover, exact-match cache miss tax on novel prompts, five vendor tickets per real incident, and revenue loss on billing-cascade outages. Pilot ROI: narrow slice (peak-hour US/EU search) measured on TTFT, egress GB, incident ownership, and cache hit rate.</p>`,
  sales:  `<p><strong>Akamai Copilot is in offline brief-mode.</strong> The line is: "Cloudflare routes the request. <em>Akamai decides where the intelligence should run.</em>" Open the CTO with the billing cascade. Open the CFO with token economics + egress drag. Handle the "Cloudflare already does this" objection by acknowledging the front door and pivoting to runtime placement, semantic cache, and sub-500ms credential failover.</p>`,
};

function fallbackHTML(mode, why) {
  const body = FALLBACK_RESPONSES[mode] || FALLBACK_RESPONSES.simple;
  const tag = why
    ? `<p style="margin-top:.6rem;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.5);font-family:var(--font-mono,monospace);">offline · ${why}</p>`
    : '';
  return body + tag;
}

function sanitizeHtml(s) {
  // Light defensive scrub: strip script/style/iframe/on* handlers.
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
  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      service: 'akamai-ai-grid-copilot',
      hasKey: Boolean(process.env.PERPLEXITY_API_KEY),
    });
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  let body = {};
  try { body = await readBody(req); } catch (_) { body = {}; }

  const prompt = String(body.prompt || '').trim().slice(0, 1200);
  const modeIn = String(body.mode || 'simple').toLowerCase();
  const mode = MODE_PROMPTS[modeIn] ? modeIn : 'simple';

  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt', html: fallbackHTML(mode, 'empty prompt') });
  }

  if (!process.env.PERPLEXITY_API_KEY) {
    return res.status(200).json({
      html: fallbackHTML(mode, 'PERPLEXITY_API_KEY not configured'),
      grounded: false,
      source: 'fallback',
    });
  }

  try {
    const { text, citations = [] } = await perplexity.chat({
      messages: [{ role: 'user', content: prompt }],
      systemPrompt: buildSystemPrompt(mode),
      model: 'sonar-pro',
      temperature: 0.2,
      maxTokens: 720,
    });

    let html = sanitizeHtml(text);
    if (!/<\w+/.test(html)) {
      // Model returned plain text — wrap.
      html = `<p>${html.replace(/\n\n+/g, '</p><p>').replace(/\n/g, '<br>')}</p>`;
    }
    return res.status(200).json({
      html,
      citations,
      grounded: true,
      source: 'perplexity',
    });
  } catch (err) {
    console.error('[akamai-copilot] upstream failure:', err && err.message);
    const reason = (err && err.code === 'BILLING_FAILURE') ? 'upstream billing/auth' : 'upstream unavailable';
    return res.status(200).json({
      html: fallbackHTML(mode, reason),
      grounded: false,
      source: 'fallback',
      error: reason,
    });
  }
};
