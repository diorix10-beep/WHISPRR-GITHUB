# CHIMERA (rebuilt)

CHIMERA is being rebuilt from scratch with two modes: **roleplay** and **storytelling**.
The previous app is still in git history (for example on `codex/chimera-phases1-6-release`).

## What exists now (step 1)

- Home, Discover (search and categories), character page, sign in / sign up.
- Ratings on every character. **Mature and NSFW are hidden unless the member is a verified adult who opted in**
  (`supabase/migrations/20261006120000_chimera_age_verification_gate.sql`, `useAdultContentAccess`).
- Guardian's Library: shows age status and the adult toggle. **Age verification is not connected to a provider yet**, so nobody is verified.
- Terms and Privacy are drafts.

## Roleplay (step 2)

- **Begin a scene** on a character page creates a one-to-one scene (`create_chimera_scene`) and opens `/chats/:id`.
  The character's own greeting opens it. `/chats` lists your scenes.
- Write as **Say**, **Act** (wrapped in `*asterisks*`) or **OOC** (wrapped in `(OOC: ...)`). **Regenerate** replaces the latest reply
  and keeps the old one in `response_versions`. A failed reply shows **Try again** and never sends your line twice.
- **Memory**: each scene has an editable memory (`save_chimera_scene_canon`) that is sent to the character every turn, in front of
  the last 32 messages (28,000 characters). Older messages are not summarised yet, so anything that must last belongs in Memory.
- **Guided Story Path** (turning points, +10 SHARDS once) is carried over from the previous CHIMERA.
- Server: `api/ai-chat.ts` (Gemini 2.5 Flash) with the prompt in `api/_lib/roleplayPrompt.ts`. It checks membership, applies the
  adult-content gate before any model call, uses the request-protection reservation (rate limits, no double charge on retry),
  and returns sanitized errors. `api/roleplay-turning-point.ts` has the same gate.
- Not in this step: personas picker, group scenes, branches, character memories, images, voice, character creation.
  Persona text is used if the member already has a default persona from before.

## Creating characters (step 2b)

- **Create** in the roleplay menu opens `/create`; `/my-characters` lists your characters; `/create/:id` edits one (owner only).
- Saved through `save_ai_character_soul`. On edit, every field the form does not show is sent back unchanged, so characters made
  with the old creator lose nothing.
- New characters are **SFW only** until age verification exists. Visibility: **private** (default), **unlisted** (link only) or **public**.
- **Public publishing is founder-only during the beta** (`profiles.role = 'founder'`). It is enforced in the database by
  `supabase/migrations/20261009000000_chimera_character_publication_guard.sql`, so a member cannot bypass the form with a direct
  update. **Apply that migration before relying on it.** Until then only the form (not the database) blocks members from choosing Public.
- Known gap for review: `create_ai_character` / `save_ai_character_soul` do not check that a Mature or NSFW rating comes from a verified adult.
  The form never offers it, but a direct call could set it.

## Personas (who you are in a scene)

- **Personas** (`/personas`, `/personas/new`, `/personas/:id`): name, pronouns, age, gender, occupation, about, personality, appearance,
  backstory and a default persona. They are private: the `is_public` flag is never set from the app.
- **Begin a scene** shows a **Play as** picker (the default persona is preselected, or "Myself, no persona") and sets it on the new scene
  with `set_chimera_scene_persona`. In the scene, a **Playing as** switch is available only **before the first message**: the server and
  the database scope the history and memory by persona, so switching later would make the character forget who you were.
- The server sends the persona's details to the character (this already existed in `api/ai-chat.ts`).
- **Safety:** `api/ai-chat.ts` refuses a Mature or NSFW scene when the persona's age clearly says under 18 (digits, number words,
  "minor", "teen"). An empty or unclear age is not refused; the prompt's safety boundaries still apply. The persona form warns about it.
- Not in this version: public / shared personas, persona avatars, a persona-specific greeting.

## Storytelling (step 3, first version)

- **Writer's Desk** (`/workspace`): your stories. **New story** (`/stories/new`), **story manager** (`/stories/:id/edit`: details,
  add / delete chapters, delete story) and the **chapter editor** (`/stories/:id/chapters/:chapterId/edit`).
- **The editor never loses text.** Every keystroke is kept on the device (`draftJournal`); the server save runs 1.5 s after the last
  keystroke and also when leaving the page. It writes only if the chapter has not changed elsewhere (`updated_at` check): on a conflict
  it stops, tells the writer and overwrites nothing. A save failure keeps the text and retries on the next change. Text left on the
  device by a crashed tab is offered back (Restore / Discard). Publish and unpublish save first.
- **Reading needs a sign-in for now**: the database only lets signed-in members read `stories` and `story_chapters`, so the reader pages are behind the sign-in.
  Opening them to visitors needs narrow `anon` SELECT policies (a security decision for the owner and Codex).
