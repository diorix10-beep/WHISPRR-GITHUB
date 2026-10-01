# CHIMERA migration-chain review and staging preparation

Reviewed locally on 2026-09-30. No connected database was read or changed. The chain is suitable for **staging verification**, conditional on the baseline schema matching the read-only preflight; production readiness is not established by synthetic fixtures.

Order is mandatory:
1. `20260930150022_chimera_phase1_authorization.sql`: creates the private helper schema and authorization guards. Requires shared profiles, conversations/messages, character/persona/lore and existing human-roleplay schema.
2. `20260930150040_chimera_phase1_request_protection.sql`: depends on the private schema, existing illustration wallet and guided-turning-point functions. Adds private RLS-enabled request coordination and service-only writers.
3. `20260930170532_chimera_phase2_reliability.sql`: depends on those writers and existing story chapters. Adds nullable lineage/scope columns, defaults matching existing application behavior, revisioned canon, scene/persona/branch/regeneration RPCs.
4. `20260930170728_chimera_phase3_continuity.sql`: depends on Phase 2 persona/lineage columns and private requests. Adds memory approval/scope/provenance and derived summaries, then replaces the guarded chat completion while preserving its service-only grant.
5. `20260930171024_chimera_phase4_human_hybrid_rooms.sql`: depends on existing ordered human writer, private requests and identity tables. Adds opt-in consent/turn and retry-safe human/AI operations.

6. `20260930190706_chimera_phase5_storytelling.sql`: follows Phase 2 chapter revisions and existing world entities; adds accepted story/world collaboration, same-story CYOA validation, guarded overview/map CAS and story-world links. Existing publication ownership is preserved.
7. `20260930190732_chimera_phase6_ledger_recovery.sql`: follows private AI requests and existing wallet/order/turning-point functions; adds nullable checkout retry identity and service-only paid-request reconciliation, preserving prices and rewards.
8. `20260930190733_chimera_privacy_requests.sql`: independent additive CHIMERA-only removal-request queue; no content/account deletion or automatic retention policy.

All files use transactions. New fields are additive, nullable or compatible defaults; legacy facts remain approved/unassigned and existing messages are retained. Unique indexes target new nullable retry/branch lineage fields. No existing content is deleted/truncated, no balance is backfilled, and no SHARDS/VELLUM price changes occur. Foreign-key delete actions describe future explicit deletion behavior, not migration-time deletion. Replaced triggers/policies and privilege revocations are intentional security changes, not broad data removals. Reapplication of the prepared files preserves synthetic existing users, messages, canon, facts and reservations; use normal migration tracking rather than routine manual reapplication.

Compatibility boundaries: older clients that impersonate bots, directly insert human-room messages, directly alter privilege/identity fields or write canon without revision checks will be rejected. Deploying SQL followed by an unrelated old frontend is not a supported rollback. Shared profile/message tables affect shared consumers: staging must exercise legitimate WHISPRR consumers without altering that product's code. Newly scoped persona context excludes preserved unassigned legacy rows; those rows are not discarded. Branches inherit current authored canon and need creator review.

Review covered explicit function grants, empty/controlled search paths, `SECURITY DEFINER` caller/member checks, RLS on private request tables, public helper exposure, two-table lore authorization, sender identity, repeatability and literal credential scanning. Regression tests also validate legitimate character edits/greetings, membership/persona flows, wallet charge/refund and human room edits. Multi-table trigger field access was corrected before the previous final run. No security-scanner certification is claimed: the installed security skill's referenced preflight resources were unavailable, so review used direct source examination and executable synthetic regressions.

## Staging procedure

1. Founder/operator identifies the nonproduction project explicitly and confirms baseline migration history. Do not infer staging from a production-shaped connection URL, read secret files or request dumps.
2. Run `scripts/chimera-staging/preflight.sql` read-only with the existing operator tooling. Check baseline columns/constraints against the migration files and review current policies/grants. Record missing/different contracts before applying anything.
3. Confirm operator-managed backup/recovery exists for staging; use synthetic identities/content. Do not copy production datasets into the test project.
4. Apply the eight named migrations in order through Supabase migration tracking, **only after authorization for that named target**. The repository has not applied them. The Phase 5/6/privacy files are included above.
5. Deploy a CHIMERA staging/preview build with staging-only configuration, never production credentials. Verify API discovery and that `chimera_private` is not exposed through the Data API.
6. Run the automated isolated suite, then real staging checks: create character/scene/group; authored opening; persisted persona across two browsers; earlier/terminal response variants; original/branch preservation; scoped fact proposal/approval/source edit; long transcript recall; human invite/accept/turn/edit/leave; unanimous consent and mid-generation withdrawal; failed-send/chapter recovery; illustration charge/refund/replay; shared-profile/message consumer compatibility.
7. Inspect private storage policies, signed URLs, provider failures/timeouts, request caps and deployment logs without printing transcripts/secrets. Use test-mode payments only, with owner-configured test credentials, when testing checkout.
8. Record evidence and remaining blockers. Request separate approval before any production SQL or application deployment.

## Rollback/recovery

Failed individual migration transactions roll back automatically; do not drop partially introduced tables or restore an old security-vulnerable client as a blanket response. Stop the rollout, retain request/ledger/content records, and use an audited forward correction. Before any production rollout, retain the compatible previous application artifact and an operator-managed recovery point. After new content exists, prefer compatible application rollback plus forward SQL repair. Any database restore, destructive down migration, history rewrite or storage cleanup requires founder approval. Expired paid requests must reconcile completion/refund through ledger operations rather than deleting reservations. Staging tests alone do not authorize a production restore.

## Final eight-file verification

The isolated PGlite suite applies all eight files, reapplies them, and checks preservation of existing chapter content/revision, removal requests and balances. Individual tests exercise collaborator grants/revocation, published ownership, cross-story destinations, map identity/CAS, checkout fulfillment replay, interrupted illustration completion/refund and unchanged reward caps. Fixtures use synthetic baseline tables/functions; this does not replace a real staging preflight against the complete historical schema. No migrations were applied to a connected Supabase project. New RPCs depend on the updated client; old direct overview/map/chapter collaborator writes are intentionally restricted. Coordinate client/API rollout and preserve local journals during cache refresh.
