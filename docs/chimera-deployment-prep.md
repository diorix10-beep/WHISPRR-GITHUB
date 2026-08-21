# CHIMERA deployment prep

This note separates what is ready for `chimera.it.com` from what must remain local-only.

## Current goal

Prepare CHIMERA for deployment without touching the hosted Supabase production project.

## Safe deployment scope

The deployable app is CHIMERA:

- app source: `apps/chimera`
- production build command: `npm run build:chimera`
- production output directory: `apps/chimera/dist`
- Vercel project name observed locally: `whisprr-github-chimera`

Do not deploy WHISPRR as part of the CHIMERA site update.

## Local-only files

These should stay on Dior's Mac and should not be committed as deployment artifacts:

- `.env`
- `.env.*`
- `apps/chimera/.env.local`
- `apps/whisprr/.env.local`
- `supabase/.temp/`
- `apps/chimera/android/`
- `apps/chimera/ios/`

The root `.env` file has been removed from Git tracking for future commits, but the local file should remain on Dior's Mac.

## Required Vercel environment variables

Production CHIMERA needs these values in the Vercel project environment settings:

- `VITE_SUPABASE_URL` — public Supabase project URL for the hosted WHISPRR backend used by CHIMERA.
- `VITE_SUPABASE_ANON_KEY` — public Supabase anon or publishable key.
- `SUPABASE_SERVICE_ROLE_KEY` — server-only key used by Vercel API routes. Never expose this in client code.
- `GEMINI_API_KEY_SERVER` or `GEMINI_API_KEY` — server-only Gemini key for Gemini-backed model calls.
- `OPENROUTER_API_KEY` — server-only OpenRouter key for OpenRouter-backed model calls.
- `CHIMERA_APP_URL` — recommended value: `https://chimera.it.com`.

Optional / payment-related keys are separate and should only be configured once the chosen payment provider is finalized. Existing Stripe routes still expect Stripe keys if those routes are used.

## Supabase production status

This preparation intentionally does not apply any production Supabase migration.

The local CHIMERA fixes currently depend on these local migration files:

- `supabase/migrations/20260821182341_allow_ai_character_profile_role.sql`
- `supabase/migrations/20260821182932_add_conversations_character_id.sql`
- `supabase/migrations/20260821183629_add_conversations_memory_summary.sql`

Before production deployment can be considered fully functional, these changes must either already exist in production or be reviewed and applied deliberately during a separate approved production database step.

## Deploy sequence when approved

1. Review the Git diff and make sure no secrets are staged.
2. Run `npm run typecheck:chimera`.
3. Run `npm run build:chimera`.
4. Confirm Vercel environment variables exist in the CHIMERA Vercel project.
5. Commit only the intended CHIMERA deployment changes.
6. Push the branch.
7. Deploy a Vercel preview first.
8. Test login, character publishing, scene start, and AI replies on the preview.
9. Only after database readiness is confirmed, promote or deploy to production.

## Production safety rule

Do not run any command that modifies hosted Supabase production unless Dior explicitly approves the production database step.
