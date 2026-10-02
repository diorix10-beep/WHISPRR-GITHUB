# CHIMERA Phases 2–4 development report

Date: 2026-09-30. Local branch: `codex/chimera-phase1-security-preservation`. Base: `1da4ab98ce149911116c2a1b50f8025119b3d8fe`.

Status: coordinated implementation and local validation completed. No commit, push, deployment, connected-database migration, production data access or credential rotation performed. All five prepared migrations remain unapplied outside disposable synthetic PostgreSQL tests. This report supersedes the Phase 1 checklist's instruction to stop before Phase 2; the historical audit and Phase 1 report remain useful baseline evidence.

## Phase 2 — Core reliability

- Removed duplicate list routes; separated the public story catalogue from the protected writer desk at `/write/desk`. Fixed `/chat/:id` interpolation, password recovery with an established session, and the missing restricted-access destination. Creator Studio opens the selected owned story in the actual writer desk. The public catalogue reuses story discovery instead of an ID-dependent reader; chapter links use registered routes and saved chapter IDs resolve within their story.
- Hydrated character names from the existing bot profile relation. Character duplication uses the existing character soul-save factory rather than unsupported direct profile inserts. Corrected memory-manager character/scene queries.
- Added the missing chapter `choices`/`is_cyoa` and character provider/model columns using existing application defaults. This is schema coverage, not a new storytelling or pricing phase.
- Replaced multi-step scene/group creation with one authorized transaction. Existing authored greetings remain the opening source; scene creation does not fabricate a new greeting.
- Persisted per-scene persona selection, including an explicit choice to play as yourself. Reloads retain the selection. Message persona snapshots and request binding prevent persona switches during generation from mislabelling or leaking a response.
- Regeneration targets an existing terminal AI response and replaces that row atomically, retaining previous content in `response_versions`. Saved variants survive reload; selection checks original content and permissions. Changing an earlier AI response creates a new scene branch first.
- Branching clones only the visible transcript through the selected point and produces new message IDs with source lineage. Original messages, later turns and memberships remain intact. Repeated branch requests return the same branch. Other human members are not silently invited into the new scene.
- Stable regeneration request IDs and expected-content fingerprints recover lost acknowledgements without another provider call. Ordinary message retries retain the Phase 1 safeguards.
- Creator-authored scene canon uses a revision check. Failed edits are not displayed as saved. Corrected chapter loading effect dependencies while retaining recovery and stale-save protection.

## Phase 3 — Memory continuity

Extended the existing `character_memories`, conversation canon, participant records, relationships and lorebooks. No replacement fact database, alternate conversation stack, vector service or additional summarization provider was introduced.

- Private facts now have persona, scene/room scope and approval status. Existing rows are preserved as approved, unassigned legacy facts; they are not automatically copied into every persona.
- Rolling continuity snapshots contain attributed excerpts, source IDs, timestamps and content digests. They are rebuilt from current visible source messages, so edits/deletions invalidate old derived text. Topic ranking selects relevant older excerpts within the existing bounded prompt architecture.
- Recent history and private facts are filtered by the effective persona before retrieval limits. Branch summaries derive only from their cloned transcript; scene-private facts are not inherited into alternate branches. Explicitly approved persona-wide facts may cross scenes.
- Source-backed proposals remain excluded from recall until the creator approves them. Approval verifies that the source still exists in the correct scene/persona and its digest is unchanged. Approval defaults to the current branch; cross-scene approval is explicit. Directly authored cabinet facts remain creator-controlled.
- Existing character relationships, persona relationship descriptions and owned persona-linked lore participate in recall. Privileged lore retrieval checks association ownership and excludes another creator's private world merely referenced by a character.
- Replaced fabricated “Infinite Memory” data with a real recall inspector: authored canon, approved private facts, older source excerpts, relationship context and selected lore. Recent source turns can be selected for proposals without waiting for a long conversation.
- Memory cabinet supports proposal approval, expiry/scope filtering, editing conflict checks and the existing deletion controls. Source summaries never silently become permanent facts or authored canon.

## Phase 4 — Human and hybrid roleplay

Completed the existing human-room architecture rather than merging it into AI conversations.

