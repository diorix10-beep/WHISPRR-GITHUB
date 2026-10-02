# CHIMERA Phases 1–6 release readiness

This is the approved local implementation snapshot. Subsequent GitHub/staging progress and connection blockers are recorded in `docs/chimera-staging-deployment-status.md`; the changes are now committed locally.

Reviewed 2026-09-30. Branch: `codex/chimera-phase1-security-preservation`, base HEAD `1da4ab98ce149911116c2a1b50f8025119b3d8fe`. Changes remain local, uncommitted and unpushed. No deployment, connected-database mutation, production-data access, credential rotation or pricing change occurred. Eight migrations are prepared and **unapplied**. Suitable for a reviewed staging candidate; production readiness remains conditional on the gates below.

## Completed scope, separated by phase

| Phase | Result |
|---|---|
| 1 — Security/preservation | Browser voice uses authenticated server mediation; prior credential literal removed. Privilege/sender/lore authorization hardened. AI request coordination, concurrency limits and provider timeouts; retry-safe roleplay drafts and revision-protected chapter drafts. |
| 2 — Reliability | Route/schema contracts corrected, selected persona persisted, terminal regeneration replaces the intended response and preserves variants; earlier regeneration branches. Conversation branches copy messages without mutating the source. Composite RPC responses normalized, including creation/checkout paths. |
| 3 — Continuity | Extended existing private memories/canon/lore: persona/branch scoping, source-attributed bounded historical context, derived summaries, creator approval of durable fact proposals and inspectable recall. AI assumptions are not automatically approved canon. Existing relationships remain usable through the same context architecture. |
| 4 — Human/hybrid | Existing rooms/messages completed with invitations, accepted membership, author identities, turn authority, retry-safe sends, shared canon revisions and unanimous opt-in AI participation. Human rooms begin without AI. |
| 5 — Storytelling | Real optional provider-backed suggestions with preview/accept/reject and no automatic manuscript/canon write. Persistent world map/overview, revision guards and account-scoped recovery. Accepted story/world editor/viewer collaboration, addressed invitations and creator-only publication. Real same-story CYOA destinations and published chapter navigation. Existing story/world/lore associations reused. Chapter entry explicitly chooses AI with a required character, or a private Human room; reviewed excerpt becomes context in that new room only. |
| 6 — Currencies/devices | Stable checkout request/order identity, signed payment/order validation and idempotent fulfillment; existing illustration job completion/refund reconciliation with no destructive storage cleanup; guided rewards serialized/replay-safe with unchanged values. Improved responsive mobile web/PWA behavior and reduced static precache. |

No parallel memory, character, persona, message, lore, currency or room architecture was introduced. Added tables serve collaboration, coordination/provenance and removal requests. Server-only helpers reuse existing wallets and storage.

Founder decisions implemented: VIP/ad-free unavailable pending duration/benefit specification; CHIMERA-only removal requests preserve the shared WHISPRR identity; chapter roleplay uses the explicit AI/Human chooser. Gift/tip placeholder spending is unavailable: existing non-transferability policy and transfer specifications require founder resolution before a real transfer action can be enabled.

## Compliance, privacy and accessibility

Removed fake deletion behavior; Settings submits an idempotent, private CHIMERA data-removal request for review. It does not execute deletion or promise an invented retention deadline. Corrected inaccurate technical privacy/cookie claims and disclosed optional AI transmission. Translation does not externally transmit text by default. Fonts are self-hosted with licenses. No optional analytics/ad tracker was found in the reviewed CHIMERA source; consent behavior must be revisited before introducing one.

Added modal focus trapping/Escape/focus restoration, labels, alerts, keyboard/touch map controls, minimum target sizes in touched components, main/skip landmarks and stronger primary-button contrast. Fixed anonymous mobile header overflow. This is targeted remediation, not a whole-application accessibility or legal certification.

## Files and migrations

