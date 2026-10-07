import { Crown, Gem, Heart, ShieldCheck, Sparkles, X } from 'lucide-react';
import { ShardCrystalImage } from './ShardCrystalImage';

interface ShardsHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  view?: 'shards' | 'patron';
}

const PatronPrinciple = ({ children }: { children: React.ReactNode }) => (
  <li className="flex gap-3 text-sm leading-relaxed text-warm-300">
    <ShieldCheck size={17} className="mt-0.5 shrink-0 text-amber-300" />
    <span>{children}</span>
  </li>
);

/**
 * A truthful information surface for SHARDS and the future Patron membership.
 * It deliberately has no purchases, ad rewards, balances, or local-only VIP state.
 */
export function ShardsHubModal({ isOpen, onClose, view = 'shards' }: ShardsHubModalProps) {
  if (!isOpen) return null;

  const isPatron = view === 'patron';

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md flex items-center justify-center p-4 font-sans animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shards-information-title"
    >
      <section className="w-full max-w-2xl overflow-hidden rounded-3xl border border-amber-500/35 bg-warm-950 shadow-2xl animate-scale-in">
        <header className="relative overflow-hidden border-b border-amber-500/20 bg-gradient-to-br from-purple-950 via-warm-950 to-amber-950/70 px-6 py-8 sm:px-9">
          <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-purple-500/20 blur-3xl" />
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 rounded-full border border-white/10 bg-black/20 p-2 text-warm-100 transition-colors hover:bg-black/45"
          >
            <X size={20} />
          </button>

          <div className="relative flex items-start gap-4 pr-10">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-amber-400/35 bg-black/25 shadow-inner">
              {isPatron ? <Crown size={28} className="text-amber-300" /> : <ShardCrystalImage size={38} />}
            </div>
            <div>
              <p className="mb-1 text-[10px] font-extrabold uppercase tracking-[0.2em] text-amber-300">
                {isPatron ? 'Optional membership' : 'The CHIMERA economy'}
              </p>
              <h2 id="shards-information-title" className="font-serif text-2xl font-bold text-white sm:text-3xl">
                {isPatron ? 'What it means to be a Chimera Patron' : 'About SHARDS'}
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-warm-300">
                {isPatron
                  ? 'A future, optional way to support CHIMERA and help shape its creative tools.'
                  : 'SHARDS are CHIMERA’s creative currency, designed for clearly described, opt-in actions.'}
              </p>
            </div>
          </div>
        </header>

        <div className="space-y-6 p-6 sm:p-9">
          {isPatron ? (
            <>
              <div className="rounded-2xl border border-purple-400/25 bg-purple-950/30 p-5">
                <div className="flex items-center gap-2 text-amber-200">
                  <Sparkles size={18} />
                  <h3 className="font-serif text-lg font-bold">Built with creators, not around pressure</h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-warm-300">
                  Patron is being designed as an optional membership for people who want to support the platform more closely. It will never be required to write, roleplay, create worlds, or continue the stories you love.
                </p>
              </div>

              <div>
                <h3 className="mb-3 font-serif text-lg font-bold text-white">What Patron is intended to make possible</h3>
                <ul className="space-y-3">
                  <PatronPrinciple>Thoughtful early access to new creative tools, only when they are ready.</PatronPrinciple>
                  <PatronPrinciple>More room to shape creator-focused features through feedback and testing.</PatronPrinciple>
                  <PatronPrinciple>A transparent way to help sustain the stories, worlds, and characters built in CHIMERA.</PatronPrinciple>
                </ul>
              </div>

              <div className="rounded-2xl border border-dashed border-amber-400/35 bg-amber-500/5 p-5 text-sm leading-relaxed text-warm-300">
                <p className="font-bold text-amber-200">Not open for purchase yet</p>
                <p className="mt-1">There is no price, billing, recurring SHARDS bonus, or membership checkout active today. CHIMERA will publish the exact benefits, limits, and terms before Patron launches.</p>
              </div>
            </>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-purple-400/20 bg-purple-950/25 p-4">
                  <Gem size={19} className="text-purple-300" />
                  <h3 className="mt-2 font-bold text-white">Clear value</h3>
                  <p className="mt-1 text-xs leading-relaxed text-warm-400">Every future SHARDS use will say what it unlocks and what it costs.</p>
                </div>
                <div className="rounded-2xl border border-purple-400/20 bg-purple-950/25 p-4">
                  <Heart size={19} className="text-amber-300" />
                  <h3 className="mt-2 font-bold text-white">Creator-first</h3>
                  <p className="mt-1 text-xs leading-relaxed text-warm-400">Creator support and rewards will appear only when their underlying systems are live.</p>
                </div>
                <div className="rounded-2xl border border-purple-400/20 bg-purple-950/25 p-4">
                  <ShieldCheck size={19} className="text-emerald-300" />
                  <h3 className="mt-2 font-bold text-white">No pretend economy</h3>
                  <p className="mt-1 text-xs leading-relaxed text-warm-400">No fake balances, fake progress, ads, purchases, or rewards are shown as real.</p>
                </div>
              </div>
              <div className="rounded-2xl border border-dashed border-amber-400/35 bg-amber-500/5 p-5 text-sm leading-relaxed text-warm-300">
                <p className="font-bold text-amber-200">What is live now</p>
                <p className="mt-1">Every human account receives a one-time welcome credit of 1,000 SHARDS in the secure wallet ledger. The interface is being connected to that live ledger next; purchasing, tipping, payout, and Patron membership are not live yet.</p>
              </div>
            </>
          )}

          <button
            onClick={onClose}
            className="w-full rounded-xl border border-amber-400/35 bg-purple-900/70 px-5 py-3 text-sm font-bold text-amber-100 transition-colors hover:bg-purple-800"
          >
            I understand
          </button>
        </div>
      </section>
    </div>
  );
}
