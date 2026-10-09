// Shared by the CHIMERA Discord scripts: configuration and safety checks. No Discord calls here.
import { WHISPRR_HQ_GUILD_ID } from './plan.mjs';

export function readConfig(env = process.env) {
  const token = env.DISCORD_BOT_TOKEN;
  const guildId = env.CHIMERA_DISCORD_GUILD_ID;
  if (!token) throw new Error('Set DISCORD_BOT_TOKEN (the bot token). Do not paste it into a file or a chat.');
  if (!guildId || !/^\d{15,25}$/.test(guildId)) {
    throw new Error('Set CHIMERA_DISCORD_GUILD_ID to the numeric id of the CHIMERA server (right-click the server name > Copy Server ID).');
  }
  // The old WHISPRR scripts default to this server. These ones must never touch it.
  if (guildId === WHISPRR_HQ_GUILD_ID) throw new Error('That is the WHISPRR HQ server, not CHIMERA. Refusing to run.');
  return { token, guildId };
}

/** Read-only picture of a server: names and structure only, no members and no messages. */
export async function snapshot(guild) {
  await guild.roles.fetch();
  const channels = await guild.channels.fetch();
  const all = [...channels.values()].filter(Boolean);
  const categories = all.filter((c) => c.type === 4).map((c) => ({ id: c.id, name: c.name }));
  const byId = new Map(categories.map((c) => [c.id, c.name]));
  return {
    roles: [...guild.roles.cache.values()].filter((r) => r.id !== guild.id).map((r) => ({ name: r.name, managed: r.managed })),
    categories,
    channels: all.filter((c) => c.type !== 4).map((c) => ({ name: c.name, parentName: c.parentId ? byId.get(c.parentId) ?? null : null })),
  };
}