Exact changed-file list: `docs/chimera-release-file-manifest.txt`. Historical Phase 1 and Phases 2–4 reports retain implementation detail. New Phase 5/6 work centers on `api/writing-suggestions.ts`, `api/illustration-status.ts`, `api/_lib/illustrationResult.ts`, checkout/webhook APIs, `AiCoPilotDrawer`, `SceneIllustrationModal`, `ChapterRoleplayChooser`, chapter editor/reader, collaboration/invitations, WritersDesk, worlds/map/relationship tools, Settings/legal pages, gift/tip/pass surfaces, shared dialog/RPC helpers, layout/styles/PWA/font assets and isolated tests. No WHISPRR/native-mobile code was changed.

Apply in this exact order only after target-specific approval:

1. `20260930150022_chimera_phase1_authorization.sql`
2. `20260930150040_chimera_phase1_request_protection.sql`
3. `20260930170532_chimera_phase2_reliability.sql`
4. `20260930170728_chimera_phase3_continuity.sql`
5. `20260930171024_chimera_phase4_human_hybrid_rooms.sql`
6. `20260930190706_chimera_phase5_storytelling.sql`
7. `20260930190732_chimera_phase6_ledger_recovery.sql`
8. `20260930190733_chimera_privacy_requests.sql`

Review and recovery details: `docs/chimera-migration-chain-review.md`; read-only staging prerequisites: `scripts/chimera-staging/preflight.sql`. Files use transactions and additive/compatible columns, replace scoped policies/functions intentionally, and do not truncate/drop user-content tables. Compatibility with the full real baseline remains a staging gate. Reapplication against synthetic data preserved chapters, request records and balances. Roll forward on failure; do not blindly undo security restrictions or delete ledger/content records. Destructive down migrations, restores and storage cleanup require separate approval.

## Verification evidence

- `npm test --prefix apps/chimera/tests`: **56 passed**, 29 Node/PGlite and 27 Vitest API/UI; no failures. Covers authorization, persona/branch isolation, regeneration, retries/drafts, consent, collaboration, map CAS, all eight migrations/reapplication, wallet/order/reward replay, illustration recovery and chapter AI/Human entry.
- App and API `tsc --noEmit`: **passed**.
- `npm run build:chimera` with synthetic local configuration: **passed**. Main chunk still exceeds 500 kB; PWA precache 132 entries, approximately 10.4 MiB.
- Relevant source/API lint: **186 errors, 17 warnings in 63 files**, inherited baseline diagnostics; no new diagnostic types relative to the previous reviewed changed-file run. Overall lint is not clean; unrelated debt was not rewritten.
- `git diff --check`: passed. Final scan of 103 changed text files found zero credential-pattern matches; browser voice module has no direct provider URL, credential header or server-key reference. This is pattern-based evidence, not proof that arbitrary secret formats cannot exist.
- Synthetic Chromium checks: creative workshop/map/suggestion preview and Human room flows; 320/390 mobile and 1440 desktop layouts, dark/light where applicable, no tested overflow/runtime errors. Both new chapter chooser creation paths confirmed at 390 px. Scoped axe WCAG 2 A/AA and 2.1 AA checks found no violations in tested workshop/writing/chooser surfaces. Manual assistive-technology and full legacy-route testing remain.
- No real provider, payment, auth, storage or connected Supabase test was performed. Security review used direct source inspection and executable regressions; unavailable security-skill preflight resources prevented scanner certification.

## Remaining blockers and limitations

1. Named isolated staging target and actual catalog/RLS/PostgREST/storage verification; no production data copies. Synthetic baseline fixtures are not a complete historical migration replay.
2. Founder must manually revoke/rotate the previously exposed ElevenLabs credential and configure the replacement only on the server. No secret value is reproduced in reports or requested from the founder.
3. Operator configuration of staging provider/payment/auth/storage environment and webhook routing. Verify no private/service/provider credential appears in client bundles or logs.
4. Founder policy review for jurisdiction, age restrictions, AI/UGC moderation/disclosures, provider terms/training/retention, refund/payment rules and CHIMERA-removal handling of collaborative content, financial records, backups and provider copies. Removal execution remains unavailable until safely specified and separately approved.
5. VIP/ad-free durations/benefits and gift/tip transfer policy remain undefined and disabled. Prices, SHARDS/VELLUM exchange values and reward values were preserved.
6. Existing `/mobile` is WHISPRR Expo, not a verified CHIMERA native client. CHIMERA mobile web/PWA advanced; native packaging, signing, hardware and distribution remain founder/product work.
7. Historical context is bounded (up to 1,000 older sources, excerpts and prompt caps), not an unlimited semantic memory service. Branches inherit current approved creator canon, not historical canon snapshots.
8. Remaining legacy lint, large assets/chunk, rich-text formatting placeholders, local handcrafted badge/provenance semantics and full accessibility verification are follow-up work. No claim that every audit placeholder or every device is finished.
9. Room-creation network uncertainty can leave a created room without client confirmation; the chooser warns to inspect rooms before retry. Paid/provider operations use their dedicated retry/recovery identities.

