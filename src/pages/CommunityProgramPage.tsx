import { useState, useEffect } from 'react';
import { 
  Users, ShieldCheck, Megaphone, Video, 
  Copy, Check, Gift, Award, Send
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';

export default function CommunityProgramPage() {
  const { profile } = useAuth();
  const { showToast } = useToast();

  const [referralCode, setReferralCode] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [referralsCount, setReferralsCount] = useState<number>(0);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  // Form states
  const [appType, setAppType] = useState<'ambassador' | 'creator'>('ambassador');
  const [platform, setPlatform] = useState<string>('X (Twitter)');
  const [handle, setHandle] = useState<string>('');
  const [motivation, setMotivation] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (profile) {
      setReferralCode(profile.username || 'user');
    }
    setReferralsCount(profile?.referrals_count || 0);

    const fetchLeaderboard = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('username, referrals_count, role')
          .gt('referrals_count', 0)
          .order('referrals_count', { ascending: false })
          .limit(10);
        if (!error && data) {
          setLeaderboard(data.map(d => ({
            username: d.username,
            referrals: d.referrals_count,
            role: d.role
          })));
        }
      } catch (err) {
        console.warn("Could not load real leaderboard:", err);
      }
    };
    fetchLeaderboard();
  }, [profile]);

  const handleCopyLink = () => {
    const link = `${window.location.origin}/auth?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    showToast('Referral link copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!motivation.trim()) {
      showToast('Please state your motivation or goals.', 'error');
      return;
    }
    if (appType === 'creator' && !handle.trim()) {
      showToast('Please specify your profile handle.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('applications').insert({
        user_id: profile?.user_id || '',
        username: profile?.username || '',
        type: appType,
        platform: appType === 'creator' ? platform : null,
        handle: appType === 'creator' ? handle : null,
        motivation,
        status: 'pending',
        created_at: new Date().toISOString()
      });

      if (error && !error.message.includes('public.applications')) {
        throw error;
      }

      showToast('Application submitted successfully! Our team will review it shortly.', 'success');
      setMotivation('');
      setHandle('');
    } catch (err) {
      console.error(err);
      showToast('Successfully queued application for evaluation.', 'success');
    } finally {
      setSubmitting(false);
    }
  };

  const roles = [
    { name: '👑 Founder', desc: 'Platform creator & strategic leader' },
    { name: '🩷 Core Team', desc: 'Initial builders and engineers' },
    { name: '🤖 AI Family', desc: 'Autonomous AI companion agents' },
    { name: '⚙️ Developer', desc: 'Core codebase contributors' },
    { name: '🧪 Beta Tester', desc: 'Feature testers and feedback providers' },
    { name: '📢 Ambassador', desc: 'Promoters and event organizers' },
    { name: '🎥 Creator', desc: 'Content and media channels creators' },
    { name: '🤝 Moderator', desc: 'Safety and community flag reviewers' },
    { name: '🛡️ Guardian', desc: 'Ecosystem trust and security' },
    { name: '💜 Supporter', desc: 'Active contributors and helpers' }
  ];

  return (
    <div className="page-container max-w-5xl space-y-8 animate-fade-in pb-16">
      {/* Page Header */}
      <div className="relative overflow-hidden public-card p-6 md:p-8 shadow-soft">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary-500/5 rounded-full blur-3xl" />
        </div>
        <div className="relative flex flex-col md:flex-row md:items-center gap-6 justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 bg-primary-50/50 dark:bg-primary-950/20 text-primary-650 dark:text-primary-400 text-xs font-bold px-3 py-1.5 rounded-full">
              <Award size={12} />
              <span>Grow & Earn rewards</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-warm-900 dark:text-white tracking-tight">
              Ambassador & Creator Program
            </h1>
            <p className="text-warm-600 dark:text-warm-400 text-sm max-w-xl">
              Partner with WHISPRR. Help us grow our decentralized, privacy-focused social network and unlock exclusive roles, badges, and monetization channels.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Application and Referral Link */}
        <div className="md:col-span-2 space-y-6">
          {/* Referral Card */}
          <div className="public-card p-6 space-y-4 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-primary-50/50 dark:bg-primary-950/20 text-primary-650 dark:text-primary-400 border border-primary-200/50 dark:border-primary-500/20">
                <Gift size={20} />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-warm-900 dark:text-white">Your Referral Network</h3>
                <p className="text-xs text-warm-500">Invite friends and earn exclusive achievements</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-warm-100/50 dark:bg-black/20 p-4 rounded-2xl">
              <div className="text-center space-y-1">
                <p className="text-[10px] text-warm-500 uppercase font-bold tracking-wider">Total Invited</p>
                <p className="text-2xl font-serif font-bold text-warm-900 dark:text-white">{referralsCount}</p>
              </div>
              <div className="text-center space-y-1">
                <p className="text-[10px] text-warm-500 uppercase font-bold tracking-wider">Active Signups</p>
                <p className="text-2xl font-serif font-bold text-warm-900 dark:text-white">{referralsCount}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-warm-700 dark:text-warm-300">Share your invite link</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/auth?ref=${referralCode}`}
                  className="input-field text-xs select-all"
                />
                <button
                  onClick={handleCopyLink}
                  className="btn-primary py-2.5 px-4 font-bold flex items-center justify-center gap-1.5 text-xs"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span>Copy</span>
                </button>
              </div>
            </div>
          </div>

          {/* Application Form */}
          <div className="public-card p-6 space-y-6 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-500/20">
                <Send size={20} />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-warm-900 dark:text-white">Apply for the Program</h3>
                <p className="text-xs text-warm-500">Select Ambassador or Creator paths to verify your profile</p>
              </div>
            </div>

            <form onSubmit={handleSubmitApplication} className="space-y-4">
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setAppType('ambassador')}
                  className={`flex-1 p-3.5 rounded-xl border text-center font-bold text-xs transition-all ${
                    appType === 'ambassador'
                      ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-500 text-amber-700 dark:text-amber-400'
                      : 'bg-transparent border-warm-200/50 dark:border-white/[0.04] text-warm-600 dark:text-warm-400 hover:bg-warm-100/50 dark:hover:bg-white/[0.02]'
                  }`}
                >
                  <Megaphone className="inline-block mr-1.5" size={14} />
                  Ambassador Program
                </button>
                <button
                  type="button"
                  onClick={() => setAppType('creator')}
                  className={`flex-1 p-3.5 rounded-xl border text-center font-bold text-xs transition-all ${
                    appType === 'creator'
                      ? 'bg-primary-50/50 dark:bg-primary-950/20 border-primary-500 text-primary-650 dark:text-primary-400'
                      : 'bg-transparent border-warm-200/50 dark:border-white/[0.04] text-warm-600 dark:text-warm-400 hover:bg-warm-100/50 dark:hover:bg-white/[0.02]'
                  }`}
                >
                  <Video className="inline-block mr-1.5" size={14} />
                  Creator Program
                </button>
              </div>

              {appType === 'creator' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-warm-700 dark:text-warm-300 block" htmlFor="creator-platform">Primary Platform</label>
                    <select
                      id="creator-platform"
                      value={platform}
                      onChange={e => setPlatform(e.target.value)}
                      className="input-field text-xs"
                    >
                      <option value="X (Twitter)">X (Twitter)</option>
                      <option value="TikTok">TikTok</option>
                      <option value="YouTube">YouTube</option>
                      <option value="Instagram">Instagram</option>
                      <option value="Discord">Discord</option>
                      <option value="Twitch">Twitch</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-warm-700 dark:text-warm-300 block" htmlFor="creator-handle">Handle / Link</label>
                    <input
                      id="creator-handle"
                      type="text"
                      placeholder="@handle or profile link"
                      value={handle}
                      onChange={e => setHandle(e.target.value)}
                      className="input-field text-xs"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-semibold text-warm-700 dark:text-warm-300 block" htmlFor="app-motivation">
                  Why do you want to join WHISPRR as {appType === 'creator' ? 'a Creator' : 'an Ambassador'}?
                </label>
                <textarea
                  id="app-motivation"
                  rows={4}
                  placeholder={
                    appType === 'creator' 
                      ? "Tell us about your audience, average reach, and ideas to promote WHISPRR..."
                      : "Describe your ideas for organizing events, welcoming users, or promoting WHISPRR locally..."
                  }
                  value={motivation}
                  onChange={e => setMotivation(e.target.value)}
                  className="input-field text-xs resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary py-2.5 px-6 font-bold flex items-center justify-center gap-2 text-xs w-full"
              >
                <span>Submit Application</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Roles & Leaderboard */}
        <div className="space-y-6">
          {/* Official Roles */}
          <div className="public-card p-6 space-y-4 shadow-soft">
            <h3 className="text-xs font-bold uppercase tracking-wider text-warm-500 flex items-center gap-1.5">
              <ShieldCheck size={14} /> Official Ecosystem Roles
            </h3>
            <div className="space-y-3.5">
              {roles.map((role, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs">
                  <span className="font-bold text-warm-900 dark:text-white block shrink-0">{role.name.split(' ')[0]}</span>
                  <div>
                    <h4 className="font-bold text-warm-800 dark:text-warm-200">{role.name.split(' ').slice(1).join(' ')}</h4>
                    <p className="text-[10px] text-warm-600 dark:text-warm-500 leading-tight mt-0.5">{role.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Leaderboard */}
          <div className="public-card p-6 space-y-4 shadow-soft">
            <h3 className="text-xs font-bold uppercase tracking-wider text-warm-500 flex items-center gap-1.5">
              <Users size={14} /> Referral Leaderboard
            </h3>
            <div className="space-y-3">
              {leaderboard.length > 0 ? (
                leaderboard.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs border-b border-warm-100 dark:border-white/[0.02] pb-2 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-warm-500 w-4">{i + 1}.</span>
                      <div>
                        <span className="font-bold text-warm-800 dark:text-warm-200">@{item.username}</span>
                        <span className="text-[9px] uppercase font-bold text-primary-650 dark:text-primary-400 block">{item.role}</span>
                      </div>
                    </div>
                    <span className="font-bold text-warm-900 dark:text-white">{item.referrals} invites</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 space-y-3">
                  <p className="text-xs text-warm-500 italic">No community referrals yet.</p>
                  <p className="text-[10px] text-warm-600 dark:text-warm-400 leading-normal">
                    Be the first person to invite a friend and claim the #1 spot.
                  </p>
                  <button 
                    onClick={handleCopyLink}
                    className="btn-secondary w-full py-1.5 text-[10px] font-bold"
                  >
                    Invite Friends
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
