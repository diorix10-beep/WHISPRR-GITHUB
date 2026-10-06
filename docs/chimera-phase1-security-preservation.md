# CHIMERA Phase 1 — Security and preservation

Status: local reviewable patch on `codex/chimera-phase1-security-preservation`, based on `1da4ab98ce149911116c2a1b50f8025119b3d8fe`. No commit, push, deployment, connected database access, production data modification, credential validation, rotation, or history rewrite. No Phase 2 work. Existing audit: [CHIMERA codebase audit](chimera-codebase-audit.md).

## Issues fixed

1. **Exposed browser voice credential:** removed the embedded provider key and direct browser-to-ElevenLabs calls. Browser now uses authenticated `/api/voice`; server loads `ELEVENLABS_API_KEY`. Only the existing voice roster is allowed. Provider model/settings and browser speech fallback remain unchanged. No live validity test was performed; treat the value as compromised and revoke it. Removal from current code does not erase Git history or previously distributed bundles.
2. **Privilege and identity mutation:** direct browser writes cannot promote a profile, change its ecosystem access, rebind an AI character's profile/creator, spoof a conversation creator, move participant identities, or alter message authorship/session/sequence. Trusted existing character-save RPCs retain authority. Recipients retain read acknowledgement; conversation creators retain edit/swipe controls for AI messages, while other human authors' words are protected.
3. **Unauthorized membership and lore links:** conversation participant reads require ownership/membership, inserts require conversation ownership; persona assignment must belong to its participant. Lore association writes require ownership of both lorebook and character/world. Runtime AI lore queries ignore existing cross-owner links; no rows were rewritten or deleted.
4. **AI/human sender spoofing:** browser `respond_as_ai_character` is restricted to an exact stored creator-authored opening in an unstarted scene, with idempotent acknowledgement. Arbitrary generated replies use a new service-only atomic writer after membership, actual AI-profile role and visibility checks. Human roleplay table inserts cannot bypass the existing authorized ordered message RPC. Direct participant edits cannot elevate role or restore departed membership.
5. **Provider request protection:** chat, turning points, illustrations and voice use durable database reservations, lease checks, request fingerprints, duplicate replay/rejection and admission budgets. Opening deduplication uses scene history rather than a new transport UUID. Chat completion persists reply and reservation atomically; turning-point completion wraps the existing reward operation atomically. Requests fail closed when protection is unavailable. Incoming body size is bounded at 24,000 bytes, voice text at 8,000 characters, chat/full turning-point context at 100,000 characters; models must be in the existing Model House catalog. Existing prompts/models are retained, oversized requests explicitly rejected rather than silently rewritten. Turning-point output is bounded to 2,048 tokens. Provider timeout is 45 seconds, illustration 90 seconds; request leases are two minutes.
6. **Illustration retries and ambiguous charges:** modal retains an operation ID for retries of unchanged payloads. Existing 400-VELLUM reservation and existing refund functions are preserved. Reservation/charge and completion/job acknowledgement are atomic wrappers. Lost begin/completion responses are reconciled before cleanup. Database cleanup cannot discard a charged request unless the illustration status is confirmed refunded; unknown states remain blocked rather than automatically generating/charging again. No SHARDS/VELLUM rates, ledger/reward amounts or eligibility were changed.
7. **Failed roleplay sends:** composer is journaled per account/conversation before network work. Text and attachment remain until message persistence is confirmed. A stable client message UUID and verified row lookup recover from lost INSERT acknowledgements without duplicate posting. AI failure leaves the human message stored and exposes an AI-only retry. Safety refusals retain text. Uploaded attachment URL and OOC mode survive recovery. Files not yet uploaded must be reselected after reload.
8. **Chapter draft loss:** account/story/chapter-scoped journals retain title, text, choices and status; reload requires explicit recovery choice, save failures retain drafts, published edits are locally journaled without automatic republishing. Serialized saves and server `updated_at` comparison reject stale overwrites. Late acknowledgements cannot discard newer local changes. Existing draft-only autosave remains. Unsaved navigation warns on browser unload; normal route recovery uses the journal.

## Admission budgets

Two active requests per user; one active request per user/resource. Aggregate per user: 60 admissions/minute and 240/hour. Voice: 12/minute and 30/hour. Illustration: 4/minute and 12/hour. Chat and turning points: 60/minute and 240/hour, subject to aggregate limits. Global maximum: 3,000 admitted provider attempts/hour. Completed duplicate replay does not spend another admission. Failed provider attempts do count. These are request caps, not a guaranteed currency-denominated provider budget; provider account spending limits remain necessary. Intentional regenerations are distinct operations, subject to these limits.

## SQL migrations — prepared, NOT applied

Exact SQL is in:

- [20260930150022_chimera_phase1_authorization.sql](../supabase/migrations/20260930150022_chimera_phase1_authorization.sql)
- [20260930150040_chimera_phase1_request_protection.sql](../supabase/migrations/20260930150040_chimera_phase1_request_protection.sql)

