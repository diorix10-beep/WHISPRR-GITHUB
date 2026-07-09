import { ArrowLeft, ShieldAlert, Sparkles, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Logo } from '../components/common/Logo';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function RestrictedPage() {
  const { signOut, upgradeToEcosystem } = useAuth();
  const navigate = useNavigate();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [error, setError] = useState('');

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    setError('');
    try {
      await upgradeToEcosystem();
      // After upgrade, ProtectedRoute will stop intercepting and let them into the app.
      navigate('/', { replace: true });
    } catch (err) {
      setError('Failed to upgrade account. Please try again or contact support.');
      setIsUpgrading(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-50 dark:bg-warm-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-warm-900 border border-warm-200 dark:border-warm-800 rounded-3xl shadow-2xl p-8 text-center flex flex-col items-center gap-6 animate-fade-in-up">
        
        <div className="w-16 h-16 bg-red-100 dark:bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mb-2 shadow-inner">
          <ShieldAlert size={32} />
        </div>
        
        <h1 className="font-serif text-2xl font-bold text-warm-900 dark:text-warm-50">
          NEXA Account Detected
        </h1>
        
        <p className="text-warm-600 dark:text-warm-300 leading-relaxed">
          Your current account gives you access to NEXA only.
          <br /><br />
          To join the WHISPRR community and access the complete ecosystem without losing your characters and conversations, you can upgrade your account for free!
        </p>
        
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm w-full">
            {error}
          </div>
        )}
        
        <div className="w-full flex flex-col gap-3 mt-2">
          <button
            onClick={handleUpgrade}
            disabled={isUpgrading}
            className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed"
          >
            {isUpgrading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Sparkles size={18} />
                Upgrade to WHISPRR Membership
              </>
            )}
          </button>
          
          <button
            onClick={() => window.location.href = 'https://nexa.whisprr.xyz'}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-warm-100 dark:bg-warm-800 text-warm-700 dark:text-warm-300 font-bold rounded-xl hover:bg-warm-200 dark:hover:bg-warm-700 transition-all"
          >
            <ArrowLeft size={18} />
            Return to NEXA
          </button>

          <button
            onClick={() => signOut()}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 text-warm-500 hover:text-warm-600 dark:hover:text-warm-400 font-medium transition-all text-sm mt-2"
          >
            <LogOut size={16} />
            Sign out of this account
          </button>
        </div>

        <div className="mt-4 opacity-50">
          <Logo size={24} />
        </div>
      </div>
    </div>
  );
}
