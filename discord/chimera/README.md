# CHIMERA Discord server

Tools to put a CHIMERA server in order **without breaking a server that already has members**. They are separate from the WHISPRR HQ
scripts in `discord/` (which are for WHISPRR and are not changed).

| File | What it does | Changes anything? |
| --- | --- | --- |
| `inspect_server.mjs` | Prints the server's roles, categories and channels (names only: no members, no messages), then what the setup would add. | No, read-only |
| `setup_chimera_server.mjs` | Adds the roles, categories and channels that are missing, and posts rules / welcome / FAQ / links into the channels it just created. | Only with `--apply` |
| `post_announcement.mjs` | Posts one announcement through a webhook. | Only with `--send` |
| `plan.mjs`, `texts.mjs` | The wanted structure and the texts. Edit these to change what gets created or posted. | No |
| `MODERATION_AND_LAUNCH.md` | Server settings to switch on, moderation steps, and how to roll this out to existing members. | No |

## Safety rules built into the scripts

- **Add only.** Nothing that already exists is renamed, moved, edited or deleted. A channel or role counts as existing if its name matches
  ignoring emoji, case and separators (`💬・general` = `general`), wherever it is in the server.
- **Dry run by default.** Without `--apply` the setup only prints its plan.
- **No administrator.** Created roles never get Administrator, Manage Roles, Manage Server or Manage Channels. Founder and Administrator
  stay manual. The 🛡️ Moderator role can kick, ban, time out, delete messages and manage nicknames, nothing more.
- **No adult channel.** There is no age-restricted channel, because Mature content is not open on the site yet.
- **Wrong server protection.** The scripts read `CHIMERA_DISCORD_GUILD_ID` only (never the old WHISPRR variable), and refuse the WHISPRR HQ
  server id. `--apply` also needs `CONFIRM_SERVER_NAME` to equal the real server name.
- **Texts only go into channels created by the run**, never into an existing channel.
- **No mass pings.** Announcements can never use `@everyone` or `@here`; one named role at most.

## Run it

1. **Bot.** In the [Discord developer portal](https://discord.com/developers/applications): New Application, then Bot. Copy the token
   (never paste it in a chat or a file; if it leaks, press Reset Token). **No privileged intent is needed.** Invite it with this link,
   replacing `CLIENT_ID` (these are the exact permissions needed; not Administrator):

   `https://discord.com/oauth2/authorize?client_id=CLIENT_ID&scope=bot&permissions=1202993523734`

   In *Server Settings > Roles*, drag the bot's role **above** the roles it will create (Discord only lets a role manage roles below it).
2. **Look first.**

   ```bash
   DISCORD_BOT_TOKEN=... CHIMERA_DISCORD_GUILD_ID=... node discord/chimera/inspect_server.mjs
   ```

   Read the output. If something you already have is not recognised as the same thing (for example your announcements channel is called
   `news`), tell me or add the name in `plan.mjs` before applying.
3. **Dry run.**

   ```bash
   DISCORD_BOT_TOKEN=... CHIMERA_DISCORD_GUILD_ID=... node discord/chimera/setup_chimera_server.mjs
   ```
4. **Apply**, at a quiet hour, after announcing it to your members (see `MODERATION_AND_LAUNCH.md`).

   ```bash
   DISCORD_BOT_TOKEN=... CHIMERA_DISCORD_GUILD_ID=... CONFIRM_SERVER_NAME="Exact Server Name" node discord/chimera/setup_chimera_server.mjs --apply
   ```
5. **Announce**, once, with a webhook (Channel settings > Integrations > Webhooks):

   ```bash
   CHIMERA_ANNOUNCE_WEBHOOK_URL=https://discord.com/api/webhooks/... node discord/chimera/post_announcement.mjs --title "..." --file note.md          # preview
   CHIMERA_ANNOUNCE_WEBHOOK_URL=https://discord.com/api/webhooks/... node discord/chimera/post_announcement.mjs --title "..." --file note.md --send   # post
   ```

## What is and is not tested

Tested (`apps/chimera/tests/discord-chimera.test.mjs`): the plan against empty and populated servers (add-only, no duplicates), the
configuration guards, the server snapshot with a fake server, the texts' limits and promises, and the announcement safety checks.

**Not tested: any call to the real Discord API.** No bot or server was available, so `setup_chimera_server.mjs --apply` has never run.
That is why it is a dry run by default and why you should read the plan first. Likely first-run issues: the bot role being below the
roles it must create, the *Community* feature being off (announcement and forum channels then fall back to ordinary text channels), and
a permission the bot lacks.

## Announcements from the site

Fully automatic posting of every change would also publish internal work, so it is not wired. The safe next step, when you want it, is a
manually triggered GitHub workflow that runs `post_announcement.mjs` with the webhook stored as a repository secret. The repository has no
`.github` folder yet, so that would be a new piece.
