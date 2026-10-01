import { phase234Database } from "./fixtures/chimeraPhase234Database.js";
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fixture, ids } from "./fixtures/chimeraDatabase.js";
const root = new URL("../../../supabase/migrations/", import.meta.url);
const story = "00000000-0000-0000-0000-000000000050",
  chapter = "00000000-0000-0000-0000-000000000051",
  otherChapter = "00000000-0000-0000-0000-000000000052";
async function database() {
  const db = await fixture();
  await db.exec(`
 CREATE TABLE stories(id uuid PRIMARY KEY,user_id uuid,title text); ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
 CREATE POLICY author_story ON stories FOR ALL TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());
 CREATE TABLE story_chapters(id uuid PRIMARY KEY,story_id uuid,title text,content text,status text DEFAULT 'draft',choices jsonb DEFAULT '[]',published_at timestamptz,created_at timestamptz DEFAULT now(),updated_at timestamptz DEFAULT now());
 ALTER TABLE story_chapters ENABLE ROW LEVEL SECURITY;
 CREATE POLICY author_chapters ON story_chapters FOR ALL TO authenticated USING(EXISTS(SELECT 1 FROM stories WHERE id=story_id AND user_id=auth.uid())) WITH CHECK(EXISTS(SELECT 1 FROM stories WHERE id=story_id AND user_id=auth.uid()));
 ALTER TABLE worlds ADD name text DEFAULT 'World',ADD description text DEFAULT '',ADD scenario text DEFAULT '',ADD tags text[] DEFAULT '{}',ADD cover_url text,ADD visibility text DEFAULT 'private',ADD updated_at timestamptz DEFAULT now();
 ALTER TABLE worlds ENABLE ROW LEVEL SECURITY; CREATE POLICY author_world ON worlds FOR ALL TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());
 CREATE TABLE world_locations(id uuid PRIMARY KEY,world_id uuid,name text); CREATE TABLE world_factions(LIKE world_locations INCLUDING ALL); CREATE TABLE world_timeline_events(LIKE world_locations INCLUDING ALL);
 ALTER TABLE world_locations ENABLE ROW LEVEL SECURITY;ALTER TABLE world_factions ENABLE ROW LEVEL SECURITY;ALTER TABLE world_timeline_events ENABLE ROW LEVEL SECURITY;
 GRANT ALL ON stories,story_chapters,world_locations,world_factions,world_timeline_events TO authenticated,service_role;
 INSERT INTO stories VALUES('${story}','${ids.alice}','Private story'),('${ids.lore}','${ids.bob}','Other story');
 INSERT INTO story_chapters(id,story_id,title,content) VALUES('${chapter}','${story}','Draft','Original'),('${otherChapter}','${ids.lore}','Other','Private');
 INSERT INTO world_locations VALUES('${ids.character}','${ids.world}','Real place');
 `);
  for (const name of [
    "20260930190706_chimera_phase5_storytelling.sql",
    "20260930190733_chimera_privacy_requests.sql",
  ])
    await db.exec(await readFile(new URL(name, root), "utf8"));
  return db;
}
async function asUser(
  db: Awaited<ReturnType<typeof database>>,
  id = ids.alice,
) {
  await db.exec(
    `RESET ROLE;SET ROLE authenticated;SELECT set_config('request.jwt.claim.sub','${id}',false);`,
  );
}
test("Story collaboration requires acceptance, preserves creator publication and rejects cross-story choices", async () => {
  const db = await database();
  try {
    await asUser(db, ids.bob);
    assert.equal(
      (await db.query(`SELECT * FROM stories WHERE id='${story}'`)).rows.length,
      0,
    );
    await assert.rejects(
      db.exec(
        `SELECT invite_chimera_collaborator('story','${story}','${ids.alice}','editor')`,
      ),
      /Owner/,
    );
    await asUser(db);
    const invite = (
      await db.query<{ id: string }>(
        `SELECT invite_chimera_collaborator('story','${story}','${ids.bob}','editor') AS id`,
      )
    ).rows[0].id;
    await asUser(db, ids.bob);
    assert.equal(
      (await db.query(`SELECT * FROM stories WHERE id='${story}'`)).rows.length,
      0,
    );
    assert.equal(
      (
        await db.query<{ project_title: string }>(
          "SELECT * FROM get_my_chimera_project_invitations()",
        )
      ).rows[0].project_title,
      "Private story",
    );
    await db.exec(
      `SELECT respond_chimera_collaboration('${invite}',true);UPDATE story_chapters SET content='Collaborative draft' WHERE id='${chapter}'`,
    );
    assert.equal(
      (await db.query(`SELECT * FROM stories WHERE id='${story}'`)).rows.length,
      1,
    );
    await assert.rejects(
      db.exec(
        `UPDATE story_chapters SET status='published' WHERE id='${chapter}'`,
      ),
      /creator/,
    );
    await assert.rejects(
      db.exec(
        `UPDATE story_chapters SET choices='[{"text":"Cross story","target_chapter_id":"${otherChapter}"}]' WHERE id='${chapter}'`,
      ),
      /this story/,
    );
    await asUser(db);
    await db.exec(`SELECT revoke_chimera_collaborator('${invite}')`);
    await asUser(db, ids.bob);
    assert.equal(
      (await db.query(`SELECT * FROM stories WHERE id='${story}'`)).rows.length,
      0,
    );
  } finally {
    await db.close();
  }
});
test("World map validates actual entities and uses revision compare-and-swap", async () => {
  const db = await database();
  try {
    await asUser(db);
    await assert.rejects(
      db.exec(
        `SELECT save_chimera_world_canvas('${ids.world}',0,'{"positions":{},"connections":[]}')`,
      ),
      /permission/,
    );
    await asUser(db, ids.bob);
    await assert.rejects(
      db.exec(
        `SELECT save_chimera_world_canvas('${ids.world}',0,'{"positions":{"${chapter}":{"x":1,"y":1}},"connections":[]}')`,
      ),
      /this world/,
    );
    await db.exec(
      `SELECT save_chimera_world_canvas('${ids.world}',0,'{"positions":{"${ids.character}":{"x":100,"y":100}},"connections":[]}')`,
    );
    await assert.rejects(
      db.exec(
        `SELECT save_chimera_world_canvas('${ids.world}',0,'{"positions":{},"connections":[]}')`,
      ),
      /changed/,
    );
  } finally {
    await db.close();
  }
});
test("CHIMERA removal requests are idempotent, private and non-destructive; migrations repeat safely", async () => {
  const db = await database();
  try {
    await asUser(db);
    const first = (
      await db.query<{ id: string }>(
        "SELECT request_chimera_data_removal() AS id",
      )
    ).rows[0].id;
    assert.equal(
      (
        await db.query<{ id: string }>(
          "SELECT request_chimera_data_removal() AS id",
        )
      ).rows[0].id,
      first,
    );
    assert.equal(
      (await db.query(`SELECT * FROM stories WHERE id='${story}'`)).rows.length,
      1,
    );
    assert.equal(
      (
        await db.query(
          `SELECT display_name FROM profiles WHERE user_id='${ids.alice}'`,
        )
      ).rows[0].display_name,
      "Member",
    );
    await asUser(db, ids.bob);
    assert.equal(
      (await db.query("SELECT * FROM chimera_data_removal_requests")).rows
        .length,
      0,
    );
    await assert.rejects(
      db.exec(
        `INSERT INTO chimera_data_removal_requests(user_id) VALUES('${ids.alice}')`,
      ),
      /permission/,
    );
    await db.exec("RESET ROLE");
    for (const name of [
      "20260930190706_chimera_phase5_storytelling.sql",
      "20260930190733_chimera_privacy_requests.sql",
    ])
      await db.exec(await readFile(new URL(name, root), "utf8"));
  } finally {
    await db.close();
  }
});
async function financeDatabase() {
  const db = await fixture();
  await db.exec(`
 CREATE TABLE stories(id uuid PRIMARY KEY,user_id uuid);CREATE TABLE story_chapters(id uuid PRIMARY KEY,story_id uuid);
 ALTER TABLE conversations ADD memory_summary text DEFAULT '';
 CREATE TABLE shards_wallets(user_id uuid PRIMARY KEY,available_balance bigint,lifetime_earned bigint DEFAULT 0,updated_at timestamptz);
 CREATE TABLE shards_ledger(wallet_user_id uuid,amount bigint,entry_type text,status text DEFAULT 'posted',description text,reference_type text,reference_id uuid);
 CREATE TABLE vellum_wallets(user_id uuid PRIMARY KEY,available_balance bigint,lifetime_spent bigint DEFAULT 0,updated_at timestamptz);
 CREATE TABLE vellum_ledger(wallet_user_id uuid,amount bigint,entry_type text,description text,reference_type text,reference_id uuid);
 ALTER TABLE story_scene_illustrations ALTER COLUMN id SET DEFAULT gen_random_uuid();ALTER TABLE story_scene_illustrations ALTER COLUMN status SET DEFAULT 'generating';
 ALTER TABLE story_scene_illustrations ADD user_id uuid,ADD story_id uuid,ADD chapter_id uuid,ADD prompt text,ADD style text,ADD aspect_ratio text,ADD vellum_cost integer,ADD storage_path text,ADD completed_at timestamptz,ADD refunded_at timestamptz;
 INSERT INTO stories VALUES('${story}','${ids.alice}');INSERT INTO vellum_wallets(user_id,available_balance)VALUES('${ids.alice}',1200);
 INSERT INTO shards_wallets(user_id,available_balance)VALUES('${ids.alice}',50);
 CREATE SCHEMA storage;CREATE TABLE storage.objects(bucket_id text,name text);
 `);
  for (const name of ["20260814194339_add_vellum_scene_illustrations.sql"]) {
    const sql = await readFile(new URL(name, root), "utf8");
    for (const fn of sql.match(/CREATE OR REPLACE FUNCTION[\s\S]*?\$\$;/g) ||
      [])
      await db.exec(fn);
  }
  for (const name of [
    "20260814164821_add_shards_stripe_purchases.sql",
    "20260814190137_fix_shards_purchase_balance_ambiguity.sql",
    "20260814160206_add_roleplay_turning_points.sql",
    "20260930190732_chimera_phase6_ledger_recovery.sql",
  ])
    await db.exec(await readFile(new URL(name, root), "utf8"));
  await db.exec("GRANT ALL ON shards_purchase_orders TO service_role;");
  return db;
}
test("Checkout repeats one order, rejects mismatched packages, credits once and is service-only", async () => {
  const db = await financeDatabase();
  try {
    await asUser(db);
    await assert.rejects(
      db.exec(
        `SELECT prepare_chimera_shards_order('${ids.alice}','${ids.world}','spark',500,0,499)`,
      ),
      /permission/,
    );
    await db.exec("RESET ROLE;SET ROLE service_role");
    const order = async () =>
      (
        await db.query<{ id: string }>(
          `SELECT (prepare_chimera_shards_order('${ids.alice}','${ids.world}','spark',500,0,499)).id AS id`,
        )
      ).rows[0].id;
    const id = await order();
    assert.equal(await order(), id);
    await assert.rejects(
      db.exec(
        `SELECT prepare_chimera_shards_order('${ids.alice}','${ids.world}','legend',8000,1600,3999)`,
      ),
      /different package/,
    );
    await db.exec(
      `UPDATE shards_purchase_orders SET stripe_checkout_session_id='synthetic-session' WHERE id='${id}';SELECT fulfill_shards_purchase('${id}','synthetic-session','synthetic-payment');SELECT fulfill_shards_purchase('${id}','synthetic-session','synthetic-payment');RESET ROLE;`,
    );
    assert.equal(
      (
        await db.query<{ balance: number }>(
          "SELECT available_balance AS balance FROM shards_wallets",
        )
      ).rows[0].balance,
      550,
    );
    assert.equal(
      (
        await db.query(
          "SELECT * FROM shards_ledger WHERE entry_type='purchase_credit'",
        )
      ).rows.length,
      1,
    );
  } finally {
    await db.close();
  }
});
test("Interrupted illustrations recover uploaded output or refund exactly once without SHARDS changes", async () => {
  const db = await financeDatabase();
  try {
    await db.exec("SET ROLE service_role");
    const reserve = async (key: string) =>
      (
        await db.query<{ job: { id: string; lease: string } }>(
          `SELECT reserve_chimera_ai_request('${ids.alice}','illustration','${story}',$1,'${"a".repeat(64)}') AS job`,
          [key],
        )
      ).rows[0].job;
    const one = await reserve("recover-image");
    const image = (
      await db.query<{ id: string }>(
        `SELECT begin_guarded_chimera_illustration('${one.id}','${one.lease}','${story}',null,'A creative scene','cinematic','16:9') AS id`,
      )
    ).rows[0].id;
    await db.exec(
      `RESET ROLE;UPDATE chimera_private.ai_requests SET expires_at=now()-interval '10 minutes' WHERE id='${one.id}';INSERT INTO storage.objects VALUES('story-illustrations','${ids.alice}/${image}.png');SET ROLE service_role;`,
    );
    const recovered = (
      await db.query<{ result: { state: string } }>(
        `SELECT recover_chimera_illustration('${ids.alice}','recover-image') AS result`,
      )
    ).rows[0].result;
    assert.equal(recovered.state, "completed");
    assert.equal(
      (
        await db.query<{ result: { state: string } }>(
          `SELECT recover_chimera_illustration('${ids.bob}','recover-image') AS result`,
        )
      ).rows[0].result.state,
      "not_found",
    );
    const two = await reserve("refund-image");
    await db.exec(
      `SELECT begin_guarded_chimera_illustration('${two.id}','${two.lease}','${story}',null,'An interrupted scene','cinematic','16:9');RESET ROLE;UPDATE chimera_private.ai_requests SET expires_at=now()-interval '10 minutes' WHERE id='${two.id}';SET ROLE service_role;SELECT recover_chimera_illustration('${ids.alice}','refund-image');SELECT recover_chimera_illustration('${ids.alice}','refund-image');RESET ROLE;`,
    );
    assert.equal(
      (
        await db.query<{ balance: number }>(
          "SELECT available_balance AS balance FROM vellum_wallets",
        )
      ).rows[0].balance,
      800,
    );
    assert.equal(
      (await db.query("SELECT * FROM vellum_ledger WHERE entry_type='refund'"))
        .rows.length,
      1,
    );
    assert.equal(
      (
        await db.query<{ balance: number }>(
          "SELECT available_balance AS balance FROM shards_wallets",
        )
      ).rows[0].balance,
      50,
    );
  } finally {
    await db.close();
  }
});
test("Guided rewards retain 10 SHARDS and three-per-day cap; same-choice retries never reaward", async () => {
  const db = await financeDatabase();
  try {
    await asUser(db);
    await assert.rejects(
      db.exec(
        `SELECT create_my_roleplay_turning_point('${ids.chat}','Title','Scene','[{"id":"a","label":"A"},{"id":"b","label":"B"}]')`,
      ),
      /permission/,
    );
    await db.exec("RESET ROLE");
    for (let i = 0; i < 4; i++) {
      const id = `00000000-0000-0000-0000-00000000006${i}`;
      await db.exec(
        `INSERT INTO roleplay_turning_points(id,conversation_id,user_id,title,scene_prompt,choices)VALUES('${id}','${ids.chat}','${ids.alice}','Choice ${i}','Scene','[{"id":"a","label":"A"},{"id":"b","label":"B"}]')`,
      );
      await asUser(db);
      if (i === 3)
        await assert.rejects(
          db.exec(`SELECT claim_my_roleplay_turning_point('${id}','a')`),
          /three guided/,
        );
      else {
        await db.exec(
          `SELECT claim_my_roleplay_turning_point('${id}','a');SELECT claim_my_roleplay_turning_point('${id}','a');`,
        );
        await assert.rejects(
          db.exec(`SELECT claim_my_roleplay_turning_point('${id}','b')`),
          /different choice/,
        );
      }
      await db.exec("RESET ROLE");
    }
    assert.equal(
      (
        await db.query<{ balance: number }>(
          "SELECT available_balance AS balance FROM shards_wallets",
        )
      ).rows[0].balance,
      80,
    );
    assert.equal(
      (
        await db.query(
          "SELECT * FROM shards_ledger WHERE entry_type='roleplay_reward'",
        )
      ).rows.length,
      3,
    );
    await db.exec(
      await readFile(
        new URL("20260930190732_chimera_phase6_ledger_recovery.sql", root),
        "utf8",
      ),
    );
  } finally {
    await db.close();
  }
});

