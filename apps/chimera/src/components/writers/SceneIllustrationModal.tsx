import { useEffect, useMemo, useState, useRef } from 'react';
import { ImagePlus, Loader2, Sparkles, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useDialogFocus } from '../../hooks/useDialogFocus';
import { clearSavedDraft, draftKey, readDraft, writeDraft } from '../../lib/draftJournal';
import { supabase } from '../../lib/supabase';

const VELLUM_COST = 400;

type SceneIllustrationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  storyId: string;
  chapterId: string;
  chapterTitle: string;
  chapterContent: string;
  onGenerated: (image: { id: string; signedUrl: string }) => void;
};

export function SceneIllustrationModal({ isOpen, onClose, storyId, chapterId, chapterTitle, chapterContent, onGenerated }: SceneIllustrationModalProps) {
  const {user}=useAuth();
  const dialogRef=useDialogFocus(isOpen,onClose);
  const journalKey=user?draftKey(user.id,'chapter',storyId,chapterId,'illustration-request'):null;
  const lock=useRef(false);
  const [pendingRequest,setPendingRequest]=useState(false);
  const retryRef = useRef<{ payload: string; id: string } | null>(null);
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('cinematic');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableVellum, setAvailableVellum] = useState<number | null>(null);
  const [confirming, setConfirming] = useState(false);

  const suggestedPrompt = useMemo(() => {
    const excerpt = chapterContent.trim().replace(/\s+/g, ' ').slice(0, 700);
    return `${chapterTitle || 'This chapter'}: ${excerpt || 'Describe the moment, setting, characters, lighting, and mood you want to see.'}`;
  }, [chapterTitle, chapterContent]);

  const suggestedPromptRef=useRef(suggestedPrompt);
  suggestedPromptRef.current=suggestedPrompt;
  const currentScope=useRef(journalKey);currentScope.current=journalKey;
  useEffect(() => {
    if (isOpen) {
      const draft=journalKey?readDraft<{payload:string;id:string}>(journalKey):null;
      if(draft && typeof draft.value.payload==='string' && /^[0-9a-f-]{36}$/i.test(draft.value.id)){
        retryRef.current=draft.value;setPendingRequest(true);
        try{const payload=JSON.parse(draft.value.payload);setPrompt(payload.prompt);setStyle(payload.style);setAspectRatio(payload.aspect_ratio)}catch{setPrompt(suggestedPromptRef.current)}
      }else{retryRef.current=null;setPendingRequest(false);setPrompt(suggestedPromptRef.current)}
      setError(null);
      setConfirming(false);
      supabase.rpc('get_my_vellum_wallet').then(({ data, error: walletError }) => {
        if (!walletError) setAvailableVellum(data?.[0]?.available_balance ?? null);
      });
    }
  }, [isOpen, storyId, chapterId, journalKey]);

  if (!isOpen) return null;

  const generate = async () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setError(null);
    if (prompt.trim().length < 12) {
      setError('Add a little more scene detail first.');
      return;
    }
    if(lock.current)return;lock.current=true;
    setGenerating(true);
    const requestScope=journalKey;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Please sign in again before using VELLUM.');
      const payload = JSON.stringify({ story_id: storyId, chapter_id: chapterId, prompt, style, aspect_ratio: aspectRatio });
      if (retryRef.current?.payload !== payload) {
        if(pendingRequest)throw new Error('Check the existing request before starting a different paid scene.');
        retryRef.current = { payload, id: crypto.randomUUID() };
      }
      if(journalKey && !writeDraft(journalKey,retryRef.current))throw new Error('Could not preserve the retry identifier. Enable browser storage before using VELLUM.');
      setPendingRequest(true);
      const submittedAttempt={...retryRef.current};
      const response = await fetch('/api/generate-scene-illustration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}`, 'Idempotency-Key': retryRef.current!.id },
        body: JSON.stringify({ story_id: storyId, chapter_id: chapterId, prompt, style, aspect_ratio: aspectRatio }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body?.illustration?.signed_url) throw new Error(body?.error || 'CHIMERA could not create this scene.');
      if(journalKey)clearSavedDraft(journalKey,submittedAttempt);
      if(currentScope.current!==requestScope)return;
      setPendingRequest(false);
      onGenerated({ id: body.illustration.id, signedUrl: body.illustration.signed_url });
      window.dispatchEvent(new Event('chimera-vellum-changed'));
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'CHIMERA could not create this scene.');
    } finally {
      lock.current=false;
      setGenerating(false);
    }
  };

  const checkRequest=async()=>{
    if(!retryRef.current || lock.current)return;
    lock.current=true;setGenerating(true);setError(null);
    try{
      const {data:{session}}=await supabase.auth.getSession();if(!session)throw new Error('Sign in to check this request.');
      const response=await fetch('/api/illustration-status',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`},body:JSON.stringify({request_id:retryRef.current.id})});
      const data=await response.json();if(!response.ok)throw new Error(data.error || 'Could not check the request.');
      if(data.state==='completed'){
        onGenerated({id:data.illustration.id,signedUrl:data.illustration.signed_url});
        if(journalKey)clearSavedDraft(journalKey,retryRef.current);setPendingRequest(false);retryRef.current=null;onClose();
      }else if(['failed','refunded','not_found'].includes(data.state)){
        if(journalKey)clearSavedDraft(journalKey,retryRef.current);setPendingRequest(false);retryRef.current=null;
        setError(data.state==='refunded'?'The interrupted job was refunded. You may start a new request.':'No active charge remains for this request. You may retry.');
      }else setError('This request is still pending. Allow seven minutes from submission before interrupted-job recovery. Checking does not charge VELLUM.');
      window.dispatchEvent(new Event('chimera-vellum-changed'));
    }catch(error){setError(error instanceof Error?error.message:'Could not check the request.');}
    finally{lock.current=false;setGenerating(false)}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#130e1d]/75 p-0 sm:p-5 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="scene-illustration-title">
      <div ref={dialogRef} tabIndex={-1} className="w-full max-w-2xl rounded-t-[2rem] sm:rounded-[2rem] border border-[#d8bc78]/25 bg-[#1a1326] shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
          <div>
            <p className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#e4c77e]"><Sparkles size={14} /> VELLUM Studio</p>
            <h2 id="scene-illustration-title" className="font-serif text-2xl font-semibold text-[#fff8e9]">Illustrate this scene</h2>
            <p className="mt-1 text-sm text-[#cfc2dd]">A private visual companion for this chapter—not a replacement for the writing.</p>
          </div>
          <button onClick={onClose} disabled={generating} className="rounded-xl p-2 text-[#cfc2dd] hover:bg-white/10 hover:text-white" aria-label="Close scene illustration"><X size={20} /></button>
        </div>

        <div className="space-y-5 px-6 py-5">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[#fff8e9]">Scene direction</span>
            <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} maxLength={1800} rows={6} disabled={generating} className="w-full resize-y rounded-2xl border border-white/10 bg-[#110c19] px-4 py-3 text-sm leading-relaxed text-[#fff8e9] outline-none placeholder:text-[#8e829b] focus:border-[#e4c77e]/60" />
            <span className="mt-1 block text-right text-xs text-[#9e91ae]">{prompt.length}/1800</span>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-[#fff8e9]">Visual language
              <select value={style} onChange={(event) => setStyle(event.target.value)} disabled={generating} className="mt-2 w-full rounded-xl border border-white/10 bg-[#110c19] px-3 py-2.5 font-normal text-[#fff8e9] outline-none">
                <option value="cinematic">Cinematic</option>
                <option value="painterly">Painterly</option>
                <option value="graphic_novel">Graphic novel</option>
              </select>
            </label>
            <label className="block text-sm font-semibold text-[#fff8e9]">Frame
              <select value={aspectRatio} onChange={(event) => setAspectRatio(event.target.value)} disabled={generating} className="mt-2 w-full rounded-xl border border-white/10 bg-[#110c19] px-3 py-2.5 font-normal text-[#fff8e9] outline-none">
                <option value="16:9">Wide — 16:9</option>
                <option value="4:5">Portrait — 4:5</option>
                <option value="1:1">Square — 1:1</option>
              </select>
            </label>
          </div>

          <div className="rounded-2xl border border-[#e4c77e]/25 bg-[#e4c77e]/10 p-4 text-sm text-[#f8e8b9]">
            <strong>{VELLUM_COST} VELLUM</strong> will be reserved only after you confirm. Confirmed failures are refunded. For an interrupted request, use Check existing request to recover the image or refund after the recovery window.
            {availableVellum !== null && <span className="mt-1 block text-xs text-[#d8c995]">Your available reserve: {availableVellum.toLocaleString()} VELLUM.</span>}
          </div>
          {availableVellum !== null && availableVellum < VELLUM_COST && <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">You need {VELLUM_COST.toLocaleString()} VELLUM to create this illustration. Your writing remains completely free.</p>}
          {pendingRequest && <button className="btn-secondary" disabled={generating} onClick={()=>void checkRequest()}>Check existing request · no new charge</button>}
          {error && <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p>}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-white/10 px-6 py-5 sm:flex-row sm:justify-end">
          <button onClick={onClose} disabled={generating} className="rounded-xl px-4 py-3 text-sm font-semibold text-[#cfc2dd] hover:bg-white/10">Not now</button>
          <button onClick={generate} disabled={generating || (availableVellum !== null && availableVellum < VELLUM_COST)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#caa552] to-[#e9d28c] px-5 py-3 text-sm font-bold text-[#211728] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70">
            {generating ? <><Loader2 size={17} className="animate-spin" /> Creating your scene…</> : confirming ? <><ImagePlus size={17} /> Confirm and create · {VELLUM_COST} VELLUM</> : <><ImagePlus size={17} /> Review · {VELLUM_COST} VELLUM</>}
          </button>
        </div>
      </div>
    </div>
  );
}
