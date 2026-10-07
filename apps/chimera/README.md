# CHIMERA (rebuilt)

CHIMERA is being rebuilt from scratch with two modes: **roleplay** and **storytelling**.
The previous app is still in git history (for example on `codex/chimera-phases1-6-release`).

## What exists now (step 1)

- Home, Discover (search and categories), character page, sign in / sign up.
- Ratings on every character. **Mature and NSFW are hidden unless the member is a verified adult who opted in**
  (`supabase/migrations/20261006120000_chimera_age_verification_gate.sql`, `useAdultContentAccess`).
- Guardian's Library: shows age status and the adult toggle. **Age verification is not connected to a provider yet**, so nobody is verified.
- Honest "coming next" pages for roleplay scenes, story library and the Writer's Desk. Terms and Privacy are drafts.

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

## Next

Roleplay scenes (chat with memory), then the storytelling editor, then age verification through a provider.

## Commands

```bash
npm run dev:chimera:local      # from the repository root
npm run typecheck:chimera
npm run build:chimera
npm run lint --workspace=chimera
```

Environment variables are listed in the root `.env.example`.
