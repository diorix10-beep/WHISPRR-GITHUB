import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'http';

// Edge-style API routes (Web Request -> Response) are served locally in dev so
// the app works with `npm run dev`. On Vercel they run as serverless functions.
const EDGE_ENDPOINTS = ['generate-scene-illustration', 'illustration-status'];

async function readRequestBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}

async function sendWebResponse(res: ServerResponse, webResponse: Response) {
  res.statusCode = webResponse.status;
  webResponse.headers.forEach((value, key) => res.setHeader(key, value));
  res.end(Buffer.from(await webResponse.arrayBuffer()));
}

function localApiPlugin(): Plugin {
  return {
    name: 'chimera-local-api',
    apply: 'serve',
    configureServer(server) {
      for (const endpoint of EDGE_ENDPOINTS) {
        server.middlewares.use(`/api/${endpoint}`, async (req, res) => {
          try {
            const body = await readRequestBody(req);
            const headers = new Headers();
            for (const [key, value] of Object.entries(req.headers)) {
              if (Array.isArray(value)) value.forEach((entry) => headers.append(key, entry));
              else if (value) headers.set(key, value);
            }
            const request = new Request(new URL(req.url || '/', 'http://127.0.0.1'), {
              method: req.method,
              headers,
              body: body.length ? body : undefined,
            });
            const module = await server.ssrLoadModule(`/api/${endpoint}.ts`);
            await sendWebResponse(res, await module.default(request));
          } catch (error) {
            console.error('Local CHIMERA API failed', error);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Local CHIMERA API failed' }));
          }
        });
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), localApiPlugin()],
  server: { host: '127.0.0.1', port: 5174 },
});
