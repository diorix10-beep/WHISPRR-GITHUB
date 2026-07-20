import { useState } from 'react';
import { ChevronLeft, Info, ChevronRight } from 'lucide-react';
import type { Profile } from '../../types';
import { Avatar } from '../common/Avatar';

interface ChatMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: Profile;
}

export function ChatMemoryModal({ isOpen, onClose, character }: ChatMemoryModalProps) {
  const [activeTab, setActiveTab] = useState<'story' | 'character'>('story');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm sm:p-6 font-sans">
      <div className="w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-md bg-[#121212] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
              <ChevronLeft size={24} />
            </button>
            <h2 className="text-xl font-bold">Memory</h2>
          </div>
          <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <Info size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          
          {/* Memory Usage Card */}
          <div className="bg-[#1C1C1E] rounded-2xl p-4 border border-white/5 shadow-inner">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Memory Usage</h3>
              <ChevronRight size={20} className="text-white/50" />
            </div>
            
            {/* Progress Bar Mock */}
            <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden mb-3">
              <div className="w-full h-full bg-[#5E5CE6] rounded-full" />
            </div>
            
            <p className="text-sm text-white/70">
              Infinite Memory is active. The AI will automatically remember important context from your conversations.
            </p>
          </div>

          {/* Context Chips */}
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
            <button 
              onClick={() => setActiveTab('story')}
              className={`flex-shrink-0 px-6 py-2 rounded-full font-medium transition-colors ${
                activeTab === 'story' ? 'bg-white text-black' : 'bg-[#1C1C1E] text-white hover:bg-[#2C2C2E]'
              }`}
            >
              Story
            </button>
            
            <button 
              onClick={() => setActiveTab('character')}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-1.5 rounded-full font-medium transition-colors ${
                activeTab === 'character' ? 'bg-white text-black' : 'bg-[#1C1C1E] text-white hover:bg-[#2C2C2E]'
              }`}
            >
              <Avatar emoji={character.avatar_emoji} photoUrl={character.photo_url} size="xs" />
              {character.display_name}
            </button>
          </div>

          {/* Skeleton Loaders matching screenshot */}
          <div className="bg-[#1C1C1E] rounded-2xl p-6 border border-white/5 space-y-4 shadow-inner">
            <div className="w-3/4 h-4 bg-white/10 rounded-full animate-pulse" />
            <div className="w-full h-4 bg-white/10 rounded-full animate-pulse" />
            <div className="w-5/6 h-4 bg-white/10 rounded-full animate-pulse" />
            <div className="w-2/3 h-4 bg-white/10 rounded-full animate-pulse" />
          </div>

        </div>
      </div>
    </div>
  );
}
