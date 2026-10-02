# CHIMERA Phase 1 regression tests

The harness has its own package manifest/lock to avoid rewriting the application's dependency tree. From the repository root:

```sh
npm ci --prefix apps/chimera/tests --workspaces=false --ignore-scripts
npm test --prefix apps/chimera/tests
npm run typecheck:chimera
npx tsc --noEmit -p apps/chimera/tsconfig.api.json
npm run build:chimera
```

The API typecheck requires Node type definitions in the development dependency tree (`@types/node` 22). No production credentials are needed. Tests mock every provider and Supabase HTTP client; database tests use PGlite with synthetic users/data and exercise both migration files, not a connected database. The fixture models relevant tables/policies, rather than replaying the entire production migration history. Chapter tests render the actual editor with mocked persistence. Roleplay persistence tests simulate failed inserts, committed inserts with lost acknowledgements, and conflicting retries.

The checkout's tracked dependencies may have missing Linux packages or an esbuild host/binary version mismatch. Use an isolated dependency installation or matching native binaries; do not replace tracked dependencies as part of this patch. Build-generated `apps/chimera/public/version.json` must not be included accidentally.

## Phases 2–4

The same `npm test --prefix apps/chimera/tests` command includes source recall,
scoped-memory filtering, synthetic migration/branch/persona/room integration and
persisted-persona/failed-send UI coverage. PGlite applies SQL only to disposable
in-memory fixtures; no connected Supabase environment or real provider is used.

For local visual checks, start CHIMERA Vite with synthetic/local public Supabase
configuration and open `/tests/browser-room.html`. Its database/auth methods are
replaced with synthetic fixtures before mounting the real human-room component.
It is not included in the production build. Check 390×844 and 1440×1000, both
light and dark themes, human send, controls and notes-draft recovery. Never use
production credentials or real accounts with this fixture.
