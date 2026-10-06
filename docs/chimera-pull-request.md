# CHIMERA: security, continuity, collaborative storytelling and ledger recovery

CHIMERA’s existing creative systems had authorization gaps, draft-loss risks, incomplete roleplay continuity and placeholder collaboration/payment surfaces. This change preserves the existing architecture while completing the coordinated Phases 1–6 batch. Humans retain control of authorship and canon.

## Changes

- Phase 1: server-mediated voice, owner/sender/lore guards, AI request deduplication/concurrency limits and draft/retry preservation.
- Phase 2: route/schema corrections, persisted personas, targeted regeneration/response variants and non-destructive branching.
- Phase 3: source-backed bounded continuity, isolated private memories, creator-approved durable facts and inspectable recall using existing canon/lore.
- Phase 4: accepted Human room membership, identity/turn/retry protection and unanimously opted-in Hybrid AI participation.
- Phase 5: optional writing preview/accept/reject, persistent revisioned world tools, accepted story/world collaboration, CYOA and explicit AI/Human chapter entry.
- Phase 6: checkout/fulfillment replay protection, interrupted illustration reconciliation, unchanged guided reward values and responsive/PWA improvements.
- Privacy/accessibility: CHIMERA-only reviewed removal requests, corrected technical disclosures, local fonts, focus/keyboard/label/contrast fixes.

No WHISPRR/native code, existing pricing, model selection or creator prompts were redesigned. VIP/ad-free remains unavailable pending founder specifications. Gift/tip placeholder spending is unavailable pending transfer policy. No automatic data deletion was enabled.

## Validation

56 isolated Node/PGlite/Vitest tests passed; application/API typechecks and build passed. Tests include the complete eight-migration chain and reapplication with synthetic data preservation. Scoped browser/accessibility checks passed. Relevant lint retains 186 inherited errors and 17 warnings; the main bundle/precache remain large.

**Deployed staging E2E remains pending.** GitHub write authorization, verified staging database and branch-specific Vercel Preview secrets/configuration are deployment prerequisites. This feature branch’s automatic Git deployment is temporarily gated to avoid using unverified Preview configuration.

## Database and rollout

Eight ordered, transactional migrations are included and remain unapplied. They add scoped authorization/request/reliability/continuity/room/collaboration/recovery/removal-request behavior, without destructive user-content table operations. Full real baseline compatibility must be verified with the read-only staging preflight before application. Coordinate schema/API/client rollout; old insecure direct writes are intentionally restricted.

- [Consolidated release report](docs/chimera-phases1-6-release-readiness.md)
- [Migration ordering/recovery review](docs/chimera-migration-chain-review.md)
- [Exact changed-file manifest](docs/chimera-release-file-manifest.txt)
- [Staging deployment status](docs/chimera-staging-deployment-status.md)
- [Deployed verification checklist](docs/chimera-staging-verification.md)

Do not merge/promote as production-ready before staging evidence and separate production approval. Founder must manually revoke/rotate the prior ElevenLabs credential. Secrets belong only in the hosting secret manager. CHIMERA-removal/retention, age/jurisdiction/provider/payment/refund policies and native packaging remain founder review items. A production release must build with production configuration; never blindly promote a staging-configured browser artifact.
