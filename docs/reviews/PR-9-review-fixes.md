# PR #9 follow-up: character authorization and local API environment

PR #9 was merged on 2026-10-07 at 14:45:03 UTC as `1b723a1487e1c148c0b1977e1a28cf46897dc540`.
This follow-up starts from main `7520586e` (including PR #10).
Both Codex threads remained unresolved, and both defects remained in that main checkout.

## Build failure: confirmed cause

The linked deployment `dpl_BrVa39XAve7fhpjn7N4Ab1jHsacm` built head `8045f0969c031f44821044e576c86c0227b6ea81`.
Vercel logs explicitly report:

```
npm error location /vercel/path0/apps/chimera
npm error Missing script: "build:chimera"
Error: Command "npm run build:chimera" exited with 1
```

The root package has `build:chimera`; the app package has `build`. This is a working-directory/build-command mismatch,
not evidence of either Codex finding causing the failed build. The deployment's API `target` is null, and its branch is
`claude/chimera-fresh-start`; that record alone does not substantiate a production-target deployment.
WHISPRR being Ready does not validate the separate CHIMERA project's build or authorization.
PR #10 added `apps/chimera/vercel.json` with `npm run build`, `dist`, and API-safe SPA rewrites.
The smallest build fix is already present: use root directory `apps/chimera`, build `npm run build`, output `dist`;
remove any conflicting dashboard override. Local app build passes. The Vercel project API now reports a later Ready
deployment, but this work does not certify its database or runtime behavior.

Evidence:
- https://github.com/diorix10-beep/WHISPRR-GITHUB/pull/9
- https://vercel.com/diorix10-4413/chimera/BrVa39XAve7fhpjn7N4Ab1jHsacm
- https://github.com/diorix10-beep/WHISPRR-GITHUB/pull/10

## P1 fix

New migration: `supabase/migrations/20261008104038_chimera_character_adult_authorization.sql`.
It requires the existing age-verification migration and earlier CHIMERA schema migrations.

- Private boolean helpers use the authenticated database identity and trusted stored verification/consent.
  They cannot accept an alternate user's identity. Unknown non-SFW ratings fail closed.
- Restrictive SELECT policies protect direct `ai_characters` reads and compose with existing ownership/visibility
  policies. Ownership does not bypass verification. Anonymous callers cannot read character rows.
- Related memories, relationships, associations, bot profiles, transcripts, participant summaries and hybrid room
  data are protected as well. A room or scene containing an inaccessible AI character is hidden in its entirety.
- Definer scene membership/ownership helpers are gated. Character-opening, scene-creation, room-attachment and
  room-continuity RPCs explicitly check the same authorization before reading or copying character data.
- `CharacterPage` waits for the access decision, filters its query, refetches on identity/access changes, and
  returns the unavailable state before rendering any restricted details. RLS remains the actual security boundary.

The current CHIMERA app has no character-detail serverless handler: its direct API is Supabase's Data API.
Remaining app handlers cover wallets/Stripe/story illustrations and do not fetch AI character details.
No character-reading Edge Function or character view was found in the checked-in schema/functions.
Privileged service-only completion/generation contracts remain privileged and must enforce request ownership;
RLS does not constrain `service_role`. Never expose service credentials to clients.

## P2 fix

Vite config now loads `.env*` for the selected mode from the app directory for local serve only, before SSR handlers
load. Existing shell environment values win. Values are copied to server `process.env`; neither Vite's `envPrefix`
nor browser `define` is expanded. Restart the dev server after changing `.env*` values.

## Verification performed

```
npm run test --workspace=chimera
npm run typecheck:chimera
npm run lint --workspace=chimera
npm run build:chimera
```

All pass. Four Node test cases exercise:
1. Actual PostgreSQL RLS (PGlite): anonymous, unverified, unverified owner, verified without consent, verified with
   consent, public/unlisted/private characters, direct IDs, and related data.
2. Definer RPC denies/allows and prevention of self-issued verification.
3. Missing/empty/normalized/unknown ratings, ordinary SFW scenes, immediate revocation, migration repeatability.
4. Real local illustration handlers with `.env*` server credentials and a local fake auth server; mode/local/shell
   precedence; a Vite browser build excludes server secret sentinels.

Database tests execute the actual age-gate and new migration SQL against a minimal contract fixture in PGlite.
They are not a full Supabase/PostgREST stack test. No Docker/Supabase stack, hosted database, provider, Stripe,
real browser E2E or database advisors were run here. No live schema was changed.

## Exact retest steps after review (not executed against hosted services)

1. From repository root: `npm ci`, then run the four commands above. In `apps/chimera`, also run `npm run build`
   to match the Vercel project's working directory.
2. On a disposable local Supabase stack with Docker, apply the complete migration history using the repository's
   local-only workflow. Run `npm run supabase:local:test:chimera` to check shared contracts. Do not reset a hosted DB.
3. Before using staging, confirm the intended project and inspect migration history:
   `SELECT version FROM supabase_migrations.schema_migrations WHERE version IN ('20261006120000','20261008104038');`
   Apply the reviewed migration through the normal staging migration process, then confirm both rows exist.
4. Check policies:
   `SELECT tablename, policyname, permissive, roles FROM pg_policies WHERE policyname IN
   ('chimera_character_adult_read','chimera_character_profile_read');`
   Expect 13 restrictive character policies plus the restrictive bot-profile policy. Inspect function grants and
   run Supabase database advisors. Check for out-of-repository views/RPCs that bypass RLS before certifying staging.
5. Create disposable staging fixtures: public SFW, public Mature, unlisted NSFW, private Mature belonging to another
   account; include greeting/scenario/personality sentinel text. Use anonymous requests, a normal unverified account,
   and a trusted-server-verified test adult with consent first off, then on. Never use user metadata as verification.
6. For each identity, call `/rest/v1/ai_characters?id=eq.<fixture-id>&select=*` with the anon API key and that identity's
   bearer token. Anonymous/unverified/verified-without-consent must receive no restricted row. A verified opted-in
   adult may read public/unlisted restricted rows, but not another creator's private row. Query the protected related
   tables and RPCs with the same IDs. Remove consent/revoke verification, repeat with the same JWT, and expect denial.
7. With `npm run dev:chimera:local`, open `/characters/<Mature-id>` and `/characters/<NSFW-id>` for each identity.
   Inspect responses and the rendered DOM: no sentinel text for denied identities. Sign out while viewing an allowed
   character and confirm its details disappear. Ordinary SFW character navigation must still work for signed-in users.
8. Put local credentials in `apps/chimera/.env.local`, restart dev, and call both illustration endpoints with a valid
   local session and an invalid payload. Expect payload validation (400), not configuration-driven 401/503. An actual
   illustration requires separately authorized provider credentials and can spend VELLUM; it was not tested here.
9. For any later authorized Vercel retest, confirm Root Directory `apps/chimera`, Build Command `npm run build`, Output
   Directory `dist`, the exact reviewed commit, and the intended environment. Build/test a preview only after explicit
   deployment authorization, then run the same identity matrix there. Record logs/commit/migration versions.

## Review risks and publication

- The migration affects shared WHISPRR character/profile/conversation access: review its full-stack compatibility.
- Restricted-character rooms/transcripts are intentionally unavailable if any linked AI character is inaccessible.
- Anonymous SFW character reads remain unavailable under the existing authenticated-only product model.
- The database migration must be applied before relying on the frontend change as protection. Existing live exposure
  is not fixed by a source-only patch. Age verification has no connected provider yet and defaults to denied access.
- Future privileged character APIs must use this gate explicitly; service-role queries bypass table policies.
- `git.deploymentEnabled` disables only `codex/pr9-review-fixes` in each checked-in Vercel configuration, preserving
  existing branch settings. This allows code review without automatic Git deployments. No merge/deploy is authorized.

## Deployment follow-up (2026-10-08)

The user authorized deployment. The next Codex review identified the service-completion revocation gap.
`20261008110354_chimera_service_adult_recheck.sql` now checks the reservation's user before chat/regeneration/room
completion and completed-result replay, and also checks reservation/cache reads. It locks the caller's preference
row while saving/returning a reply, so consent/verification revocation cannot race that transaction. Hybrid rooms
also require eligible accepted participants. Legacy published scene snapshots receive restrictive read policies.

Five regression tests pass, including service-role calls with no member JWT, consent/verification revocation during
an in-flight request, denial of cached completed replies and successful eligible-adult completions.
Typecheck, lint and build pass. Live CHIMERA's published browser bundle references project `gcknzlnumcryvqjvjnyg`
(named WHISPRR), not the separate project named WHISPRR-GITHUB-CHIMERA. All prerequisite tables exist in that confirmed
live database; the age-verification columns/migration were missing at inspection. Security advisors also report
pre-existing warnings outside this patch (mutable function search paths, callable legacy definer functions and
leaked-password protection). Those are not a claim that the database has a clean global security audit.

Deployment will use the reviewed branch without merging it. Branch-specific automatic Git deployment remains blocked;
manual deployment is authorized. Apply the age gate, character authorization, then service recheck migrations in that
order before certifying the deployed app's authorization.

Hosted verification is now complete for the core identity matrix and service chat completion/cache revocation:
all assertions passed against the actual live database in a single rolled-back transaction (no test accounts,
characters, messages or request rows persisted). Reproducible SQL is in `scripts/test-chimera-adult-access.sql`.
The three migrations applied successfully through the connected Supabase migration API, and policy/function ACL
inspection confirmed the restrictive rules and service-only completion permissions.

A live schema check also found that `ai_characters` has `chat_name`, not `name`. Discover/Character queries now alias
`name:chat_name` so the rebuilt app can load characters against the actual production schema. The full local five-test,
typecheck, lint and production-build checks pass with this correction. Hosted browser sign-in E2E and actual paid
provider/image generation remain outside these checks.


Production deployment completed: `dpl_5NfKoJdsb4qbrbiThQU7S4Ts5RyF`, commit `26d59bddf339c878e04a2124ea408129a41d1bc2`, target production, state READY, with both custom domains assigned. The public homepage and production JS were fetched successfully; the JS contains the corrected name alias and the confirmed Supabase project URL. Exact anonymous PostgREST Discover/detail projections return 200 with zero rows. The deployment-scoped error/fatal runtime log query returned no entries in the immediate post-deploy window.

Recorded hosted migration versions: `20261008110920` (age gate), `20261008111210` (character authorization), `20261008111219` (service recheck). They correspond to the checked-in migration contents; the connected migration API assigned execution-time versions. No temporary test accounts remain. Full signed-in browser and paid-provider E2E are still not asserted.

The user merged PR #11 at 11:06:02 UTC, before the later service-recheck and name-column commits. A follow-up PR is required to bring those already-deployed fixes into main. Branch-specific automatic deployment remains blocked on the review branch only; main's automatic production deployment remains enabled.
