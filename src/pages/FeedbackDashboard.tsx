import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X, Bug, Lightbulb, MessageSquare, Shield, Users, Filter, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow } from 'date-fns';

type FeedbackType = 'bug' | 'feature' | 'ux' | 'privacy' | 'community';
type FeedbackStatus = 'new' | 'reviewing' | 'planned' | 'in_progress' | 'completed' | 'released';

interface FeedbackItem {
  id: string;
  type: FeedbackType;
  status: FeedbackStatus;
  title: string;
  description: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

const TYPE_CONFIG: Record<FeedbackType, { label: string; icon: typeof Bug; color: string }> = {
  bug:       { label: 'Bug',             icon: Bug,           color: 'bg-error-100 dark:bg-error-900/30 text-error-700 dark:text-error-400' },
  feature:   { label: 'Feature Request', icon: Lightbulb,     color: 'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-400' },
  ux:        { label: 'UX Suggestion',   icon: MessageSquare, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
  privacy:   { label: 'Privacy Concern', icon: Shield,        color: 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400' },
  community: { label: 'Community',       icon: Users,         color: 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400' },
};

const STATUS_CONFIG: Record<FeedbackStatus, { label: string; color: string }> = {
  new:         { label: 'New',         color: 'bg-warm-100 dark:bg-warm-700 text-warm-700 dark:text-warm-300' },
  reviewing:   { label: 'Reviewing',   color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
  planned:     { label: 'Planned',     color: 'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-400' },
  in_progress: { label: 'In Progress', color: 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400' },
  completed:   { label: 'Completed',   color: 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400' },
  released:    { label: 'Released',    color: 'bg-success-200 dark:bg-success-800/40 text-success-800 dark:text-success-300 font-semibold' },
};

export default function FeedbackDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<FeedbackType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<FeedbackStatus | 'all'>('all');
  const [showNewModal, setShowNewModal] = useState(false);
  const [newType, setNewType] = useState<FeedbackType>('bug');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const fetchFeedback = useCallback(async () => {
    try {
      let query = supabase.from('feedback').select('*').order('created_at', { ascending: false });
      if (filterType !== 'all') query = query.eq('type', filterType);
      if (filterStatus !== 'all') query = query.eq('status', filterStatus);
      const { data, error } = await query;
      if (error) {
        // Table might not exist yet
        console.warn('Feedback table not yet created:', error.message);
        setItems([]);
      } else {
        setItems(data || []);
      }
    } finally {
      setLoading(false);
    }
  }, [filterType, filterStatus]);

  useEffect(() => { fetchFeedback(); }, [fetchFeedback]);

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) { setSubmitError('Please fill in all fields'); return; }
    setSubmitting(true);
    setSubmitError('');
    try {
      const { error } = await supabase.from('feedback').insert({
        type: newType,
        title: newTitle.trim(),
        description: newDesc.trim(),
        status: 'new',
        user_id: user?.id,
      });
      if (error) throw error;
      setNewTitle(''); setNewDesc(''); setShowNewModal(false);
      await fetchFeedback();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit. The feedback table may not be set up yet.');
    } finally {
      setSubmitting(false);
    }
  };

  const stats = {
    total: items.length,
    new: items.filter(i => i.status === 'new').length,
    in_progress: items.filter(i => i.status === 'in_progress').length,
    released: items.filter(i => i.status === 'released').length,
  };

  return (
    <div className="page-container">
      <button onClick={() => navigate('/settings')} className="flex items-center gap-2 mb-6 text-sm text-warm-600 dark:text-warm-400 hover:text-warm-900 dark:hover:text-warm-100 transition-colors">
        <ArrowLeft size={18} /> Settings
      </button>

      <div className="flex items-center justify-between mb-6">
        <h1 className="section-title">Beta Feedback</h1>
        <button onClick={() => setShowNewModal(true)} className="btn-primary flex items-center gap-2 py-2 px-4 text-sm">
          <Plus size={16} /> Add Feedback
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total', value: stats.total, color: 'text-warm-700 dark:text-warm-300' },
          { label: 'New', value: stats.new, color: 'text-warning-600 dark:text-warning-400' },
          { label: 'In Progress', value: stats.in_progress, color: 'text-primary-600 dark:text-primary-400' },
          { label: 'Released', value: stats.released, color: 'text-success-600 dark:text-success-400' },
        ].map(s => (
          <div key={s.label} className="card text-center py-3 px-2">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-warm-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        <div className="flex items-center gap-1.5">
          <Filter size={14} className="text-warm-400" />
          <span className="text-xs text-warm-500 font-medium">Type:</span>
          {(['all', 'bug', 'feature', 'ux', 'privacy', 'community'] as const).map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${filterType === t ? 'bg-primary-500 text-white' : 'bg-warm-100 dark:bg-warm-700 text-warm-700 dark:text-warm-300'}`}
            >
              {t === 'all' ? 'All' : TYPE_CONFIG[t].label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-warm-500 font-medium">Status:</span>
          {(['all', 'new', 'reviewing', 'planned', 'in_progress', 'completed', 'released'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${filterStatus === s ? 'bg-primary-500 text-white' : 'bg-warm-100 dark:bg-warm-700 text-warm-700 dark:text-warm-300'}`}
            >
              {s === 'all' ? 'All' : STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Feedback List */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-300 border-t-primary-500" /></div>
      ) : items.length === 0 ? (
        <div className="card text-center py-12">
          <MessageSquare size={36} className="mx-auto text-warm-300 mb-3" />
          <p className="text-warm-500">No feedback yet. {filterType !== 'all' || filterStatus !== 'all' ? 'Try clearing your filters.' : 'Be the first to add some!'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => {
            const tc = TYPE_CONFIG[item.type];
            const sc = STATUS_CONFIG[item.status];
            const Icon = tc.icon;
            return (
              <div key={item.id} className="card space-y-2">
                <div className="flex items-start gap-3">
                  <div className={`p-1.5 rounded-lg ${tc.color} flex-shrink-0`}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-warm-900 dark:text-warm-50 text-sm">{item.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${sc.color}`}>{sc.label}</span>
                    </div>
                    <p className="text-xs text-warm-400 mt-0.5">{tc.label} · {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</p>
                  </div>
                </div>
                <p className="text-sm text-warm-600 dark:text-warm-400 pl-9">{item.description}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* New Feedback Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-warm-800 rounded-3xl border border-warm-100 dark:border-warm-700 w-full sm:max-w-md p-6 shadow-float animate-scale-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-serif text-xl font-bold text-warm-900 dark:text-warm-100">New Feedback</h2>
              <button onClick={() => { setShowNewModal(false); setSubmitError(''); }} className="p-2 hover:bg-warm-100 dark:hover:bg-warm-700 rounded-full transition-colors" aria-label="Close">
                <X size={20} />
              </button>
            </div>
            {submitError && <p className="text-sm text-error-600 dark:text-error-400 mb-3">{submitError}</p>}
            <form onSubmit={handleSubmitFeedback} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-2">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(TYPE_CONFIG) as FeedbackType[]).map(t => {
                    const Icon = TYPE_CONFIG[t].icon;
                    return (
                      <button key={t} type="button" onClick={() => setNewType(t)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-sm text-left transition-all ${newType === t ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/25 text-primary-700 dark:text-primary-300' : 'border-warm-200 dark:border-warm-600 hover:border-warm-300'}`}
                      >
                        <Icon size={14} />
                        {TYPE_CONFIG[t].label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-2" htmlFor="fb-title">Title</label>
                <input id="fb-title" type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="input-field" placeholder="Brief summary" maxLength={100} />
              </div>
              <div>
                <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-2" htmlFor="fb-desc">Description</label>
                <textarea id="fb-desc" value={newDesc} onChange={e => setNewDesc(e.target.value)} className="input-field resize-none" rows={4} placeholder="Describe the issue or idea in detail…" maxLength={2000} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowNewModal(false)} className="btn-ghost flex-1">Cancel</button>
                <button type="submit" disabled={submitting || !newTitle.trim() || !newDesc.trim()} className="btn-primary flex-1">
                  {submitting ? 'Submitting…' : 'Submit Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
