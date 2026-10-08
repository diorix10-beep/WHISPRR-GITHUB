# Roleplay review fixes — 2026-10-08

Claude's roleplay commit `5144bd21064a011f4fe71a938a6f159457dc24b0` builds directly on main's #12 merge `05e75a5998e41d90411ac148420307b18a0ddd90`. These fixes live on `codex/roleplay-revocation-retry-fixes`; Claude's branch is unchanged. Because main does not yet contain roleplay, the draft PR toward main contains the reviewed roleplay commit followed by the fix commit. Do not merge it without coordinating Claude's feature work.

## Fixed behavior

1. Turning points now authorize the stored user and scene at reservation/replay, private request lookup, and insertion. The insert trigger covers both service completion and the existing definer creation RPC. Caller preferences are share-locked for the transaction so consent/verification revocation serializes with completion. A restrictive SELECT policy composes with the existing owner-only policy to hide saved points when the character scene is inaccessible. The old reward/ledger functions and amounts are untouched.
2. ConversationPage retains an unconfirmed message ID per user/scene. A retry of the same formatted content reuses that ID, allowing the existing persistence helper to find an insert whose acknowledgement was lost. Confirmation clears only that pending ID; a stale confirmation cannot clear the next send. Changed content is rejected while the old send is unresolved, rather than silently creating another identity. This queue lives for the mounted conversation component, not across a page reload; durable reload recovery is not claimed.

## Migration

`supabase/migrations/20261008162011_chimera_turning_point_access.sql` is **unapplied**. It depends on the existing turning-point schema and #11/#12 authorization helpers. It adds private authorization/insert helpers, one trigger and one restrictive read policy, and replaces reservation/request-lookup functions with the same implementations plus turning-point checks. Other operations retain their existing behavior and service-only grants. There is no data deletion, balance backfill, price change, claim/reward modification, or migration-history repair.

Production records checked during review (metadata only) mapped #11/#12 filenames to execution-time versions: character authorization `20261008111210`, service recheck `20261008111219`, room preference locks `20261008114024`; the prerequisite age gate is `20261008110920`. Do not blindly reapply those source files due to filename differences. This fix does not apply anything to production or staging.

## Validation

Nine regression tests pass: six existing tests and three new cases covering consent/verification revocation during turning-point completion, cache and table reads, legitimate eligible/SFW behavior, migration reapplication with data preservation, and an uncertain committed send followed by same-ID retry. Synthetic PostgreSQL uses the actual relevant schema/function migrations. App/API typechecks, lint, synthetic-config build and diff whitespace checks pass. No hosted schema changes, provider calls, signed-in browser E2E, deployment or domain change was performed. The review reproductions run locally with synthetic data; they are not evidence of deployed fixes.

Checked-in Vercel configurations disable automatic Git deployment for this fix branch only. Main/Claude settings are retained. Other app Vercel files change only to add that same branch guard, avoiding cross-project auto-deploys when the shared repository branch is pushed.

## Fix-file handoff to Claude

- `apps/chimera/src/pages/ConversationPage.tsx` (the only designated coordination-sensitive source file edited, with prior user authorization)
- `apps/chimera/src/lib/pendingPlayerSend.ts`
- `apps/chimera/tests/character-access.test.mjs` (existing fixture extracted without changing assertions)
- `apps/chimera/tests/fixtures/characterAccessDatabase.mjs`
- `apps/chimera/tests/pending-player-send.test.mjs`
- `apps/chimera/tests/turning-point-access.test.mjs`
- `supabase/migrations/20261008162011_chimera_turning_point_access.sql`
- `docs/reviews/CHIMERA-roleplay-revocation-retry-fixes.md`
- `vercel.json`, `apps/chimera/vercel.json`, `apps/whisprr/vercel.json`, `oracle-verity/vercel.json` (branch deploy guard only)

No SHARDS/VELLUM code is changed by the fix commit. No changes were made to `ai-chat.ts`, `roleplay-turning-point.ts`, `roleplayPrompt.ts`, `ChatsPage.tsx`, or `chat.ts` relative to Claude's roleplay commit. No merge is authorized or performed in this task.
