import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  authenticated: true, botMember: true, botRole: 'ai_character', reservation: 'reserved',
  model: 'gemini-2.5-flash', calls: [] as string[], reserveKeys: [] as string[], beginCase: '', roomEnabled:false, roomConsent:true, regeneration:false, writingAllowed:true,
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: { getUser: async () => ({ data: { user: state.authenticated ? { id: '00000000-0000-0000-0000-000000000001' } : null }, error: null }) },
    from: (table: string) => {
      state.calls.push(`query:${table}`);
      const filters: Record<string,unknown> = {};
      const query = {
        select: () => query, eq: (name: string, value: unknown) => { filters[name] = value; return query; },
        is: () => query, or: () => query, in: () => query, order: () => query, limit: () => query,
        maybeSingle: async () => result(),
        then: (resolve: (value: unknown) => unknown) => Promise.resolve(result()).then(resolve),
      };
      function result() {
        let data: unknown = [];
        if (table === 'conversation_participants') data = filters.user_id ? (state.botMember || filters.user_id === '00000000-0000-0000-0000-000000000001' ? { user_id: filters.user_id } : null) : [{user_id:'00000000-0000-0000-0000-000000000001'}];
        if (table === 'human_roleplay_sessions') data={id:'room',creator_id:'00000000-0000-0000-0000-000000000001',ai_enabled:state.roomEnabled,ai_policy:'host',turn_user_id:null,status:'active',title:'Shared room',setting:'Forest',lore:'Host canon',rules:'Respect agency',objectives:'Explore'};
        if (table === 'human_roleplay_participants') data=filters.user_id?{ai_opt_in:state.roomConsent,status:'accepted'}:[{user_id:'00000000-0000-0000-0000-000000000001',ai_opt_in:state.roomConsent,status:'accepted'}];
        if (table === 'human_roleplay_characters') data=filters.id?{id:'room-character',ai_character_id:'ai-character',name:'Character'}:[{id:'human-actor',name:'Creator submitted character',description:'Shared description'}];
        if (table === 'human_roleplay_messages') data=[{id:'human-turn',sender_id:'human',author_kind:'human',content:'A shared human turn',sequence_number:1}];
        if (table === 'story_chapters') data={id:'chapter',title:'Creator chapter',status:'draft'};
        if (table === 'stories') data = {title:'Creator story',summary:'A human story',world_id:null,user_id:'00000000-0000-0000-0000-000000000001'};
        if (table === 'conversations') data = {memory_summary:''};
        if (table === 'ai_characters') data = {id:'character',creator_id:'creator',personality:'Creator-authored identity',scenario:'A quiet scene',tags:[],visibility:'public'};
        if (table === 'profiles') data = {role:state.botRole,display_name:'Character',username:'character'};
        if (table === 'personas') data = null;
        if (table === 'messages' && state.regeneration) data=[{id:'00000000-0000-0000-0000-000000000020',sender_id:'00000000-0000-0000-0000-000000000003',content:'Committed replacement',profiles:{role:'ai_character'}},{id:'human-message',sender_id:'human',content:'Hello',profiles:{role:'user'}}];
        else if (table === 'messages') data = [{id:'human-message',sender_id:'human',content:'Hello',profiles:{role:'user'}}];
        if (table === 'chimera_user_preferences') data = {default_ai_model:state.model};
        return {data,error:null};
      }
      return query;
    },
    rpc: async (name: string, args: Record<string, unknown>) => {
      state.calls.push(name);
      if(name==='can_access_chimera_project')return {data:state.writingAllowed,error:null};
      if (name === 'reserve_chimera_ai_request') { state.reserveKeys.push(String(args.p_request_key)); return {data:{state:state.reservation,id:'request',lease:'lease',result:String(args.p_resource).startsWith('writing:')?{suggestion:'Cached proposal'}:{reply:'Cached reply'}},error:null}; }
      if(name==='reserve_chimera_room_ai')return {data:{state:state.reservation,id:'request',lease:'lease',result:{reply:'Cached room reply'}},error:null};
      if(name==='get_human_room_continuity')return {data:[],error:null};
      if(name==='complete_chimera_room_ai')return {data:{reply:'Saved shared reply'},error:null};
      if(name==='refresh_chimera_continuity')return {data:{sources:[]},error:null};
      if (name === 'begin_guarded_chimera_illustration') return {data:null,error:{message:'sensitive database detail'}};
      if (name === 'get_chimera_ai_request') return {data:state.beginCase === 'unknown' ? null : {state:'running',result:state.beginCase === 'charged' ? {illustration_id:'synthetic-illustration'} : null},error:state.beginCase === 'unknown' ? {message:'connection lost'} : null};
      return {data:null,error:null};
    },
  }),
}));

