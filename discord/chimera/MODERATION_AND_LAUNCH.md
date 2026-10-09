# Moderation and launch plan (CHIMERA Discord)

This is practical guidance, not legal advice. Where the law or Discord's rules matter, check the current text.

## 1. Before touching the live server

- [ ] Screenshot *Server Settings > Roles* and the channel list, so you can compare afterwards.
- [ ] Run `inspect_server.mjs` and keep the output.
- [ ] Post a short heads-up in your existing announcements channel: "Tomorrow evening we are adding a few channels and roles. Nothing is removed."
- [ ] Apply at a quiet hour. New categories land at the **bottom**; drag them where you want afterwards.

## 2. Settings to switch on by hand (Discord does these, no code)

| Setting | Where | Why |
| --- | --- | --- |
| Verification level: Medium or High | Server Settings > Safety Setup | Slows throwaway accounts and raids. |
| Explicit media filter: scan all members | Safety Setup | This server allows no explicit content at all. |
| AutoMod: spam, mention spam, and a keyword list | Server Settings > AutoMod | Catches most scams and slurs before a human has to. |
| Require 2FA for moderator actions | Safety Setup | A hijacked moderator account is the worst case. |
| Rules screening, with "This server is for adults: I am 18 or older" as one of the rules members must accept | Community > Onboarding / Rules screening | Self-declaration only. It cannot verify age, but it makes the rule clear and gives you a basis to remove people. |
| Onboarding questions that give 📢 Announcement Pings and 📋 Changelog Pings | Community > Onboarding | Members opt in to pings, so announcements do not annoy everyone. Needs the *Community* feature. |
| Community feature | Server Settings > Enable Community | Needed for announcement channels, forums and onboarding. Without it the setup creates ordinary text channels instead. |

Discord itself lets people from 13 use the platform. This server is 18+ by its own rule, so enforcement is by your moderators, not by Discord.

## 3. The line that cannot move

- **Anything sexual involving a minor, or a character who is or looks like one, is an instant ban**, including "age regression" and "she is
  really ancient". Discord's rules are stricter than what a private chat on the site may allow, and a public server answers to Discord.
- **Do not copy, forward or keep the material** beyond what a report requires. Use Discord's report tool (Trust & Safety) and, where your law
  requires it, your local authority. Write the *reason* in the moderation log, not the content.
- **Someone says they are under 18:** remove them calmly, no lecture, no argument, and log it.
- No sexual or explicit content at all, anywhere on the server, until the site opens Mature content to verified adults. Revisit this rule
  then, with age-restricted channels, not before.

## 4. Everyday moderation ladder

1. **Note** (private reminder) for first small slips.
2. **Warning** with the rule number, in a DM or in a thread, never in public.
3. **Timeout** 10 minutes, 1 hour, 1 day, depending on what happened.
4. **Kick**, then **ban** for repeats, harassment, spam bots, scams, anything in section 3.

Every action goes in `📒 moderation-log` with: who, what rule, what you did, date. If two moderators disagree, the founder decides.
Never moderate your own dispute; ask another moderator.

## 5. Moderators

- Give the 🛡️ Moderator role to a few people you trust, after a trial period. They have no admin rights by design.
- They must have 2FA on. They keep member information private.
- Review the log together every week, in the first month.

## 6. Hard conversations

CHIMERA characters are AI and people may say difficult things in the server. Moderators are not counsellors. Use one calm message:
thank them, say you are not able to give the support they deserve, encourage them to contact someone they trust or a local support
service, and tell the founder. Do not ignore it and do not promise confidentiality.

## 7. Rolling out to existing members

- Week 0: inspect, dry run, announce, apply.
- Week 1: post the welcome message in your existing channels pointing to `rules`; watch `general` and `help` daily; fix names or order
  that feel wrong (this is allowed: only the scripts are add-only).
- Week 2: ask members what is missing. Add channels slowly: a quiet server with few good channels beats a large empty one.
- After that: one announcement a week at most; changelog entries when something real changed.

## 8. Facts to keep true in what you post

The texts in `texts.mjs` only claim what the site does today: 18+, SUPERNOVA free, other models in testing and paid in SHARDS, Mature
content not open yet, no dates. When that changes (age verification goes live, paid models open, SHARDS purchases open), update the
FAQ **first**, then announce.
