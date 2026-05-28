/**
 * ΔTOM // Discord → GitHub Projects Issue Tracker
 *
 * Deploy to: Vercel serverless function (api/discord-webhook.js)
 * or Cloudflare Worker / Node.js server.
 *
 * Setup:
 *   DISCORD_BOT_TOKEN     — your Discord bot token
 *   DISCORD_CHANNEL_ID    — channel to monitor (or use webhook)
 *   GITHUB_TOKEN          — fine-grained PAT (issues:write, projects:write)
 *   GITHUB_OWNER          — BenThingkTangk
 *   GITHUB_REPO           — Perplexity-Crisis
 *   GITHUB_PROJECT_NUMBER — GitHub Project number (from URL)
 *
 * Trigger: Any Discord message with 🐛 🚨 ⚠️ 🔥 or starting with "!issue"
 * Creates: GitHub Issue + adds to Project board automatically
 */

const TRIGGER_EMOJIS = ['🐛','🚨','⚠️','🔥','❌','💥'];
const PRIORITY_MAP = {
  '🔥': 'P0 - Critical',
  '🚨': 'P1 - High',
  '⚠️': 'P2 - Medium',
  '🐛': 'P3 - Bug',
  '❌': 'P2 - Medium',
  '💥': 'P0 - Critical',
};
const LABEL_MAP = {
  'billing': ['billing', 'infrastructure'],
  'api': ['api', 'integration'],
  'latency': ['performance', 'infrastructure'],
  'deploy': ['deployment', 'ci-cd'],
  'akamai': ['akamai', 'edge'],
  'discord': ['discord', 'bot'],
  'crash': ['bug', 'critical'],
};

function detectPriority(text) {
  for (const [emoji, label] of Object.entries(PRIORITY_MAP)) {
    if (text.includes(emoji)) return label;
  }
  return 'P3 - Bug';
}

function detectLabels(text) {
  const lower = text.toLowerCase();
  const labels = new Set(['from-discord']);
  for (const [keyword, lbls] of Object.entries(LABEL_MAP)) {
    if (lower.includes(keyword)) lbls.forEach(l => labels.add(l));
  }
  return [...labels];
}

function parseIssue(discordMessage) {
  const { content, author, channel_id, id, timestamp } = discordMessage;
  const clean = content.replace(/^!issue\s*/i, '').trim();
  const lines = clean.split('\n').filter(Boolean);
  const title = lines[0].substring(0, 120);
  const body = [
    lines.slice(1).join('\n'),
    '',
    '---',
    `**Discord Source**`,
    `- Author: ${author.username}#${author.discriminator}`,
    `- Channel: ${channel_id}`,
    `- Message ID: ${id}`,
    `- Timestamp: ${timestamp}`,
    `- Priority: ${detectPriority(content)}`,
    '',
    `> Auto-created by ΔTOM Discord→GitHub bridge`,
  ].join('\n');
  return { title, body, labels: detectLabels(content), priority: detectPriority(content) };
}

async function createGitHubIssue({ title, body, labels }) {
  const res = await fetch(
    `https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/issues`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, body, labels }),
    }
  );
  if (!res.ok) throw new Error(`GitHub API error: ${res.status} ${await res.text()}`);
  return res.json();
}

async function addIssueToProject(issueNodeId) {
  // GitHub GraphQL — add item to Project V2
  const mutation = `
    mutation($projectId: ID!, $contentId: ID!) {
      addProjectV2ItemById(input: { projectId: $projectId, contentId: $contentId }) {
        item { id }
      }
    }
  `;
  // First get project node ID
  const projectRes = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: `query { organization(login: "${process.env.GITHUB_OWNER}") { projectV2(number: ${process.env.GITHUB_PROJECT_NUMBER}) { id } } }`,
    }),
  });
  const { data } = await projectRes.json();
  const projectId = data?.organization?.projectV2?.id || data?.user?.projectV2?.id;
  if (!projectId) { console.warn('Could not resolve project ID — issue created but not added to board'); return; }

  await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: mutation, variables: { projectId, contentId: issueNodeId } }),
  });
}

async function replyToDiscord(channelId, messageId, issueUrl) {
  await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bot ${process.env.DISCORD_BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content: `✅ Issue created: ${issueUrl}`,
      message_reference: { message_id: messageId },
    }),
  });
}

// Vercel serverless handler (also works as Express middleware)
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const msg = req.body;
  if (!msg?.content) return res.status(200).json({ ok: true });

  const shouldTrack =
    msg.content.startsWith('!issue') ||
    TRIGGER_EMOJIS.some(e => msg.content.includes(e));

  if (!shouldTrack) return res.status(200).json({ ok: true });

  try {
    const { title, body, labels } = parseIssue(msg);
    const issue = await createGitHubIssue({ title, body, labels });
    await addIssueToProject(issue.node_id);
    await replyToDiscord(msg.channel_id, msg.id, issue.html_url);
    res.status(200).json({ ok: true, issue: issue.html_url });
  } catch (err) {
    console.error('Discord→GitHub bridge error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Self-registering Discord webhook listener (for standalone Node.js)
if (require.main === module) {
  const { Client, GatewayIntentBits } = require('discord.js');
  const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    const shouldTrack = message.content.startsWith('!issue') || TRIGGER_EMOJIS.some(e => message.content.includes(e));
    if (!shouldTrack) return;
    try {
      const { title, body, labels } = parseIssue({ content: message.content, author: message.author, channel_id: message.channelId, id: message.id, timestamp: message.createdAt.toISOString() });
      const issue = await createGitHubIssue({ title, body, labels });
      await addIssueToProject(issue.node_id);
      await message.reply(`✅ Issue created: ${issue.html_url}`);
    } catch (err) { console.error(err); await message.reply('❌ Failed to create issue: ' + err.message); }
  });
  client.login(process.env.DISCORD_BOT_TOKEN);
  console.log('🤖 ΔTOM Discord→GitHub bridge running...');
}