Generated with Supabase CLI 2.81.3 `migration new`. Apply order is authorization, then request protection. The first creates restricted helper/trigger functions and replaces the affected policies; the second creates private RLS-protected request/attempt tables, budgets and service-only reservation/completion functions. No data backfills, deletes or economy schema changes. No new bucket or Dashboard RLS setting is needed. The private schema must remain unexposed through the Data API; public wrappers grant execution only to the documented caller roles.

**Shared-schema impact:** CHIMERA uses shared `profiles`, `conversations`, `conversation_participants`, `messages` and `ai_characters`. Guarding those security boundaries necessarily affects writes to the same rows by any consumer. WHISPRR application code was not changed. Cross-product compatibility must be reviewed in an isolated staging/local instance before either migration is approved. Existing authenticated callers of arbitrary `respond_as_ai_character` replies must move to the guarded service path. Character duplication's direct profile/character insert flow was already broken; it is explicitly blocked by the new guards and remains a separately documented follow-up.

## Checks

- 22 focused tests: 11 Node/PGlite/preservation tests and 11 Vitest API/editor tests. SQL tests reproduce original role escalation and sender spoofing before the patch, apply both migrations against synthetic fixtures, test legitimate paths, authorization denials, admission/replay/concurrency/rate limits, atomic replies and charged-job cleanup refusal until refund. Tests are completely isolated; no external providers or database.
- Actual chapter editor tests: explicit reload recovery, failed save retention, edits during an in-flight save and published local drafts without automatic republishing.
- API tests: authentication/AI membership/role, cached duplicate response, concurrency/rate denial, existing model/prompt preservation, sanitized provider failure, voice path allowlist, stable opening IDs and ambiguous illustration reservation reconciliation.
- Roleplay persistence helper tests: failure retains journal; committed INSERT with lost response is recovered exactly once; mismatched retry is refused.
- App TypeScript check and scoped changed-API TypeScript check pass.
- CHIMERA Vite/PWA production build passes; existing >500-kB chunk warning remains. Environment's tracked dependencies had esbuild binary mismatch/missing native dependencies; matching binaries/dependencies were supplied outside the tracked tree. Generated public version file restored.
- Focused ESLint: API/helper/voice/modal/config files clean. Two touched page files retain 41 preexisting errors and three warnings (baseline 42 errors and three warnings). Broad 395-error lint cleanup was not attempted.
- Fresh read-only security investigation and independent review performed; reported opening, creator-insert, illustration-acknowledgement and charged-cleanup issues addressed.

Reproduce focused tests with [tests/README.md](../apps/chimera/tests/README.md). Test harness has a separate locked package manifest to avoid application dependency churn.

## Remaining risks and limitations

- Not production-ready until credential rotation, isolated integration validation and separately approved coordinated migration/API deployment. API handlers fail closed if service-side configuration or migrations are missing.
- Synthetic PostgreSQL fixtures do not replay the complete migration history or prove deployed policies match this repository. Real multi-connection transaction timing was not exercised; cleanup's conditional update enforces the charged-result invariant under PostgreSQL row locking. Live Supabase/PostgREST, storage, provider and payment integration were not tested.
- A charged illustration interrupted by process termination or unknown database status is deliberately retained for manual reconciliation/refund. There is no automated durable background worker in this phase. Duplicate replay contains a one-hour signed preview URL; if expired, use the existing gallery refresh path.
- Rate limits constrain costs but do not stop distributed-account abuse or cap currency spend precisely. Configure provider-side budgets/alerts; monitor capacity before raising limits. Attempt/request retention maintenance remains to be designed; no destructive cleanup is included.
- Local drafts are plaintext browser storage scoped by account, not encrypted or synchronized. They survive sign-out and may remain on a shared device; browser storage deletion/quota failure can prevent reload recovery. Storage failures are shown and in-memory text retained. Cross-tab journals share one scope; server revision checks and explicit recovery mitigate overwrites, but this is not collaborative editing.
- Existing chapter `choices`/`is_cyoa` schema drift remains outside this phase; if a deployed schema lacks those columns, saves fail visibly and local text survives. Memory, hybrid roleplay, storytelling expansion, currency policy and mobile changes are deferred.
- Existing unauthorized lore links are ignored at runtime, not repaired; owners can unlink them after review. No broad audit claim is made about every shared-table policy, bucket, alternate endpoint or legacy RPC. Existing direct turning-point reward RPC/economy policy needs its own separately approved review.

## Manual actions / approval boundary

1. **Revoke the exposed ElevenLabs credential yourself** in the provider dashboard. Create a new one and enter it only into CHIMERA's server-side `ELEVENLABS_API_KEY` configuration. Never use a `VITE_` prefix or send a secret to this chat. Inspect provider usage/billing for unauthorized use. Existing history/deployed assets may contain the old value; history rewriting and external repository cleanup are separate approval-gated actions.
2. Confirm existing server-only Supabase service-role and AI-provider configuration is available to CHIMERA API handlers. Do not replace, request or copy production keys. Keep service-role keys server-only.
3. Review exact SQL and shared consumer behavior, then explicitly approve an isolated nonproduction integration/migration test. No migration should be applied to a shared or production database based merely on this local patch. Coordinate future API/frontend rollout with these migrations to avoid blocking writes or requests.
4. Set provider account spending caps/alerts and define support reconciliation for retained illustration reservations. No payment settings, webhook credentials, production authentication settings, RLS Dashboard changes or bucket policies were changed.