## Exact path to staging and production

1. **Repository review:** inspect the local diff and reports without dumping the removed credential. Review the eight SQL files and changed-file manifest. Approve logical commits/PR when satisfied; none have been created. Suggested separation: Phase 1 security/preservation; Phase 2 reliability; Phase 3 continuity; Phase 4 rooms; Phase 5 storytelling; Phase 6 ledger/devices; privacy/accessibility; tests/release documentation. Never stage secret-bearing artifacts or temporary test tooling.
2. **Staging selection/preflight:** explicitly identify an isolated nonproduction project, verify baseline migration history and operator recovery capability, then run the read-only preflight and inspect contracts/policies. Resolve discrepancies before SQL. Use synthetic identities/content, not production dumps.
3. **Staging configuration:** operator supplies staging-only server secrets through the hosting secret manager: configured provider keys, Supabase server service role, Stripe test secret and webhook signing secret, and `CHIMERA_APP_URL` as an HTTPS staging origin. Server names are `SUPABASE_SERVICE_ROLE_KEY`, `ELEVENLABS_API_KEY`, the existing `OPENROUTER_API_KEY` / `GEMINI_API_KEY_SERVER` routing (legacy server `GEMINI_API_KEY` fallback), `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `CHIMERA_APP_URL`; illustration provider settings must match the existing handler. Browser configuration contains only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Never prefix private secrets with `VITE_`. Preserve existing model selections. Ensure `chimera_private` is not Data-API exposed; keep illustration storage private and verify signed-URL access. Verify current API deployment recognizes all new routes.
4. **Approval then staging SQL:** obtain approval for the named staging target and eight ordered files. Review the CLI dry-run plan first; apply only this approved pending chain through tracked migration tooling. Do not reset a database, force all historical migrations or repair history automatically. Stop and resolve an unexpected plan.
5. **Staging application:** build/deploy the compatible CHIMERA API/client to staging after schema readiness. Coordinate restrictions/new RPC availability; preserve local draft journals during service-worker refresh. Repeat automated checks and real end-to-end scenarios: character/persona ownership, terminal/earlier regeneration and source preservation, memory approval/isolation, invitation/read-only/publication, chapter/map stale saves, draft recovery, human consent withdrawal, request concurrency, test-mode checkout/webhook replay, interrupted illustration recovery, private storage access, deletion-request privacy, cookies/network disclosures and keyboard/mobile flows.
6. **Review evidence:** record actual results, resolve security/data/cost blockers and founder policy/configuration tasks. Staging approval does not authorize production.
7. **Separate production approval:** after evidence, obtain explicit database and deployment approval. Operator prepares recovery point and compatible rollback artifact, verifies production configuration privately, applies the reviewed chain and releases the coordinated application. Monitor authorization failures, request rejection/recovery and wallet reconciliation with sanitized logs. Prefer compatible application rollback and audited forward SQL correction. Any destructive restore needs separate approval.

## Proposed PR summary

**CHIMERA: preserve creator data and complete reliable continuity, collaborative storytelling and ledger recovery**

Harden authorization and server-mediated AI/voice, preserve drafts and retry identity, repair persona/regeneration/branch behavior, extend creator-approved scoped memory, complete Human/opt-in Hybrid rooms, and add reviewed writing suggestions, persistent world tools and collaboration. Keep existing pricing/models and undefined purchases unchanged/unavailable; add private CHIMERA-only removal requests and targeted accessibility/privacy fixes. Eight ordered migrations are unapplied. Validation: 56 isolated tests, app/API typechecks and build pass; inherited lint and real staging/policy gates remain.
