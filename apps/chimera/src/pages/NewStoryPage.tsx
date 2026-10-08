import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useIsFounder } from '../hooks/useIsFounder';
import { StoryDetailsForm } from '../components/StoryDetailsForm';
import { EMPTY_STORY, saveFailureMessage, storyRow, validateStory, type StoryForm } from '../lib/stories';

export default function NewStoryPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { isFounder } = useIsFounder();
  const [form, setForm] = useState<StoryForm>(EMPTY_STORY);
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (saving || !user) return;
    const message = validateStory(form);
    setProblem(message);
    if (message) return;
    setSaving(true);
    const { data, error } = await supabase
      .from('stories')
      .insert({ user_id: user.id, content: '', ...storyRow(form) })
      .select('id')
      .single();
    setSaving(false);
    if (error || !data?.id) {
      setProblem(saveFailureMessage(error, 'We could not create this story. Your text is still here, please try again.'));
      return;
    }
    showToast('Story created. Add your first chapter.', 'success');
    navigate(`/stories/${data.id}/edit`);
  };

  return (
    <div className="mx-auto max-w-3xl px-5 pb-12 pt-8 sm:px-8">
      <Link to="/workspace" className="mb-5 inline-flex items-center gap-2 text-[15px] text-chimera-mute hover:text-chimera-gold">
        <ArrowLeft size={18} aria-hidden="true" /> Writer&apos;s Desk
      </Link>
      <p className="mb-3 text-sm font-bold tracking-[0.26em] text-chimera-gold">NEW STORY</p>
      <h1 className="font-serif text-4xl font-semibold sm:text-5xl">Begin a story.</h1>
      <p className="mt-3 text-chimera-mute">Stories here are for all audiences for now. Keep them fictional, and never sexual in any way involving minors.</p>
      <form onSubmit={(e) => void submit(e)} className="mt-8 space-y-6" noValidate>
        <StoryDetailsForm form={form} setForm={setForm} isFounder={isFounder} onEdit={() => setProblem(null)} />
        {problem && <p role="alert" className="rounded-xl border border-chimera-rose/40 bg-chimera-rose/10 px-4 py-3 text-sm text-red-100">{problem}</p>}
        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" disabled={saving} className="inline-flex min-h-[52px] items-center rounded-full bg-chimera-gold px-7 text-base font-bold text-[#1a1208] hover:brightness-110 disabled:opacity-50">{saving ? 'Creating…' : 'Create story'}</button>
          <Link to="/workspace" className="text-chimera-mute hover:text-chimera-gold">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
