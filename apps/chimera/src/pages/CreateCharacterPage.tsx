import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Camera, FileUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { CardImportError, importCardFile, type ImportNotes, type ImportResult } from '../lib/characterImport';
import { checkAvatarFile, uploadCharacterAvatar } from '../lib/characterAvatar';
import { AGE_VERIFICATION_LIVE } from '../lib/ageVerification';
import { CharacterAvatar } from '../components/characters/CharacterAvatar';
import { FormSection } from '../components/characters/FormSection';
import { TagPicker } from '../components/characters/TagPicker';
import {
  CATEGORIES,
  EMPTY_FORM,
  LIMITS,
  MAX_DEFINITION_CHARACTERS,
  VISIBILITY_LABEL,
  definitionSize,
  estimateTokens,
  formFromRecord,
  missingForCreate,
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
  const avatarInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

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
          // The card name is the profile's display name; the character row only keeps the chat name.
          const { data: profile } = await supabase.from('profiles').select('display_name').eq('user_id', (data as CharacterRecord).user_id as string).maybeSingle();
          if (!active) return;
          setExisting(data as CharacterRecord);
          setForm(formFromRecord(data as CharacterRecord, profile?.display_name ?? ''));
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

  const chooseAvatar = async (file: File | undefined) => {
    if (!file || !user || uploading) return;
    const problem = checkAvatarFile(file);
    if (problem) {
      setAvatarError(problem);
      return;
    }
    setUploading(true);
    setAvatarError(null);
    try {
      set('avatarUrl', await uploadCharacterAvatar(user.id, file));
    } catch (error) {
      setAvatarError(error instanceof Error ? error.message : 'We could not upload this picture. Please try again.');
    } finally {
      setUploading(false);
      if (avatarInput.current) avatarInput.current.value = '';
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

  // A rough size, never a limit.
  const tokens = (value: string) => <span className="text-xs text-chimera-mute">≈ {estimateTokens(value).toLocaleString()} tokens</span>;
  const missing = missingForCreate(form);
  const size = definitionSize(form);
  const required = <span className="text-chimera-rose" aria-hidden="true"> *</span>;

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
          <p className="font-bold" id="avatar-label">Picture</p>
          <input ref={avatarInput} id="c-avatar" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-labelledby="avatar-label" onChange={(e) => void chooseAvatar(e.target.files?.[0])} />
          <label htmlFor="c-avatar" className={`mt-2 flex min-h-[132px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-chimera-gold/40 p-4 text-center hover:bg-chimera-gold/5 ${uploading ? 'opacity-60' : ''}`}>
            {form.avatarUrl ? (
              <CharacterAvatar url={form.avatarUrl} name={form.name} size="h-28 w-28" initialSize="text-5xl" rounded="rounded-2xl" />
            ) : (
              <Camera size={30} className="text-chimera-gold" aria-hidden="true" />
            )}
            <span className="text-chimera-mute">{uploading ? 'Uploading…' : form.avatarUrl ? 'Choose another picture' : 'Upload a picture (JPG, PNG or WebP)'}</span>
          </label>
          {avatarError && <p role="alert" className="mt-2 text-sm text-red-200">{avatarError}</p>}
          <p className="mt-2 text-sm text-chimera-mute">Optional. Only use a picture you have the right to use, and nothing that breaks the rules: no one under 18 in a sexual context, no real people, nothing explicit.</p>
        </div>

        <div>
          <label htmlFor="c-name" className="font-bold">Character name{required}</label>
          <input id="c-name" value={form.name} onChange={(e) => set('name', e.target.value)} maxLength={LIMITS.name} required aria-required="true" className={FIELD} placeholder="Captain Isolde Vance" />
        </div>

        <div>
          <label htmlFor="c-chat-name" className="font-bold">Chat name <span className="font-normal text-chimera-mute">(optional)</span></label>
          <input id="c-chat-name" value={form.chatName} onChange={(e) => set('chatName', e.target.value)} maxLength={LIMITS.chatName} className={FIELD} placeholder="Isolde" />
          <p className="mt-1 text-sm text-chimera-mute">A nickname used in chats and by the AI, instead of the name above.</p>
        </div>

        <div>
          <label htmlFor="c-tagline" className="font-bold">Tagline <span className="font-normal text-chimera-mute">(one line shown on cards)</span></label>
          <input id="c-tagline" value={form.tagline} onChange={(e) => set('tagline', e.target.value)} maxLength={LIMITS.tagline} className={FIELD} placeholder="Sky-pirate captain with a map she cannot read alone." />
        </div>

        <div>
          <label htmlFor="c-about" className="font-bold">Bio <span className="font-normal text-chimera-mute">(optional)</span></label>
          <textarea id="c-about" value={form.about} onChange={(e) => set('about', e.target.value)} rows={4} className={FIELD} placeholder="Press here to start writing…" />
          <p className="mt-1 text-sm text-chimera-mute">Shown on the character&apos;s card and used by search. It does not change how they answer.</p>
        </div>

        <FormSection title="Character settings">
          <div>
            <label htmlFor="c-category" className="font-bold">Category</label>
            <select id="c-category" value={form.category} onChange={(e) => set('category', e.target.value)} className={FIELD}>
              {[...new Set([...CATEGORIES, form.category])].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <TagPicker value={form.tags} onChange={(value) => set('tags', value)} />

          <fieldset>
            <legend className="font-bold">Content rating</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <label className="flex items-start gap-3 rounded-xl border border-chimera-gold bg-chimera-gold/10 p-3">
                <input type="radio" name="rating" checked readOnly className="mt-1" />
                <span><span className="font-bold">General</span><span className="block text-sm text-chimera-mute">Suitable for everyone on CHIMERA. Nothing sexual or explicit.</span></span>
              </label>
              <label className="flex items-start gap-3 rounded-xl border border-chimera-gold/25 p-3 opacity-60">
                <input type="radio" name="rating" disabled className="mt-1" />
                <span><span className="font-bold">Mature</span><span className="block text-sm text-chimera-mute">{AGE_VERIFICATION_LIVE ? 'For verified adults only.' : 'Available once age verification opens. Coming soon.'}</span></span>
              </label>
            </div>
            <p className="mt-2 text-sm text-chimera-mute">A character who is, or looks like, a minor can never be part of sexual content, whatever the rating.</p>
          </fieldset>

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
        </FormSection>

        <FormSection title="Character definition: this is the heart of your character">
          <p className="text-sm text-chimera-mute">Write as much as you need. Everything here is read by the AI with every reply, so the more precise it is, the better they stay in character.</p>

          <div>
            <div className="flex items-baseline justify-between"><label htmlFor="c-personality" className="font-bold">Personality{required}</label>{tokens(form.personality)}</div>
            <textarea id="c-personality" value={form.personality} onChange={(e) => set('personality', e.target.value)} rows={7} required aria-required="true" className={FIELD} placeholder="Describe who they are and how they act with others." />
          </div>

          <div>
            <div className="flex items-baseline justify-between"><label htmlFor="c-scenario" className="font-bold">Scenario <span className="font-normal text-chimera-mute">(optional)</span></label>{tokens(form.scenario)}</div>
            <p className="text-sm text-chimera-mute">The setting and the situation your scenes start from.</p>
            <textarea id="c-scenario" value={form.scenario} onChange={(e) => set('scenario', e.target.value)} rows={5} className={FIELD} />
          </div>

          <div>
            <div className="flex items-baseline justify-between"><label htmlFor="c-greeting" className="font-bold">Opening message{required}</label>{tokens(form.greeting)}</div>
            <p className="text-sm text-chimera-mute">The first thing your character says when a scene begins. A longer, vivid opening makes longer answers.</p>
            <textarea id="c-greeting" value={form.greeting} onChange={(e) => set('greeting', e.target.value)} rows={6} required aria-required="true" className={FIELD} placeholder={'*She looks up from the chart table.* You are either very brave or very lost.'} />
          </div>

          <div>
            <div className="flex items-baseline justify-between"><label htmlFor="c-examples" className="font-bold">Example dialogue <span className="font-normal text-chimera-mute">(optional)</span></label>{tokens(form.examples)}</div>
            <p className="text-sm text-chimera-mute">Short exchanges that show how they speak. This teaches the AI their voice.</p>
            <textarea id="c-examples" value={form.examples} onChange={(e) => set('examples', e.target.value)} rows={6} className={FIELD} />
          </div>

          <FormSection title="More guidance (optional)" defaultOpen={Boolean(form.style || form.lore || form.avoid || form.notes)}>
            <div>
              <div className="flex items-baseline justify-between"><label htmlFor="c-style" className="font-bold">Speech style</label>{tokens(form.style)}</div>
              <p className="text-sm text-chimera-mute">How they talk: rhythm, accent, favourite words.</p>
              <textarea id="c-style" value={form.style} onChange={(e) => set('style', e.target.value)} rows={3} className={FIELD} />
            </div>
            <div>
              <div className="flex items-baseline justify-between"><label htmlFor="c-lore" className="font-bold">Lore and knowledge</label>{tokens(form.lore)}</div>
              <p className="text-sm text-chimera-mute">What they know about their world. They reveal it when it matters, not all at once.</p>
              <textarea id="c-lore" value={form.lore} onChange={(e) => set('lore', e.target.value)} rows={5} className={FIELD} />
            </div>
            <div>
              <div className="flex items-baseline justify-between"><label htmlFor="c-avoid" className="font-bold">Phrases to avoid</label>{tokens(form.avoid)}</div>
              <p className="text-sm text-chimera-mute">Words or phrases they should quietly not use.</p>
              <textarea id="c-avoid" value={form.avoid} onChange={(e) => set('avoid', e.target.value)} rows={2} className={FIELD} />
            </div>
            <div>
              <div className="flex items-baseline justify-between"><label htmlFor="c-notes" className="font-bold">Notes for the AI</label>{tokens(form.notes)}</div>
              <p className="text-sm text-chimera-mute">Anything else the AI should keep in mind about this character.</p>
              <textarea id="c-notes" value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={3} className={FIELD} />
            </div>
          </FormSection>
        </FormSection>

        <FormSection title="Character preview">
          <article className="mx-auto flex max-w-sm flex-col gap-4 rounded-[22px] border border-chimera-gold/20 bg-chimera-bg p-6">
            <div className="flex items-center gap-4">
              <CharacterAvatar url={form.avatarUrl} name={form.name} size="h-[52px] w-[52px]" initialSize="text-2xl" />
              <div className="min-w-0">
                <h3 className="font-serif text-2xl font-semibold leading-tight">{form.name.trim() || 'Your character'}</h3>
                <span className="text-sm text-chimera-mute">{form.category}</span>
              </div>
            </div>
            <p className="leading-relaxed text-violet-100/85">{form.tagline.trim() || form.about.trim().slice(0, 160) || 'A character waiting for a story to begin.'}</p>
            <div className="flex flex-wrap gap-2">
              {form.tags.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 3).map((tag) => (
                <span key={tag} className="rounded-full border border-white/15 px-3 py-1 text-[13px] text-violet-100/80">{tag}</span>
              ))}
              <span className="rounded-full border border-chimera-mint/50 px-3 py-1 text-xs font-bold tracking-[0.1em] text-chimera-mint">GENERAL</span>
            </div>
          </article>
          <p className="text-center text-sm text-chimera-mute">
            The AI reads about <span className="font-bold text-chimera-ink">≈ {Math.ceil(size / 4).toLocaleString()} tokens</span> of definition with every reply.
            {size > MAX_DEFINITION_CHARACTERS * 0.75 && ' That is very long: replies will be slower, and a few more pages would stop chats from working.'}
          </p>
        </FormSection>

        {problem && <p role="alert" className="rounded-xl border border-chimera-rose/40 bg-chimera-rose/10 px-4 py-3 text-sm text-red-100">{problem}</p>}

        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" disabled={saving || uploading || missing.length > 0} aria-describedby={missing.length > 0 ? 'create-needs' : undefined} className="inline-flex min-h-[52px] items-center rounded-full bg-chimera-gold px-7 text-base font-bold text-[#1a1208] hover:brightness-110 disabled:opacity-50">
            {saving ? 'Saving…' : editId ? 'Save changes' : 'Create character'}
          </button>
          <Link to="/my-characters" className="text-chimera-mute hover:text-chimera-gold">Cancel</Link>
        </div>
        {missing.length > 0 && <p id="create-needs" className="text-sm text-chimera-mute">To {editId ? 'save' : 'create'} this character, add {missing.join(', ').replace(/, ([^,]*)$/, ' and $1')}.</p>}
      </form>
    </div>
  );
}