import {loadLinkedLore} from '../api/_lib/linkedLore';
import type {SupabaseClient} from '@supabase/supabase-js';
import handler from '../api/ai-chat';
import voice from '../api/voice';
import roomAi from '../api/room-ai';
import illustration from '../api/generate-scene-illustration';
import writing from '../api/writing-suggestions';

const request = () => new Request('https://example.invalid/api/ai-chat', {
  method:'POST', headers:{Authorization:'Bearer synthetic-test-token'},
  body:JSON.stringify({conversation_id:'00000000-0000-0000-0000-000000000010',bot_user_id:'00000000-0000-0000-0000-000000000003'}),
});

describe('AI security boundary with synthetic clients; no real providers', () => {
  beforeEach(() => {
    Object.assign(state,{authenticated:true,botMember:true,botRole:'ai_character',reservation:'reserved',model:'gemini-2.5-flash',calls:[],reserveKeys:[],beginCase:'',roomEnabled:false,roomConsent:true});
    state.roomEnabled=false;state.roomConsent=true;state.regeneration=false;state.writingAllowed=true;
    vi.stubEnv('VITE_SUPABASE_URL','https://example.invalid');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY','synthetic-public-test-key');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY','synthetic-server-test-key');
    vi.stubEnv('GEMINI_API_KEY','synthetic-provider-test-key');
    vi.stubEnv('GEMINI_API_KEY_SERVER','synthetic-provider-test-key');
    vi.stubGlobal('fetch',vi.fn(async () => new Response(JSON.stringify({candidates:[{content:{parts:[{text:'The character answers softly.'}]}}]}),{status:200})));
  });
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
  it('rejects unauthenticated, nonmember bot and human-target impersonation before provider spend', async () => {
    state.authenticated=false; expect((await handler(request())).status).toBe(401);
    state.authenticated=true; state.botMember=false; expect((await handler(request())).status).toBe(403);
    state.botMember=true; state.botRole='user'; expect((await handler(request())).status).toBe(403);
    expect(fetch).not.toHaveBeenCalled();
  });
  it('replays completed turns and rejects concurrent requests without another provider call', async () => {
    state.reservation='completed'; expect(await (await handler(request())).json()).toEqual({reply:'Cached reply'});
    state.reservation='busy'; expect((await handler(request())).status).toBe(409);
    state.reservation='limited'; expect((await handler(request())).status).toBe(429);
    expect(fetch).not.toHaveBeenCalled();
  });
  it('keeps normal model/prompt behavior and commits through the service-only atomic writer', async () => {
    const response = await handler(request()); expect(response.status).toBe(200);
    expect(state.calls).toContain('complete_chimera_chat_request');
    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(String(url)).toContain('gemini-2.5-flash:generateContent');
    expect(JSON.parse(init!.body as string).systemInstruction.parts[0].text).toContain('Creator-authored identity');
    expect(init!.signal).toBeTruthy();
  });
  it('blocks arbitrary model IDs and sanitizes provider errors while releasing failed leases', async () => {
    state.model='attacker/custom-expensive-model'; expect((await handler(request())).status).toBe(400); expect(fetch).not.toHaveBeenCalled();
    state.model='gemini-2.5-flash'; vi.mocked(fetch).mockResolvedValue(new Response('sensitive provider details',{status:500}));
    const response = await handler(request()); expect(response.status).toBe(502);
    expect(await response.text()).not.toContain('sensitive');
    expect(state.calls).toContain('finish_chimera_ai_request');
  });

  it('deduplicates opening snapshots across different transport identifiers', async () => {
    for (const key of ['first-tab','second-tab']) {
      await handler(new Request('https://example.invalid/api/ai-chat',{method:'POST',headers:{Authorization:'Bearer test','Idempotency-Key':key},body:JSON.stringify({conversation_id:'00000000-0000-0000-0000-000000000010',bot_user_id:'00000000-0000-0000-0000-000000000003',is_initiation:true})}));
    }
    expect(state.reserveKeys).toHaveLength(2);
    expect(state.reserveKeys[0]).toBe(state.reserveKeys[1]);
  });
  it('reconciles failed illustration reservations before releasing or refunding', async () => {
    const req = () => new Request('https://example.invalid/api/generate-scene-illustration',{method:'POST',headers:{Authorization:'Bearer test','Idempotency-Key':'stable-key'},body:JSON.stringify({story_id:'00000000-0000-0000-0000-000000000010',prompt:'A scene',style:'cinematic',aspect_ratio:'16:9'})});
    expect((await illustration(req())).status).toBe(400);
    expect(state.calls).toContain('get_chimera_ai_request');
    expect(state.calls).toContain('finish_chimera_ai_request');
    state.calls=[]; state.beginCase='charged';
    expect((await illustration(req())).status).toBe(502);
    expect(state.calls).toContain('refund_vellum_scene_illustration');
    state.calls=[]; state.beginCase='unknown';
    expect((await illustration(req())).status).toBe(503);
    expect(state.calls).not.toContain('finish_chimera_ai_request');
    expect(state.calls).not.toContain('refund_vellum_scene_illustration');
    expect(fetch).not.toHaveBeenCalled();
  });
  it('lost regeneration acknowledgements replay the same operation despite changed content, while stale fresh jobs spend nothing',async()=>{
    state.regeneration=true;
    const regenerate=()=>new Request('https://example.invalid/api/ai-chat',{method:'POST',headers:{Authorization:'Bearer synthetic-test-token','Idempotency-Key':'stable-regeneration-id'},body:JSON.stringify({conversation_id:'00000000-0000-0000-0000-000000000010',bot_user_id:'00000000-0000-0000-0000-000000000003',is_swipe:true,target_message_id:'00000000-0000-0000-0000-000000000020',expected_content:'Original response'})});
    state.reservation='completed';expect(await(await handler(regenerate())).json()).toEqual({reply:'Cached reply'});
    state.reservation='reserved';expect((await handler(regenerate())).status).toBe(409);expect(fetch).not.toHaveBeenCalled();
  });
  it('hybrid requires room mode and unanimous consent before provider spend',async()=>{
    const req=()=>new Request('https://example.invalid/api/room-ai',{method:'POST',headers:{Authorization:'Bearer synthetic-test-token'},body:JSON.stringify({session_id:'00000000-0000-0000-0000-000000000010',character_id:'00000000-0000-0000-0000-000000000003'})});
    expect((await roomAi(req())).status).toBe(403);
    state.roomEnabled=true;state.roomConsent=false;expect((await roomAi(req())).status).toBe(403);expect(fetch).not.toHaveBeenCalled();
    state.roomConsent=true;state.reservation='completed';expect(await (await roomAi(req())).json()).toEqual({reply:'Cached room reply'});expect(fetch).not.toHaveBeenCalled();
  });
  it('shared-room AI never loads private cabinets or private personas',async()=>{
    state.roomEnabled=true;
    const req=new Request('https://example.invalid/api/room-ai',{method:'POST',headers:{Authorization:'Bearer synthetic-test-token'},body:JSON.stringify({session_id:'00000000-0000-0000-0000-000000000010',character_id:'00000000-0000-0000-0000-000000000003'})});
    expect((await roomAi(req)).status).toBe(200);
    expect(state.calls).not.toContain('query:character_memories');expect(state.calls).not.toContain('query:personas');expect(state.calls).toContain('complete_chimera_room_ai');
  });
  it('voice requires authentication and rejects arbitrary voice paths before transport', async () => {
    state.authenticated=false;
    expect((await voice(new Request('https://example.invalid/api/voice',{method:'POST',headers:{Authorization:'Bearer test'},body:'{}'}))).status).toBe(401);
    state.authenticated=true;
    expect((await voice(new Request('https://example.invalid/api/voice',{method:'POST',headers:{Authorization:'Bearer test'},body:JSON.stringify({text:'Sample',voice_id:'../../arbitrary'})}))).status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });
});


