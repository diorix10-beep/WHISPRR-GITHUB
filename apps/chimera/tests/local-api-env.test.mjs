import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer as httpServer } from 'node:http';
import { createServer, build } from 'vite';
import { loadLocalApiEnv } from '../scripts/localApiEnv.mjs';

test('local .env loading preserves shell precedence and both original API handlers receive server credentials', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'chimera-env-'));
  const keys = ['VITE_SUPABASE_URL','VITE_SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY',
    'GEMINI_API_KEY_SERVER','PR9_ENV_PRECEDENCE'];
  const before = Object.fromEntries(keys.map(key => [key,process.env[key]]));
  let authCalls=0;
  const api = httpServer((req,res) => {
    assert.equal(req.url,'/auth/v1/user');
    authCalls++;
    res.writeHead(200, {'Content-Type':'application/json'});
    res.end(JSON.stringify({id:'00000000-0000-4000-8000-000000000001',aud:'authenticated'}));
  });
  await new Promise(resolve => api.listen(0,'127.0.0.1',resolve));
  let vite;
  try {
    for (const key of keys) delete process.env[key];
    process.env.PR9_ENV_PRECEDENCE='shell';
    await writeFile(join(dir,'.env'), 'GEMINI_API_KEY_SERVER=base\nPR9_ENV_PRECEDENCE=file\n');
    await writeFile(join(dir,'.env.local'), `VITE_SUPABASE_URL=http://127.0.0.1:${api.address().port}\nVITE_SUPABASE_ANON_KEY=local-anon\nSUPABASE_SERVICE_ROLE_KEY=local-service\nGEMINI_API_KEY_SERVER=private-local-sentinel\n`);
    await writeFile(join(dir,'.env.development'), 'GEMINI_API_KEY_SERVER=mode\n');
    await writeFile(join(dir,'.env.development.local'), 'GEMINI_API_KEY_SERVER=private-mode-sentinel\n');
    loadLocalApiEnv('development',dir);
    assert.equal(process.env.PR9_ENV_PRECEDENCE,'shell');
    assert.equal(process.env.GEMINI_API_KEY_SERVER,'private-mode-sentinel');
    vite=await createServer({configFile:false,root:new URL('../',import.meta.url).pathname,
      server:{middlewareMode:true},appType:'custom'});
    for(const endpoint of ['generate-scene-illustration','illustration-status']) {
      const module=await vite.ssrLoadModule(`/api/${endpoint}.ts`);
      const response=await module.default(new Request('http://localhost/api/'+endpoint,{
        method:'POST',headers:{Authorization:'Bearer local-test-token','Content-Type':'application/json'},body:'{}'}));
      // A real handler passed configuration/auth and reached payload validation.
      assert.equal(response.status,400,await response.text());
    }
    assert.equal(authCalls,2);
    await writeFile(join(dir,'index.html'),'<script type="module" src="/main.js"></script>');
    await writeFile(join(dir,'main.js'),'console.log(import.meta.env);');
    const output=await build({configFile:false,root:dir,envDir:dir,logLevel:'silent',build:{write:false}});
    const code=output.output.filter(item=>item.type==='chunk').map(item=>item.code).join('\n');
    assert.ok(!code.includes('private-mode-sentinel') && !code.includes('private-local-sentinel'));
    assert.ok(!code.includes('local-service'));
  } finally {
    await vite?.close();
    await new Promise(resolve=>api.close(resolve));
    for (const [key,value] of Object.entries(before)) {
      if(value===undefined) delete process.env[key]; else process.env[key]=value;
    }
    await rm(dir,{recursive:true,force:true});
  }
});
