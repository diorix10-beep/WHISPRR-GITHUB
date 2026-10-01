# CHIMERA Phase 1 release checklist

Status: review complete; local changes only. No commit, push, deployment, connected-database migration, credential rotation or Phase 2 work performed. Both migrations remain unapplied outside synthetic tests.

## 1. Safe repository actions

- Review local source/SQL and update regression tests/documentation without accessing secrets. Completed: final self-review, migration-repeatability fixes, two composer recovery fixes and expanded regression coverage.
- Run `npm test --prefix apps/chimera/tests`, application/scoped API typechecks, focused lint, whitespace validation and CHIMERA build. Results: 22 tests pass; typechecks/build pass; changed API/helper files lint clean; existing page lint backlog remains.
- Keep generated build files, local configuration and secret values out of tracked changes. Verify a future commit's file manifest and scan additions without exposing the removed credential in diff output.
- Prepare a commit/PR summary locally. Actual commit, push and PR publication remain on hold under the current instruction.

## 2. Owner's manual actions

- Revoke the exposed ElevenLabs credential in the provider dashboard; inspect usage/billing; create a replacement restricted to the required service permissions. Do not paste credentials into chat.
- Review provider budget ceilings/alerts and support handling of uncertain illustration reservations. Request caps are not a currency-denominated spending guarantee.
- Confirm approved staging/production projects, backup/recovery procedures, rollout window and responsible operator. No database dumps are requested or needed here.
- Decide separately whether history/previous build cleanup is required after revocation; any history rewrite requires explicit approval.

## 3. Database migrations requiring approval

Apply in this order only after explicit approval for the named environment:

1. `supabase/migrations/20260930150022_chimera_phase1_authorization.sql`
2. `supabase/migrations/20260930150040_chimera_phase1_request_protection.sql`

First validate in an isolated nonproduction instance against the actual schema, with synthetic test accounts. Review shared profiles/conversations/messages consumers. Exercise supported character-save RPC, create scene/group, persona selection, authored greeting, message edit/read acknowledgement, human-roleplay invite/join/send/edit/leave, lore associations and chapter saves. The preexisting broken direct character-duplicate flow remains a separately tracked limitation.

These migrations retain existing user rows. Repeat application against the expected schema preserves data; policies/triggers are replaced and tables/indexes guarded. This does not repair unrelated schema drift; use Supabase migration tracking rather than manual routine reapplication. Do not expose `chimera_private` through the Data API. No new bucket policy or economy change is required by this phase.

Approve production migration separately after staging checks. Coordinate SQL and API rollout: old arbitrary bot-message RPC calls are intentionally rejected, and new endpoints fail closed without the protection migration.

## 4. Required environment/secrets configuration

- **New:** server-only `ELEVENLABS_API_KEY`, supplied manually through the hosting platform's secret configuration. Never prefix it with `VITE_`, embed it in client configuration, or commit it.
- **Existing:** server-only `SUPABASE_SERVICE_ROLE_KEY`, Gemini (`GEMINI_API_KEY_SERVER`, existing `GEMINI_API_KEY` fallback) and OpenRouter (`OPENROUTER_API_KEY`) configuration must remain available to the corresponding CHIMERA handlers. Do not rotate or replace these as part of this patch.
- **Existing public configuration:** `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` must identify the approved environment. Anon/publishable keys are not service-role credentials.
- Verify environment scope: preview uses approved nonproduction resources. Supply no production keys to test harnesses. No production authentication setting, payment credential or webhook change is required.

## 5. Deployment steps — not authorized yet

- After approval, publish the reviewed branch/PR and deploy an isolated CHIMERA preview with approved nonproduction configuration and migrations.
- Verify actual authenticated API routing, voice playback/browser fallback, roleplay retries, two-tab duplicate requests, provider timeout behavior, illustration charge/refund/replay and chapter conflict/reload recovery. Inspect browser network/build artifacts for credential leakage. Validate shared consumers.
- Review results and request separate approval for production SQL/application rollout. Maintain a recovery plan that preserves new request/ledger data; do not blindly undo security guards or drop request tables.
- After approved coordinated rollout, refresh/invalidate old frontend/PWA assets, verify revoked-key status, run smoke checks and monitor 401/403/409/429/503 responses, provider budgets and retained illustration reservations.
- Stop at Phase 1. Phase 2 requires a separate review and instruction.
