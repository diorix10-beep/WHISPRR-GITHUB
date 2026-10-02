# CHIMERA codebase audit

Audited repository: `diorix10-beep/WHISPRR-GITHUB`, commit `1da4ab98ce149911116c2a1b50f8025119b3d8fe`. Audit date: 2026-09-30.

Scope: CHIMERA web, its API handlers, relevant shared Supabase migrations, and identification of mobile scope. WHISPRR features and Oracle are not being redesigned. No application code, database, deployment, credentials, or payments were changed. No production database or backup was read. Findings below are code/migration evidence, not claims about the deployed database.

## Assessment

CHIMERA has a substantial creative platform already. Preserve its character architecture, Supabase persistence, lorebook resolver, user-owned memory cabinet, chapter editor, and transactional wallets. The highest-impact work is repairing their integration, protecting authored work, and completing human-controlled continuity. A replacement platform or second memory database would add unnecessary risk.

No feature can be certified fully working in production from this audit. “Implemented” below means a concrete code path and supporting migrations exist; it does not mean production or end-to-end verification passed.

## Architecture and routes

- `apps/chimera`: React 18 + TypeScript, Vite, React Router, Tailwind, PWA; Tauri desktop scaffolding under `src-tauri`.
- `src/App.tsx`: lazy routes, theme/toast/auth/localization/project providers, maintenance handling and route gates. Public discovery, character/world lists, story reader; protected creation, chats, memory, models, currencies and human-roleplay pages.
- `src/contexts/AuthContext.tsx`: Supabase password, OTP and OAuth authentication, persistent browser session, shared profiles, CHIMERA preferences and wallet reads. Identity infrastructure is shared with WHISPRR, but product features remain in CHIMERA.
- `api/ai-chat.ts`: authenticated roleplay, database-loaded prompts, Gemini/OpenRouter routing, post-processing, and reply insertion through a database RPC. Other handlers implement turning points, Stripe checkout/webhook, and VELLUM illustrations.
- `supabase/migrations`: shared ordered history, including old NEXA naming. CHIMERA depends on earlier shared profiles, messaging, stories and storage definitions. Its own `apps/chimera/supabase` directory is not the canonical migration history.
- Development middleware in `vite.config.ts` exposes only `/api/ai-chat`; the other server endpoints need an appropriate local server before they can be tested locally.
- The root build runs all workspaces; CHIMERA-specific build/typecheck scripts exist. Its TypeScript check includes `src` only, leaving API handlers outside that check.

Important route defects:

1. `/stories` appears first as public `StoryReaderPage`, and later as protected `WritersDeskPage`. Matching duplicate routes selects the earlier branch; the writer desk's intended entry and `/write/desk` redirect collide with the reader. Duplicate character/world list routes also obscure access intent.
2. `/chat/:id` redirects to the literal `/conversations/:id`, without substituting the actual ID.
3. `ProtectedRoute` redirects disallowed access levels to `/restricted`, but no such route is registered.
4. `/reset-password` is inside `PublicOnlyRoute`, which redirects an authenticated user. A password-recovery link establishes a session, so the recovery screen can be redirected away before the password is changed.
5. Public pages query tables whose supplied policies often permit only `authenticated` reads. Anonymous discovery/reading is not established by making a React route public. “Public” roleplay snapshots also remain behind authentication; “unlisted” snapshots have no non-owner read policy in the supplied migrations.

## Feature inventory

