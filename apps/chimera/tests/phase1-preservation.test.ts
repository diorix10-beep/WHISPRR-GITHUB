import {singleRpcRecord} from '../src/lib/rpcRecord.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clearSavedDraft, draftKey, readDraft, writeDraft } from '../src/lib/draftJournal.js';
import { readPayload, RequestError, requestFailure } from '../api/_lib/requestProtection.js';

class MemoryStorage implements Storage {
  private values = new Map<string,string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string,value: string) { this.values.set(key,value); }
}

test('reload recovery, account isolation, and late acknowledgement retain newer chapter/message work', () => {
  const storage = new MemoryStorage();
  const key = draftKey('alice','chapter','story','chapter');
  const old = {title:'Chapter',content:'First revision',choices:[],status:'draft'};
  assert.equal(writeDraft(key,old,'server-v1',storage),true);
  assert.deepEqual(readDraft(key,storage)?.value,old);
  assert.equal(readDraft(draftKey('bob','chapter','story','chapter'),storage),null);
  const newer = {...old,content:'Second revision'};
  writeDraft(key,newer,'server-v1',storage);
  assert.equal(clearSavedDraft(key,old,storage),false);
  assert.deepEqual(readDraft(key,storage)?.value,newer);
  assert.equal(clearSavedDraft(key,newer,storage),true);
  assert.equal(readDraft(key,storage),null);
  const messageKey = draftKey('alice','message','conversation');
  const pending = {text:'Roleplay dialogue',attemptId:'stable-retry-id',imageUrl:'https://example.invalid/owned-image'};
  writeDraft(messageKey,pending,undefined,storage);
  assert.deepEqual(readDraft(messageKey,storage)?.value,pending);
});

test('corrupt/unavailable storage fails safely without crashing editor', () => {
  const storage = new MemoryStorage(); storage.setItem('draft','broken-json');
  assert.equal(readDraft('draft',storage),null);
  storage.setItem = () => { throw new Error('Quota exceeded'); };
  assert.equal(writeDraft('draft',{content:'Keep in React state'},undefined,storage),false);
});

test('bounded parser handles streamed bodies, malformed JSON, arrays and misleading size headers', async () => {
  const post = (body: string) => new Request('https://example.invalid/api', {method:'POST',body});
  assert.deepEqual(await readPayload(post('{"valid":true}')),{valid:true});
  await assert.rejects(readPayload(post('[]')),error => error instanceof RequestError && error.status===400);
  await assert.rejects(readPayload(post('bad-json')),error => error instanceof RequestError && error.status===400);
  await assert.rejects(readPayload(post('a'.repeat(24001))),error => error instanceof RequestError && error.status===413);
  const response = requestFailure(new Error('Provider URL and sensitive backend detail'));
  assert.equal(response.status,502);
  assert.doesNotMatch(await response.text(),/Provider URL|sensitive backend/);
});


test('roleplay retries confirm a lost INSERT acknowledgement without duplicating the message', async () => {
  const { persistRoleplayMessage } = await import('../src/lib/messagePersistence.js');
  const message = {id:'stable-id',conversation_id:'scene',sender_id:'alice',content:'My words',image_url:null};
  let stored: typeof message | null = null;
  let inserts = 0;
  const client = {from: () => ({
    select: () => ({eq: () => ({maybeSingle: async () => ({data:stored,error:null})})}),
    insert: async () => { inserts++; stored=message; return {error:new Error('Lost response')}; },
  })} as unknown as Parameters<typeof persistRoleplayMessage>[0];
  await persistRoleplayMessage(client,message);
  await persistRoleplayMessage(client,message);
  assert.equal(inserts,1);
  await assert.rejects(persistRoleplayMessage(client,{...message,content:'Different words'}),/verified/);
});

test('failed roleplay persistence does not clear its recovery journal', async () => {
  const { persistRoleplayMessage } = await import('../src/lib/messagePersistence.js');
  const storage=new MemoryStorage();
  const draft={text:'My unsent dialogue',attemptId:'stable-id'};
  writeDraft('draft',draft,undefined,storage);
  const client={from: () => ({
    select: () => ({eq: () => ({maybeSingle: async () => ({data:null,error:null})})}),
    insert: async () => ({error:new Error('Network unavailable')}),
  })} as unknown as Parameters<typeof persistRoleplayMessage>[0];
  await assert.rejects(persistRoleplayMessage(client,{id:draft.attemptId,conversation_id:'scene',sender_id:'alice',content:draft.text,image_url:null}),/Network unavailable/);
  assert.deepEqual(readDraft('draft',storage)?.value,draft);
});

test('concurrent retries of the same client message ID persist only one row', async () => {
  const { persistRoleplayMessage } = await import('../src/lib/messagePersistence.js');
  const message={id:'stable-id',conversation_id:'scene',sender_id:'alice',content:'My words',image_url:null};
  let stored: typeof message | null=null;
  let reads=0;
  let inserts=0;
  const client={from:()=>({
    select:()=>({eq:()=>({maybeSingle:async()=>({data:++reads<=2?null:stored,error:null})})}),
    insert:async()=>{
      if(stored)return {error:new Error('Duplicate primary key')};
      stored=message;inserts++;return {error:null};
    },
  })} as unknown as Parameters<typeof persistRoleplayMessage>[0];
  await Promise.all([persistRoleplayMessage(client,message),persistRoleplayMessage(client,message)]);
  assert.equal(inserts,1);
  assert.deepEqual(stored,message);
});

test('single-row RPC contract handles composite arrays and rejects ambiguous or missing records',()=>{
 assert.deepEqual(singleRpcRecord({id:'scene'}),{id:'scene'});
 assert.deepEqual(singleRpcRecord([{id:'scene'}]),{id:'scene'});
 for(const input of [null,{},[],[{id:'one'},{id:'two'}],{id:undefined}])assert.equal(singleRpcRecord(input),null);
});
