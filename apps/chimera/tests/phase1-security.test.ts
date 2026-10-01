import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {fixture,ids} from './fixtures/chimeraDatabase.js';

test('authorization blocks original flaws and alternate identity mutations; legitimate edits/greeting survive', async () => {
  const db = await fixture();
  try {
    await db.exec(`SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub','${ids.alice}',false)`);
    await assert.rejects(db.exec(`INSERT INTO conversations(id,created_by) VALUES(gen_random_uuid(),'${ids.bob}')`), /ownership/);
    await assert.rejects(db.exec(`UPDATE profiles SET role='admin' WHERE user_id='${ids.alice}'`), /permissions/);
    await assert.rejects(db.exec(`UPDATE profiles SET access_level='whisprr' WHERE user_id='${ids.alice}'`), /permissions/);
    await db.exec(`UPDATE profiles SET display_name='Author' WHERE user_id='${ids.alice}'`);
    await assert.rejects(db.exec(`UPDATE ai_characters SET user_id='${ids.bob}' WHERE id='${ids.character}'`), /identities/);
    await assert.rejects(db.exec(`SELECT respond_as_ai_character('${ids.chat}','${ids.bob}','Spoofed human')`), /authored/);
    await assert.rejects(db.exec(`SELECT respond_as_ai_character('${ids.chat}','${ids.bot}','Injected AI reply')`), /authored/);
    await db.exec(`SELECT respond_as_ai_character('${ids.chat}','${ids.bot}','Authored opening'); SELECT respond_as_ai_character('${ids.chat}','${ids.bot}','Authored opening');`);
    assert.equal((await db.query('SELECT * FROM messages')).rows.length,1);
    await assert.rejects(db.exec(`UPDATE messages SET sender_id='${ids.alice}'`), /identity/);
    await assert.rejects(db.exec(`INSERT INTO lorebook_worlds VALUES('${ids.lore}','${ids.world}')`), /row-level/);
    await db.exec(`INSERT INTO lorebook_characters VALUES('${ids.lore}','${ids.character}')`);
    await assert.rejects(db.exec(`INSERT INTO conversation_participants(conversation_id,user_id) VALUES('${ids.otherChat}','${ids.alice}')`), /row-level/);
    await db.exec('RESET ROLE');
    await db.exec(`INSERT INTO human_roleplay_participants(session_id,user_id) VALUES('${ids.chat}','${ids.alice}'); SET ROLE authenticated;`);
    await assert.rejects(db.exec(`UPDATE human_roleplay_participants SET role='creator'`), /Membership/);
    await db.exec(`UPDATE human_roleplay_participants SET status='left'`);
    await assert.rejects(db.exec(`UPDATE human_roleplay_participants SET status='accepted'`), /Membership/);
    await assert.rejects(db.exec(`INSERT INTO human_roleplay_messages(session_id,sender_id,content,sequence_number) VALUES('${ids.chat}','${ids.alice}','Bypass',1)`), /permission denied/);
    await assert.rejects(db.exec(`SELECT reserve_chimera_ai_request('${ids.alice}','chat','scope','key','${'a'.repeat(64)}')`), /permission denied/);
    // Definer character saves can still maintain bot profiles on the trusted path.
    await db.exec(`RESET ROLE; CREATE FUNCTION public.test_trusted_bot_update() RETURNS void LANGUAGE sql SECURITY DEFINER AS $$ UPDATE profiles SET role='ai_character',display_name='Edited bot' WHERE user_id='${ids.bot}' $$; SET ROLE authenticated; SELECT test_trusted_bot_update(); RESET ROLE;`);
  } finally { await db.close(); }
});

