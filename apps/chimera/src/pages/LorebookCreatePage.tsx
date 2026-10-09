import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { DepthStepper } from '../components/lorebooks/DepthStepper';
import { ThemePicker } from '../components/lorebooks/ThemePicker';
import { createLorebook, DEFAULT_SCAN_DEPTH, DEFAULT_THEME, LOREBOOK_LIMITS, type ThemeId } from '../lib/lorebooks';

const FIELD = 'mt-2 w-full rounded-xl border border-chimera-gold/25 bg-chimera-bg p-3 text-base text-chimera-ink outline-none placeholder:text-chimera-mute/60 focus:border-chimera-gold';

export default function LorebookCreatePage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [theme, setTheme] = useState<ThemeId>(DEFAULT_THEME);
  const [scanDepth, setScanDepth] = useState(DEFAULT_SCAN_DEPTH);
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user || saving) return;
    if (!title.trim()) {
      setProblem('Give your lorebook a name.');
      return;
    }
    setSaving(true);
    setProblem(null);
    try {
      const id = await createLorebook(user.id, { title, description, theme, scanDepth });
      navigate(`/lorebooks/${id}`);
    } catch {
      setSaving(false);
      showToast('We could not create the lorebook. Please try again.', 'error');
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-5 pb-12 pt-8 sm:px-8">
      <Link to="/lorebooks" className="mb-5 inline-flex items-center gap-2 text-[15px] text-chimera-mute hover:text-chimera-gold">
        <ArrowLeft size={18} aria-hidden="true" /> Your lorebooks
      </Link>
      <p className="mb-3 text-sm font-bold tracking-[0.26em] text-chimera-gold">NEW LOREBOOK</p>
      <h1 className="font-serif text-4xl font-semibold sm:text-5xl">Create a lorebook.</h1>
      <p className="mt-3 text-chimera-mute">You will add its entries on the next page. You can also <Link to="/lorebooks" className="font-bold text-chimera-gold underline">import a JSON file</Link> from the list.</p>

      <form onSubmit={(e) => void submit(e)} className="mt-8 space-y-6" noValidate>
        <div>
          <div className="flex items-baseline justify-between">
            <label htmlFor="lb-name" className="font-bold">Name <span className="text-chimera-rose" aria-hidden="true">*</span></label>
            <span className="text-xs text-chimera-mute">{title.length}/{LOREBOOK_LIMITS.title}</span>
          </div>
          <input id="lb-name" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={LOREBOOK_LIMITS.title} required aria-required="true" className={FIELD} placeholder="The Sunken Archipelago" />
        </div>

        <ThemePicker name="lb-theme" value={theme} onChange={setTheme} />

        <div>
          <div className="flex items-baseline justify-between">
            <label htmlFor="lb-description" className="font-bold">Description <span className="font-normal text-chimera-mute">(optional, only for you)</span></label>
            <span className="text-xs text-chimera-mute">{description.length}/{LOREBOOK_LIMITS.description}</span>
          </div>
          <textarea id="lb-description" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={LOREBOOK_LIMITS.description} rows={3} className={FIELD} placeholder="What this lorebook is for" />
        </div>

        <div>
          <p id="lb-depth" className="font-bold">Message depth</p>
          <p className="text-sm text-chimera-mute">How many of the latest chat messages this lorebook checks for keywords, newest first. Choose a number from 1 to 10. An entry can ask for its own number.</p>
          <DepthStepper id="lb-depth" value={scanDepth} onChange={setScanDepth} />
        </div>

        {problem && <p role="alert" className="rounded-xl border border-chimera-rose/40 bg-chimera-rose/10 px-4 py-3 text-[15px] text-rose-100">{problem}</p>}

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={saving} className="inline-flex min-h-[48px] items-center rounded-full bg-chimera-gold px-7 font-bold text-[#1a1208] hover:brightness-110 disabled:opacity-50">
            {saving ? 'Creating…' : 'Create lorebook'}
          </button>
          <Link to="/lorebooks" className="min-h-[48px] rounded-full px-4 py-3 text-chimera-mute hover:text-chimera-ink">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
