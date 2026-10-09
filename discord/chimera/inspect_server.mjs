// READ-ONLY. Prints the roles, categories and channels of the CHIMERA server, so we can see what is already there
// before changing anything. It needs the bot to be in the server; it needs no special permission and no privileged intent.
//
//   DISCORD_BOT_TOKEN=... CHIMERA_DISCORD_GUILD_ID=... node discord/chimera/inspect_server.mjs
//
// It prints names and structure only: no members, no messages.
import { Client, GatewayIntentBits } from 'discord.js';
import { readConfig, snapshot } from './lib.mjs';
import { planChanges, summarize } from './plan.mjs';

const { token, guildId } = readConfig();
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.once('clientReady', async () => {
  try {
    const guild = await client.guilds.fetch(guildId);
    const shot = await snapshot(guild);
    console.log(`Server: ${guild.name} (${guild.memberCount} members)\n`);
    console.log(`ROLES (${shot.roles.length})`);
    for (const r of shot.roles) console.log(`  ${r.name}${r.managed ? '  [bot role]' : ''}`);
    console.log(`\nCHANNELS (${shot.channels.length}) in ${shot.categories.length} categories`);
    for (const c of shot.categories) {
      console.log(`  ${c.name}`);
      for (const ch of shot.channels.filter((x) => x.parentName === c.name)) console.log(`    ${ch.name}`);
    }
    for (const ch of shot.channels.filter((x) => !x.parentName)) console.log(`  (no category) ${ch.name}`);
    console.log('\nWhat setup_chimera_server.mjs would add:', JSON.stringify(summarize(planChanges(shot))));
  } finally {
    await client.destroy();
  }
});
client.login(token).catch((error) => { console.error('Could not log in:', error.message); process.exit(1); });
