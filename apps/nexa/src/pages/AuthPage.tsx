import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AuthHero } from '../components/auth/AuthHero';
import { SignInForm } from '../components/auth/SignInForm';
import { SignUpForm } from '../components/auth/SignUpForm';
import { ForgotPasswordForm } from '../components/auth/ForgotPasswordForm';
import { AuthProviders } from '../components/auth/AuthProviders';
import { Footer } from '../components/legal/Footer';
type TabType = 'signin' | 'signup' | 'forgot';

export default function AuthPage() {
  const { loading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('signin');

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
          <div className="w-12 h-12 bg-red-500 rounded-full shadow-[0_0_30px_rgba(239,68,68,0.5)]"></div>
          <p className="text-warm-400 font-medium">Entering NEXA...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-950 flex flex-col relative overflow-x-hidden">
      
      {/* Immersive Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-indigo-900/30 rounded-full blur-[120px] mix-blend-screen opacity-60"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-red-900/20 rounded-full blur-[100px] mix-blend-screen opacity-50"></div>
        <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[150px] mix-blend-screen opacity-40"></div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 relative">
        <div className="w-full max-w-md relative z-10 flex flex-col gap-6">
        
        <AuthHero />

        {/* Glassmorphic Card */}
        <div className="bg-warm-900/40 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-2xl relative">
          
          {/* Subtle inner glow */}
          <div className="absolute inset-0 rounded-3xl border border-white/5 pointer-events-none"></div>

          {activeTab !== 'forgot' && (
            <div className="flex gap-2 mb-8 bg-warm-950/50 p-1.5 rounded-2xl border border-white/5">
              <button
                onClick={() => setActiveTab('signin')}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 ${
                  activeTab === 'signin'
                    ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                    : 'text-warm-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setActiveTab('signup')}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 ${
                  activeTab === 'signup'
                    ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                    : 'text-warm-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Create Account
              </button>
            </div>
          )}

          {activeTab === 'signin' && (
            <SignInForm onForgotPassword={() => setActiveTab('forgot')} />
          )}

          {activeTab === 'signup' && (
            <SignUpForm />
          )}

          {activeTab === 'forgot' && (
            <ForgotPasswordForm onBack={() => setActiveTab('signin')} />
          )}

          {activeTab !== 'forgot' && <AuthProviders />}
          
        </div>
        
        {/* Shared Ecosystem Messaging */}
        {activeTab !== 'forgot' && (
          <div className="text-center bg-warm-900/30 backdrop-blur-md border border-white/5 p-4 rounded-2xl mt-4">
            <p className="text-warm-400 text-sm leading-relaxed">
              Already have a <span className="font-bold text-white">WHISPRR</span> account?<br/>
              <span className="text-warm-300">Sign in with the same account.</span>
            </p>
          </div>
        )}
      </div>
      </div>
      <Footer product="nexa" />
    </div>
  );
}
