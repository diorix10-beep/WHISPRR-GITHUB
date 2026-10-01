import {phase234Database as database} from './fixtures/chimeraPhase234Database.js';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {ids} from './fixtures/chimeraDatabase.js';
const root=new URL('../../../supabase/migrations/',import.meta.url);
const migrations=['20260930170532_chimera_phase2_reliability.sql','20260930170728_chimera_phase3_continuity.sql','20260930171024_chimera_phase4_human_hybrid_rooms.sql'];
async function asUser(db:Awaited<ReturnType<typeof database>>,id=ids.alice){await db.exec(`RESET ROLE; SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub','${id}',false);`);}

test('Phase 2: atomic scene/persona contracts and non-destructive branch retries',async()=>{
 const db=await database();try{
  await db.exec(`INSERT INTO personas(id,user_id,is_default) VALUES('${ids.lore}','${ids.alice}',true);`);await asUser(db);
  const {rows:[{scene}]}=await db.query<{scene:{id:string}}>(`SELECT to_jsonb(create_chimera_scene(ARRAY['${ids.bot}']::uuid[])) AS scene`);
  await db.exec(`SELECT set_chimera_scene_persona('${scene.id}','${ids.lore}'); INSERT INTO messages(conversation_id,sender_id,content) VALUES('${scene.id}','${ids.alice}','First source');`);
  const {rows:[point]}=await db.query<{id:string,persona_id:string}>(`SELECT id,persona_id FROM messages WHERE conversation_id='${scene.id}'`);assert.equal(point.persona_id,ids.lore);
  await db.exec(`INSERT INTO messages(conversation_id,sender_id,content) VALUES('${scene.id}','${ids.alice}','Later source');`);
  const branch=async()=> (await db.query<{branch:{conversation_id:string}}>(`SELECT branch_chimera_conversation('${scene.id}','${point.id}','${ids.world}') AS branch`)).rows[0].branch;
  const first=await branch();assert.deepEqual(await branch(),first);
  assert.equal((await db.query(`SELECT * FROM messages WHERE conversation_id='${scene.id}'`)).rows.length,2);
  assert.equal((await db.query(`SELECT * FROM messages WHERE conversation_id='${first.conversation_id}'`)).rows.length,1);
  await asUser(db,ids.bob);await assert.rejects(db.exec(`SELECT set_chimera_scene_persona('${scene.id}','${ids.lore}')`),/access|own/);
 }finally{await db.close();}
});

test('Phase 3: older sources remain available, proposals are isolated and approval checks provenance',async()=>{
 const db=await database();try{
  await db.exec(`INSERT INTO messages(conversation_id,sender_id,content,created_at) SELECT '${ids.chat}','${ids.alice}','Original turn '||i,now()+i*interval '1 second' FROM generate_series(1,120) i;`);await asUser(db);
  const summary=(await db.query<{summary:{sources:Array<{id:string,excerpt:string}>}}>(`SELECT refresh_chimera_continuity('${ids.chat}') AS summary`)).rows[0].summary;
  assert.equal(summary.sources.length,88);assert.ok(summary.sources.some(s=>s.excerpt==='Original turn 1'));
  const source=summary.sources[0];
  const fact=(await db.query<{id:string}>(`SELECT propose_chimera_memory('${ids.chat}','${ids.character}','A creator-reviewed detail',ARRAY['${source.id}']::uuid[]) AS id`)).rows[0].id;
  await db.exec('RESET ROLE');const row=(await db.query<{approval_status:string,updated_at:string}>(`SELECT approval_status,updated_at::text FROM character_memories WHERE id='${fact}'`)).rows[0];assert.equal(row.approval_status,'proposed');
  await asUser(db,ids.bob);await assert.rejects(db.exec(`SELECT approve_chimera_memory('${fact}','${row.updated_at}',true)`),/changed/);
  await asUser(db);await db.exec(`UPDATE messages SET content='Changed source' WHERE id='${source.id}'`);
  await assert.rejects(db.exec(`SELECT approve_chimera_memory('${fact}','${row.updated_at}',false)`),/Source changed/);
 }finally{await db.close();}
});

