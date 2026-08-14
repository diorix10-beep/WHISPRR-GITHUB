import { useEffect, useMemo, useState } from 'react';
import { ImagePlus, Loader2, Sparkles, X } from 'lucide-react';
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
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('cinematic');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suggestedPrompt = useMemo(() => {
    const excerpt = chapterContent.trim().replace(/\s+/g, ' ').slice(0, 700);
    return `${chapterTitle || 'This chapter'}: ${excerpt || 'Describe the moment, setting, characters, lighting, and mood you want to see.'}`;
  }, [chapterTitle, chapterContent]);

  useEffect(() => {
    if (isOpen) {
      setPrompt(suggestedPrompt);
      setError(null);
    }
  }, [isOpen, suggestedPrompt]);

  if (!isOpen) return null;

  const generate = async () => {
    setError(null);
    if (prompt.trim().length < 12) {
      setError('Add a little more scene detail first.');
      return;
    }
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Please sign in again before using VELLUM.');
      const response = await fetch('/api/generate-scene-illustration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ story_id: storyId, chapter_id: chapterId, prompt, style, aspect_ratio: aspectRatio }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body?.illustration?.signed_url) throw new Error(body?.error || 'CHIMERA could not create this scene.');
      onGenerated({ id: body.illustration.id, signedUrl: body.illustration.signed_url });
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'CHIMERA could not create this scene.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#130e1d]/75 p-0 sm:p-5 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="scene-illustration-title">
      <div className="w-full max-w-2xl rounded-t-[2rem] sm:rounded-[2rem] border border-[#d8bc78]/25 bg-[#1a1326] shadow-2xl">
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
            <strong>{VELLUM_COST} VELLUM</strong> will be reserved when you generate. If CHIMERA cannot deliver an image, it is automatically refunded.
          </div>
          {error && <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p>}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-white/10 px-6 py-5 sm:flex-row sm:justify-end">
          <button onClick={onClose} disabled={generating} className="rounded-xl px-4 py-3 text-sm font-semibold text-[#cfc2dd] hover:bg-white/10">Not now</button>
          <button onClick={generate} disabled={generating} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#caa552] to-[#e9d28c] px-5 py-3 text-sm font-bold text-[#211728] transition hover:brightness-110 disabled:cursor-wait disabled:opacity-70">
            {generating ? <><Loader2 size={17} className="animate-spin" /> Creating your scene…</> : <><ImagePlus size={17} /> Generate for {VELLUM_COST} VELLUM</>}
          </button>
        </div>
      </div>
    </div>
  );
}