test('durable admissions enforce concurrency, fingerprints, replay and atomic chat completion', async () => {
  const db = await fixture();
  try {
    await db.exec('SET ROLE service_role');
    async function reserve(key: string, resource = `${ids.chat}:${ids.bot}`, hash = 'a'.repeat(64)) {
      return (await db.query<{job:{state:string,id:string,lease:string,result?:unknown}}>(`SELECT reserve_chimera_ai_request('${ids.alice}','chat',$1,$2,$3) AS job`,[resource,key,hash])).rows[0].job;
    }
    const first = await reserve('one'); assert.equal(first.state,'reserved');
    assert.equal((await reserve('one')).state,'busy');
    assert.equal((await reserve('one',undefined,'b'.repeat(64))).state,'conflict');
    assert.equal((await reserve('two')).state,'busy');
    const second = await reserve('two','second-resource'); assert.equal(second.state,'reserved');
    assert.equal((await reserve('three','third-resource')).state,'busy');
    await assert.rejects(db.exec(`SELECT complete_chimera_chat_request('${first.id}','${first.lease}','${ids.chat}','${ids.bob}','Spoof')`), /reservation/);
    await db.exec(`SELECT complete_chimera_chat_request('${first.id}','${first.lease}','${ids.chat}','${ids.bot}','A genuine reply'); SELECT complete_chimera_chat_request('${first.id}','${first.lease}','${ids.chat}','${ids.bot}','A genuine reply');`);
    assert.equal((await db.query('SELECT * FROM messages')).rows.length,1);
    assert.deepEqual((await reserve('one')).result,{reply:'A genuine reply'});
    await db.exec(`SELECT finish_chimera_ai_request('${second.id}','${second.lease}',null,true)`);
    assert.equal((await reserve('two','second-resource')).state,'reserved');
    await db.exec(`SELECT finish_chimera_ai_request('${first.id}','${first.lease}',null,true)`).catch(() => undefined);
    await db.exec(`RESET ROLE; UPDATE chimera_private.ai_requests SET state='failed' WHERE state='running'; SET ROLE service_role;`);
    const illustration = (await db.query<{job:{id:string,lease:string}}>(`SELECT reserve_chimera_ai_request('${ids.alice}','illustration','story','illustration-retry','${'a'.repeat(64)}') AS job`)).rows[0].job;
    // Cleanup must re-check the charged result after waiting on the row lock.
    await db.exec(`RESET ROLE; UPDATE chimera_private.ai_requests SET result=jsonb_build_object('illustration_id','${ids.world}') WHERE id='${illustration.id}'; INSERT INTO story_scene_illustrations VALUES('${ids.world}','generating'); SET ROLE service_role;`);
    await assert.rejects(db.exec(`SELECT finish_chimera_ai_request('${illustration.id}','${illustration.lease}',null,true)`), /active/);
    await db.exec('RESET ROLE');
    assert.equal((await db.query<{state:string}>(`SELECT state FROM chimera_private.ai_requests WHERE id='${illustration.id}'`)).rows[0].state,'running');
    await db.exec(`RESET ROLE; UPDATE story_scene_illustrations SET status='refunded'; SET ROLE service_role; SELECT finish_chimera_ai_request('${illustration.id}','${illustration.lease}',null,true)`);
    await db.exec(`RESET ROLE; INSERT INTO chimera_private.ai_attempts(user_id,operation) SELECT '${ids.alice}','chat' FROM generate_series(1,60); SET ROLE service_role;`);
    assert.equal((await reserve('rate-capped','fourth-resource')).state,'limited');
  } finally { await db.close(); }
});

test('both prepared migrations can be reapplied without losing existing users, messages or reservations', async () => {
  const db = await fixture();
  try {
    await db.exec(`INSERT INTO messages(conversation_id,sender_id,content) VALUES('${ids.chat}','${ids.alice}','Keep my words'); SET ROLE service_role; SELECT reserve_chimera_ai_request('${ids.alice}','voice','voice','retry','${'a'.repeat(64)}'); RESET ROLE;`);
    const tables=['profiles','ai_characters','conversations','conversation_participants','messages','chimera_private.ai_requests','chimera_private.ai_attempts'];
    const before=await Promise.all(tables.map(table=>db.query(`SELECT to_jsonb(t) AS row FROM ${table} t ORDER BY to_jsonb(t)::text`)));
    const root = new URL('../../../supabase/migrations/', import.meta.url);
    for(const name of ['20260930150022_chimera_phase1_authorization.sql','20260930150040_chimera_phase1_request_protection.sql']) await db.exec(await readFile(new URL(name,root),'utf8'));
    for(let i=0;i<tables.length;i++) assert.deepEqual((await db.query(`SELECT to_jsonb(t) AS row FROM ${tables[i]} t ORDER BY to_jsonb(t)::text`)).rows,before[i].rows);
  } finally { await db.close(); }
});

test('legitimate scene creation, participant personas, character edits and AI edits remain authorized', async () => {
  const db=await fixture();
  try {
    await db.exec(`INSERT INTO personas VALUES('${ids.lore}','${ids.alice}'); SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub','${ids.alice}',false); INSERT INTO conversations(id,created_by) VALUES('${ids.world}','${ids.alice}'); INSERT INTO conversation_participants(conversation_id,user_id,persona_id) VALUES('${ids.world}','${ids.alice}','${ids.lore}'); UPDATE ai_characters SET greeting='Revised opening' WHERE id='${ids.character}'; SELECT respond_as_ai_character('${ids.chat}','${ids.bot}','Revised opening'); UPDATE messages SET content='Creator edit' WHERE sender_id='${ids.bot}'; RESET ROLE; INSERT INTO messages(conversation_id,sender_id,content) VALUES('${ids.chat}','${ids.bob}','Human words'); SET ROLE authenticated; UPDATE messages SET read=true WHERE sender_id='${ids.bob}';`);
    await assert.rejects(db.exec(`UPDATE messages SET content='Impersonation' WHERE sender_id='${ids.bob}'`),/author/);
    await db.exec(`SELECT set_config('request.jwt.claim.sub','${ids.bob}',false)`);
    await assert.rejects(db.exec(`UPDATE conversation_participants SET persona_id='${ids.lore}' WHERE user_id='${ids.bob}'`),/participant|row-level/);
  } finally {await db.close();}
});

