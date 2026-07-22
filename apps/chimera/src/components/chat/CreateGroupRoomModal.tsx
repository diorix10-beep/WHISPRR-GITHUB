import { useState, useEffect } from 'react';
import { X, Users, Plus, Check, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

interface CreateGroupRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoomCreated: (conversationId: string) => void;
}

export function CreateGroupRoomModal({ isOpen, onClose, onRoomCreated }: CreateGroupRoomModalProps) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [availableChars, setAvailableChars] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [roomName, setRoomName] = useState('');
  const [scenario, setScenario] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchCharacters();
    }
  }, [isOpen]);

  const fetchCharacters = async () => {
    try {
      setFetching(true);
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'ai_character')
        .limit(20);
      setAvailableChars(data || []);
    } catch (e) {
      showToast('Error loading characters', 'error');
    } finally {
      setFetching(false);
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleCreateGroup = async () => {
    if (!user) return;
    if (selectedIds.length < 2) {
      showToast('Please select at least 2 AI Characters for a group room', 'error');
      return;
    }
    if (!roomName.trim()) {
      showToast('Please give your group room a title', 'error');
      return;
    }

    try {
      setLoading(true);

      // Create group conversation
      const { data: conv, error: convError } = await supabase
        .from('conversations')
        .insert({
          is_group: true,
          title: roomName.trim(),
          scenario: scenario.trim() || undefined,
          created_by: user.id,
        })
        .select()
        .single();

      if (convError) throw convError;

      // Add user participant
      const participants = [
        { conversation_id: conv.id, user_id: user.id, role: 'owner' },
        ...selectedIds.map(id => ({ conversation_id: conv.id, user_id: id, role: 'ai_character' }))
      ];

      await supabase.from('conversation_participants').insert(participants);

      showToast('Multi-Character Group Room created!', 'success');
      onRoomCreated(conv.id);
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Error creating group room', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-warm-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-warm-850 rounded-3xl border border-warm-200 dark:border-warm-750 shadow-2xl p-6 relative flex flex-col gap-5 max-h-[90vh] overflow-y-auto no-scrollbar">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-warm-100 dark:border-warm-800 pb-4">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-500 font-bold text-base">
            <Users size={20} />
            <span>Create Multi-Character Group Room</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-warm-400 hover:text-warm-600 dark:hover:text-warm-200 rounded-full hover:bg-warm-100 dark:hover:bg-warm-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-warm-700 dark:text-warm-300 mb-1">
              Group Room Name
            </label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="e.g. Verity High Council, Mountain Expedition"
              className="w-full text-xs bg-warm-50 dark:bg-warm-900 border border-warm-200 dark:border-warm-800 rounded-xl px-3 py-2 text-warm-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-warm-700 dark:text-warm-300 mb-1">
              Group Scenario (Optional)
            </label>
            <textarea
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              rows={2}
              placeholder="Set the scene where the characters meet..."
              className="w-full text-xs bg-warm-50 dark:bg-warm-900 border border-warm-200 dark:border-warm-800 rounded-xl px-3 py-2 text-warm-900 dark:text-white resize-none"
            />
          </div>

          {/* Character Selection List */}
          <div>
            <label className="block text-xs font-bold text-warm-700 dark:text-warm-300 mb-2">
              Select AI Characters (At least 2)
            </label>

            {fetching ? (
              <div className="py-6 text-center text-xs text-warm-400">Loading available characters...</div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                {availableChars.map((char) => {
                  const isSelected = selectedIds.includes(char.id);

                  return (
                    <div
                      key={char.id}
                      onClick={() => toggleSelect(char.id)}
                      className={`p-3 rounded-2xl border cursor-pointer flex items-center gap-2.5 transition-all ${
                        isSelected
                          ? 'border-red-600 bg-red-500/10 text-red-500 font-bold'
                          : 'border-warm-200 dark:border-warm-800 bg-warm-50 dark:bg-warm-900 text-warm-900 dark:text-white hover:border-warm-300'
                      }`}
                    >
                      {char.photo_url ? (
                        <img src={char.photo_url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-warm-200 dark:bg-warm-800 flex items-center justify-center font-bold text-xs shrink-0">
                          {char.avatar_emoji || char.display_name?.[0] || '🎭'}
                        </div>
                      )}
                      <div className="overflow-hidden flex-1">
                        <h4 className="text-xs truncate">{char.display_name}</h4>
                      </div>
                      {isSelected && <Check size={16} className="text-red-600 shrink-0" />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-warm-500 hover:text-warm-700 dark:hover:text-warm-300"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreateGroup}
            disabled={loading}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Plus size={14} /> Launch Group Room
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