it('privileged lore lookup excludes a different creator’s private world while preserving shared and creator-owned lore',async()=>{
 let visibility='private',worldOwner='other-creator',entriesRead=0;
 const client={from:(table:string)=>{let query:unknown;query=new Proxy({}, {get:(_,name)=>name==='then'?(resolve:(value:unknown)=>void)=>{const data=table==='lorebook_worlds'?[{lorebook_id:'world-lore',lorebook:{user_id:worldOwner},world:{user_id:worldOwner,visibility}}]:table==='lorebook_entries'?[{id:'entry',title:'World fact',content:'Creator world detail',keywords:[],priority:1,enabled:true,insertion_order:0,is_constant:true,case_sensitive:false}]:[];if(table==='lorebook_entries')entriesRead++;return Promise.resolve({data,error:null}).then(resolve);}:()=>query});return query;}} as unknown as SupabaseClient;
 const params={characterId:'character',creatorId:'character-creator',worldId:'world',userId:'reader',recentText:[]};
 expect((await loadLinkedLore(client,client,params)).entries).toHaveLength(0);expect(entriesRead).toBe(0);
 visibility='public';expect((await loadLinkedLore(client,client,params)).entries).toHaveLength(1);
 visibility='private';worldOwner='character-creator';expect((await loadLinkedLore(client,client,params)).entries).toHaveLength(1);
});