| Area | Concrete implementation to preserve | Incomplete, inconsistent, or unverified |
| --- | --- | --- |
| Characters | Structured architecture compiler; soul-save RPC; published/private/unlisted data; greeting persistence; character drafts; import/export helpers | Name/profile hydration differs between pages; duplication uses a different creation path; some importer/model fields lack migration coverage |
| Personas | Owned CRUD, default persona, images, backstory/relationships, drafts, persisted lorebook ID array | Chat switch is component state only; server reads participant `persona_id` or default; persona relationships/lorebooks are not compiled into chat |
| Conversations/messages | Persistent messages, realtime client paths, human/bot participants, saved opening, AI replies, OOC canon, scene publishing/export | Non-atomic scene creation; message drafts cleared before write success; regeneration appends another message; branch action truncates existing history |
| Durable memory | Private player–character memory CRUD; categorized facts, importance and expiry; conversation canon loaded server-side | No active rolling summary/extraction; no persona/branch scope; stale or conflicting canon has no revision/conflict workflow |
| Lorebooks/worlds | World locations, factions, timeline, character/lore links; entry CRUD; keyword/constant resolver with bounded prompt | Persona links unused by API; relationship table unused by API; world canvas and relationship viewer fabricate/approximate data |
| Stories | Story/chapter CRUD, publication and readers; library, votes/comments schema; basic word count, autosave, import/export | Desk route collision; missing CYOA schema; no durable chapter recovery; co-pilot is canned text; authorship badge is local state |
| Human roleplay | Separate session/participant/character/message/invite/economy tables; creation/invite RPCs; ordered message-send RPC | Session screen still says Phase 1 and provides no message composer or timeline; character/invite UX incomplete |
| Hybrid/group roleplay | Group chat and multi-character response controls in existing conversation UI | No coherent human-room AI permission/turn/canon workflow; API selects first non-bot participant as persona; other AI speakers are mapped as user text |
| SHARDS | Wallet/ledger reads and RLS, purchase orders, authenticated checkout, signed webhook, idempotent fulfillment; guided-choice rewards | Generic spending/earning are stubs; gifting/tips/VIP purchases incomplete; VIP state is localStorage; reward issuance can be called directly |
| VELLUM | Separate wallet/ledger, storytelling eligibility, illustration reservation/completion/refund RPCs, private image storage/gallery | Provider/deployment unverified; interrupted jobs lack durable recovery; refund messages may claim success even if refund failed |
| Voice/localization | Browser speech engine; translation/localization code; voice roster/UI | Browser voice integration contains a hardcoded credential-shaped value; translation sends a truncated excerpt to an external service; translations/UI coverage incomplete |
| Mobile/desktop | Responsive web components/PWA; Tauri shell; Expo app exists | Expo routes are social feed/communities/messages/profile, not a CHIMERA native creative client; no demonstrated CHIMERA native feature parity |

## Existing persistent-memory system

The active server path is already persistent and should be extended:

1. Authenticate caller and verify conversation membership.
2. Load `conversations.memory_summary` as manually established scene canon.
3. Load character definition and bot profile.
4. Load `character_memories` scoped to requester ID and character record ID.
5. Resolve participant persona, falling back to that participant's default.
6. Fetch up to 80 recent messages, then select at most 32 messages / 28,000 characters.
7. Resolve lorebooks linked to the character and its `world_id`, using server credentials when configured. Match enabled constant/keyword entries against the last ten fetched messages; inject at most twelve entries / 6,000 characters.
8. Build layered character/persona/formatting/example prompt; append scene canon (first 6,000 characters), linked lore, and durable character memories (up to 24 queried rows, then a 6,000-character block).
9. Generate and insert a response.

Sources: `api/ai-chat.ts:70`, `:98`, `:465`, `:505`, `:544`, `:597`, `:672`; `src/lib/lorebookRuntime.ts`; migrations `20260815170119_secure_character_memories`, `20260821183629_add_conversations_memory_summary` and `20260815220021_secure_lorebook_runtime_links`.

What this already remembers:

- Creator-authored identity/voice/boundaries stored on the character.
- A persisted persona's selected fields when participant selection is correct.
- Manually curated player–character facts across that player's sessions/devices, including relationship and lore categories.
- Manually saved scene instructions/canon and guided-choice consequences within one conversation.
- Relevant linked lore entries on each turn.

