import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Logo } from '../common/Logo';

export function RestrictedPage() {
  const { signOut } = useAuth();

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
          Your NEXA account gives you access to NEXA only.
          <br /><br />
          To join the WHISPRR community and access the complete ecosystem, please create a WHISPRR account.
        </p>
        
        <div className="w-full flex flex-col gap-3 mt-4">
          <button
            onClick={() => signOut()}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5"
          >
            Sign Out to Create Account
          </button>
          
          <button
            onClick={() => window.location.href = 'https://nexa.whisprr.xyz'}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-warm-100 dark:bg-warm-800 text-warm-700 dark:text-warm-300 font-bold rounded-xl hover:bg-warm-200 dark:hover:bg-warm-700 transition-all"
          >
            <ArrowLeft size={18} />
            Return to NEXA
          </button>
        </div>

        <div className="mt-4 opacity-50">
          <Logo size={24} />
        </div>
      </div>
    </div>
  );
}
