import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve } from 'path';
import type { IncomingMessage, ServerResponse } from 'http';

const buildTimestamp = Date.now().toString();

function generateVersionPlugin() {
  return {
    name: 'generate-version-json',
    buildStart() {
      const publicDir = resolve(__dirname, 'public');
      if (!existsSync(publicDir)) {
        mkdirSync(publicDir, { recursive: true });
      }
      writeFileSync(
        resolve(publicDir, 'version.json'),
        JSON.stringify({ version: buildTimestamp, timestamp: new Date().toISOString() })
      );
    },
  };
}

async function readRequestBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

async function sendWebResponse(res: ServerResponse, webResponse: Response) {
  res.statusCode = webResponse.status;
  webResponse.headers.forEach((value, key) => res.setHeader(key, value));
  const body = Buffer.from(await webResponse.arrayBuffer());
  res.end(body);
}

function localApiPlugin(): Plugin {
  return {
    name: 'chimera-local-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/ai-chat', async (req, res) => {
        try {
          const body = await readRequestBody(req);
          const url = new URL(req.url || '/', 'http://127.0.0.1');
          const headers = new Headers();
          for (const [key, value] of Object.entries(req.headers)) {
            if (Array.isArray(value)) {
              value.forEach((entry) => headers.append(key, entry));
            } else if (value) {
              headers.set(key, value);
            }
          }

          const request = new Request(url, {
            method: req.method,
            headers,
            body: body.length ? body : undefined,
          });
          const module = await server.ssrLoadModule('/api/ai-chat.ts');
          const response = await module.default(request);
          await sendWebResponse(res, response);
        } catch (error) {
          console.error('Local CHIMERA API failed', error);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Local CHIMERA API failed' }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '');
  for (const key of [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'GEMINI_API_KEY_SERVER',
    'GEMINI_API_KEY',
    'OPENROUTER_API_KEY',
  ]) {
    if (!process.env[key] && env[key]) {
      process.env[key] = env[key];
    }
  }

  return {
    define: {
      __APP_BUILD_TIME__: JSON.stringify(buildTimestamp),
    },
    plugins: [
      generateVersionPlugin(),
      localApiPlugin(),
      react(),
      VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'CHIMERA — Where Stories Come to Life',
        short_name: 'CHIMERA',
        description: 'A complete creation platform for storytellers and world builders. Build characters, craft worlds, write stories — your way.',
        theme_color: '#E84C3D',
        background_color: '#0F0F0E',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      }),
    ],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
  };
});
