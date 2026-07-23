import { useState, useEffect } from 'react';
import { X, UserCheck, Plus, Check, Sparkles, User, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Avatar } from '../common/Avatar';

interface PersonaItem {
  id: string;
  name: string;
  avatar_emoji?: string;
  photo_url?: string;
  bio?: string;
  is_default?: boolean;
}

interface InChatPersonaDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activePersonaId?: string;
  onSelectPersona: (persona: PersonaItem) => void;
}

export function InChatPersonaDrawer({ isOpen, onClose, activePersonaId, onSelectPersona }: InChatPersonaDrawerProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [personas, setPersonas] = useState<PersonaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && user) {
      fetchPersonas();
    }
  }, [isOpen, user]);

  const fetchPersonas = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('personas')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });

      if (error) throw error;
      
      const formatted: PersonaItem[] = (data || []).map((p: any) => ({
        id: p.id,
        name: p.name || p.display_name || 'My Persona',
        avatar_emoji: p.avatar_emoji || '🎭',
        photo_url: p.photo_url,
        bio: p.bio || p.personality || 'User Persona identity for roleplay',
        is_default: p.is_default,
      }));

      // Fallback default persona if none found
      if (formatted.length === 0) {
        formatted.push({
          id: 'default-user-persona',
          name: user.email?.split('@')[0] || 'My Persona',
          avatar_emoji: '👤',
          bio: 'Default User Persona',
          is_default: true,
        });
      }

      setPersonas(formatted);
    } catch (err: any) {
      console.error('Error fetching personas:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-warm-950/70 backdrop-blur-xs p-0 sm:p-4 font-sans">
      <div className="w-full sm:max-w-md bg-white dark:bg-warm-900 rounded-t-3xl sm:rounded-3xl border border-warm-200 dark:border-warm-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-warm-200 dark:border-warm-800 bg-warm-50/50 dark:bg-warm-950/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20">
              <UserCheck size={18} />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-warm-900 dark:text-white">
                Switch Roleplay Persona
              </h3>
              <p className="text-[10px] text-warm-500">
                Rule 35: Personas represent YOU in the story.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-warm-400 hover:text-warm-700 dark:hover:text-white rounded-full hover:bg-warm-100 dark:hover:bg-warm-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Persona List */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1 min-h-0">
          {loading ? (
            <div className="py-12 text-center text-xs text-warm-400 flex items-center justify-center gap-2">
              <Sparkles size={16} className="animate-spin text-red-500" />
              <span>Loading personas...</span>
            </div>
          ) : (
            personas.map((persona) => {
              const isSelected = activePersonaId === persona.id || (activePersonaId === undefined && persona.is_default);

              return (
                <div
                  key={persona.id}
                  onClick={() => {
                    onSelectPersona(persona);
                    showToast(`Active Persona set to ${persona.name}!`, 'success');
                    onClose();
                  }}
                  className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3.5 ${
                    isSelected
                      ? 'border-red-600 bg-red-50 dark:bg-red-950/30 text-warm-900 dark:text-white shadow-sm'
                      : 'border-warm-200 dark:border-warm-800 bg-white dark:bg-warm-850 hover:border-red-300 dark:hover:border-red-800/50'
                  }`}
                >
                  <Avatar emoji={persona.avatar_emoji} photoUrl={persona.photo_url} size="md" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs text-warm-900 dark:text-warm-50 truncate">
                        {persona.name}
                      </h4>
                      {persona.is_default && (
                        <span className="text-[9px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded font-extrabold uppercase">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-warm-500 dark:text-warm-400 truncate mt-0.5">
                      {persona.bio}
                    </p>
                  </div>

                  {isSelected ? (
                    <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0">
                      <Check size={14} strokeWidth={3} />
                    </div>
                  ) : (
                    <ChevronRight size={16} className="text-warm-400 shrink-0" />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer: Create Persona Link */}
        <div className="p-4 border-t border-warm-200 dark:border-warm-800 bg-warm-50/50 dark:bg-warm-950/50 shrink-0">
          <a
            href="/personas"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl border border-warm-300 dark:border-warm-750 bg-white dark:bg-warm-850 hover:bg-warm-100 dark:hover:bg-warm-800 text-warm-900 dark:text-warm-100 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <Plus size={15} />
            <span>Manage & Create New Personas</span>
          </a>
        </div>
      </div>
    </div>
  );
}
