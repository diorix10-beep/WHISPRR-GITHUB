// Builds the webhook payload for an announcement and refuses anything unsafe. Pure, so it is tested.

export function readArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (!argv[i].startsWith('--')) continue;
    const key = argv[i].slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) out[key] = true;
    else { out[key] = next; i += 1; }
  }
  return out;
}

export function buildAnnouncement({ title, text, pingRole, webhookUrl }) {
  if (!/^https:\/\/(discord|discordapp)\.com\/api\/webhooks\/\d+\/[\w-]+$/.test(webhookUrl ?? '')) {
    throw new Error('Set CHIMERA_ANNOUNCE_WEBHOOK_URL to a Discord webhook URL (https://discord.com/api/webhooks/<id>/<token>).');
  }
  const cleanTitle = String(title ?? '').trim();
  const body = String(text ?? '').trim();
  if (!cleanTitle || cleanTitle.length > 256) throw new Error('Give a --title of 1 to 256 characters.');
  if (!body || body.length > 4000) throw new Error('The announcement must be 1 to 4000 characters.');
  if (pingRole !== undefined && !/^\d{15,25}$/.test(String(pingRole))) throw new Error('--ping-role must be a numeric role id.');
  return {
    content: pingRole ? `<@&${pingRole}>` : undefined,
    embeds: [{ title: cleanTitle, description: body, color: 0x8b5cf6 }],
    // Only the one role (if any) can be pinged: never everyone, here or users.
    allowed_mentions: pingRole ? { roles: [String(pingRole)] } : { parse: [] },
  };
}
