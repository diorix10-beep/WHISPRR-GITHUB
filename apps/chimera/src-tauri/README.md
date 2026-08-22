# CHIMERA Desktop

This is the Tauri 2 wrapper around the existing Vite/React CHIMERA application.

## Local development

Install Rust and the Tauri prerequisites for the operating system, then run from `apps/chimera`:

```bash
npm install
npm run desktop:dev
```

## Installers

From `apps/chimera`:

```bash
npm run desktop:build
```

Tauri produces a macOS `.dmg` on macOS and Windows `.msi`/`.exe` installers on Windows. Builds should be produced on their target operating system and signed before public distribution.

The desktop shell does not contain Supabase secrets. It loads the same frontend and uses the existing HTTPS Supabase/API configuration, so authentication and server-side AI keys remain behind the existing web/API boundary.
