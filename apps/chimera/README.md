# CHIMERA (rebuilt)

CHIMERA is being rebuilt from scratch with two modes: **roleplay** and **storytelling**.
The previous app is still in git history (for example on `codex/chimera-phases1-6-release`).

## What exists now (step 1)

- Home, Discover (search and categories), character page, sign in / sign up.
- Ratings on every character. **Mature and NSFW are hidden unless the member is a verified adult who opted in**
  (`supabase/migrations/20261006120000_chimera_age_verification_gate.sql`, `useAdultContentAccess`).
- Guardian's Library: shows age status and the adult toggle. **Age verification is not connected to a provider yet**, so nobody is verified.
- Honest "coming next" pages for the story library and the Writer's Desk. Terms and Privacy are drafts.

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

The storytelling editor, then age verification through a provider.

## Commands

```bash
npm run dev:chimera:local      # from the repository root
npm run typecheck:chimera
npm run build:chimera
npm run lint --workspace=chimera
```

Environment variables are listed in the root `.env.example`.