describe('Optional writing API uses existing auth/budget and never writes manuscripts',()=>{
 const req=()=>new Request('https://example.invalid/api/writing-suggestions',{method:'POST',headers:{Authorization:'Bearer synthetic-token'},body:JSON.stringify({story_id:'00000000-0000-0000-0000-000000000050',chapter_id:'00000000-0000-0000-0000-000000000051',request_id:'00000000-0000-0000-0000-000000000052',content:'The human manuscript.',action:'continue',tone:'poetic'})});
 beforeEach(()=>{state.authenticated=true;state.writingAllowed=true;state.reservation='reserved';state.model='gemini-2.5-flash';state.calls=[];vi.stubEnv('VITE_SUPABASE_URL','https://example.invalid');vi.stubEnv('VITE_SUPABASE_ANON_KEY','synthetic-key');vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY','synthetic-server-key');vi.stubEnv('GEMINI_API_KEY_SERVER','synthetic-provider-key');vi.stubGlobal('fetch',vi.fn(async()=>new Response(JSON.stringify({candidates:[{content:{parts:[{text:'Optional idea'}]}}]}),{status:200})))});
 afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs()});
 it('requires edit permission before provider work',async()=>{state.writingAllowed=false;expect((await writing(req())).status).toBe(403);expect(fetch).not.toHaveBeenCalled();expect(state.calls).not.toContain('reserve_chimera_ai_request')});
 it('returns a proposal without a manuscript/canon mutation',async()=>{const result=await writing(req());expect(result.status).toBe(200);expect(await result.json()).toMatchObject({suggestion:'Optional idea',canon:false});expect(state.calls).toContain('finish_chimera_ai_request');expect(state.calls).not.toContain('complete_chimera_chat_request')});
 it('replays a completed request without another provider call',async()=>{state.reservation='completed';expect((await writing(req())).status).toBe(200);expect(fetch).not.toHaveBeenCalled()});
});
