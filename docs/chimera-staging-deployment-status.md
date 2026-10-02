# CHIMERA GitHub/staging handoff

2026-09-30. The founder approved commit/push/PR and a verified nonproduction deployment/database rollout. Production, production data, production alias and `chimera.it.com` remain excluded.

## Current repository verification

113 approved implementation/documentation paths reviewed; credential-pattern scan found zero matches in 103 changed text files. All eight migrations are transactional and contain no destructive table DDL. The isolated suite passed all 56 tests, including eight-file reapplication/data preservation. App/API typechecks and the build passed again. Bundled font-license line endings/trailing whitespace were normalized after staged-file review; license wording is unchanged. Relevant lint remains inherited debt documented in the consolidated report.

Implementation commit: `a7de3c729e822c7e9703da06ddb97bf4900af671`.
License maintenance commit: `bb5dac60d61d1156c10d41fff1ac69ec54728915`.
Preview gating commit: `a276fba8`.

Git push failed with HTTP 403 after checking the standard GitHub credential helper. The connected GitHub app also rejected branch creation with HTTP 403 (`Resource not accessible by integration`). Repository metadata reports owner/push permission, but the active integration does not authorize repository writes. The remote feature branch and PR have not been created. A repository-scoped connection with Contents and Pull requests write permissions is required; no token should be sent in chat. Prepared PR text: `docs/chimera-pull-request.md`.

## Staging prerequisites not yet satisfied

- Vercel CHIMERA project exists: `prj_PIUMGmWRexfA7WqhraGPUzuW46SL`, team `team_nx2NTJYED4nFhpyE8UrsSMcr`.
- Accessible Supabase projects: WHISPRR (`gcknzlnumcryvqjvjnyg`, active) and WHISPRR-GITHUB-CHIMERA (`sukxlukpqudfxkgefqdt`, inactive). Both list zero development branches. Neither has been verified as staging; no SQL is authorized against either merely because its name includes CHIMERA.
- Vercel project metadata retrieval fails inside the connector with an `idOrName` argument mapping error. Its available tools do not expose environment-variable configuration; there is no authenticated Vercel CLI in this workspace. No secret values were requested or accessed.
- Founder/operator must identify the nonproduction database target and configure branch-specific Preview variables through the secret manager/authenticated connection. Existing exposed credentials must not be reused.

To prevent Git push from automatically deploying with unverified existing Preview variables, the CHIMERA root and app Vercel configs disable **only** this feature branch's automatic Git deployment. Other branches retain default behavior. This reversible guard must be removed once the target/environment checks pass; explicit Preview deployment can then proceed. No production project settings or aliases were changed. The top-level Vercel configuration already builds CHIMERA.

## Required Supabase actions

Apply the eight ordered files listed in `docs/chimera-migration-chain-review.md` only to an explicitly verified staging target after read-only `scripts/chimera-staging/preflight.sql` succeeds and migration history/contracts are reviewed. No migrations have been applied. Verify existing private illustration storage and policies, Auth redirect URLs for the Preview URL, realtime room access and private-schema Data API exclusion; no production Auth/storage changes are authorized.

Configure staging-only `VITE_SUPABASE_URL`/anon browser configuration and server `SUPABASE_SERVICE_ROLE_KEY`, existing provider keys, Stripe test-mode secret/webhook secret and HTTPS `CHIMERA_APP_URL`. Put all secret values in hosting configuration, never tracked files or chat. Review the exact names/limits in the consolidated release report.

## Deployed E2E status

Not run: no verified staging database or safely configured Preview exists for this release. Authentication, character/persona, AI/regeneration/branch/memory, Human/Hybrid, storytelling/drafts/suggestions, worldbuilding/CYOA, payment/recovery, removal requests, responsive/a11y and API/runtime checks remain pending against the deployed release. Local/synthetic test success must not be reported as deployed E2E success.

## Production promotion

Complete actual staging SQL/application verification and record its evidence first. Then obtain separate founder approval for production SQL/deployment, prepare an operator-managed recovery point and compatible rollback artifact, apply the reviewed chain and release a **production-configured** build. Do not blindly promote a staging-configured preview artifact: its browser bundle must not keep the staging Supabase URL or test-mode checkout configuration. Do not touch production aliases or domains until that approval.
