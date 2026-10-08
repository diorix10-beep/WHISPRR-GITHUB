import { loadEnv } from 'vite';

// Local SSR handlers read process.env. Keep secrets on the server: do not use
// define/import.meta.env or broaden Vite's browser envPrefix.
export function loadLocalApiEnv(mode, envDir, target = process.env) {
  for (const [key, value] of Object.entries(loadEnv(mode, envDir, ''))) {
    if (target[key] === undefined) target[key] = value;
  }
}
