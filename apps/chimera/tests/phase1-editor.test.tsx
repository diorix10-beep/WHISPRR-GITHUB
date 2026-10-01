// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { draftKey, readDraft, writeDraft } from '../src/lib/draftJournal';

const state = vi.hoisted(() => ({
  toast: vi.fn(), save: vi.fn(), filters: [] as Array<[string,unknown]>, userId:'alice', status:'draft',
}));
vi.mock('react-router-dom', () => ({ useParams:()=>({storyId:'story',chapterId:'chapter'}),useNavigate:()=>vi.fn() }));
vi.mock('../src/contexts/AuthContext', () => ({useAuth:()=>({user:{id:state.userId}})}));
vi.mock('../src/contexts/ToastContext', () => ({useToast:()=>({showToast:state.toast})}));
vi.mock('../src/components/writers/AiCoPilotDrawer', () => ({AiCoPilotDrawer:()=>null}));
vi.mock('../src/components/writers/SceneIllustrationModal', () => ({SceneIllustrationModal:()=>null}));
vi.mock('../src/lib/supabase', () => ({supabase:{
  from:(table:string) => {
    let update = false;
    const query = {
      select:()=>query,eq:(column:string,value:unknown)=>{if(update)state.filters.push([column,value]);return query;},order:()=>query,
      update:(payload:unknown)=>{update=true;state.save.mock.calls.push([payload]);return query;},
      single:async()=>({data:table==='stories'?{id:'story',user_id:state.userId,title:'Story'}:{id:'chapter',story_id:'story',title:'Server title',content:'Server prose',status:state.status,choices:[],updated_at:'server-v1'},error:null}),
      maybeSingle:()=>update?state.save():Promise.resolve({data:null,error:null}),
      then:(resolve:(value:unknown)=>unknown)=>Promise.resolve({data:[],error:null}).then(resolve),
    };
    return query;
  },
}}));

import ChapterEditorPage from '../src/pages/ChapterEditorPage';
const key = draftKey('alice','chapter','story','chapter');
beforeEach(()=>{localStorage.clear();state.toast.mockClear();state.save.mockReset();state.save.mockResolvedValue({data:null,error:new Error('Network unavailable')});state.userId='alice';state.status='draft';state.filters=[];});
afterEach(()=>cleanup());

it('recovers a chapter after reload with an explicit choice and no pre-choice write', async()=>{
  writeDraft(key,{title:'Local title',content:'Unsaved prose',status:'draft',choices:[]},'server-v1');
  render(<ChapterEditorPage />);
  await screen.findByRole('button',{name:'Restore local draft'});
  expect((screen.getByPlaceholderText('Tap here to start writing...') as HTMLTextAreaElement).value).toBe('Server prose');
  expect(state.save).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button',{name:'Restore local draft'}));
  expect((screen.getByPlaceholderText('Tap here to start writing...') as HTMLTextAreaElement).value).toBe('Unsaved prose');
  fireEvent.click(screen.getByRole('button',{name:'Save',exact:true}));
  await waitFor(()=>expect(state.toast).toHaveBeenCalled());
  expect(readDraft<{content:string}>(key)?.value.content).toBe('Unsaved prose');
});

it('late save acknowledgement does not erase edits made while saving', async()=>{
  let resolveSave!: (value:unknown)=>void;
  state.save.mockImplementation(()=>new Promise(resolve=>{resolveSave=resolve;}));
  render(<ChapterEditorPage />);
  const editor = await screen.findByPlaceholderText('Tap here to start writing...');
  fireEvent.change(editor,{target:{value:'First local revision'}});
  fireEvent.click(screen.getByRole('button',{name:'Save',exact:true}));
  fireEvent.change(editor,{target:{value:'Newer local revision'}});
  resolveSave({data:{id:'chapter',updated_at:'server-v2'},error:null});
  await waitFor(()=>expect(state.toast).toHaveBeenCalled());
  expect(readDraft<{content:string}>(key)?.value.content).toBe('Newer local revision');
});

it('published edits are journaled without automatically republishing', async()=>{
  state.status='published'; render(<ChapterEditorPage />);
  const editor = await screen.findByPlaceholderText('Tap here to start writing...');
  fireEvent.change(editor,{target:{value:'Unpublished edit of a published chapter'}});
  expect(readDraft<{content:string}>(key)?.value.content).toBe('Unpublished edit of a published chapter');
  expect(state.save).not.toHaveBeenCalled();
});


it('a newer server chapter rejects a stale save and retains the local draft', async()=>{
  state.save.mockResolvedValue({data:null,error:null});
  render(<ChapterEditorPage />);
  const editor=await screen.findByPlaceholderText('Tap here to start writing...');
  fireEvent.change(editor,{target:{value:'My pending revision'}});
  fireEvent.click(screen.getByRole('button',{name:'Save',exact:true}));
  await waitFor(()=>expect(state.toast).toHaveBeenCalledWith(expect.stringContaining('changed elsewhere'),'error'));
  expect(state.filters).toContainEqual(['updated_at','server-v1']);
  expect(readDraft<{content:string}>(key)?.value.content).toBe('My pending revision');
});