- **Reading:** `/library` (public stories that have a published chapter, search and genre), `/stories/:id` (published chapters; the
  author also sees drafts) and `/stories/:id/chapters/:chapterId`. Chapter text is rendered as plain text.
- **Public publishing is founder-only during the beta**, enforced by
  `supabase/migrations/20261009010000_chimera_story_publication_guard.sql`. Stories have **no content rating** yet, so a public story
  cannot be filtered for minors. The `stories.visibility` column **defaults to public**: the new pages always send an explicit value,
  and the trigger also blocks inserts that forget it. **Apply that migration before relying on it.**
- Not in this version: the AI co-author (will use VELLUM and only suggest), scene illustrations, comments and votes, worlds,
  choose-your-own-adventure branches, collaborators, a story word count.

## Scene tools (chat)

The **Scene** button in a chat opens the tools. Everything here is private to the player.

- **Name this scene:** a custom title (`conversations.name`, up to 80 characters) shown in the chat and in Your scenes, with the
  character's name beneath. Empty means the character's name.
- **Reply length:** Short, Medium (default) or Long. It is an instruction in the prompt; Long also raises the output budget.
- **Words to avoid:** up to 500 characters, sent to the model as a "do not use" line. It adds to the creator's own banned words.
- **Pinned messages:** up to 8, using the pin under each message. Pins outside the recent window are sent in front of the model
  (600 characters each, 3000 in total), with the same persona scope as the history. Pins inside the window are not repeated.
- **Start over:** creates a new scene with the same character (same title and persona, optionally the same memory notes, same length
  and words). The old scene is kept as it was. Pins are not carried over.
- **Delete scene:** after a confirmation, removes the scene, its messages and its memory for good.

Settings live in `chimera_scene_settings` (migration `20261009020000_chimera_scene_settings.sql`): one row per scene and player, only
readable and writable by that player while they are a member. `api/ai-chat.ts` reads it with the player's own session and, if it cannot
be read (for example before the migration is applied), answers with the defaults. Apply the migration before or after the deploy; both work.

## SHARDS and VELLUM: unchanged from the previous CHIMERA

These files were copied as they were (only two unused imports/variables removed from `DailyBonusModal` for lint):

- Screens: `src/pages/ShardsPage.tsx`, `src/pages/VellumPage.tsx`
- Dialogs: `src/components/common/{ShardsHubModal,GiftShardsModal,DailyBonusModal,ShardCrystalImage}.tsx`,
  `src/components/creator/CreatorTipModal.tsx`, `src/components/writers/SceneIllustrationModal.tsx`
- API: `api/create-shards-checkout.ts`, `api/stripe-webhook.ts`, `api/generate-scene-illustration.ts`,
  `api/illustration-status.ts`, `api/_lib/{requestProtection,illustrationResult}.ts`, `src/lib/rpcRecord.ts`
- Wallet balances and `chimera-shards-changed` / `chimera-vellum-changed` events: in `src/contexts/AuthContext.tsx`
- Header reserve chip (SHARDS in Roleplay, VELLUM in Storytelling): `src/components/layout/AppLayout.tsx`
- Database: the existing wallet, ledger and purchase migrations in `supabase/migrations/` (not changed)
- Notes: `docs/18-SHARD-TOKEN-SYSTEM.md`

Checkout still uses Stripe, exactly as before. Stripe does not accept businesses in Senegal, so a SHARDS purchase
needs a Stripe account from a supported country, or a different payment provider, before it can go live.

## Deploying to Vercel

The Vercel project `chimera` uses root directory `apps/chimera` (build `npm run build`, output `dist`; see `vercel.json`).
Before the first production deploy:

1. **Apply the database migration** `supabase/migrations/20261006120000_chimera_age_verification_gate.sql` to the production
   Supabase project. It resets every self-declared adult setting to off.
2. **Set the environment variables** in Vercel (Production): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, `CHIMERA_APP_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `GEMINI_API_KEY_SERVER`.
   The two `VITE_` values are baked in at build time, so redeploy after changing them.
3. **Check the production branch** (Vercel > Project > Settings > Git) and merge into it.
4. **Rollback:** Vercel > Deployments > a previous deployment > "Instant Rollback" restores the old site at once.

`public/sw.js` retires the service worker of the previous CHIMERA (it was a PWA), so returning visitors do not keep
seeing the old site from their cache. Keep it for a few weeks after the switch.

## Next

Automatic long-term memory for roleplay, then age verification through a provider.

## Commands

```bash
npm run dev:chimera:local      # from the repository root
npm run typecheck:chimera
npm run build:chimera
npm run lint --workspace=chimera
```

Environment variables are listed in the root `.env.example`.
