import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { AuthHero } from '../components/auth/AuthHero';
import { useAuth } from '../contexts/AuthContext';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // If the user lands here without a session, they might have clicked an invalid link
  useEffect(() => {
    // Supabase automatically picks up the access_token from the URL hash and creates a session
    // We just need to make sure they are actually authenticated before letting them change password
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        setError('Invalid or expired password reset link. Please request a new one.');
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      
      if (updateError) throw updateError;
      
      setSuccess(true);
      
      // Redirect to home after 3 seconds
      setTimeout(() => {
        navigate('/');
      }, 3000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-950 flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      
      {/* Immersive Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-indigo-900/30 rounded-full blur-[120px] mix-blend-screen opacity-60"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-red-900/20 rounded-full blur-[100px] mix-blend-screen opacity-50"></div>
        <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[150px] mix-blend-screen opacity-40"></div>
      </div>

      <div className="w-full max-w-md relative z-10 flex flex-col gap-6">
        
        <AuthHero />

        {/* Glassmorphic Card */}
        <div className="bg-warm-900/40 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-2xl relative">
          
          {/* Subtle inner glow */}
          <div className="absolute inset-0 rounded-3xl border border-white/5 pointer-events-none"></div>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Set New Password</h2>
            <p className="text-warm-400 text-sm">
              Please enter your new password below.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium">
              {error}
            </div>
          )}
          
          {success ? (
            <div className="flex flex-col items-center justify-center p-4 text-center space-y-4">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-2">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white">Password Updated</h3>
              <p className="text-warm-400">
                Your password has been successfully updated. Redirecting you to NEXA...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5 relative z-10">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-warm-300 uppercase tracking-wider pl-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-warm-900/50 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-warm-500 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all"
                    placeholder="Min. 6 characters"
                    disabled={isLoading || !!error.includes('expired')}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-warm-300 uppercase tracking-wider pl-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-warm-900/50 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-warm-500 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all"
                    placeholder="Repeat password"
                    disabled={isLoading || !!error.includes('expired')}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !!error.includes('expired')}
                className="w-full py-4 px-6 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center mt-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Update Password'
                )}
              </button>
            </form>
          )}
          
        </div>
      </div>
    </div>
  );
}
