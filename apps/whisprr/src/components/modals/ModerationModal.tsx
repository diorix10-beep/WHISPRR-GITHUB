import { useState } from 'react';
import { X, ShieldAlert, UserMinus, VolumeX, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

interface ModerationModalProps {
  onClose: () => void;
  targetUserId: string;
  targetUsername: string;
  contentType: 'user' | 'whisper' | 'comment';
  contentId?: string;
  onSuccess?: () => void;
}

export function ModerationModal({
  onClose,
  targetUserId,
  targetUsername,
  contentType,
  contentId,
  onSuccess,
}: ModerationModalProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'report' | 'block' | 'mute'>('report');
  
  // Report Form state
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !reason) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('reports').insert({
        reporter_id: user.id,
        reported_user_id: targetUserId,
        content_type: contentType,
        content_id: contentId || null,
        reason,
        details,
      });

      if (error) throw error;
      showToast('Thank you. Content has been reported and will be reviewed.', 'success');
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      showToast('Failed to file report. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBlockUser = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('user_blocks').insert({
        blocker_id: user.id,
        blocked_id: targetUserId,
      });

      if (error) {
        if (error.code === '23505') {
          showToast(`You have already blocked @${targetUsername}`, 'info');
        } else {
          throw error;
        }
      } else {
        showToast(`Blocked @${targetUsername}. You will no longer see their content.`, 'success');
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      showToast('Failed to block user.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMuteUser = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('user_mutes').insert({
        muter_id: user.id,
        muted_id: targetUserId,
      });

      if (error) {
        if (error.code === '23505') {
          showToast(`You have already muted @${targetUsername}`, 'info');
        } else {
          throw error;
        }
      } else {
        showToast(`Muted @${targetUsername}. Their content will be hidden.`, 'success');
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      showToast('Failed to mute user.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white dark:bg-warm-800 rounded-3xl p-6 w-full max-w-md shadow-xl border border-warm-100 dark:border-warm-700 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-warm-900 dark:text-warm-50 font-bold">
            <ShieldAlert size={20} className="text-primary-500" />
            <span>Moderation options: @{targetUsername}</span>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-warm-100 dark:hover:bg-warm-700 rounded-full">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-warm-50 dark:bg-warm-900/60 p-1 rounded-xl mb-5">
          <button
            onClick={() => setActiveTab('report')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold ${
              activeTab === 'report' ? 'bg-white dark:bg-warm-700 text-warm-900 dark:text-warm-50 shadow-sm' : 'text-warm-500'
            }`}
          >
            Report Content
          </button>
          <button
            onClick={() => setActiveTab('mute')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold ${
              activeTab === 'mute' ? 'bg-white dark:bg-warm-700 text-warm-900 dark:text-warm-50 shadow-sm' : 'text-warm-500'
            }`}
          >
            Mute User
          </button>
          <button
            onClick={() => setActiveTab('block')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold ${
              activeTab === 'block' ? 'bg-white dark:bg-warm-700 text-warm-900 dark:text-warm-50 shadow-sm' : 'text-warm-500'
            }`}
          >
            Block User
          </button>
        </div>

        {/* Report Tab */}
        {activeTab === 'report' && (
          <form onSubmit={handleReportSubmit} className="space-y-4">
            <div>
              <label htmlFor="report-reason" className="block text-xs font-bold text-warm-500 uppercase mb-2">Reason</label>
              <select
                id="report-reason"
                required
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="input-field py-2 px-3 text-sm"
              >
                <option value="">Select a reason...</option>
                <option value="harassment">Harassment or bullying</option>
                <option value="spam">Spam or scam attempts</option>
                <option value="nsfw">Inappropriate or NSFW content</option>
                <option value="hate_speech">Hate speech or symbols</option>
                <option value="impersonation">Impersonation / fake account</option>
                <option value="other">Other reason</option>
              </select>
            </div>
            <div>
              <label htmlFor="report-details" className="block text-xs font-bold text-warm-500 uppercase mb-2">Additional Details</label>
              <textarea
                id="report-details"
                rows={3}
                placeholder="Please describe why you are reporting this content..."
                value={details}
                onChange={e => setDetails(e.target.value)}
                className="input-field text-sm resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="btn-ghost flex-1 py-2 text-sm">Cancel</button>
              <button type="submit" disabled={submitting || !reason} className="btn-primary flex-1 py-2 text-sm">
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}

        {/* Mute Tab */}
        {activeTab === 'mute' && (
          <div className="space-y-4 text-center">
            <VolumeX className="mx-auto text-warm-400" size={48} />
            <div>
              <h4 className="font-bold text-warm-900 dark:text-white">Mute @{targetUsername}?</h4>
              <p className="text-xs text-warm-500 mt-1.5 px-4 leading-relaxed">
                Muting hides all thoughts and comments from @{targetUsername} on your feeds. They won't know they are muted.
              </p>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="btn-ghost flex-1 py-2 text-sm">Cancel</button>
              <button onClick={handleMuteUser} disabled={submitting} className="btn-primary flex-1 py-2 text-sm bg-amber-500 hover:bg-amber-600 border-amber-500">
                {submitting ? 'Muting...' : 'Yes, Mute User'}
              </button>
            </div>
          </div>
        )}

        {/* Block Tab */}
        {activeTab === 'block' && (
          <div className="space-y-4 text-center">
            <UserMinus className="mx-auto text-red-500" size={48} />
            <div>
              <h4 className="font-bold text-warm-900 dark:text-white">Block @{targetUsername}?</h4>
              <p className="text-xs text-warm-500 mt-1.5 px-4 leading-relaxed">
                Blocking hides their content, prevents them from viewing your profile, and stops them from sending you direct messages.
              </p>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="btn-ghost flex-1 py-2 text-sm">Cancel</button>
              <button onClick={handleBlockUser} disabled={submitting} className="btn-primary flex-1 py-2 text-sm bg-red-500 hover:bg-red-650 border-red-500">
                {submitting ? 'Blocking...' : 'Yes, Block User'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
