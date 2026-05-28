/**
 * ΔTOM // Perplexity API Client
 * - Streaming support with ReadableStream
 * - Automatic retry with exponential backoff on 429/5xx
 * - Billing failure circuit-breaker (the exact bug we documented)
 * - Model routing: sonar-pro for search, sonar-reasoning for deep analysis
 */

const PERPLEXITY_BASE = 'https://api.perplexity.ai';
const DEFAULT_MODEL = 'sonar-pro';
const REASONING_MODEL = 'sonar-reasoning';

class PerplexityClient {
  constructor({ apiKey, maxRetries = 3, timeoutMs = 30000 } = {}) {
    this.apiKey = apiKey || process.env.PERPLEXITY_API_KEY;
    this.maxRetries = maxRetries;
    this.timeoutMs = timeoutMs;
    this._circuitOpen = false;
    this._failureCount = 0;
    this._circuitOpenedAt = null;
    this.CIRCUIT_THRESHOLD = 3;
    this.CIRCUIT_RESET_MS = 60000; // 1 minute
  }

  _checkCircuit() {
    if (!this._circuitOpen) return;
    const elapsed = Date.now() - this._circuitOpenedAt;
    if (elapsed > this.CIRCUIT_RESET_MS) {
      this._circuitOpen = false;
      this._failureCount = 0;
      console.log('[ΔTOM circuit] Resetting circuit breaker — retrying Perplexity API');
    } else {
      throw new Error(`[ΔTOM circuit] Circuit open — Perplexity API in cooldown (${Math.round((this.CIRCUIT_RESET_MS - elapsed) / 1000)}s remaining). Failover to backup.`);
    }
  }

  _recordFailure() {
    this._failureCount++;
    if (this._failureCount >= this.CIRCUIT_THRESHOLD) {
      this._circuitOpen = true;
      this._circuitOpenedAt = Date.now();
      console.error('[ΔTOM circuit] Circuit OPENED — Perplexity API failures:', this._failureCount);
    }
  }

  _recordSuccess() {
    this._failureCount = 0;
    this._circuitOpen = false;
  }

  async _fetchWithRetry(url, options, attempt = 0) {
    this._checkCircuit();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeout);
      if (res.status === 402 || res.status === 401) {
        // Billing/auth failure — this is the exact cascade we documented
        this._recordFailure();
        const err = new Error(`[ΔTOM] Perplexity billing/auth failure (${res.status}) — activate fallback API key`);
        err.code = 'BILLING_FAILURE';
        err.status = res.status;
        throw err;
      }
      if ((res.status === 429 || res.status >= 500) && attempt < this.maxRetries) {
        const backoff = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 500, 8000);
        console.warn(`[ΔTOM] Perplexity ${res.status} — retry ${attempt + 1}/${this.maxRetries} in ${Math.round(backoff)}ms`);
        await new Promise(r => setTimeout(r, backoff));
        return this._fetchWithRetry(url, options, attempt + 1);
      }
      if (!res.ok) {
        this._recordFailure();
        const text = await res.text();
        throw new Error(`[ΔTOM] Perplexity API error ${res.status}: ${text}`);
      }
      this._recordSuccess();
      return res;
    } catch (err) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') throw new Error('[ΔTOM] Perplexity API timeout — request exceeded ' + this.timeoutMs + 'ms');
      throw err;
    }
  }

  async chat({ messages, model = DEFAULT_MODEL, stream = false, temperature = 0.2, maxTokens = 2048, systemPrompt } = {}) {
    const body = {
      model,
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        ...messages,
      ],
      temperature,
      max_tokens: maxTokens,
      stream,
    };
    const res = await this._fetchWithRetry(`${PERPLEXITY_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': stream ? 'text/event-stream' : 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (stream) return res.body; // caller handles ReadableStream
    const data = await res.json();
    return {
      text: data.choices?.[0]?.message?.content || '',
      citations: data.citations || [],
      usage: data.usage || {},
      model: data.model,
    };
  }

  async search(query, { focus = 'internet', model = DEFAULT_MODEL } = {}) {
    return this.chat({
      messages: [{ role: 'user', content: query }],
      model,
      systemPrompt: `You are a precise research assistant. Focus: ${focus}. Be concise and cite sources.`,
    });
  }

  async deepAnalysis(query) {
    return this.chat({
      messages: [{ role: 'user', content: query }],
      model: REASONING_MODEL,
      temperature: 0.1,
      maxTokens: 4096,
      systemPrompt: 'You are an expert analyst. Provide deep, structured analysis with specific evidence.',
    });
  }
}

// Singleton with fallback key support
const primary = new PerplexityClient();
const backup  = process.env.PERPLEXITY_API_KEY_BACKUP
  ? new PerplexityClient({ apiKey: process.env.PERPLEXITY_API_KEY_BACKUP })
  : null;

module.exports = {
  PerplexityClient,
  perplexity: {
    chat: async (...args) => {
      try { return await primary.chat(...args); }
      catch (err) {
        if (err.code === 'BILLING_FAILURE' && backup) {
          console.log('[ΔTOM failover] Switching to backup Perplexity API key');
          return backup.chat(...args);
        }
        throw err;
      }
    },
    search: async (...args) => {
      try { return await primary.search(...args); }
      catch (err) { if (backup) return backup.search(...args); throw err; }
    },
    deepAnalysis: async (...args) => {
      try { return await primary.deepAnalysis(...args); }
      catch (err) { if (backup) return backup.deepAnalysis(...args); throw err; }
    },
  },
};