- Playable room timeline, paged earlier turns, realtime subscription with polling fallback, human composer, dialogue/action/narration/system types, own-character selection, own-turn editing and local draft recovery.
- Existing invitations can be accepted/declined from the hub. Hosts can invite by username, pause/resume, assign/free turns, remove members and manage AI request policy. Participants can leave; host departure remains intentionally unavailable to avoid silently abandoning ownership.
- Participants can submit a room character or explicitly share their own persona's name/description. The persona's private definition/backstory and private cabinet are not exposed to room AI.
- Hosts can attach an existing authorized AI character. Hybrid mode requires every accepted human participant's opt-in, with host/member request policy and turn permission. AI participation is an explicit request, never an automatic chain. Withdrawal is checked again when a generation completes.
- Identity attachment and consent/persona mutations require the authorized RPCs; direct-table attempts cannot bypass those checks. Human send RPC wraps the existing ordered writer with stable request IDs. Retries produce one message; humans cannot impersonate an AI identity or another participant. AI replies use the actual bot identity, distinct authorship, ordered sequence and source-turn lineage.
- Room AI reuses the existing character prompt builder, model catalogue, provider routing, source recall and guarded requests. Shared submitted character descriptions, relationships, room notes and linked lore supply context; private persona/cabinet facts are never loaded.
- Room AI admission is shared across users for the same character turn. Completion and message persistence are atomic; a repeated request replays the existing result. No SHARDS/VELLUM spending or reward path was added.
- Host-controlled shared canon/notes editor has local recovery and an expected-revision save. Conflicting drafts require reviewing the current notes before rebasing; AI responses cannot update these fields.
- New room screen uses existing theme tokens, accessible control labels, touch-sized controls and responsive layouts. Chromium checks covered desktop and mobile, dark/light rendering, human send and local notes recovery.

## Migrations — approval required before application

Apply through migration tracking in chronological order only to an explicitly approved environment:

1. Existing Phase 1 prerequisite: `20260930150022_chimera_phase1_authorization.sql`.
2. Existing Phase 1 prerequisite: `20260930150040_chimera_phase1_request_protection.sql`.
3. **Phase 2:** `20260930170532_chimera_phase2_reliability.sql` — additive schema contracts, persisted persona selection, scene factory, branch lineage, durable response versions/restoration and revisioned canon RPCs.
4. **Phase 3:** `20260930170728_chimera_phase3_continuity.sql` — scoped private facts, approval/provenance, derived continuity, message persona snapshots and persona-bound generation completion.
5. **Phase 4:** `20260930171024_chimera_phase4_human_hybrid_rooms.sql` — consent/turn controls, existing-identity attachments, retry-safe human writes, protected shared AI writes, invite/member operations and room source recall.

Repeat application of prepared migrations was tested against disposable synthetic fixtures. Existing users/messages/canon and request reservations survived. There are no table drops, transcript truncations, database-wide deletes or economy changes. Replaced policies/triggers/functions still require validation against the actual staging schema and shared consumers; synthetic fixtures are not a complete historical migration replay. A regression test caught a multi-table trigger field-access error, which was fixed using separate table-specific branches before the final passing run.

## Files changed in this batch

Paths below are relative to `apps/chimera` unless prefixed otherwise. The working tree also retains the previously approved Phase 1 changes; those are described separately in `docs/chimera-phase1-security-preservation.md`.

| Area | Files |
| --- | --- |
| Routing/contracts | `src/App.tsx`, `src/contexts/AuthContext.tsx`, `src/pages/CreatorStudioPage.tsx`, `src/pages/DiscoverPage.tsx`, `src/pages/WritersDeskPage.tsx`, `src/pages/StoryReaderPage.tsx`, `src/pages/CharactersPage.tsx`, `src/pages/CharacterProfilePage.tsx`, `src/pages/ChimeraChatsPage.tsx`, `src/pages/ChapterReaderPage.tsx`, `src/pages/ChapterEditorPage.tsx`, `src/pages/MemoryManagerPage.tsx`, `src/components/chat/CreateGroupRoomModal.tsx`, `src/types/index.ts` |
| AI scenes and continuity | `src/pages/ConversationPage.tsx`, `src/components/chat/ScenePersonaSelector.tsx`, `src/components/chat/ChatMemoryModal.tsx`, `src/components/chat/MemoryVisualizerModal.tsx`, `src/lib/continuity.ts`, `api/ai-chat.ts`, `api/scene-recall.ts`, `api/_lib/sceneRecall.ts`, `api/_lib/linkedLore.ts` |
| Human/hybrid rooms | `src/pages/HumanRoleplayHubPage.tsx`, `src/pages/HumanRoleplaySessionPage.tsx`, `api/room-ai.ts` |
| Local API/typecheck wiring | `vite.config.ts`, `tsconfig.api.json` |
| Regression tests | `tests/fixtures/chimeraDatabase.ts`, `tests/phase234-database.test.ts`, `tests/phase234-continuity.test.ts`, `tests/phase234-ui.test.tsx`, updated `tests/phase1-security.test.ts`, `tests/phase1-api.test.ts`, `tests/package.json`, `tests/README.md`, `vitest.phase1.config.ts` |
| Browser verification | `tests/browser-room.html`, `tests/browser-room.tsx` — synthetic local-only visual fixture, not a product route or deployed build entry |
| SQL/report | The three batch migrations above; `docs/chimera-phases2-4-development-report.md` |

No WHISPRR application, native mobile app, wallet/pricing implementation, production configuration or production data was changed. Unchanged portions of the large scene/API files retain their original formatting where practical to reduce review noise.

## Checks and results

