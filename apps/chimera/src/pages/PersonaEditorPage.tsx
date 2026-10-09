import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
  EMPTY_PERSONA,
  PERSONA_LIMITS,
  ageIsUnder18,
  formFromPersona,
  personaRow,
  validatePersona,
  type PersonaForm,
} from '../lib/personas';

const FIELD = 'mt-2 w-full rounded-xl border border-chimera-gold/25 bg-chimera-bg p-3 text-base text-chimera-ink outline-none placeholder:text-chimera-mute/60 focus:border-chimera-gold';

export default function PersonaEditorPage() {
  const { id: editId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState<PersonaForm>(EMPTY_PERSONA);
  const [loading, setLoading] = useState(!!editId);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !editId) return;
    let active = true;
    supabase
      .from('personas')
      .select('*')
      .eq('id', editId)
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error || !data) setNotFound(true);
        else setForm(formFromPersona(data as Record<string, unknown>));
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user, editId]);

  const set = <K extends keyof PersonaForm>(key: K, value: PersonaForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setProblem(null);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (saving || !user) return;
    const message = validatePersona(form);
    setProblem(message);
    if (message) return;
    setSaving(true);
    const row = personaRow(form);
    const { error } = editId
      ? await supabase.from('personas').update(row).eq('id', editId).eq('user_id', user.id)
      : await supabase.from('personas').insert({ ...row, user_id: user.id });
    setSaving(false);
    if (error) {
      setProblem('We could not save this persona. Your text is still here, please try again.');
      return;
    }
    showToast(editId ? 'Persona updated.' : 'Persona created.', 'success');
    navigate('/personas');
  };

  if (loading) return <p className="px-5 py-24 text-center text-chimera-mute">Opening the persona…</p>;

  if (notFound) {
    return (
      <div className="mx-auto max-w-xl px-5 py-24 text-center">
        <h1 className="font-serif text-4xl font-semibold">Persona not found</h1>
        <p className="mt-3 text-chimera-mute">Only you can edit your personas.</p>
        <Link to="/personas" className="mt-6 inline-flex min-h-[44px] items-center rounded-full border border-chimera-gold/50 px-5 font-bold hover:bg-chimera-gold/10">Your personas</Link>
      </div>
    );
  }

  const counter = (value: string, max: number) => <span className="text-xs text-chimera-mute">{value.length} / {max}</span>;

  return (
    <div className="mx-auto max-w-3xl px-5 pb-12 pt-8 sm:px-8">
      <Link to="/personas" className="mb-5 inline-flex items-center gap-2 text-[15px] text-chimera-mute hover:text-chimera-gold">
        <ArrowLeft size={18} aria-hidden="true" /> Your personas
      </Link>
      <p className="mb-3 text-sm font-bold tracking-[0.26em] text-chimera-gold">{editId ? 'EDIT PERSONA' : 'NEW PERSONA'}</p>
      <h1 className="font-serif text-4xl font-semibold sm:text-5xl">{editId ? 'Refine who you are.' : 'Who are you in the story?'}</h1>
      <p className="mt-3 text-chimera-mute">Only you can see your personas. Characters you chat with receive these details so they know who they are talking to.</p>

      <form onSubmit={(e) => void submit(e)} className="mt-8 space-y-6" noValidate>
        <div>
          <label htmlFor="p-name" className="font-bold">Name</label>
          <input id="p-name" value={form.name} onChange={(e) => set('name', e.target.value)} maxLength={PERSONA_LIMITS.name} className={FIELD} placeholder="Lyra" />
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          <div>
            <label htmlFor="p-pronouns" className="font-bold">Pronouns <span className="font-normal text-chimera-mute">(optional)</span></label>
            <input id="p-pronouns" value={form.pronouns} onChange={(e) => set('pronouns', e.target.value)} maxLength={PERSONA_LIMITS.pronouns} className={FIELD} placeholder="she/her" />
          </div>
          <div>
            <label htmlFor="p-age" className="font-bold">Age <span className="font-normal text-chimera-mute">(optional)</span></label>
            <input id="p-age" value={form.age} onChange={(e) => set('age', e.target.value)} maxLength={PERSONA_LIMITS.age} className={FIELD} placeholder="27" />
          </div>
          <div>
            <label htmlFor="p-gender" className="font-bold">Gender <span className="font-normal text-chimera-mute">(optional)</span></label>
            <input id="p-gender" value={form.gender} onChange={(e) => set('gender', e.target.value)} maxLength={PERSONA_LIMITS.gender} className={FIELD} />
          </div>
        </div>
        {ageIsUnder18(form.age) && (
          <p role="note" className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            This age is under 18. Adult (Mature or NSFW) scenes are not available with this persona.
          </p>
        )}
        <div>
          <label htmlFor="p-occupation" className="font-bold">Occupation <span className="font-normal text-chimera-mute">(optional)</span></label>
          <input id="p-occupation" value={form.occupation} onChange={(e) => set('occupation', e.target.value)} maxLength={PERSONA_LIMITS.occupation} className={FIELD} />
        </div>
        <div>
          <div className="flex items-baseline justify-between"><label htmlFor="p-description" className="font-bold">About you <span className="font-normal text-chimera-mute">(optional)</span></label>{counter(form.description, PERSONA_LIMITS.description)}</div>
          <textarea id="p-description" value={form.description} onChange={(e) => set('description', e.target.value)} maxLength={PERSONA_LIMITS.description} rows={3} className={FIELD} />
        </div>
        <div>
          <div className="flex items-baseline justify-between"><label htmlFor="p-personality" className="font-bold">Personality <span className="font-normal text-chimera-mute">(optional)</span></label>{counter(form.personality, PERSONA_LIMITS.personality)}</div>
          <textarea id="p-personality" value={form.personality} onChange={(e) => set('personality', e.target.value)} maxLength={PERSONA_LIMITS.personality} rows={3} className={FIELD} />
        </div>
        <div>
          <div className="flex items-baseline justify-between"><label htmlFor="p-appearance" className="font-bold">Appearance <span className="font-normal text-chimera-mute">(optional)</span></label>{counter(form.appearance, PERSONA_LIMITS.appearance)}</div>
          <textarea id="p-appearance" value={form.appearance} onChange={(e) => set('appearance', e.target.value)} maxLength={PERSONA_LIMITS.appearance} rows={3} className={FIELD} />
        </div>
        <div>
          <div className="flex items-baseline justify-between"><label htmlFor="p-backstory" className="font-bold">Backstory <span className="font-normal text-chimera-mute">(optional)</span></label>{counter(form.backstory, PERSONA_LIMITS.backstory)}</div>
          <textarea id="p-backstory" value={form.backstory} onChange={(e) => set('backstory', e.target.value)} maxLength={PERSONA_LIMITS.backstory} rows={5} className={FIELD} />
        </div>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-chimera-gold/25 p-3">
          <input type="checkbox" checked={form.isDefault} onChange={(e) => set('isDefault', e.target.checked)} className="mt-1" />
          <span>
            <span className="font-bold">Use as my default persona</span>
            <span className="block text-sm text-chimera-mute">New scenes start with it. You can still choose another one, or none, before the first message.</span>
          </span>
        </label>

        {problem && <p role="alert" className="rounded-xl border border-chimera-rose/40 bg-chimera-rose/10 px-4 py-3 text-sm text-red-100">{problem}</p>}
        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" disabled={saving} className="inline-flex min-h-[52px] items-center rounded-full bg-chimera-gold px-7 text-base font-bold text-[#1a1208] hover:brightness-110 disabled:opacity-50">{saving ? 'Saving…' : editId ? 'Save changes' : 'Create persona'}</button>
          <Link to="/personas" className="text-chimera-mute hover:text-chimera-gold">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
