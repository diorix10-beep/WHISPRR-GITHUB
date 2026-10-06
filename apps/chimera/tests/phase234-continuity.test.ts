import {test} from 'node:test';import assert from 'node:assert/strict';
import {formatContinuity,selectContinuitySources,selectScopedFacts,type ScopedFact} from '../src/lib/continuity.js';
test('continuity isolates persona, branch and room facts and excludes proposals and expiry',()=>{
 const base:ScopedFact={id:'one',content:'Approved bond',memory_type:'relationship',importance:6,persona_id:'persona',approval_status:'approved'};
 const rows=[base,{...base,id:'other-persona',persona_id:'other'},{...base,id:'other-branch',conversation_id:'other'},{...base,id:'proposed',approval_status:'proposed'},{...base,id:'expired',expires_at:'2000-01-01'},{...base,id:'room',session_id:'room'}];
 assert.deepEqual(selectScopedFacts(rows,{personaId:'persona',conversationId:'scene'}).map(m=>m.id),['one']);
 assert.deepEqual(selectScopedFacts(rows,{personaId:'persona',sessionId:'room'}).map(m=>m.id),['one','room']);
 assert.equal(selectScopedFacts(rows,{personaId:null,conversationId:'scene'}).length,0);
});
test('old relevant events survive a long-running scene and recall remains source-attributed and bounded',()=>{
 const sources=Array.from({length:150},(_,i)=>({id:`source-${i}`,sender_id:'author',excerpt:i===0?'The obsidian compass belongs to Mira.':'They travel along the road.',digest:'digest',created_at:new Date(1000*i).toISOString()}));
 const selected=selectContinuitySources(sources,['Mira asks about the obsidian compass'],1000);
 assert.ok(selected.some(s=>s.id==='source-0'));assert.ok(selected.length<=24);assert.ok(selected.reduce((n,s)=>n+s.excerpt.length,0)<=1000);
 const prompt=formatContinuity(selected);assert.match(prompt,/not approved facts/);assert.match(prompt,/source source-0/);
});
