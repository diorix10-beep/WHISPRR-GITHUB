# CHIMERA production rollout — 2026-10-02

This record supersedes the historical deployment status in the transfer ZIP.

## Authorized scope and source

The founder requested deployment in this chat and completed the Vercel connection. The production target is Vercel project `prj_PIUMGmWRexfA7WqhraGPUzuW46SL` in team `team_nx2NTJYED4nFhpyE8UrsSMcr`, root `apps/chimera`. The prior production browser bundle identified Supabase `gcknzlnumcryvqjvjnyg` as the existing live database. This database also hosts WHISPRR. No data rows were read as part of identifying the target.

Release commit: `2c6838f5497a831fa5eff5c1907a7dd69838982c` (initial implementation `374faa545f4b13e9a1ced9b42ba733b791b3c032`), branch `codex/chimera-phases1-6-release`, [PR #7](https://github.com/diorix10-beep/WHISPRR-GITHUB/pull/7).

The homepage redesign and scripted sample remain separate in the original workspace. This release imports the Phases 1–6 transfer with ES2020-compatible last-message accesses and checkout own-property checks. The two API corrections remove hosted compilation diagnostics without changing behavior; 14 API tests and an ES2020 API type check passed after correction. Automatic Git deployment is disabled for this release branch; the production deployment was explicitly initiated through Vercel.

## Database update

The read-only contract preflight passed. All eight SQL files then passed a rehearsal inside one transaction with `ROLLBACK`, a three-second lock timeout and a 25-second statement timeout. The rehearsal left no persistent changes.

The eight reviewed migrations were subsequently applied sequentially through the connected Supabase migration tool. Every application returned success. The tool assigns application-time versions; the original source filenames are mapped below. Do not blindly rerun the source timestamps with CLI migration push or automatically repair unrelated migration history.

| Source version | Recorded live version | Migration |
| --- | --- | --- |
| 20260930150022 | 20261002200506 | chimera_phase1_authorization |
| 20260930150040 | 20261002200507 | chimera_phase1_request_protection |
| 20260930170532 | 20261002200509 | chimera_phase2_reliability |
| 20260930170728 | 20261002200510 | chimera_phase3_continuity |
| 20260930171024 | 20261002200511 | chimera_phase4_human_hybrid_rooms |
| 20260930190706 | 20261002200512 | chimera_phase5_storytelling |
| 20260930190732 | 20261002200514 | chimera_phase6_ledger_recovery |
| 20260930190733 | 20261002200515 | chimera_privacy_requests |

Post-application catalog checks confirmed all eight entries, RLS on `chimera_private.ai_attempts` and `chimera_private.ai_requests`, no `anon`/`authenticated` execution privilege on request reservation, and private illustration storage.

## Application deployment

Deployment ID: `dpl_9AXs6KKBPo6BHGNJm9RFGgDEwbug` (supersedes initial release `dpl_H8JZtDM19yxm9vTCEueoimY5T1ad`).

Production-configured build URL: https://chimera-h6xupadf6-diorix10-4413.vercel.app/

Status: **READY**. Vercel assigned `www.chimera.it.com` and `chimera.it.com` to the corrected production release. Its build completed in 27 seconds. The final 20 build events contained no API TypeScript diagnostics.

Live smoke evidence: homepage and `/stories` returned HTTP 200 with the new self-hosted font stylesheet. `/api/voice`, `/api/room-ai`, `/api/writing-suggestions`, `/api/scene-recall`, and `/api/illustration-status` returned 405 for GET and 401 for unauthenticated POST. A remote browser observed meaningful homepage and Discover content at desktop size. These requests created no authenticated content or provider/payment work.

Remote mobile measurements were inconclusive: the browser used `window.resizeTo` and manually assigned `innerWidth`, which does not reliably change the layout viewport. Its reported Discover overflow is therefore not treated as a verified defect or as proof of mobile readiness. The earlier synthetic mobile fixture checks remain the available local evidence. Runtime-error capture was limited; no full observability or accessibility certification is claimed.

## Validation and limits

The integration run passed 56 disposable Node/PGlite/Vitest tests, application/API type checks, local production build, and scoped synthetic browser checks. The hosted Vercel build compiles from the release commit using production environment variables; no staging-configured browser artifact is promoted.

The configured variable names include the production Supabase browser settings, service role, Gemini/OpenRouter settings, Stripe keys and app URL. Values were not decrypted, printed or changed. `ELEVENLABS_API_KEY` is absent, so voice remains unavailable until the owner configures a replacement server-side credential. No previous exposed voice credential was reused.

No real signed-in session, AI provider request, payment transaction, removal operation, storage upload, or full deployed E2E test was performed. No database backup was created or destructive rollback performed. The prior production application is `dpl_74yEFBiEKgfTrzxTx3ZEWJhnFvyN`; reverting to its old client after security/schema changes is not assumed compatible. Prefer audited forward corrections that preserve creator content and ledger records.

## Homepage publication — subsequent founder approval

The founder subsequently approved publishing the saved Lyra homepage. Commit `e88aaebad9294b880d79238623496fd2c4de3c63` restores the clear introduction, primary sample-story action, original Lyra character card, public `/try` route, and Discover sample entry on top of the phases release. No additional database changes were needed.

Deployment `dpl_3pSh4c8sXHugWnADhvD51zApB3TA` is **READY**, assigned to both CHIMERA custom domains. Deployment URL: https://chimera-jehqpsloi-diorix10-4413.vercel.app/

Fresh app type check and production build passed. A live browser verified both homepage headings, navigation to `/try`, the explicit prewritten-response disclaimer, all three distinct endings, restart between paths, and `/characters/new` links. Direct `/try` fetch returned HTTP 200. The browser initially retained the prior service-worker build; clicking the existing **Refresh CHIMERA** notification loaded the new homepage successfully.
