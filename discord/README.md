# WHISPRR HQ — Discord Server Setup

## Overview
Complete automated setup script for the official **WHISPRR HQ** Discord server.

This script uses the Discord API (via `discord.js`) to create the entire server from scratch — roles, categories, channels, permissions, welcome embeds, and country roles — in a single execution.

## What Gets Created

### 🎭 Roles (15 hierarchy + 30 country)

| # | Role | Color | Type |
|---|------|-------|------|
| 1 | 👑 Founder | `#FFD700` Gold | Full Admin |
| 2 | 🛡️ Administrator | `#FF4D6D` | Full Admin |
| 3 | ⚙️ Developer | `#3B82F6` | Staff |
| 4 | 🎨 Designer | `#A855F7` | Staff |
| 5 | 🤖 AI Team | `#8B5CF6` | Staff |
| 6 | 🛠️ Moderator | `#22C55E` | Staff (Kick/Ban/Mute) |
| 7 | 💬 Community Manager | `#06B6D4` | Staff (Manage Messages) |
| 8 | 🎉 Event Manager | `#FB7185` | Staff (Manage Events) |
| 9 | 🤝 Partner | `#F97316` | Community |
| 10 | 🎨 Creator | `#EC4899` | Community |
| 11 | 💎 Premium | `#14B8A6` | Community |
| 12 | 🧪 Beta Tester | `#F59E0B` | Community |
| 13 | 🌟 Early Supporter | `#FACC15` | Community |
| 14 | ✅ Verified | `#60A5FA` | Member |
| 15 | 👤 Member | `#9CA3AF` | Member |

**+ 30 Country Roles** (🇸🇳 Senegal, 🇨🇦 Canada, 🇺🇸 USA, 🇫🇷 France, 🇯🇵 Japan, etc.)

---

### 📁 Categories & Channels (11 categories, 50+ channels)

| Category | Visibility | Channels |
|----------|-----------|----------|
| 📢 INFORMATION | 🟢 Public | welcome, rules, get-roles, faq, links |
| 📣 WHISPRR NEWS | 🟢 Public | announcements, changelog, roadmap, founder-journal, polls |
| 💬 COMMUNITY | 🟢 Public | general, introductions, ideas, media-share, off-topic, voice-lounge |
| 🌍 COUNTRY SPACES | 🟢 Public | global-chat + 9 country channels |
| 🎨 CREATORS | 🟢 Public | creator-lounge, showcase, creator-tips, creator-voice |
| 🛠 SUPPORT | 🟢 Public | bug-reports (forum), feature-requests (forum), help, guides |
| 🤖 AI & FUTURE | 🟢 Public | ai-discussion, ai-feedback, future-vision |
| 🧪 BETA PROGRAM | 🟢 Public | beta-announcements, beta-feedback, beta-bugs |
| 🎉 EVENTS | 🟢 Public | event-announcements, ama-stage, game-nights |
| 🔐 STAFF | 🟡 Staff only | staff-general, staff-tasks, moderation-log, staff-analytics, staff-voice |
| 👑 FOUNDER | 🔴 Founder only | founder-private, founder-drafts, founder-dashboard, founder-voice |

---

### 🔐 Permission Zones

- **🟢 Public** — All members can view and interact
- **🟡 Staff** — Only Founder, Admin, Dev, Designer, AI Team, Mod, CM, Event Manager
- **🔴 Founder** — Only the Founder role
- **Read-only** channels: welcome, rules, get-roles, faq, links, announcements, changelog, roadmap, founder-journal, guides, beta-announcements, event-announcements

---

## How to Run

### Prerequisites
1. Go to [discord.com/developers](https://discord.com/developers/applications)
2. Create a new Application → name it "WHISPRR HQ Bot"
3. Go to **Bot** tab → click **Reset Token** → copy the token
4. Enable **all Privileged Gateway Intents** (Presence, Server Members, Message Content)
5. Go to **OAuth2** → **URL Generator**:
   - Scopes: `bot`, `applications.commands`
   - Bot Permissions: `Administrator`
6. Copy the generated URL and open it to invite the bot to your empty Discord server
7. Copy the **Server ID** (right-click server name → Copy Server ID)

### Execute
```bash
cd discord/
DISCORD_BOT_TOKEN="your_token_here" DISCORD_GUILD_ID="your_server_id_here" node setup_whisprr_hq.mjs
```

Or edit the two constants at the top of the script directly.

---

## Future Automation (Bot Features)

The server is pre-structured for a future WHISPRR Discord bot that can:

| Feature | Channel |
|---------|---------|
| Welcome new members | #welcome |
| Auto-assign country roles | #get-roles |
| Publish changelog updates | #changelog |
| Publish roadmap updates | #roadmap |
| Post founder journal entries | #founder-journal |
| Handle bug reports | #bug-reports (forum) |
| Handle feature requests | #feature-requests (forum) |
| Support tickets | #help |
| Community polls | #polls |
| Event management | #event-announcements |
| Moderation logging | #moderation-log |

---

> **WHISPRR HQ** — The central community hub for the entire WHISPRR ecosystem.
