import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { CardImportError, importCardFile, type ImportNotes, type ImportResult } from '../lib/characterImport';
import {
  CATEGORIES,
  EMPTY_FORM,
  LIMITS,
  VISIBILITY_LABEL,
  formFromRecord,
  saveCharacter,
  validateForm,
  type CharacterForm,
  type CharacterRecord,
  type Visibility,
} from '../lib/characters';

const FIELD = 'mt-2 w-full rounded-xl border border-chimera-gold/25 bg-chimera-bg p-3 text-base text-chimera-ink outline-none placeholder:text-chimera-mute/60 focus:border-chimera-gold';

const VISIBILITY_HELP: Record<Visibility, string> = {
  private: 'Only you can see and chat with this character.',
  unlisted: 'Not shown in Discover. Anyone with the link can chat with it.',
  public: 'Shown in Discover for everyone.',
};

export default function CreateCharacterPage() {
  const { id: editId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState<CharacterForm>(EMPTY_FORM);
  const [existing, setExisting] = useState<CharacterRecord | null>(null);
  const [isFounder, setIsFounder] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importedNotes, setImportedNotes] = useState<ImportNotes | null>(null);
  const [pendingImport, setPendingImport] = useState<ImportResult | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const { data: me } = await supabase.from('profiles').select('role').eq('user_id', user.id).maybeSingle();
      if (!active) return;
      setIsFounder(me?.role === 'founder');
      if (editId) {
        const { data, error } = await supabase.from('ai_characters').select('*').eq('id', editId).eq('creator_id', user.id).maybeSingle();
        if (!active) return;
        if (error || !data) {
          setLoadError(true);
        } else {
          setExisting(data as CharacterRecord);
          setForm(formFromRecord(data as CharacterRecord));
        }
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [user, editId]);

  const set = <K extends keyof CharacterForm>(key: K, value: CharacterForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setProblem(null);
  };

  const applyImport = (result: ImportResult) => {
    setForm(result.form);
    setImportedNotes(result.notes);
    setPendingImport(null);
    setProblem(null);
  };

  const chooseCard = async (file: File | undefined) => {
    if (!file || importing) return;
    setImporting(true);
    setImportError(null);
    try {
      const result = await importCardFile(file);
      // Do not silently replace what the person has already typed.
      const typedSomething = JSON.stringify(form) !== JSON.stringify(EMPTY_FORM);
      if (typedSomething) setPendingImport(result);
      else applyImport(result);
    } catch (error) {
      setImportError(error instanceof CardImportError ? error.message : 'We could not read this file. Please try another card.');
    } finally {
      setImporting(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;
    const message = validateForm(form);
    setProblem(message);
    if (message) return;
    setSaving(true);
    try {
      const id = await saveCharacter(form, existing);
      showToast(editId ? 'Character updated.' : 'Character created.', 'success');
      navigate(`/characters/${id}`);
    } catch (error) {
      const text = error instanceof Error ? error.message : (error as { message?: string } | null)?.message;
      setProblem(/founder|public publishing/i.test(text ?? '')
        ? 'Public publishing is limited to the CHIMERA founder during the beta. Choose private or unlisted.'
        : 'We could not save this character. Your text is still here, please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="px-5 py-24 text-center text-chimera-mute">Opening the workshop…</p>;

  if (loadError) {
    return (
      <div className="mx-auto max-w-xl px-5 py-24 text-center">
        <h1 className="font-serif text-4xl font-semibold">Character not found</h1>
        <p className="mt-3 text-chimera-mute">Only the creator can edit a character.</p>
        <Link to="/my-characters" className="mt-6 inline-flex min-h-[44px] items-center rounded-full border border-chimera-gold/50 px-5 font-bold hover:bg-chimera-gold/10">Your characters</Link>
      </div>
    );
  }

  const count = (value: string, max: number) => <span className="text-xs text-chimera-mute">{value.length} / {max}</span>;

  return (
    <div className="mx-auto max-w-3xl px-5 pb-12 pt-8 sm:px-8">
      <Link to="/my-characters" className="mb-5 inline-flex items-center gap-2 text-[15px] text-chimera-mute hover:text-chimera-gold">
        <ArrowLeft size={18} aria-hidden="true" /> Your characters
      </Link>
      <p className="mb-3 text-sm font-bold tracking-[0.26em] text-chimera-gold">{editId ? 'EDIT CHARACTER' : 'NEW CHARACTER'}</p>
      <h1 className="font-serif text-4xl font-semibold sm:text-5xl">{editId ? 'Refine your character.' : 'Bring someone to life.'}</h1>
      <p className="mt-3 text-chimera-mute">
        Characters here are rated SFW for now. Keep them fictional, never based on a real person, and never sexual in any way involving minors.
      </p>

      {!editId && (
        <section aria-labelledby="import-title" className="mt-6 rounded-2xl border border-chimera-gold/25 bg-chimera-panel p-4">
          <h2 id="import-title" className="font-serif text-xl font-semibold text-chimera-gold">Already have a character card?</h2>
          <p className="mt-1 text-sm text-chimera-mute">
            Import a card from another site (a .png picture with the card inside, or a .json file). It only fills the form below: you read it through and decide before anything is saved, and it starts private. Only import characters you made or have permission to use.
          </p>
          <input ref={fileInput} id="card-file" type="file" accept=".png,.json,image/png,application/json" className="sr-only" onChange={(e) => void chooseCard(e.target.files?.[0])} />
          <label htmlFor="card-file" className={`mt-3 inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full border border-chimera-gold/50 px-5 text-sm font-bold hover:bg-chimera-gold/10 ${importing ? 'opacity-60' : ''}`}>
            <FileUp size={17} aria-hidden="true" /> {importing ? 'Reading…' : 'Choose a card file'}
          </label>
          {importError && <p role="alert" className="mt-3 rounded-xl border border-chimera-rose/40 bg-chimera-rose/10 px-4 py-3 text-sm text-red-100">{importError}</p>}
          {pendingImport && (
            <div role="group" aria-label="Replace the form" className="mt-3 rounded-xl border border-chimera-gold/40 p-3">
              <p className="text-sm">Importing <span className="font-bold">{pendingImport.form.name || 'this card'}</span> will replace what you have typed so far.</p>
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={() => applyImport(pendingImport)} className="min-h-[44px] rounded-full bg-chimera-gold px-5 text-sm font-bold text-[#1a1208]">Replace the form</button>
                <button type="button" onClick={() => setPendingImport(null)} className="min-h-[44px] rounded-full border border-chimera-gold/40 px-5 text-sm font-bold">Keep what I typed</button>
              </div>
            </div>
          )}
          {importedNotes && (
            <div role="status" className="mt-3 rounded-xl border border-chimera-gold/30 bg-chimera-bg p-3 text-sm">
              <p className="font-bold text-chimera-ink">Imported from a {importedNotes.format}. Please read everything through before you create it.</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-chimera-mute">
                {importedNotes.trimmed.map((item) => (
                  <li key={item.field}>{item.field} was {item.from.toLocaleString()} characters and was shortened to {item.to.toLocaleString()}. Check that it still ends well.</li>
                ))}
                {importedNotes.leftOut.map((item) => <li key={item}>Not imported: {item}.</li>)}
                {importedNotes.picture && <li>The card&apos;s picture is not used yet.</li>}
                {importedNotes.placeholders.length > 0 && <li>These placeholders were left as written: {importedNotes.placeholders.join(', ')}.</li>}
                <li>Instructions for the player were written as &ldquo;you&rdquo; or &ldquo;the player&rdquo;.</li>
              </ul>
            </div>
          )}
        </section>
      )}

      <form onSubmit={(e) => void submit(e)} className="mt-8 space-y-6" noValidate>
        <div>
          <label htmlFor="c-name" className="font-bold">Name</label>
          <input id="c-name" value={form.name} onChange={(e) => set('name', e.target.value)} maxLength={LIMITS.name} className={FIELD} placeholder="Captain Isolde Vance" />
        </div>

        <div>
          <label htmlFor="c-tagline" className="font-bold">Tagline <span className="font-normal text-chimera-mute">(one line shown on cards)</span></label>
          <input id="c-tagline" value={form.tagline} onChange={(e) => set('tagline', e.target.value)} maxLength={LIMITS.tagline} className={FIELD} placeholder="Sky-pirate captain with a map she cannot read alone." />
        </div>

        <div>
          <div className="flex items-baseline justify-between"><label htmlFor="c-greeting" className="font-bold">Opening message</label>{count(form.greeting, LIMITS.greeting)}</div>
          <p className="text-sm text-chimera-mute">The first thing your character says when a scene begins.</p>
          <textarea id="c-greeting" value={form.greeting} onChange={(e) => set('greeting', e.target.value)} maxLength={LIMITS.greeting} rows={4} className={FIELD} placeholder={'*She looks up from the chart table.* You are either very brave or very lost.'} />
        </div>

        <div>
          <div className="flex items-baseline justify-between"><label htmlFor="c-personality" className="font-bold">Personality</label>{count(form.personality, LIMITS.personality)}</div>
          <p className="text-sm text-chimera-mute">How they speak, what they want, what they hide. The more specific, the better they stay in character.</p>
          <textarea id="c-personality" value={form.personality} onChange={(e) => set('personality', e.target.value)} maxLength={LIMITS.personality} rows={5} className={FIELD} />
        </div>

        <div>
          <div className="flex items-baseline justify-between"><label htmlFor="c-scenario" className="font-bold">Scenario <span className="font-normal text-chimera-mute">(optional)</span></label>{count(form.scenario, LIMITS.scenario)}</div>
          <p className="text-sm text-chimera-mute">Where and when the story begins.</p>
          <textarea id="c-scenario" value={form.scenario} onChange={(e) => set('scenario', e.target.value)} maxLength={LIMITS.scenario} rows={3} className={FIELD} />
        </div>

        <div>
          <div className="flex items-baseline justify-between"><label htmlFor="c-examples" className="font-bold">Example dialogue <span className="font-normal text-chimera-mute">(optional)</span></label>{count(form.examples, LIMITS.examples)}</div>
          <p className="text-sm text-chimera-mute">A few lines showing their voice. They are used as a guide, not copied.</p>
          <textarea id="c-examples" value={form.examples} onChange={(e) => set('examples', e.target.value)} maxLength={LIMITS.examples} rows={4} className={FIELD} />
        </div>

        <div>
          <div className="flex items-baseline justify-between"><label htmlFor="c-about" className="font-bold">About <span className="font-normal text-chimera-mute">(optional)</span></label>{count(form.about, LIMITS.about)}</div>
          <textarea id="c-about" value={form.about} onChange={(e) => set('about', e.target.value)} maxLength={LIMITS.about} rows={3} className={FIELD} />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="c-category" className="font-bold">Category</label>
            <select id="c-category" value={form.category} onChange={(e) => set('category', e.target.value)} className={FIELD}>
              {[...new Set([...CATEGORIES, form.category])].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="c-tags" className="font-bold">Tags <span className="font-normal text-chimera-mute">(comma separated, up to {LIMITS.tags})</span></label>
            <input id="c-tags" value={form.tags} onChange={(e) => set('tags', e.target.value)} className={FIELD} placeholder="Adventure, Found family" />
          </div>
        </div>

        <fieldset>
          <legend className="font-bold">Who can find this character</legend>
          <div className="mt-2 space-y-2">
            {(['private', 'unlisted', 'public'] as const).map((value) => {
              const disabled = value === 'public' && !isFounder;
              return (
                <label key={value} className={`flex items-start gap-3 rounded-xl border p-3 ${form.visibility === value ? 'border-chimera-gold bg-chimera-gold/10' : 'border-chimera-gold/25'} ${disabled ? 'opacity-60' : 'cursor-pointer'}`}>
                  <input type="radio" name="visibility" value={value} checked={form.visibility === value} disabled={disabled} onChange={() => set('visibility', value)} className="mt-1" />
                  <span>
                    <span className="font-bold">{VISIBILITY_LABEL[value]}</span>
                    <span className="block text-sm text-chimera-mute">
                      {VISIBILITY_HELP[value]}
                      {disabled && ' Public publishing is limited to the CHIMERA founder during the beta.'}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {problem && <p role="alert" className="rounded-xl border border-chimera-rose/40 bg-chimera-rose/10 px-4 py-3 text-sm text-red-100">{problem}</p>}

        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" disabled={saving} className="inline-flex min-h-[52px] items-center rounded-full bg-chimera-gold px-7 text-base font-bold text-[#1a1208] hover:brightness-110 disabled:opacity-50">
            {saving ? 'Saving…' : editId ? 'Save changes' : 'Create character'}
          </button>
          <Link to="/my-characters" className="text-chimera-mute hover:text-chimera-gold">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
