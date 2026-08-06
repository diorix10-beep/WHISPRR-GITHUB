import React, { useState, useEffect } from 'react';
import { X, Search, Plus, Users, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Avatar } from '../common/Avatar';
import type { Profile } from '../../types';

interface AddCharacterToGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCharacter: (character: Profile) => void;
  existingIds: string[];
}

export const AddCharacterToGroupModal: React.FC<AddCharacterToGroupModalProps> = ({
  isOpen,
  onClose,
  onSelectCharacter,
  existingIds
}) => {
  const [search, setSearch] = useState('');
  const [characters, setCharacters] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCharacters();
    }
  }, [isOpen]);

  const fetchCharacters = async () => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'ai_character')
        .limit(30);

      setCharacters(data || []);
    } catch (err) {
      console.error('Error fetching characters for group:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filtered = characters.filter(c => 
    !existingIds.includes(c.user_id) &&
    (search === '' || c.display_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-warm-900 border border-warm-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl space-y-4 p-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="text-purple-400" size={20} />
            <h3 className="font-serif font-bold text-white text-lg">Add AI Character to Scene</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-warm-400 hover:text-white hover:bg-warm-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-3 text-warm-400" />
          <input
            type="text"
            placeholder="Search AI characters to invite..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-warm-950 border border-warm-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-purple-500 font-medium"
          />
        </div>

        {/* Characters Grid List */}
        <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
          {loading ? (
            <div className="py-8 text-center text-xs text-warm-500">Loading AI character universe...</div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-warm-500">No additional characters found.</div>
          ) : (
            filtered.map((char) => (
              <div
                key={char.id}
                onClick={() => {
                  onSelectCharacter(char);
                  onClose();
                }}
                className="p-3 rounded-2xl bg-warm-950/60 hover:bg-purple-950/40 border border-warm-800 hover:border-purple-500/40 flex items-center justify-between cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Avatar photoUrl={char.photo_url} emoji={char.avatar_emoji} size="md" />
                  <div>
                    <h4 className="font-bold text-white text-sm group-hover:text-purple-300 transition-colors">{char.display_name}</h4>
                    <p className="text-[11px] text-warm-400 line-clamp-1">{char.bio || 'AI Character Companion'}</p>
                  </div>
                </div>

                <button className="px-3 py-1.5 rounded-xl bg-purple-600 group-hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1 shadow-md shrink-0">
                  <Plus size={14} />
                  <span>Invite</span>
                </button>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};