test('actual existing wallet RPCs charge illustrations once, refund once and do not spend SHARDS', async () => {
  const db=await fixture();
  try {
    await db.exec(`
      CREATE TABLE stories(id uuid PRIMARY KEY,user_id uuid); CREATE TABLE story_chapters(id uuid PRIMARY KEY,story_id uuid);
      CREATE TABLE vellum_wallets(user_id uuid PRIMARY KEY,available_balance bigint,lifetime_spent bigint DEFAULT 0,updated_at timestamptz);
      CREATE TABLE vellum_ledger(wallet_user_id uuid,amount bigint,entry_type text,description text,reference_type text,reference_id uuid);
      ALTER TABLE story_scene_illustrations ALTER COLUMN id SET DEFAULT gen_random_uuid();
      ALTER TABLE story_scene_illustrations ALTER COLUMN status SET DEFAULT 'generating';
      ALTER TABLE story_scene_illustrations ADD user_id uuid, ADD story_id uuid, ADD chapter_id uuid, ADD prompt text, ADD style text, ADD aspect_ratio text, ADD vellum_cost integer, ADD storage_path text, ADD completed_at timestamptz, ADD refunded_at timestamptz;
      INSERT INTO stories VALUES('${ids.world}','${ids.alice}'); INSERT INTO vellum_wallets(user_id,available_balance) VALUES('${ids.alice}',1200);
      CREATE TABLE shards_wallets(user_id uuid PRIMARY KEY,available_balance bigint,lifetime_earned bigint DEFAULT 0,updated_at timestamptz);
      CREATE TABLE shards_ledger(wallet_user_id uuid,amount bigint,entry_type text,description text,reference_type text,reference_id uuid);
      INSERT INTO shards_wallets(user_id,available_balance) VALUES('${ids.alice}',50);
    `);
    const original=await readFile(new URL('../../../supabase/migrations/20260814194339_add_vellum_scene_illustrations.sql',import.meta.url),'utf8');
    for(const sql of original.match(/CREATE OR REPLACE FUNCTION[\s\S]*?\$\$;/g) || []) await db.exec(sql);
    const reserve=async(key:string)=>(await db.query<{job:{id:string,lease:string,state:string}}>(`SELECT reserve_chimera_ai_request('${ids.alice}','illustration','${ids.world}',$1,'${'a'.repeat(64)}') AS job`,[key])).rows[0].job;
    await db.exec('SET ROLE service_role'); const job=await reserve('one');
    const begin=()=>db.query<{id:string}>(`SELECT begin_guarded_chimera_illustration('${job.id}','${job.lease}','${ids.world}',null,'A fictional moonlit forest','cinematic','16:9') AS id`);
    const first=(await begin()).rows[0].id; assert.equal((await begin()).rows[0].id,first);
    assert.equal((await reserve('one')).state,'busy');
    await db.exec(`SELECT refund_vellum_scene_illustration('${first}'); SELECT refund_vellum_scene_illustration('${first}'); SELECT finish_chimera_ai_request('${job.id}','${job.lease}',null,true); RESET ROLE;`);
    assert.equal((await db.query<{balance:number}>('SELECT available_balance AS balance FROM vellum_wallets')).rows[0].balance,1200);
    assert.equal((await db.query('SELECT * FROM vellum_ledger')).rows.length,2);
    await db.exec('SET ROLE service_role'); const next=await reserve('two');
    await db.exec(`SELECT begin_guarded_chimera_illustration('${next.id}','${next.lease}','${ids.world}',null,'A fictional moonlit forest','cinematic','16:9'); SELECT complete_guarded_chimera_illustration('${next.id}','${next.lease}','owned-path','{"illustration":{"id":"saved"}}');`);
    assert.equal((await reserve('two')).state,'completed'); await db.exec('RESET ROLE');
    assert.equal((await db.query<{balance:number}>('SELECT available_balance AS balance FROM vellum_wallets')).rows[0].balance,800);
    assert.equal((await db.query<{balance:number}>('SELECT available_balance AS balance FROM shards_wallets')).rows[0].balance,50);
    assert.equal((await db.query('SELECT * FROM shards_ledger')).rows.length,0);
  } finally {await db.close();}
});
