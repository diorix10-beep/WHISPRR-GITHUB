import type { Dispatch, SetStateAction } from 'react';
import { VISIBILITY_LABEL, type Visibility } from '../lib/characters';
import { GENRES, STATUS_LABEL, STORY_LIMITS, type StoryForm, type StoryStatus } from '../lib/stories';

const FIELD = 'mt-2 w-full rounded-xl border border-chimera-gold/25 bg-chimera-bg p-3 text-base text-chimera-ink outline-none placeholder:text-chimera-mute/60 focus:border-chimera-gold';

const VISIBILITY_HELP: Record<Visibility, string> = {
  private: 'Only you can read this story.',
  unlisted: 'Not shown in the Library. Anyone with the link can read the published chapters.',
  public: 'Shown in the Library for everyone.',
};

interface Props {
  form: StoryForm;
  setForm: Dispatch<SetStateAction<StoryForm>>;
  isFounder: boolean;
  onEdit?: () => void;
}

export function StoryDetailsForm({ form, setForm, isFounder, onEdit }: Props) {
  const set = <K extends keyof StoryForm>(key: K, value: StoryForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    onEdit?.();
  };
  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="s-title" className="font-bold">Title</label>
        <input id="s-title" value={form.title} onChange={(e) => set('title', e.target.value)} maxLength={STORY_LIMITS.title} className={FIELD} placeholder="The Lantern Archive" />
      </div>
      <div>
        <div className="flex items-baseline justify-between">
          <label htmlFor="s-summary" className="font-bold">Summary <span className="font-normal text-chimera-mute">(optional)</span></label>
          <span className="text-xs text-chimera-mute">{form.summary.length} / {STORY_LIMITS.summary}</span>
        </div>
        <textarea id="s-summary" value={form.summary} onChange={(e) => set('summary', e.target.value)} maxLength={STORY_LIMITS.summary} rows={4} className={FIELD} />
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="s-genre" className="font-bold">Genre</label>
          <select id="s-genre" value={form.genre} onChange={(e) => set('genre', e.target.value)} className={FIELD}>
            {[...new Set([...GENRES, form.genre])].map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="s-status" className="font-bold">Progress</label>
          <select id="s-status" value={form.status} onChange={(e) => set('status', e.target.value as StoryStatus)} className={FIELD}>
            {(Object.keys(STATUS_LABEL) as StoryStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="s-tags" className="font-bold">Tags <span className="font-normal text-chimera-mute">(comma separated, up to 6)</span></label>
        <input id="s-tags" value={form.tags} onChange={(e) => set('tags', e.target.value)} className={FIELD} placeholder="Cozy, Mystery" />
      </div>
      <fieldset>
        <legend className="font-bold">Who can read this story</legend>
        <div className="mt-2 space-y-2">
          {(['private', 'unlisted', 'public'] as const).map((value) => {
            const disabled = value === 'public' && !isFounder;
            return (
              <label key={value} className={`flex items-start gap-3 rounded-xl border p-3 ${form.visibility === value ? 'border-chimera-gold bg-chimera-gold/10' : 'border-chimera-gold/25'} ${disabled ? 'opacity-60' : 'cursor-pointer'}`}>
                <input type="radio" name="story-visibility" value={value} checked={form.visibility === value} disabled={disabled} onChange={() => set('visibility', value)} className="mt-1" />
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
    </div>
  );
}
