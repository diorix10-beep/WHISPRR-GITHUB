import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function WelcomePage() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  return (
    <div className="min-h-screen bg-warm-50 dark:bg-warm-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-200/30 dark:bg-primary-900/20 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-warm-200/50 dark:bg-warm-800/20 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-md w-full bg-white/80 dark:bg-warm-900/80 backdrop-blur-xl rounded-3xl p-10 shadow-2xl border border-white/20 dark:border-warm-800 text-center relative z-10 transform transition-all animate-fade-in-up">
        <div className="w-20 h-20 mx-auto bg-gradient-to-tr from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30 mb-8 animate-bounce-slow">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h1 className="text-4xl font-serif font-bold text-warm-900 dark:text-white mb-4 tracking-tight">
          Welcome to WHISPRR
        </h1>
        
        <p className="text-warm-600 dark:text-warm-300 mb-8 font-sans leading-relaxed">
          {profile?.display_name ? `Hey ${profile.display_name}! ` : ''}We're so excited to have you here. 
          Discover communities, join voice rooms, and connect with the AI Family.
        </p>

        <button
          onClick={() => navigate('/feed')}
          className="w-full py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-sans font-semibold text-lg transition-all shadow-lg hover:shadow-primary-500/25 active:scale-[0.98]"
        >
          Start Exploring
        </button>
      </div>
    </div>
  );
}