What it does not yet do:

- Automatically preserve older events when they leave the recent-history window. `historySummary` is explicitly `null`; canon is not a generated rolling summary.
- Keep independent bonds for different personas played by the same user with the same character. Current key is user + character, not persona or universe branch.
- Retrieve structured character-to-character relationship rows, persona relationships or persona-linked lore.
- Provide source-message provenance, user approval of extracted facts, contradiction resolution, versioned canon, reliable branch isolation, or semantic retrieval.
- Guarantee that everything saved is recalled: the budgets deliberately omit material. Old canon remains at the beginning when truncated, which can hide newer appended instructions. Expired top-priority rows are filtered after the 24-row query, reducing effective recall.

There are overlapping legacy pieces:

- `services/memoryNexus.ts` exports an extractor/formatter with no runtime callers found. It uses keyword/substr heuristics and randomly generated relationship links/weights. It is not an active persistent knowledge graph.
- `ChatMemoryModal.tsx` is still reachable and initializes invented memories, reads/writes the same conversation text field, suppresses errors, and advertises “Infinite Memory.” It is not the private cross-session cabinet.
- `MemoryVisualizerModal.tsx` actually exports the durable `CharacterMemoryCabinetModal`, which uses owner-scoped Supabase rows. Keep this working path; rename/consolidate intentionally later.
- Message pins live in localStorage, despite a “permanent memory” tooltip. The backend never reads them.
- `supabase/functions/summarize-thread` returns a generic summary but does not write CHIMERA canon/memories, expects `body` rather than message `content`, and has no CHIMERA caller found. Its body lacks user/conversation authorization; deployed JWT settings are unverified. It is not evidence of active CHIMERA long-term memory.

Recommendation: retain the current stores and add optional, source-backed memory proposals plus a separate rolling-summary field/state. Users approve lasting canon; summaries assist recall without silently rewriting authored identity. Add persona/branch scope only where the user explicitly wants separation, with a migration preserving existing memories. Semantic/vector search should follow measured recall needs, not precede basic correctness.

## Concrete defects and technical debt

### Schema/frontend contract drift

The supplied migrations define character names in bot `profiles.display_name`, not `ai_characters.name`. `MemoryManagerPage` requests `ai_characters.name`, which will fail against that migration-defined schema. `CharactersPage` and `CharacterProfilePage` load `select('*')` but expect a `bot_profile` relation that was not selected; discovery does request that join. Resolve presentation from the existing canonical profile rather than introducing another name store.

`ChapterEditorPage` updates `choices` and `is_cyoa`; neither column is defined in the supplied migration history. `project_collaborators` is queried by a modal with no defining migration found. Character `ai_provider`/`ai_model` are read by the API but lack defining columns in the history inspected; account preference routing currently masks that omission. These are migration-coverage findings, not assertions that a manually altered production database lacks the columns.

### Auth, safety and creative control

CHIMERA currently implements its own Supabase signup, while repository policy says registration must originate in WHISPRR. OTP also omits `shouldCreateUser: false`. Repair CHIMERA entry points within the existing shared identity model; do not create a new auth provider.

Legal acceptance trusts user-editable metadata in a route gate. Suspension and creative-mode gates are primarily client logic; `ai-chat` validates membership but does not enforce the same account suspension/legal/adult-preference gates. Safety claims should be verified in server behavior, not inferred from UI or prompt text. Crisis keyword checks clear chat input and can block saving fictional chapter text, conflicting with preservation of human-authored work.

### Data preservation and UI honesty

