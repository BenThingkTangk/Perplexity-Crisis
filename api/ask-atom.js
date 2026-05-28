/**
 * Akamai AI Grid // /api/ask-atom — canonical endpoint for the ATOM agent.
 *
 * This is the canonical name used by the dashboard UI. It delegates to the
 * same handler as /api/atom-agent for backward compatibility. Reads
 * PERPLEXITY_API_KEY from process.env only — the underlying provider is
 * never echoed to the client. UI brand is ATOM / Akamai Copilot.
 */

module.exports = require('./atom-agent.js');