test("The complete eight-migration chain preserves existing state and repeats safely after all phases", async () => {
  const db = await phase234Database();
  try {
    await db.exec(`
 CREATE TABLE stories(id uuid PRIMARY KEY,user_id uuid,title text);
 ALTER TABLE story_chapters ADD title text,ADD status text DEFAULT 'draft',ADD COLUMN IF NOT EXISTS choices jsonb DEFAULT '[]',ADD created_at timestamptz DEFAULT now(),ADD published_at timestamptz,ADD chapter_number integer;
 ALTER TABLE worlds ADD name text DEFAULT 'World',ADD description text DEFAULT '',ADD scenario text DEFAULT '',ADD tags text[] DEFAULT '{}',ADD cover_url text,ADD visibility text DEFAULT 'private',ADD updated_at timestamptz DEFAULT now();
 CREATE TABLE world_locations(id uuid PRIMARY KEY,world_id uuid);CREATE TABLE world_factions(LIKE world_locations INCLUDING ALL);CREATE TABLE world_timeline_events(LIKE world_locations INCLUDING ALL);
 CREATE TABLE shards_wallets(user_id uuid PRIMARY KEY,available_balance bigint,lifetime_earned bigint DEFAULT 0,updated_at timestamptz);
 CREATE TABLE shards_ledger(wallet_user_id uuid,amount bigint,entry_type text,status text DEFAULT 'posted',description text,reference_type text,reference_id uuid);
 ALTER TABLE story_scene_illustrations ADD user_id uuid;
 CREATE SCHEMA storage;CREATE TABLE storage.objects(bucket_id text,name text);
 INSERT INTO stories VALUES('${story}','${ids.alice}','Existing story');INSERT INTO story_chapters(id,story_id,content,updated_at)VALUES('${chapter}','${story}','Existing chapter',now());
 INSERT INTO shards_wallets(user_id,available_balance)VALUES('${ids.alice}',50);
 `);
    for (const name of [
      "20260814164821_add_shards_stripe_purchases.sql",
      "20260814160206_add_roleplay_turning_points.sql",
    ])
      await db.exec(await readFile(new URL(name, root), "utf8"));
    const prepared = [
      "20260930150022_chimera_phase1_authorization.sql",
      "20260930150040_chimera_phase1_request_protection.sql",
      "20260930170532_chimera_phase2_reliability.sql",
      "20260930170728_chimera_phase3_continuity.sql",
      "20260930171024_chimera_phase4_human_hybrid_rooms.sql",
      "20260930190706_chimera_phase5_storytelling.sql",
      "20260930190732_chimera_phase6_ledger_recovery.sql",
      "20260930190733_chimera_privacy_requests.sql",
    ];
    for (const name of prepared.slice(5))
      await db.exec(await readFile(new URL(name, root), "utf8"));
    await asUser(db);
    await db.exec("SELECT request_chimera_data_removal()");
    await db.exec("RESET ROLE");
    const before = (
      await db.query("SELECT content,updated_at FROM story_chapters")
    ).rows;
    for (const name of prepared)
      await db.exec(await readFile(new URL(name, root), "utf8"));
    assert.deepEqual(
      (await db.query("SELECT content,updated_at FROM story_chapters")).rows,
      before,
    );
    assert.equal(
      (await db.query("SELECT * FROM chimera_data_removal_requests")).rows
        .length,
      1,
    );
    assert.equal(
      (
        await db.query<{ balance: number }>(
          "SELECT available_balance AS balance FROM shards_wallets",
        )
      ).rows[0].balance,
      50,
    );
  } finally {
    await db.close();
  }
});