- `handleSendMessage` clears input before upload/database success and does not restore it on failure.
- Chapter autosave is a ten-second debounce only for drafts, with no local journal/recovery buffer found. Published edits and choices changes have additional autosave gaps.
- Regeneration sends `is_swipe`, but the handler ignores it and always inserts a new reply. Client then attempts to overwrite the original bot message; RLS success is not checked.
- “Branch” marks later messages deleted in the same conversation. It creates no branch or cloned canon and reports success without checking the write.
- `WorldCanvasTab` ignores supplied locations/factions when initializing its fabricated nodes and stores edits only in React state; mouse-only dragging does not establish touch support.
- `WorldRelationshipModal` ignores world scope when querying characters/lore and assigns Ally/Rival/Guild by array index instead of relationship records.
- `AiCoPilotDrawer` returns three hardcoded suggestions after a timer; chapter text/tone do not influence generation. The explicit insert step respects author control and should be preserved when connecting a real backend.
- `/media` is explicitly a placeholder. Seasonal model cards explicitly describe future availability; they should remain clearly unavailable until connected.

## Security findings requiring priority

These are locally evidenced authorization/design weaknesses. Exploitation against production was not attempted.

1. **Browser credential exposure:** `src/lib/elevenlabs.ts` contains a hardcoded credential-shaped value used in direct browser requests. It is imported by active UI code. Do not copy or test the value. The owner should revoke it through the provider and use an authenticated, rate-limited server proxy with secrets managed outside Git.
2. **Profile privilege updates:** supplied `update_own_profile` RLS restricts row ownership but not columns. Later migrations add `role` and `access_level`; no corresponding column restriction/update guard was found. If deployed as supplied, a user can attempt to change their own privilege fields. Shared-schema protection needs explicit review because CHIMERA depends on those fields; no WHISPRR implementation changes are included in this audit.
3. **Sender impersonation RPC:** `respond_as_ai_character` checks caller and target membership but does not verify the target is an AI character. An authenticated participant can call it with another human participant and arbitrary content. Restrict human impersonation while preserving the legitimate authored-greeting path and separating trusted generated replies from client-supplied content.
4. **Provider-cost abuse:** AI endpoints lack durable rate/concurrency limits, request size/token budgets across the full prompt, generation idempotency, and provider timeouts. Any persisted account model ID can reach routing without server allowlist enforcement. `ai-chat` verifies bot membership only in the final insertion RPC, after provider spend; establish it before generation.
5. **Privileged lore association:** link policies check lorebook ownership but not ownership/authorization of the target character/world. Runtime then reads all linked entries through a service client. A user could attach their lore to another creator's visible character/world and influence its prompts. Define who may attach canonical lore and validate both sides before privileged retrieval.
6. **Human-room bypasses:** direct participant UPDATE protects only `user_id`, allowing other membership/role/session fields to be changed under the supplied policy. Direct message INSERT does not enforce the send RPC's character ownership or sequence allocation. Harden direct-table permissions and field invariants before exposing the playable room.
7. **Reward provenance:** an authenticated participant can create a turning point directly through its RPC without AI generation, then claim its reward. Unique reward indexes prevent duplicate credit for one point but do not prove genuine activity. The daily cap is counted before locking the wallet, so concurrent claims on different points also need verification.
8. **Disclosure/error handling:** AI provider and RPC error details are returned to clients. Some UI errors expose database text; others suppress failures entirely. Return safe user messages while retaining sanitized server diagnostics. Never log credentials or private transcripts unnecessarily.

Existing security work is valuable: user-owned memory RLS, explicit caller membership before normal chat, bounded recent context, scene ownership/source triggers, signed Stripe webhooks, service-only purchase fulfillment, wallet transactions, and private illustration storage. Preserve these controls.

## SHARDS/VELLUM assessment

The currencies are not merely decorative counters. They have separate tables, ledgers, provisioning, ownership policies and real server/database actions.

