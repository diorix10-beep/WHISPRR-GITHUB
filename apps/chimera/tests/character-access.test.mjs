import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { database, identity, ids, verify, user, owner, sfw, mature, nsfw, privateId, bot, scene, room } from './fixtures/characterAccessDatabase.mjs';
const root = new URL('../../../', import.meta.url);

test('database denies direct IDs and related data to anonymous/unverified; verified adults must opt in', async () => {
  const db = await database();
  try {
    for (const [role,id] of [['anon',''], ['authenticated',user], ['authenticated',owner]]) {
      await identity(db,role,id);
      assert.deepEqual(await ids(db), role === 'anon' ? [] : [sfw]);
      assert.deepEqual((await db.query('SELECT * FROM profiles WHERE user_id=$1',[bot])).rows, []);
      assert.deepEqual((await db.query('SELECT greeting,personality FROM ai_characters WHERE id=$1',[mature])).rows, []);
      for (const table of ['character_memories','character_relationships','world_characters','lorebook_characters',
        'ai_character_likes','ai_character_followers','conversations','messages','conversation_participants',
        'human_roleplay_sessions','human_roleplay_characters','human_roleplay_messages','roleplay_public_scenes','roleplay_public_scene_messages']) {
        assert.deepEqual((await db.query(`SELECT * FROM ${table}`)).rows, [], `${role}: ${table} leaked`);
      }
    }
    await verify(db,false);
    await identity(db,'authenticated',user);
    assert.deepEqual(await ids(db),[sfw]);
    await verify(db,true);
    await identity(db,'authenticated',user);
    assert.deepEqual(await ids(db),[sfw,mature,nsfw]);
    assert.equal((await db.query('SELECT greeting FROM ai_characters WHERE id=$1',[mature])).rows[0].greeting,'restricted greeting');
    assert.equal((await db.query('SELECT * FROM messages')).rows.length,1);
    // Removing consent takes effect without refreshing a JWT.
    await db.exec(`UPDATE chimera_user_preferences SET adult_content_enabled=false WHERE user_id='${user}'`);
    assert.deepEqual(await ids(db),[sfw]);
  } finally { await db.close(); }
});

test('privileged scene/room RPCs cannot bypass the gate; verification cannot be forged', async () => {
  const db = await database();
  try {
    await identity(db,'anon');
    await assert.rejects(db.query('SELECT public.create_chimera_scene($1)',[[bot]]),/permission denied/);
    await identity(db,'authenticated',user);
    await assert.rejects(db.exec(`INSERT INTO chimera_user_preferences(user_id,age_verification_status,adult_content_enabled)
      VALUES('${user}','verified_adult',true)`), /only be recorded/);
    assert.equal((await db.query(`SELECT chimera_private.is_conversation_member('${scene}') AS allowed`)).rows[0].allowed,false);
    await assert.rejects(db.query('SELECT public.create_chimera_scene($1)',[[bot]]),/Character unavailable/);
    await assert.rejects(db.query('SELECT public.respond_as_ai_character($1,$2,$3)',[scene,bot,'restricted greeting']),/Roleplay access required/);
    await assert.rejects(db.query('SELECT public.attach_human_room_character($1,null,$2)',[room,mature]),/Identity unavailable/);
    await assert.rejects(db.query('SELECT public.get_human_room_continuity($1)',[room]),/Room membership required/);
    await verify(db,true);
    await identity(db,'authenticated',user);
    assert.equal((await db.query(`SELECT chimera_private.is_conversation_member('${scene}') AS allowed`)).rows[0].allowed,true);
    await db.query('SELECT public.create_chimera_scene($1)',[[bot]]);
    await db.query('SELECT public.attach_human_room_character($1,null,$2)',[room,mature]);
    await db.query('SELECT public.get_human_room_continuity($1)',[room]);
  } finally { await db.close(); }
});

test('unknown ratings fail closed, safe scenes remain usable, and verification revocation is immediate', async () => {
  const db = await database();
  try {
    const ratings = [null, '', ' sfw ', 'FutureRating', '   ', 'mature', 'nsfw'];
    for (const [i,rating] of ratings.entries()) {
      await db.query('INSERT INTO ai_characters(id,user_id,creator_id,visibility,content_rating) VALUES($1,$2,$2,$3,$4)',
        [`00000000-0000-4000-8000-${String(100+i).padStart(12,'0')}`,owner,'public',rating]);
    }
    const safeScene='00000000-0000-4000-8000-000000000031';
    await db.exec(`INSERT INTO conversations(id,character_id,created_by) VALUES('${safeScene}','${sfw}','${user}');
      INSERT INTO conversation_participants(conversation_id,user_id) VALUES('${safeScene}','${user}');`);
    await identity(db,'authenticated',user);
    assert.equal((await ids(db)).length,4); // SFW, NULL, empty and normalized SFW
    assert.equal((await db.query('SELECT chimera_private.is_conversation_member($1) AS allowed',[safeScene])).rows[0].allowed,true);
    await verify(db,true);
    await identity(db,'authenticated',user);
    assert.equal((await ids(db)).length,10); // all except somebody else's private character
    await db.exec(`RESET ROLE; SELECT public.set_age_verification('${user}','unverified');`);
    await identity(db,'authenticated',user);
    assert.equal((await ids(db)).length,4);
    assert.deepEqual((await db.query('SELECT * FROM messages WHERE conversation_id=$1',[scene])).rows,[]);
    // New migration is repeatable without resetting verification or consent.
    await db.exec('RESET ROLE');
    await db.exec(await readFile(new URL('supabase/migrations/20261008104038_chimera_character_adult_authorization.sql',root),'utf8'));
  } finally { await db.close(); }
});

