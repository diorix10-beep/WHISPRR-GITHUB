import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AuthHero } from '../components/auth/AuthHero';
import { SignInForm } from '../components/auth/SignInForm';
import { SignUpForm } from '../components/auth/SignUpForm';
import { ForgotPasswordForm } from '../components/auth/ForgotPasswordForm';
import { AuthProviders } from '../components/auth/AuthProviders';
import { brand } from '../brand/brandConfig';

type ViewType = 'providers' | 'signin' | 'signup' | 'forgot';

export default function AuthPage() {
  const { loading } = useAuth();
  const [view, setView] = useState<ViewType>('providers');

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
              <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                Characters with a pulse. <br />
                <span className="bg-gradient-to-r from-amber-400 via-rose-400 to-purple-400 bg-clip-text text-transparent">
                  Worlds with a soul.
                </span>
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-warm-400 leading-relaxed">
                Welcome to CHIMERA — your private, distraction-free AI creation studio.
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
                  <button
                    type="button"
                    onClick={() => setView('signup')}
                    className="inline-flex items-center gap-2 text-xs font-bold text-warm-300 hover:text-white transition-colors"
                  >
                    <span>New here? Create your account</span>
                    <span>→</span>
                  </button>
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

            {view === 'signup' && (
              <div className="flex flex-col gap-5">
                <div className="flex items-center justify-between mb-1">
                  <button
                    onClick={() => setView('providers')}
                    className="text-warm-400 hover:text-white text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <span>← Back to all options</span>
                  </button>
                </div>
                <div>
                  <h2 className="text-lg font-serif font-extrabold text-white">Begin with CHIMERA</h2>
                  <p className="mt-1 text-xs leading-relaxed text-warm-400">Your CHIMERA account is your creative home. Choose your space after you join.</p>
                </div>
                <SignUpForm onBack={() => setView('signin')} />
              </div>
            )}

            {isForgot && (
              <ForgotPasswordForm onBack={() => setView('signin')} />
            )}
          </div>

          {/* A CHIMERA-first account promise: the shared technical identity is never a competing product message. */}
          <div className="flex items-center justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-warm-900/80 px-4 py-2 text-xs text-warm-400 shadow-lg backdrop-blur-md">
              <span className="text-amber-300">✦</span>
              <span>Your characters, stories, worlds, SHARDS, and VELLUM belong here.</span>
            </div>
          </div>

        </div>
      </div>

      {/* Hero Right Side */}
      <div className="flex-1 hidden lg:block relative">
        <AuthHero />
      </div>

    </div>
  );
}
