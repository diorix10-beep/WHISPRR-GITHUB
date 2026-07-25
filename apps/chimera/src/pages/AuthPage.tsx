import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AuthHero } from '../components/auth/AuthHero';
import { SignInForm } from '../components/auth/SignInForm';
import { ForgotPasswordForm } from '../components/auth/ForgotPasswordForm';
import { AuthProviders } from '../components/auth/AuthProviders';
import { brand } from '../brand/brandConfig';
import { Info, Sparkles, X, ShieldCheck, CheckCircle2, ArrowRight, Layers, Users, Globe } from 'lucide-react';
import { WhisprrLogo } from '../components/common/WhisprrLogo';

const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
const whisprrUrl = isLocalhost ? 'http://localhost:5173' : 'https://whisprr.xyz';

type ViewType = 'providers' | 'signin' | 'forgot';

export default function AuthPage() {
  const { loading } = useAuth();
  const [view, setView] = useState<ViewType>('providers');
  const [showEcosystemModal, setShowEcosystemModal] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      localStorage.setItem('whisprr_referrer', ref);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-950 flex flex-col items-center justify-center gap-4">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <img src="/chimera_logo.png" alt="CHIMERA" className="w-14 h-14 object-contain drop-shadow-[0_0_25px_rgba(239,68,68,0.5)]" />
          <p className="text-warm-300 font-serif text-sm font-bold tracking-wider">{brand.loadingText}</p>
        </div>
      </div>
    );
  }

  const showProviders = view === 'providers';
  const isForgot = view === 'forgot';

  return (
    <div className="min-h-screen bg-warm-950 flex flex-col lg:flex-row overflow-hidden relative">
      
      {/* Form Left Side */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-10 lg:py-16 relative z-10">
        
        {/* Ambient Glowing Orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[65%] h-[65%] bg-red-600/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[55%] h-[55%] bg-purple-600/10 rounded-full blur-[100px]" />
        </div>

        <div className="w-full max-w-md relative space-y-6">
          
          {/* Header Branding */}
          <div className="text-center lg:text-left space-y-3">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <img
                src="/chimera_logo.png"
                alt="CHIMERA"
                className="w-10 h-10 object-contain drop-shadow-md group-hover:scale-105 transition-transform"
              />
              <span className="font-serif text-2xl font-extrabold tracking-wider bg-gradient-to-r from-red-500 via-rose-400 to-amber-400 bg-clip-text text-transparent drop-shadow-sm">
                CHIMERA
              </span>
            </Link>

            <div>
              <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight">
                Enter the Creative Universe
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-warm-400 leading-relaxed">
                Roleplay with persistent AI identities, craft sagas, and explore narrative worlds.
              </p>
            </div>
          </div>

          {/* Form Surface */}
          <div className="bg-warm-900/60 backdrop-blur-2xl border border-white/10 p-6 sm:p-8 rounded-3xl shadow-2xl relative space-y-5">
            
            {showProviders && (
              <div className="flex flex-col gap-4">
                <AuthProviders mode="signin" onEmailClick={() => setView('signin')} />
                
                <p className="text-center text-warm-400 text-[11px] leading-relaxed pt-2">
                  By continuing, you agree to our{' '}
                  <Link to="/terms" className="text-warm-200 hover:text-white underline underline-offset-2 transition-colors">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-warm-200 hover:text-white underline underline-offset-2 transition-colors">
                    Privacy Policy
                  </Link>
                  .
                </p>

                <div className="border-t border-white/10 pt-4 text-center">
                  <a
                    href={`${whisprrUrl}/auth?tab=signup`}
                    className="inline-flex items-center gap-2 text-xs font-bold text-warm-300 hover:text-white transition-colors"
                  >
                    <span>New creator? Create an account on WHISPRR</span>
                    <span>→</span>
                  </a>
                </div>
              </div>
            )}

            {view === 'signin' && (
              <div className="flex flex-col gap-5">
                <div className="flex items-center justify-between mb-1">
                  <button
                    onClick={() => setView('providers')}
                    className="text-warm-400 hover:text-white text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <span>← Back to all options</span>
                  </button>
                </div>
                <h2 className="text-lg font-serif font-extrabold text-white">Sign in with Email</h2>
                <SignInForm onForgotPassword={() => setView('forgot')} />
              </div>
            )}

            {isForgot && (
              <ForgotPasswordForm onBack={() => setView('signin')} />
            )}
          </div>

          {/* Bottom Interactive Ecosystem Note */}
          <div className="flex items-center justify-center">
            <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-warm-900/80 hover:bg-warm-850/90 border border-white/10 hover:border-white/20 shadow-lg text-xs text-warm-400 backdrop-blur-md transition-all group">
              <button
                onClick={() => setShowEcosystemModal(true)}
                className="flex items-center gap-1.5 hover:text-white transition-colors"
                title="Click to learn about shared ecosystem"
              >
                <Info size={14} className="text-purple-400 group-hover:scale-110 transition-transform shrink-0" />
                <span>One account unlocks both</span>
              </button>

              <Link
                to="/"
                className="font-bold text-warm-200 hover:text-red-400 transition-colors underline decoration-red-500/40 underline-offset-2"
                title="Open CHIMERA Homepage"
              >
                CHIMERA
              </Link>

              <span>and</span>

              <a
                href={whisprrUrl}
                className="font-bold text-primary-400 hover:text-primary-300 transition-colors underline decoration-primary-500/40 underline-offset-2"
                title="Open WHISPRR Social Network"
              >
                WHISPRR
              </a>

              <button
                onClick={() => setShowEcosystemModal(true)}
                className="ml-1 p-0.5 rounded-full hover:bg-white/10 text-warm-400 hover:text-amber-300 transition-colors"
                title="One Account Dialog"
              >
                <Sparkles size={12} className="text-amber-400" />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Hero Right Side */}
      <div className="flex-1 hidden lg:block relative">
        <AuthHero />
      </div>


      {/* ── ONE ACCOUNT ECOSYSTEM DIALOG MODAL ── */}
      {showEcosystemModal && (
        <div className="fixed inset-0 z-[9999] bg-warm-950/80 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md bg-warm-900 rounded-3xl border border-white/15 shadow-2xl p-6 sm:p-8 relative space-y-6 overflow-hidden">
            
            {/* Ambient Background Glow */}
            <div className="absolute -top-20 -right-20 w-44 h-44 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-red-500/20 rounded-full blur-3xl pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={() => setShowEcosystemModal(false)}
              className="absolute top-4 right-4 p-2 rounded-2xl bg-white/5 hover:bg-white/10 text-warm-300 hover:text-white transition-colors"
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>

            {/* Header Badge & Title */}
            <div className="space-y-3 relative">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[10px] font-extrabold uppercase tracking-widest">
                <ShieldCheck size={12} />
                <span>Unified Ecosystem Identity</span>
              </div>

              <h2 className="font-serif text-2xl font-extrabold text-white leading-tight">
                One Account. Two Creative Worlds.
              </h2>

              <p className="text-xs text-warm-300 leading-relaxed">
                Your account is shared across the entire ecosystem. With one single login, you seamlessly access both platforms without extra steps.
              </p>
            </div>

            {/* Platform Comparison Cards */}
            <div className="grid grid-cols-2 gap-3 relative">
              
              {/* CHIMERA */}
              <Link
                to="/"
                onClick={() => setShowEcosystemModal(false)}
                className="p-4 rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-all flex flex-col justify-between gap-3 group text-left"
              >
                <div className="flex items-center justify-between">
                  <img src="/chimera_logo.png" alt="CHIMERA" className="w-6 h-6 object-contain" />
                  <ArrowRight size={12} className="text-red-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div>
                  <h4 className="font-serif font-extrabold text-sm text-white">CHIMERA</h4>
                  <p className="text-[10px] text-warm-300 mt-0.5">Roleplay &amp; Novels</p>
                </div>
              </Link>

              {/* WHISPRR */}
              <a
                href={whisprrUrl}
                className="p-4 rounded-2xl bg-primary-500/10 hover:bg-primary-500/20 border border-primary-500/20 transition-all flex flex-col justify-between gap-3 group text-left"
              >
                <div className="flex items-center justify-between">
                  <WhisprrLogo size={22} />
                  <ArrowRight size={12} className="text-primary-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div>
                  <h4 className="font-serif font-extrabold text-sm text-white">WHISPRR</h4>
                  <p className="text-[10px] text-warm-300 mt-0.5">Social Creator Network</p>
                </div>
              </a>

            </div>

            {/* Feature Bullets */}
            <div className="space-y-2.5 pt-1 text-xs text-warm-300 relative">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                <span><strong className="text-white">Shared Identity &amp; Profile</strong>: Personas, avatars, and bios sync instantly.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-cyan-400 shrink-0 mt-0.5" />
                <span><strong className="text-white">SHARDS Economy</strong>: Use &amp; earn SHARDS across both CHIMERA &amp; WHISPRR.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-purple-400 shrink-0 mt-0.5" />
                <span><strong className="text-white">Zero Extra Sign-in</strong>: Switch between creation and social feeds friction-free.</span>
              </div>
            </div>

            {/* Footer Action */}
            <div className="pt-2">
              <button
                onClick={() => setShowEcosystemModal(false)}
                className="w-full py-3 rounded-2xl bg-white hover:bg-warm-100 text-black font-extrabold text-xs shadow-lg transition-all"
              >
                Got It
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
