// Posts ONE announcement to a Discord channel through a webhook. Nothing is sent unless you pass --send.
//
//   CHIMERA_ANNOUNCE_WEBHOOK_URL=https://discord.com/api/webhooks/... \
//     node discord/chimera/post_announcement.mjs --title "Model House update" --file announcement.md [--ping-role 123456789012345678] [--send]
//
// Create the webhook in Discord: channel settings > Integrations > Webhooks. Keep its URL secret: anyone who has it can post.
// Mentions are OFF unless you give --ping-role (a single role id). @everyone and @here can never be sent by this script.
import { readFileSync } from 'node:fs';
import { buildAnnouncement, readArgs } from './announcement.mjs';

const args = readArgs(process.argv.slice(2));
const url = process.env.CHIMERA_ANNOUNCE_WEBHOOK_URL;
const text = args.file ? readFileSync(args.file, 'utf8') : args.text ?? '';
const payload = buildAnnouncement({ title: args.title, text, pingRole: args['ping-role'], webhookUrl: url });

console.log('--- preview ---');
console.log(payload.content ? `${payload.content}\n` : '', `# ${payload.embeds[0].title}\n${payload.embeds[0].description}`);
if (!args.send) {
  console.log('\nDRY RUN: nothing was sent. Add --send to post it.');
} else {
  const response = await fetch(`${url}?wait=true`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  if (!response.ok) { console.error(`Discord answered ${response.status}. Nothing was posted.`); process.exit(1); }
  console.log('Posted.');
}