test('service-role completions and cached replies recheck the reserved user after consent/verification revocation', async () => {
  const db=await database();
  const requestId='00000000-0000-4000-8000-000000000050';
  const lease='00000000-0000-4000-8000-000000000051';
  const source='00000000-0000-4000-8000-000000000052';
  try {
    const messageId=(await db.query('SELECT id FROM messages WHERE conversation_id=$1',[scene])).rows[0].id;
    const characterId=(await db.query('SELECT id FROM human_roleplay_characters WHERE session_id=$1',[room])).rows[0].id;
    for (const operation of ['chat','regeneration','room']) {
      const resource=operation==='room'?`room:${room}:${characterId}`:`${scene}:${bot}`;
      const complete=()=> operation==='chat'
        ? db.query('SELECT public.complete_chimera_chat_request($1,$2,$3,$4,$5)',[requestId,lease,scene,bot,'new restricted reply'])
        : operation==='regeneration'
        ? db.query('SELECT public.complete_chimera_regeneration($1,$2,$3,$4,$5,$6,$7)',[requestId,lease,scene,bot,messageId,'restricted greeting','new restricted reply'])
        : db.query('SELECT public.complete_chimera_room_ai($1,$2,$3,$4,$5,$6)',[requestId,lease,room,characterId,source,'new restricted reply']);
      for(const revoke of ['consent','verification']) {
        await verify(db,true);
        await db.query(`INSERT INTO chimera_private.ai_requests(id,user_id,operation,resource,request_key,fingerprint,state,lease,expires_at)
          VALUES($1,$2,'chat',$3,$4,$5,'running',$6,now()+interval '2 minutes')
          ON CONFLICT(id) DO UPDATE SET state='running',resource=EXCLUDED.resource,request_key=EXCLUDED.request_key,result=null`,
          [requestId,user,resource,operation==='room'?`turn:${source}`:'test','a'.repeat(64),lease]);
        if(revoke==='consent') await db.query('UPDATE chimera_user_preferences SET adult_content_enabled=false WHERE user_id=$1',[user]);
        else await db.query("SELECT public.set_age_verification($1,'unverified')",[user]);
        await identity(db,'service_role'); // no member auth.uid(): authorization must use the reservation user
        await assert.rejects(complete(),/permission changed/);
        await assert.rejects(db.query('SELECT public.get_chimera_ai_request($1,$2)',[requestId,lease]),/permission changed/);
        await assert.rejects(db.query('SELECT public.reserve_chimera_ai_request($1,$2,$3,$4,$5)',
          [user,'chat',resource,'test','a'.repeat(64)]),/permission changed/);
        await db.exec('RESET ROLE');
        assert.equal((await db.query('SELECT state FROM chimera_private.ai_requests WHERE id=$1',[requestId])).rows[0].state,'running');
        assert.equal((await db.query('SELECT content FROM messages WHERE id=$1',[messageId])).rows[0].content,'restricted greeting');
        await db.query("UPDATE chimera_private.ai_requests SET state='completed',result='{"+ '"reply":"cached restricted reply"' + "}'::jsonb WHERE id=$1",[requestId]);
        await identity(db,'service_role');
        await assert.rejects(complete(),/permission changed/); // completed replay must also be denied
        await assert.rejects(db.query('SELECT public.get_chimera_ai_request($1,$2)',[requestId,lease]),/permission changed/);
        await db.exec('RESET ROLE');
      }
      await verify(db,true);
      await db.query("UPDATE chimera_private.ai_requests SET state='running',result=null WHERE id=$1",[requestId]);
      await identity(db,'service_role');
      await complete(); // same service endpoint still works for an eligible adult
      await db.exec('RESET ROLE');
      assert.equal((await db.query('SELECT state FROM chimera_private.ai_requests WHERE id=$1',[requestId])).rows[0].state,'completed');
      if(operation==='chat') await db.query('DELETE FROM messages WHERE id<>$1',[messageId]);
      if(operation==='regeneration') await db.query("UPDATE messages SET content='restricted greeting' WHERE id=$1",[messageId]);
    }
    await identity(db,'authenticated',user);
    await assert.rejects(db.query('SELECT public.get_chimera_ai_request($1,$2)',[requestId,lease]),/permission denied/);
  } finally {await db.close();}
});

test('hybrid access includes every accepted member and blocks another member revocation', async () => {
 const db=await database();
 try {
   const characterId=(await db.query('SELECT id FROM human_roleplay_characters WHERE session_id=$1',[room])).rows[0].id;
   const resource=`room:${room}:${characterId}`;
   await verify(db,true);
   await db.query('INSERT INTO human_roleplay_participants VALUES($1,$2,$3,true)',[room,owner,'accepted']);
   await db.query("SELECT public.set_age_verification($1,'verified_adult')",[owner]);
   await db.query('UPDATE chimera_user_preferences SET adult_content_enabled=true WHERE user_id=$1',[owner]);
   await db.query('SELECT chimera_private.require_character_request_access($1,$2)',[user,resource]);
   await db.query('UPDATE chimera_user_preferences SET adult_content_enabled=false WHERE user_id=$1',[owner]);
   await assert.rejects(db.query('SELECT chimera_private.require_character_request_access($1,$2)',[user,resource]),/Room permission changed/);
   await db.query("UPDATE human_roleplay_participants SET status='left' WHERE user_id=$1",[owner]);
   await db.query('SELECT chimera_private.require_character_request_access($1,$2)',[user,resource]);
 } finally {await db.close();}
});