test('Phase 4: human send retries, turn authority, unanimous consent and atomic AI authorship',async()=>{
 const db=await database();try{
  await asUser(db);
  const room=(await db.query<{room:{id:string}}>(`SELECT to_jsonb(create_human_roleplay_session('Shared story')) AS room`)).rows[0].room;
  const invite=(await db.query<{invite:{id:string}}>(`SELECT to_jsonb(invite_human_roleplay_user('${room.id}','${ids.bob}')) AS invite`)).rows[0].invite;
  await asUser(db,ids.bob);await db.exec(`SELECT accept_human_roleplay_invite('${invite.id}')`);await asUser(db);
  await assert.rejects(db.exec(`SELECT configure_human_room('${room.id}',true,'host',null)`),/opt in/);
  await db.exec(`SELECT set_my_human_room_preferences('${room.id}',null,true)`);await asUser(db,ids.bob);await db.exec(`SELECT set_my_human_room_preferences('${room.id}',null,true)`);await asUser(db);
  await db.exec(`SELECT configure_human_room('${room.id}',true,'host','${ids.alice}')`);
  const actor=(await db.query<{id:string}>(`SELECT attach_human_room_character('${room.id}',null,'${ids.character}') AS id`)).rows[0].id;
  await assert.rejects(db.exec(`UPDATE human_roleplay_participants SET ai_opt_in=false WHERE session_id='${room.id}' AND user_id='${ids.alice}'`),/authorized/);
  await assert.rejects(db.exec(`INSERT INTO human_roleplay_characters(session_id,owner_id,name,ai_character_id) VALUES('${room.id}','${ids.alice}','Forged attached identity','${ids.character}')`),/authorized identity/);
  const send=async()=> (await db.query<{message:{id:string}}>(`SELECT to_jsonb(send_human_roleplay_message('${room.id}','The human begins','dialogue',null,'${ids.lore}')) AS message`)).rows[0].message;
  const human=await send();assert.deepEqual(await send(),human);
  await asUser(db,ids.bob);await assert.rejects(db.exec(`SELECT send_human_roleplay_message('${room.id}','Out of turn','dialogue',null,'${ids.world}')`),/another participant/);
  await db.exec('RESET ROLE; SET ROLE service_role;');
  const reserve=()=>db.query<{job:{id:string,lease:string,state:string}}>(`SELECT reserve_chimera_room_ai('${ids.alice}','${room.id}','${actor}','${human.id}','${'a'.repeat(64)}') AS job`);
  const job=(await reserve()).rows[0].job;assert.equal(job.state,'reserved');assert.equal((await reserve()).rows[0].job.state,'busy');
  await db.exec(`SELECT complete_chimera_room_ai('${job.id}','${job.lease}','${room.id}','${actor}','${human.id}','A fictional answer'); SELECT complete_chimera_room_ai('${job.id}','${job.lease}','${room.id}','${actor}','${human.id}','A fictional answer');`);
  assert.equal((await reserve()).rows[0].job.state,'completed');
  await asUser(db);const turns=(await db.query<{author_kind:string,sender_id:string}>(`SELECT author_kind,sender_id FROM human_roleplay_messages WHERE session_id='${room.id}' ORDER BY sequence_number`)).rows;
  assert.equal(turns.length,2);assert.equal(turns[1].author_kind,'ai');assert.equal(turns[1].sender_id,ids.bot);
  await asUser(db);await db.exec(`UPDATE human_roleplay_messages SET content='A revised human turn' WHERE id='${human.id}'; UPDATE human_roleplay_characters SET name='Renamed actor' WHERE id='${actor}';`);
  await asUser(db,ids.bob);await db.exec(`SELECT set_my_human_room_preferences('${room.id}',null,false)`);await db.exec('RESET ROLE; SET ROLE service_role;');await assert.rejects(reserve(),/consent/);
 }finally{await db.close();}
});


