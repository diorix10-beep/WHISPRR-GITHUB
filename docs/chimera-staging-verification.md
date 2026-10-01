# Deployed CHIMERA staging verification

Status: **not run**. This document is the executable manual/browser checklist for the approved release; synthetic/local results are not deployed E2E evidence.

## Entry gates

Record exact Git SHA, Vercel URL/deployment ID, target `preview`, Supabase staging reference and baseline migration history. Confirm the database reference is explicitly verified nonproduction and differs from the production reference. Inspect branch-specific Preview environment **names and targets**, privately checking values; never print service/provider/Stripe secrets. Confirm payment keys are test mode and the checkout return origin is the HTTPS staging URL. Confirm private schema exclusion, private illustration bucket/policies and staging Auth callback/redirect settings. Stop before any SQL if these gates fail.

Run `scripts/chimera-staging/preflight.sql` read-only; inspect baseline policies/functions/columns. Apply exactly the eight ordered files from the migration review through migration tracking. Record each result. Do not reset, repair history, drop existing content or replay unrelated migrations automatically.

Use two synthetic creators (A/B), two personas and a viewer/invitee where needed. Test accounts and financial test fixtures belong only to staging; mark created content with a release test prefix. Do not delete users/content as cleanup without approval. Never use production accounts or credentials.

## Verification matrix

| Area | Actions and required evidence |
|---|---|
| Auth | Sign up/sign in/out and refresh session; confirm private routes require auth. Invalid/expired tokens must reject protected APIs. OAuth, if enabled, must return to the Preview origin. |
| Characters/personas | Create/edit a private character and two personas; A can save owned fields, B cannot edit A’s private resources or privileged profile fields. Switch personas in a conversation and refresh; selection persists. |
| AI Roleplay | Send once, retry the same request ID, then overlap requests. Confirm intended model/prompt behavior, one message/result/charge per logical request and bounded concurrency. Inspect only sanitized API status/log metadata. Test network/provider failure and recover the retained draft. |
| Regeneration/branching | Regenerate terminal response; intended response is replaced and variant retained. Regenerate earlier response; a separate branch opens. Compare original source messages/canon before and after; original remains intact. Retry branch operation without duplicate branch history. |
| Memory/canon/lore | Recall source-backed older context and inspect provenance. Switch persona/branch and verify private facts do not leak. AI proposals remain unapproved until creator action. Reject and approve facts; recalled durable canon follows creator approval. Check private lore access as A/B and world/persona links. |
| Human rooms | Create private room, invite B, accept, choose persona/character, send/edit messages and refresh. Retry lost-ack send without duplicate. Enforce author identity, turn authority, private visibility and accepted membership. |
| Hybrid | Human room starts AI off. Unanimously opt in, bind existing permitted AI character and trigger participation. Withdraw consent during/after request; unauthorized generation/completion must fail closed. Private participant memories must not leak into shared room context. |
| Stories/drafts | Create story/chapter, edit and reload recovery. Keep two editor tabs; stale save cannot overwrite newer content. Verify owner-only publication and accepted editor/viewer boundaries, including published-chapter restrictions. |
| Writing assistance | Explicit request produces preview; manuscript/canon unchanged before acceptance. Reject leaves writing unchanged; accept adds only the reviewed suggestion. Change draft/chapter during request; obsolete output cannot apply. Failure/retry retains the same request identity and writing. |
| Worlds | Persist real locations/factions/map placement/connections and overview; refresh. Concurrent saves reject stale revision. Removing placement preserves entity. Invited editors/viewers obey grants; uninvited B cannot read private world/lore. |
| CYOA/entry | Published choices reach same-story published destinations; gaps/drafts do not break next/previous. Cross-story targets reject. Chapter AI entry requires character; Human entry creates private AI-off room. Reviewed excerpt is new-room context, original manuscript unchanged. |
| SHARDS | Stripe test checkout retries reuse intended order/session. Signed duplicate paid webhook credits once; forged/mismatched amount/currency/owner/session rejects. Guided reward retries return same result, do not add duplicate award/canon and preserve existing daily cap/value. |
| VELLUM | Illustration submission reserves once; repeat request does not charge twice. Interrupted upload/completion recovers same object/result. Expired missing output reconciles one refund. Refresh/status check does not launch a provider call or new fee. Other users cannot retrieve private image/status. |
| Removal requests | A submits CHIMERA-only request twice; one pending request remains. B cannot see A’s request. Shared identity/profile and creative records remain unchanged because this is a reviewed request, not destructive execution. |
| Mobile/accessibility | Test 320/390/768/1440 widths, portrait/landscape, dark/light. Check overflow, touch targets, keyboard-only navigation, modal focus/Escape/restore, labels/alerts/headings, zoom and contrast. Run scoped axe and manual screen-reader checks; record any legacy-route limitations. |
| Runtime/build | Verify API URLs return JSON/appropriate auth errors rather than SPA HTML. Inspect browser errors, Vercel build/runtime metadata and bounded provider failures; never dump transcripts/tokens. Verify service worker caches no authenticated API data and draft journals survive reload/update. |

## Results format

For each row record pass/fail/blocked, environment/SHA, exact steps, expected/observed behavior and evidence location. Fix ordinary implementation bugs in the feature branch and redeploy/retest; do not change pricing, production data or policy to make tests pass.

Approval to deploy to staging does not authorize production. Production requires founder review of results, manual credential/policy blockers, operator recovery preparation, explicit production SQL/deployment approval and a new artifact built with production variables. Preserve source data and ledger records during recovery.
