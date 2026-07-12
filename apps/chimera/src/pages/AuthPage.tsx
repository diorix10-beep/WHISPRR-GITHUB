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
      <div className="min-h-screen bg-warm-950 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-primary-500 rounded-full shadow-[0_0_30px_rgba(201,96,89,0.5)]" />
          <p className="text-warm-400 font-medium tracking-wide">{brand.loadingText}</p>
        </div>
      </div>
    );
  }

  const showProviders = view === 'providers';
  const isForgot = view === 'forgot';

  return (
    <div className="min-h-screen bg-warm-950 flex flex-col lg:flex-row overflow-hidden">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 lg:py-0 lg:px-16 xl:px-24 relative z-10">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-15%] left-[-10%] w-[60%] h-[60%] bg-primary-900/15 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-accent-900/10 rounded-full blur-[100px]" />
        </div>

        <div className="w-full max-w-sm relative">
          <div className="mb-10 lg:mb-12">
            <div className="flex items-center gap-2.5 mb-6 auth-text-rise">
              <div className="w-8 h-8 bg-primary-500 rounded-full shadow-[0_0_20px_rgba(201,96,89,0.4)]" />
              <span className="font-bold text-white tracking-[0.15em] text-sm">{brand.shortName}</span>
            </div>
            <h1 className="auth-text-rise auth-text-rise-delay-1 font-serif text-3xl lg:text-4xl text-white leading-tight">
              {brand.name.split('.')[0]}<span className="text-primary-400">.AI</span>
            </h1>
            <p className="auth-text-rise auth-text-rise-delay-2 mt-3 text-warm-400 text-base lg:text-lg leading-relaxed">
              {brand.authSubtitle}
            </p>
          </div>

          <div className="auth-text-rise auth-text-rise-delay-3 bg-warm-900/40 backdrop-blur-2xl border border-white/10 p-7 lg:p-8 rounded-2xl shadow-2xl relative">
            <div className="absolute inset-0 rounded-2xl border border-white/5 pointer-events-none" />

            {showProviders && (
              <div className="flex flex-col gap-4">
                <AuthProviders mode="signin" onEmailClick={() => setView('signin')} />
                <p className="text-center text-warm-500 text-xs mt-4 leading-relaxed">
                  By continuing, you agree to our{' '}
                  <Link to="/terms" className="text-warm-300 hover:text-white underline underline-offset-2 transition-colors">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-warm-300 hover:text-white underline underline-offset-2 transition-colors">
                    Privacy Policy
                  </Link>
                  .
                </p>
                <div className="text-center mt-2">
                  <button
                    onClick={() => setView('signup')}
                    className="text-warm-400 hover:text-white text-sm font-medium transition-colors"
                  >
                    New here? Create an account
                  </button>
                </div>
              </div>
            )}

            {view === 'signin' && (
              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-2 mb-1">
                  <button
                    onClick={() => setView('providers')}
                    className="text-warm-400 hover:text-white text-sm font-medium transition-colors flex items-center gap-1.5"
                  >
                    <span className="text-base">←</span> Back
                  </button>
                </div>
                <h2 className="text-xl font-semibold text-white">Sign in with email</h2>
                <SignInForm onForgotPassword={() => setView('forgot')} />
              </div>
            )}

            {view === 'signup' && (
              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-2 mb-1">
                  <button
                    onClick={() => setView('providers')}
                    className="text-warm-400 hover:text-white text-sm font-medium transition-colors flex items-center gap-1.5"
                  >
                    <span className="text-base">←</span> Back
                  </button>
                </div>
                <h2 className="text-xl font-semibold text-white">Create your account</h2>
                <SignUpForm />
              </div>
            )}

            {isForgot && (
              <ForgotPasswordForm onBack={() => setView('signin')} />
            )}
          </div>

          {!isForgot && (
            <div className="auth-text-rise auth-text-rise-delay-4 text-center mt-5">
              <p className="text-warm-500 text-xs leading-relaxed">
                Already have a <span className="font-semibold text-warm-300">WHISPRR</span> account?
                <br />
                <span className="text-warm-400">Sign in with the same credentials.</span>
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="hidden lg:block lg:w-[45%] xl:w-[50%] h-screen relative">
        <AuthHero />
      </div>

      <div className="lg:hidden relative h-44 overflow-hidden hero-fade-in">
        <div
          className="absolute inset-0 ken-burns"
          style={{
            backgroundImage:
              "url(https://images.pexels.com/photos/4670617/pexels-photo-4670617.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop)",
            backgroundSize: 'cover',
            backgroundPosition: 'center 30%',
          }}
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-warm-950 via-warm-950/20 to-transparent" />
        <div className="absolute bottom-4 left-6 right-6">
          <p className="font-serif text-lg text-white/95 leading-snug drop-shadow-md">
            {brand.heroTagline}
          </p>
        </div>
      </div>
    </div>
  );
}