test('Phase 2: regeneration replaces exactly the terminal response and rejects stale or earlier targets',async()=>{
 const db=await database();try{
  await db.exec(`INSERT INTO messages(conversation_id,sender_id,content) VALUES('${ids.chat}','${ids.bot}','Original response');`);
  const target=(await db.query<{id:string}>(`SELECT id FROM messages WHERE conversation_id='${ids.chat}'`)).rows[0].id;
  await db.exec('SET ROLE service_role');
  const job=(await db.query<{job:{id:string,lease:string}}>(`SELECT reserve_chimera_ai_request('${ids.alice}','chat','${ids.chat}:${ids.bot}','regenerate-one','${'a'.repeat(64)}') AS job`)).rows[0].job;
  await assert.rejects(db.exec(`SELECT complete_chimera_regeneration('${job.id}','${job.lease}','${ids.chat}','${ids.bot}','${target}','Wrong expected','New response')`),/changed/);
  await db.exec(`SELECT complete_chimera_regeneration('${job.id}','${job.lease}','${ids.chat}','${ids.bot}','${target}','Original response','New response'); SELECT complete_chimera_regeneration('${job.id}','${job.lease}','${ids.chat}','${ids.bot}','${target}','Original response','New response'); RESET ROLE;`);
  const rows=(await db.query<{content:string,response_versions:Array<{content:string}>}>('SELECT content,response_versions FROM messages')).rows;
  assert.equal(rows.length,1);assert.equal(rows[0].content,'New response');assert.equal(rows[0].response_versions[0].content,'Original response');
 }finally{await db.close();}
});


test('batch migrations are repeatable and preserve existing messages, facts and canon',async()=>{
 const db=await database();try{
  await asUser(db);await db.exec(`SELECT save_chimera_scene_canon('${ids.chat}',0,'Creator canon'); INSERT INTO messages(conversation_id,sender_id,content) VALUES('${ids.chat}','${ids.alice}','Keep this source'); INSERT INTO character_memories(character_id,user_id,content) VALUES('${ids.character}','${ids.alice}','Keep this approved fact');`);
  await db.exec('RESET ROLE');
  for(const migration of migrations)await db.exec(await readFile(new URL(migration,root),'utf8'));
  const scene=(await db.query<{memory_summary:string,canon_revision:number}>(`SELECT memory_summary,canon_revision FROM conversations WHERE id='${ids.chat}'`)).rows[0];assert.equal(scene.memory_summary,'Creator canon');assert.equal(Number(scene.canon_revision),1);
  assert.equal((await db.query('SELECT * FROM messages')).rows.length,1);
  assert.equal((await db.query(`SELECT * FROM character_memories WHERE content='Keep this approved fact' AND approval_status='approved'`)).rows.length,1);
  await asUser(db);await assert.rejects(db.exec(`SELECT save_chimera_scene_canon('${ids.chat}',0,'Stale canon')`),/changed/);
  await asUser(db,ids.bob);await assert.rejects(db.exec(`SELECT save_chimera_scene_canon('${ids.chat}',1,'Unauthorized canon')`),/creator/);
 }finally{await db.close();}
});

