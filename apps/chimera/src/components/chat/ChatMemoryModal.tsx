import { useState, useEffect } from 'react';
import { ChevronLeft, Info, Plus, Trash2, Sparkles, Brain, Check } from 'lucide-react';
import type { Profile } from '../../types';
import { Avatar } from '../common/Avatar';
import { supabase } from '../../lib/supabase';

interface ChatMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: Profile;
  conversationId?: string;
}

export function ChatMemoryModal({ isOpen, onClose, character, conversationId }: ChatMemoryModalProps) {
  const [activeTab, setActiveTab] = useState<'story' | 'character'>('character');
  const [memories, setMemories] = useState<string[]>([
    `${character.display_name} remembers that you possess an ancient runic blade.`,
    `You promised to meet ${character.display_name} at the Obsidian Citadel.`,
    `Shared history: Escaped together from the Whispering Catacombs.`
  ]);
  const [newMemory, setNewMemory] = useState('');

  useEffect(() => {
    if (isOpen && conversationId) {
      fetchMemories();
    }
  }, [isOpen, conversationId]);

  const fetchMemories = async () => {
    if (!conversationId) return;
    try {
      const { data } = await supabase
        .from('conversations')
        .select('memory_summary')
        .eq('id', conversationId)
        .maybeSingle();

      if (data?.memory_summary) {
        const lines = data.memory_summary.split('\n').filter((l: string) => l.trim().length > 0);
        if (lines.length > 0) setMemories(lines);
      }
    } catch (e) {}
  };

  const handleAddMemory = async () => {
    if (!newMemory.trim()) return;
    const updated = [...memories, newMemory.trim()];
    setMemories(updated);
    setNewMemory('');

    if (conversationId) {
      await supabase
        .from('conversations')
        .update({ memory_summary: updated.join('\n') })
        .eq('id', conversationId);
    }
  };

  const handleDeleteMemory = async (index: number) => {
    const updated = memories.filter((_, i) => i !== index);
    setMemories(updated);

    if (conversationId) {
      await supabase
        .from('conversations')
        .update({ memory_summary: updated.join('\n') })
        .eq('id', conversationId);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md sm:p-6 font-sans">
      <div className="w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-md bg-[#121212] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white border border-white/10">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0 bg-[#1A1A1C]">
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
              <ChevronLeft size={22} />
            </button>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Brain size={18} className="text-purple-400" />
              <span>Living Character Memory</span>
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <Info size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          
          {/* Memory Usage Card */}
          <div className="bg-[#1C1C1E] rounded-2xl p-4 border border-white/10 shadow-inner">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-purple-300 flex items-center gap-1.5">
                <Sparkles size={14} /> Infinite Memory Active
              </h3>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 font-extrabold px-2 py-0.5 rounded-full uppercase">
                {memories.length} Memories Retained
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden mb-3">
              <div className="w-full h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full animate-pulse" />
            </div>
            
            <p className="text-xs text-white/70 leading-relaxed">
              Rule 33: {character.display_name} remembers key plot points, user secrets, and shared history across all roleplay sessions.
            </p>
          </div>

          {/* Context Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button 
              onClick={() => setActiveTab('character')}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                activeTab === 'character' ? 'bg-purple-600 text-white shadow-md' : 'bg-[#1C1C1E] text-white/70 hover:bg-[#2C2C2E]'
              }`}
            >
              <Avatar emoji={character.avatar_emoji} photoUrl={character.photo_url} size="xs" />
              <span>{character.display_name}'s Memory</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('story')}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                activeTab === 'story' ? 'bg-purple-600 text-white shadow-md' : 'bg-[#1C1C1E] text-white/70 hover:bg-[#2C2C2E]'
              }`}
            >
              Story Setting
            </button>
          </div>

          {/* Memory List */}
          <div className="space-y-2.5">
            <h4 className="text-[10px] uppercase font-bold text-white/50 tracking-wider px-1">
              Retained Memories ({memories.length})
            </h4>

            {memories.map((mem, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-[#1C1C1E] border border-white/10 flex items-start justify-between gap-3 text-xs leading-relaxed group">
                <p className="flex-1 text-white/90">{mem}</p>
                <button
                  onClick={() => handleDeleteMemory(idx)}
                  className="p-1 text-white/40 hover:text-rose-400 rounded transition-colors opacity-80 sm:opacity-0 group-hover:opacity-100"
                  title="Forget Memory"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Add Custom Memory Input */}
          <div className="pt-3 border-t border-white/10 space-y-2">
            <label className="block text-[10px] uppercase font-bold text-white/50 tracking-wider">
              Teach {character.display_name} a New Fact:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newMemory}
                onChange={(e) => setNewMemory(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddMemory()}
                placeholder={`e.g. You know that ${character.display_name} is afraid of dragons...`}
                className="flex-1 bg-[#1C1C1E] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
              />
              <button
                onClick={handleAddMemory}
                disabled={!newMemory.trim()}
                className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1 transition-all shrink-0"
              >
                <Plus size={14} /> Add
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
