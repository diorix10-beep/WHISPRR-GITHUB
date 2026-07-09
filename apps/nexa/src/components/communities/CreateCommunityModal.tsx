import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Trash2 } from 'lucide-react';
import { INTERESTS, COMMUNITY_CATEGORIES } from '../../types';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface CreateCommunityModalProps {
  onClose: () => void;
  onCommunityCreated?: () => void;
}

const EMOJI_GRID = [
  '🎨', '🎭', '🎪', '🎬', '🎤', '🎧', '🎸', '🎹',
  '📚', '📖', '✍️', '📝', '🖊️', '🖍️', '🎓', '📜',
  '🌍', '🌎', '🌏', '✈️', '🏔️', '🏖️', '🏜️', '⛰️',
  '🍕', '🍔', '🍜', '🍱', '🥘', '🍰', '🧁', '☕',
  '🎮', '👾', '🎯', '🎲', '♟️', '🎳', '🏀', '⚽',
  '🧘', '🏃', '🚴', '🏊', '🤸', '🧗', '💪', '🤼',
];

export function CreateCommunityModal({ onClose, onCommunityCreated }: CreateCommunityModalProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedInterest, setSelectedInterest] = useState<string>(INTERESTS[0]);
  const [selectedCategory, setSelectedCategory] = useState<string>('General');
  const [selectedEmoji, setSelectedEmoji] = useState<string>(EMOJI_GRID[0]);
  const [rules, setRules] = useState<string[]>([]);
  const [newRule, setNewRule] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addRule = () => {
    if (newRule.trim() && rules.length < 10) {
      setRules([...rules, newRule.trim()]);
      setNewRule('');
    }
  };

  const removeRule = (idx: number) => setRules(rules.filter((_, i) => i !== idx));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) { setError('Please fill in all required fields'); return; }

    setIsLoading(true);
    setError(null);

    try {
      const { data: communityData, error: createError } = await supabase
        .from('communities')
        .insert({
          name: name.trim(),
          description: description.trim(),
          interest: selectedInterest,
          category: selectedCategory,
          emoji: selectedEmoji,
          owner_id: user.id,
          rules,
        })
        .select()
        .single();

      if (createError) throw createError;
      if (!communityData) throw new Error('Failed to create community');

      await supabase.from('community_members').insert({
        community_id: communityData.id,
        user_id: user.id,
        role: 'owner',
      });

      if (onCommunityCreated) {
        onCommunityCreated();
      } else {
        navigate(`/communities/${communityData.id}`);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create community.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-warm-800 rounded-3xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-5 border-b border-warm-200 dark:border-warm-700 bg-white dark:bg-warm-800 rounded-t-3xl z-10">
          <h2 className="text-lg font-bold text-warm-900 dark:text-warm-50">
            Create Community {step === 2 && '- Rules'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-warm-100 dark:hover:bg-warm-700 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={step === 1 ? (e) => { e.preventDefault(); setStep(2); } : handleCreate} className="p-5 space-y-5">
          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-xl text-sm">
              {error}
            </div>
          )}

          {step === 1 && (
            <>
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-warm-900 dark:text-warm-50 mb-1.5">
                  Community Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g., Indie Music Lovers"
                  maxLength={100}
                  className="input-field"
                  required
                />
                <p className="text-xs text-warm-400 mt-1">{name.length}/100</p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-warm-900 dark:text-warm-50 mb-1.5">Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="What's this community about?"
                  maxLength={500}
                  rows={3}
                  className="input-field resize-none"
                />
                <p className="text-xs text-warm-400 mt-1">{description.length}/500</p>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-warm-900 dark:text-warm-50 mb-1.5">Category *</label>
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="input-field"
                >
                  {COMMUNITY_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Interest */}
              <div>
                <label className="block text-sm font-medium text-warm-900 dark:text-warm-50 mb-1.5">Primary Interest *</label>
                <select
                  value={selectedInterest}
                  onChange={e => setSelectedInterest(e.target.value)}
                  className="input-field"
                >
                  {INTERESTS.map(interest => (
                    <option key={interest} value={interest}>{interest}</option>
                  ))}
                </select>
              </div>

              {/* Emoji */}
              <div>
                <label className="block text-sm font-medium text-warm-900 dark:text-warm-50 mb-2">Icon</label>
                <div className="grid grid-cols-8 gap-1.5">
                  {EMOJI_GRID.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setSelectedEmoji(emoji)}
                      className={`w-full aspect-square flex items-center justify-center text-xl rounded-lg transition-all ${
                        selectedEmoji === emoji
                          ? 'bg-primary-500 scale-110 shadow-md'
                          : 'bg-warm-100 dark:bg-warm-700 hover:bg-warm-200 dark:hover:bg-warm-600'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose} className="flex-1 btn-secondary">Cancel</button>
                <button type="submit" disabled={!name.trim()} className="flex-1 btn-primary disabled:opacity-50">
                  Next
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-sm text-warm-500">Add rules to help members understand expectations. You can skip this and add rules later.</p>

              {/* Rules List */}
              {rules.length > 0 && (
                <div className="space-y-2">
                  {rules.map((rule, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-3 rounded-xl bg-warm-50 dark:bg-warm-700">
                      <span className="w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="text-sm text-warm-800 dark:text-warm-200 flex-1">{rule}</p>
                      <button type="button" onClick={() => removeRule(idx)} className="text-warm-400 hover:text-red-500 flex-shrink-0">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Rule */}
              {rules.length < 10 && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newRule}
                    onChange={e => setNewRule(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addRule(); } }}
                    placeholder="Type a rule..."
                    className="input-field flex-1"
                    maxLength={200}
                  />
                  <button type="button" onClick={addRule} disabled={!newRule.trim()} className="btn-secondary px-3 disabled:opacity-50">
                    <Plus size={18} />
                  </button>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setStep(1)} className="flex-1 btn-secondary" disabled={isLoading}>
                  Back
                </button>
                <button type="submit" disabled={isLoading} className="flex-1 btn-primary disabled:opacity-50">
                  {isLoading ? 'Creating...' : 'Create Community'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