- SHARDS checkout fixes package amounts server-side; webhook verifies signature and owner; fulfillment locks orders and makes repeated fulfillment idempotent. Production payment configuration, refunds/chargebacks, and amount/currency reconciliation were not verified. Generic `spendShards` always returns false and `earnShards` only warns, so passes/tips/gifts must not be called complete. LocalStorage VIP flags are not entitlements.
- VELLUM is storytelling assistance credit, not a writing paywall. Illustration generation reserves credit, calls the provider, uploads privately, completes the record, and attempts refunds on failure. A killed request can strand a reservation; failed refunds are logged while the response still says refunded. Preserve ledger accounting and add recovery/reconciliation rather than local balance mutations.

## Verification and limits

- `npm run typecheck:chimera`: failed because `framer-motion` cannot be resolved in the supplied checkout (two imports). Declared dependency exists; this is not proof of a TypeScript logic defect.
- `npm run build:chimera`: blocked before compilation by missing `@rollup/rollup-linux-x64-gnu` in supplied node_modules.
- `npm run lint --workspace=chimera`: failed, 428 findings: 395 errors and 33 warnings. Broad unused imports/explicit `any`, hooks and other rule findings require triage rather than a blind autofix.
- Repository tracks 23,712 files under root node_modules, including a dependency lock artifact. Reproducible platform-specific installation and sensible tracking should be addressed separately; no dependency tree or lockfile was removed.
- Supabase CLI is not installed in this environment. Existing local CHIMERA smoke script covers startup reads/auth/wallets, not the memory/branching/persona/security stories above. No migration reset, backup restore, provider call, payment, live browser flow or native build was run.
- Production deployment/configuration is unknown. The existing deployment-prep document explicitly calls out unapplied/unverified CHIMERA migration dependencies. No production readiness certification is justified.

## Proposed priority order

1. **Protect users and authored work.** Owner-managed credential revocation; restrict privilege/sender/lore/membership mutations; restore failed message drafts; add chapter recovery; remove fabricated memory/canon claims. Use synthetic users and isolated data for authorization regression checks.
2. **Make the existing core reliable.** Repair route conflicts, recovery flow, persisted persona selection, name/profile hydration, schema coverage, regeneration semantics and non-destructive branching. Make dependency installation/builds reproducible and include API code in verification. Review explicit Supabase changes before any deployment.
3. **Complete continuity using existing stores.** Optional source-backed summaries/memory proposals, explicit canon approval, persona/branch scope, relationship/persona-lore inclusion, recall inspection, conflict correction, export and deletion. Test conversations longer than the recent window and reload/device changes. Keep human identity/lore authoritative.
4. **Finish human roleplay, then hybrid.** Connect existing session/invite/character/message RPCs to a real room with composer, timeline, realtime, turn ownership and permissions. Add opt-in AI characters/assistance under host/member control with shared scene canon; preserve separate human and AI authorship.
5. **Polish human-led storytelling and worldbuilding.** Make desk/editor reliable, connect optional co-pilot through preview/accept, persist world canvas using real entities, finish CYOA/collaboration only with complete schema and permissions. Do not overwrite manuscript text automatically or equate AI use with loss of authorship.
6. **Complete currencies and device experience.** Reconcile existing ledgers/jobs, implement only approved premium actions, replace local VIP flags, verify responsive accessibility/PWA/Tauri. Decide separately whether a CHIMERA native Expo client is needed; the present social mobile app is not that client.

Completion gates should include: create/publish a character; start/reload a scene; switch/reload persona; recall approved facts after 100+ messages; isolate alternate personas/branches; recover failed sends/unsaved chapter edits; authorize human-room writes; verify webhook replay and illustration recovery; exercise both desktop and touch layouts. Core character creation, writing, worldbuilding and roleplay should remain usable without mandatory payment.

## Required external actions for this audit

No SQL, storage, authentication configuration, environment variable or Vercel change is required to read this report. No migration was created or applied. Future fixes must include exact reviewed migration/configuration steps and regression evidence before they are described as deployable. Credential revocation is an owner action through the existing provider, without sharing replacement values here.

Task status: repository audit completed; major implementation deferred to the proposed priorities. Production ready: not established.
