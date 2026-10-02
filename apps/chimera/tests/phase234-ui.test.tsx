// @vitest-environment jsdom
import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {cleanup,render,screen,fireEvent,waitFor} from '@testing-library/react';
const state=vi.hoisted(()=>({params:{sessionId:'room'} as {sessionId?:string;storyId?:string;chapterNumber?:string},navigation:vi.fn(),readerFilters:[] as Array<[string,unknown]>,user:{id:'alice'},scenePersona:'persona-a',failure:false,rpcCalls:[] as Array<{name:string,args:Record<string,unknown>}>,humanMessages:[] as Array<Record<string,unknown>>}));
vi.mock('react-router-dom',()=>({useParams:()=>state.params,useNavigate:()=>state.navigation}));
vi.mock('../src/contexts/ToastContext',()=>({useToast:()=>({showToast:vi.fn()})}));
vi.mock('../src/contexts/AuthContext',()=>({useAuth:()=>({user:state.user})}));
vi.mock('../src/lib/supabase',()=>({supabase:{
 auth:{getSession:async()=>({data:{session:{access_token:'synthetic-ui-token'}}})},
 from:(table:string)=>{
  const result=()=>({data:table==='personas'?[{id:'persona-a',name:'Mira',is_default:true},{id:'persona-b',name:'Elian',is_default:false}]
   :table==='conversation_participants'?{persona_id:state.scenePersona,persona_selected:true}
   :table==='human_roleplay_sessions'?{id:'room',creator_id:'alice',title:'Room',description:'Shared story',status:'active',ai_enabled:false,ai_policy:'host',turn_user_id:null}
   :table==='human_roleplay_participants'?[{id:'member',user_id:'alice',status:'accepted',ai_opt_in:false,persona_id:null,profile:{display_name:'Alice'}}]
   :table==='human_roleplay_messages'?state.humanMessages:table==='stories'?{id:'story',title:'A creator story',user_id:'alice'}:table==='story_chapters'?{id:'00000000-0000-0000-0000-000000000021',title:'The opening',content:'A published chapter.',chapter_number:1,choices:[]}:[],count:2,error:null});
  let selection='';const originalResult=result;const selectedResult=()=>table==='story_chapters' && selection==='id,chapter_number'?{data:[{id:'00000000-0000-0000-0000-000000000021',chapter_number:1},{id:'second',chapter_number:3}],error:null}:originalResult();
  const query={select:(columns:string)=>{selection=columns;return query},eq:(column:string,value:unknown)=>{if(table==='story_chapters')state.readerFilters.push([column,value]);return query;},is:()=>query,order:()=>query,limit:()=>query,single:async()=>selectedResult(),maybeSingle:async()=>selectedResult(),then:(resolve:(value:unknown)=>unknown)=>Promise.resolve(selectedResult()).then(resolve)};return query;
 },
 rpc:async(name:string,args:Record<string,unknown>)=>{state.rpcCalls.push({name,args});if(state.failure)return {data:null,error:{message:'network failed'}};if(name==='set_chimera_scene_persona')state.scenePersona=String(args.p_persona_id||'');if(name==='send_human_roleplay_message'&&!state.humanMessages.length)state.humanMessages=[{id:args.p_request_id,sender_id:'alice',character_id:null,content:args.p_content,message_type:'dialogue',author_kind:'human',sequence_number:1,profiles:{display_name:'Alice'}}];return {data:{},error:null};},
 channel:()=>{const channel={on:()=>channel,subscribe:()=>channel};return channel;},removeChannel:async()=>undefined,
}}));
import {ScenePersonaSelector} from '../src/components/chat/ScenePersonaSelector';
import ChapterReaderPage from '../src/pages/ChapterReaderPage';
import HumanRoleplaySessionPage from '../src/pages/HumanRoleplaySessionPage';
beforeEach(()=>{state.params={sessionId:'room'};state.navigation.mockClear();state.readerFilters=[];state.scenePersona='persona-a';state.failure=false;state.rpcCalls=[];state.humanMessages=[];localStorage.clear();});
afterEach(()=>cleanup());
it('scene persona is persisted and restored after reload',async()=>{
 const view=render(<ScenePersonaSelector conversationId="scene"/>);
 const select=await screen.findByRole('combobox',{name:'Scene persona'});await waitFor(()=>expect((select as HTMLSelectElement).value).toBe('persona-a'));
 fireEvent.change(select,{target:{value:'persona-b'}});await waitFor(()=>expect(state.scenePersona).toBe('persona-b'));view.unmount();
 render(<ScenePersonaSelector conversationId="scene"/>);await waitFor(()=>expect((screen.getByRole('combobox',{name:'Scene persona'}) as HTMLSelectElement).value).toBe('persona-b'));
});
it('human room failed sends preserve prose and retry the same message ID without duplicate turns',async()=>{
 state.failure=true;render(<HumanRoleplaySessionPage/>);
 const editor=await screen.findByRole('textbox',{name:'Room message'});fireEvent.change(editor,{target:{value:'The creator begins the story.'}});
 fireEvent.click(screen.getByRole('button',{name:'Send human turn'}));await screen.findByRole('alert');expect((editor as HTMLTextAreaElement).value).toBe('The creator begins the story.');
 const failed=state.rpcCalls.find(c=>c.name==='send_human_roleplay_message')!;
 state.failure=false;fireEvent.click(screen.getByRole('button',{name:'Send human turn'}));await waitFor(()=>expect((editor as HTMLTextAreaElement).value).toBe(''));
 const retries=state.rpcCalls.filter(c=>c.name==='send_human_roleplay_message');expect(retries).toHaveLength(2);expect(retries[1].args.p_request_id).toBe(failed.args.p_request_id);expect(state.humanMessages).toHaveLength(1);
});

it('saved chapter-ID choices resolve within their story and Next skips deleted or unpublished chapter numbers',async()=>{
 state.params={storyId:'story',chapterNumber:'00000000-0000-0000-0000-000000000021'};
 render(<ChapterReaderPage/>);
 await screen.findByText('A published chapter.');
 expect(state.readerFilters).toContainEqual(['story_id','story']);expect(state.readerFilters).toContainEqual(['id',state.params.chapterNumber]);
 fireEvent.click(screen.getByRole('button',{name:'Next'}));expect(state.navigation).toHaveBeenCalledWith('/stories/story/chapter/3');
});