test('persona switching during generation fails closed and summaries remain persona/branch isolated',async()=>{
 const db=await database();try{
  await db.exec(`INSERT INTO personas(id,user_id) VALUES('${ids.lore}','${ids.alice}'),('${ids.world}','${ids.alice}');`);await asUser(db);
  await db.exec(`SELECT set_chimera_scene_persona('${ids.chat}','${ids.lore}'); INSERT INTO messages(conversation_id,sender_id,content,created_at) SELECT '${ids.chat}','${ids.alice}','Persona A turn '||i,now()+i*interval '1 second' FROM generate_series(1,40)i;`);
  const point=(await db.query<{id:string}>(`SELECT id FROM messages WHERE content='Persona A turn 35'`)).rows[0].id;
  const branch=(await db.query<{branch:{conversation_id:string}}>(`SELECT branch_chimera_conversation('${ids.chat}','${point}','${ids.lore}') branch`)).rows[0].branch;
  const summary=(await db.query<{summary:{sources:Array<{excerpt:string}>}}>(`SELECT refresh_chimera_continuity('${branch.conversation_id}') summary`)).rows[0].summary;assert.equal(summary.sources.length,3);assert.ok(summary.sources.every(s=>!s.excerpt.includes('36')));
  await db.exec('RESET ROLE; SET ROLE service_role');
  const job=(await db.query<{job:{id:string,lease:string}}>(`SELECT reserve_chimera_ai_request('${ids.alice}','chat','${ids.chat}:${ids.bot}','persona-bound','${'b'.repeat(64)}') job`)).rows[0].job;
  await db.exec(`SELECT bind_chimera_persona_request('${job.id}','${job.lease}','${ids.lore}')`);
  await asUser(db);await db.exec(`SELECT set_chimera_scene_persona('${ids.chat}','${ids.world}')`);
  const otherSummary=(await db.query<{summary:{sources:unknown[]}}>(`SELECT refresh_chimera_continuity('${ids.chat}') summary`)).rows[0].summary;assert.equal(otherSummary.sources.length,0);
  await db.exec('RESET ROLE; SET ROLE service_role');await assert.rejects(db.exec(`SELECT complete_chimera_chat_request('${job.id}','${job.lease}','${ids.chat}','${ids.bot}','Must not persist')`),/Persona|persona/);
  await db.exec('RESET ROLE');assert.equal((await db.query(`SELECT * FROM messages WHERE sender_id='${ids.bot}'`)).rows.length,0);
 }finally{await db.close();}
});

test('saved response variants are durable, creator-only and cannot rewrite later history',async()=>{
 const db=await database();try{
  await db.exec(`INSERT INTO messages(conversation_id,sender_id,content,response_versions) VALUES('${ids.chat}','${ids.bot}','Current answer','[{"content":"Previous answer"}]');`);
  const target=(await db.query<{id:string}>('SELECT id FROM messages')).rows[0].id;
  await asUser(db);await db.exec(`SELECT restore_chimera_response_variant('${ids.chat}','${target}','Current answer','Previous answer')`);
  await assert.rejects(db.exec(`SELECT restore_chimera_response_variant('${ids.chat}','${target}','Previous answer','Invented answer')`),/saved/);
  await asUser(db,ids.bob);await assert.rejects(db.exec(`SELECT restore_chimera_response_variant('${ids.chat}','${target}','Previous answer','Current answer')`),/creator/);
  await asUser(db);await db.exec(`INSERT INTO messages(conversation_id,sender_id,content,created_at) VALUES('${ids.chat}','${ids.alice}','Later turn',now()+interval '1 minute')`);
  await assert.rejects(db.exec(`SELECT restore_chimera_response_variant('${ids.chat}','${target}','Previous answer','Current answer')`),/Branch/);
 }finally{await db.close();}
});

test('room creator notes reject stale revisions and another participant cannot change shared canon',async()=>{
 const db=await database();try{
  await asUser(db);
  const room=(await db.query<{room:{id:string}}>(`SELECT to_jsonb(create_human_roleplay_session('Shared notes')) room`)).rows[0].room;
  const original=(await db.query<{updated_at:string}>(`SELECT updated_at::text FROM human_roleplay_sessions WHERE id='${room.id}'`)).rows[0].updated_at;
  await db.exec(`UPDATE human_roleplay_sessions SET lore='Reviewed by the host' WHERE id='${room.id}'`);
  const stale=await db.query(`UPDATE human_roleplay_sessions SET lore='Old draft' WHERE id='${room.id}' AND updated_at='${original}' RETURNING id`);assert.equal(stale.rows.length,0);
  await asUser(db,ids.bob);assert.equal((await db.query(`UPDATE human_roleplay_sessions SET lore='Unauthorized canon' WHERE id='${room.id}' RETURNING id`)).rows.length,0);
  await asUser(db);assert.equal((await db.query<{lore:string}>(`SELECT lore FROM human_roleplay_sessions WHERE id='${room.id}'`)).rows[0].lore,'Reviewed by the host');
 }finally{await db.close();}
});