## Files changed / added

- `apps/chimera/api/ai-chat.ts`
- `apps/chimera/api/generate-scene-illustration.ts`
- `apps/chimera/api/roleplay-turning-point.ts`
- `apps/chimera/src/components/writers/SceneIllustrationModal.tsx`
- `apps/chimera/src/lib/elevenlabs.ts`
- `apps/chimera/src/pages/ChapterEditorPage.tsx`
- `apps/chimera/src/pages/ConversationPage.tsx`
- `apps/chimera/vite.config.ts`
- `apps/chimera/api/_lib/requestProtection.ts`
- `apps/chimera/api/voice.ts`
- `apps/chimera/src/lib/aiRequests.ts`
- `apps/chimera/src/lib/draftJournal.ts`
- `apps/chimera/src/lib/messagePersistence.ts`
- `apps/chimera/src/lib/voiceCatalog.ts`
- `apps/chimera/tests/README.md`
- `apps/chimera/tests/package-lock.json`
- `apps/chimera/tests/package.json`
- `apps/chimera/tests/phase1-api.test.ts`
- `apps/chimera/tests/phase1-editor.test.tsx`
- `apps/chimera/tests/phase1-preservation.test.ts`
- `apps/chimera/tests/phase1-security.test.ts`
- `apps/chimera/tsconfig.api.json`
- `apps/chimera/vitest.phase1.config.ts`
- `supabase/migrations/20260930150022_chimera_phase1_authorization.sql`
- `supabase/migrations/20260930150040_chimera_phase1_request_protection.sql`

`docs/chimera-codebase-audit.md` is the prior audit artifact, not newly rewritten in Phase 1. This report is also new.

## Proposed commit / PR

**Title:** `fix(chimera): secure roleplay requests and preserve creative drafts`

**Description:** Protect CHIMERA's identity and ownership boundaries, move voice credentials to authenticated server transport, and bound/idempotently persist AI operations. Preserve roleplay messages and chapter drafts across failed requests and lost acknowledgements. Prepare two unapplied SQL migrations; preserve existing character prompts/models and SHARDS/VELLUM amounts. Validation: 22 isolated tests, app/API typechecks, focused lint comparison and CHIMERA build. Requires credential rotation and separately approved shared-schema integration/rollout. No production changes or Phase 2 work.


## Final self-review — 2026-09-30

The release self-review found and corrected three local issues: repeated SQL application needed guarded table/index creation and replaceable triggers; image-only recovered messages needed to pass composer/send validation; conversation draft initialization needed a rendered-scope gate to avoid briefly journaling the previous conversation's input into the next scope. No deployed schema, credentials or data were changed.

Expanded regression checks use the actual existing VELLUM RPC bodies against synthetic tables: repeated guarded reservation debits once, repeated refund credits once, completed request replay does not debit again, and SHARDS wallet/ledger remain untouched. Authorization positives cover owned scene creation, participant insertion, own persona assignment, character definition edits, creator AI-message edits and recipient read acknowledgements. Negatives continue to cover privilege, identity, lore and other-human message edits. Both prepared migrations are reapplied over populated synthetic fixtures and preserve row contents, including in-flight requests. Concurrent roleplay retries produce one stored message. A stale chapter save includes the original server revision predicate, rejects a newer server version and retains local prose.

Credential-pattern checks covered all Phase 1 files and tracked diff additions without printing removed credential lines. Client source contains zero `ELEVENLABS_API_KEY` references. A production build with a synthetic server-only voice marker contains neither that marker nor provider authentication transport across 140 generated artifacts. No real secret was supplied to these checks. This checks the changed code/build; it does not erase history or establish absence of every preexisting repository secret.

Final results: 22 tests pass; app and scoped API typechecks pass; changed API/helper/voice/modal/config lint passes; touched page lint remains 41 errors/three warnings versus baseline 42 errors/three warnings; build passes with existing large-chunk warning; whitespace diff check passes. SQL replay only occurred inside throwaway embedded PostgreSQL tests. Shared/deployed compatibility and real multi-connection timing remain unverified integration gates.

Repeatability applies to the expected schema created by these migrations. `IF NOT EXISTS` does not repair unrelated schema drift or migrate incompatible preexisting table definitions. Supabase migration history should still apply each version once. There are no DROP TABLE, TRUNCATE, DELETE, data UPDATE/backfill statements at migration top level; DROP/CREATE POLICY and DROP/CREATE TRIGGER intentionally replace security definitions. Function bodies perform existing authorized runtime writes. A coordinated approved rollout is required because enforcing rules before updating API clients can block old paths.

Release steps are listed in [the Phase 1 release checklist](chimera-phase1-release-checklist.md).