- **39 tests pass:** 21 Node/embedded PostgreSQL/preservation tests and 18 Vitest API/editor/UI tests. Includes 120-message recall, persona/branch isolation, stale canon, persona switch during generation, preserved original branches, response replacement/restoration, replay after lost acknowledgement, room authorship/consent/turn checks, legitimate room edits, host notes conflict protection, repeatable migrations, Phase 1 authorization and actual existing wallet RPC charge/refund tests. No real provider/database calls.
- **Application and API TypeScript checks pass**, using `tsconfig.app.json` and `tsconfig.api.json`.
- **CHIMERA build passes**, including PWA generation. Existing >500 kB chunk warning remains.
- **Focused lint:** new source files and the new room/recall implementations pass. Lint across all changed source files reports 158 errors and 15 warnings in legacy files; comparison with the original commit found no new diagnostics. No broad 395-error cleanup was attempted. The chapter dependency warning discovered during comparison was corrected.
- **Chromium:** synthetic human room at 390×844 and 1440×1000 loads with no error overlay, no horizontal overflow and no browser runtime errors. Human send clears only confirmed text; closing/reopening notes restores the local draft. Dark/light theme contrast was inspected. The old anonymous landing page has existing mobile overflow, outside this room implementation.
- **Whitespace/secret-pattern checks pass.** Changed/new sources contain no credential-pattern literals; browser source has no ElevenLabs credential/header references. This is scoped static verification, not a certification of all repository history.
- Supplied checkout lacks native build dependencies. Matching platform tools were installed under temporary directories without replacing tracked `node_modules`; isolated regression dependencies have a separate pinned manifest/lock. Clean-checkout dependency validation remains a release step.

## Remaining limits and release actions

1. **Do not deploy this batch before migrations.** Test the entire five-migration chain on an approved nonproduction schema and verify shared profile/message consumers, real authenticated API routing, realtime behavior, multiple independent browsers and provider failures. No migrations have been applied to a connected environment.
2. **Continuity is bounded source-backed recall, not an infinite semantic memory service.** Archive snapshots cover up to 1,000 older messages, excerpts up to 360 characters; selected older-context and lore each have bounded prompt budgets. Explicit approved facts and authored canon persist beyond that window. AI extraction/vector retrieval/automatic contradiction adjudication are not claimed. Creators correct/delete approved facts themselves.
3. **Branches inherit current authored scene canon**, which may describe events after the branch point. The original remains untouched; creators should review branch canon. Source summaries reflect only the cloned prefix. Legacy unassigned facts/messages are preserved, not automatically associated with a chosen persona.
4. **PostgreSQL/PGlite fixtures are synthetic and deliberately narrower than production.** Shared-schema permissions, deployed function exposure, provider integrations and distributed live concurrency still require staging verification. Request budgets bound calls/concurrency, not a guaranteed monetary provider-spend ceiling; owner-managed billing alerts remain advisable.
5. Anonymous discovery/read policies, snapshot-sharing permissions, storytelling collaboration (`project_collaborators`), fabricated world canvas and canned co-pilot remain separately audited work. These were not expanded into new sharing permissions or Phase 5 implementation. Existing overall lint, tracked-dependency and bundle-size debt remains.
6. No additional production credential is needed for Phases 2–4. Existing **server-only** Supabase service-role and Gemini/OpenRouter configuration must serve `/api/ai-chat`, `/api/scene-recall` and `/api/room-ai` in the approved environment. Public configuration remains only the Supabase URL/anon key. Confirm hosting discovers the two new API routes. Never prefix server credentials with `VITE_`.
7. Phase 1 owner action remains: revoke the previously exposed ElevenLabs key and configure a replacement only in the server secret store. Nothing was rotated or copied into this batch. Payment configuration/economy is unchanged.
8. Human-room participant/session changes have a 15-second polling fallback. Confirm the existing realtime publication in staging; publication changes are not applied automatically. No new bucket/auth/webhook configuration is required by these phases.
9. Local draft journals depend on browser storage and are private account/scope keys, not encrypted backups. Storage-unavailable failures are surfaced. Clearing site data can remove unsent work; private-browser/shared-device and logout cleanup behavior needs broader product hardening.

Recommended next step: review the three logically separated phase diffs and migrations; approve a named staging environment and coordinated Phase 1–4 migration/API verification. After staging evidence, separately approve any commit/push/deployment. Do not start Phases 5–6 without a new instruction.

## Proposed commit/PR summary

Title: **CHIMERA: reliable scenes, creator-controlled continuity, and opt-in hybrid rooms**

Suggested logical commits: Phase 2 contracts/personas/branches/regeneration; Phase 3 scoped facts/source recall/approval; Phase 4 playable human rooms/consent/AI integration; coordinated tests and release report. The existing Phase 1 security patch remains a prerequisite and should be reviewed independently.

Description: Repair existing scene and schema contracts, preserve original histories when branching, and persist persona and response variation state. Extend the current private-memory/canon/lore architecture with source-backed recall and explicit fact approval. Finish human rooms and add permissioned, explicitly requested AI participation while retaining separate AI/human authorship. No wallet changes or migrations applied. Validation: 39 synthetic regression tests, app/API typechecks, CHIMERA build, scoped lint and desktop/mobile browser checks.
