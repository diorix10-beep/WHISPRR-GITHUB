import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Settings, User, Edit2, Trash2, CheckCircle, ShieldAlert, Sparkles, UserCheck, Flame } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useTranslation } from '../hooks/useTranslation';
import { supabase } from '../lib/supabase';
import type { Persona } from '../types';
import { RichEmptyState } from '../components/common/RichEmptyState';

export default function PersonasPage() {
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPersonas();
    }
  }, [user]);

  const fetchPersonas = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('personas')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) {
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          setPersonas([]);
          return;
        }
        throw error;
      }
      setPersonas(data || []);
    } catch (err) {
      console.error('Error fetching personas:', err);
      setPersonas([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this persona? This cannot be undone.')) return;
    
    try {
      const { error } = await supabase.from('personas').delete().eq('id', id);
      if (error) throw error;
      setPersonas(prev => prev.filter(p => p.id !== id));
      showToast('Persona deleted successfully', 'success');
    } catch (err) {
      console.error('Error deleting persona:', err);
      showToast('Failed to delete persona', 'error');
    }
  };

  const handleSetDefault = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { error } = await supabase
        .from('personas')
        .update({ is_default: true })
        .eq('id', id);
        
      if (error) throw error;
      
      setPersonas(prev => prev.map(p => ({
        ...p,
        is_default: p.id === id
      })));
      
      showToast('Default persona updated', 'success');
    } catch (err) {
      console.error('Error setting default persona:', err);
      showToast('Failed to set default persona', 'error');
    }
  };

  const defaultPersona = personas.find(p => p.is_default) || personas[0];

  return (
    <div className="rp-page font-sans pb-24 relative overflow-hidden">
      
      {/* Ambient Red/Purple Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-red-600/15 via-purple-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-[1160px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10 relative z-10 pt-10">

        {/* ── 1. HERO SECTION ── */}
        <section className="flex flex-col items-start pt-6 sm:pt-10 space-y-4 text-left">
          <div className="rp-micro inline-flex items-center gap-2 rounded-full border border-[#c99b50]/50 bg-black/30 px-3.5 py-1.5">
            <UserCheck size={14} />
            <span>YOUR ROLEPLAY PRESENCE</span>
          </div>

          <h1 className="rp-heading text-5xl sm:text-6xl font-extrabold tracking-tight">
            Who You Are Here
          </h1>

          <p className="rp-copy text-base sm:text-lg max-w-2xl leading-relaxed">
            A persona is the self you bring into a story—their voice, history, boundaries, and point of view.
          </p>

          <button
            onClick={() => navigate('/personas/new')}
            className="rp-gold-button"
          >
            <Plus size={16} strokeWidth={3} />
            <span>Create a persona</span>
          </button>
        </section>


        {/* ── 2. ACTIVE DEFAULT PERSONA SHOWCASE ── */}
        {defaultPersona && (
          <section className="rp-card p-8 sm:p-10 rounded-3xl text-white relative overflow-hidden space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
              
              <div className="space-y-4 max-w-xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#c99b50]/10 border border-[#c99b50]/40 text-[#e8c378] text-xs font-extrabold uppercase tracking-wider">
                  <CheckCircle size={14} />
                  <span>{t('persona.active_persona')}</span>
                </div>

                  <h2 className="rp-heading text-3xl sm:text-4xl font-bold leading-tight">
                  {defaultPersona.name}
                </h2>

                  <p className="text-xs sm:text-sm text-[#d5c6af] leading-relaxed line-clamp-3">
                  {defaultPersona.description || defaultPersona.personality || "Your primary active identity for AI character roleplays."}
                </p>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => navigate(`/personas/${defaultPersona.id}/edit`)}
                    className="rp-gold-button"
                  >
                    <Edit2 size={16} />
                    <span>Edit Active Persona</span>
                  </button>
                </div>
              </div>

              {/* Avatar Showcase */}
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl bg-black/40 border-2 border-[#c99b50]/65 shadow-2xl overflow-hidden flex items-center justify-center shrink-0 self-center md:self-auto">
                {defaultPersona.avatar_url ? (
                  <img src={defaultPersona.avatar_url} alt={defaultPersona.name} className="w-full h-full object-cover" />
                ) : (
                  <User size={48} className="text-warm-400" />
                )}
              </div>

            </div>
          </section>
        )}


        {/* ── 3. PERSONA LIBRARY MATRIX ── */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="rp-heading font-serif text-2xl font-bold">
              Your other selves ({personas.length})
            </h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 rounded-3xl bg-[#201725] animate-pulse" />
              ))}
            </div>
          ) : personas.length === 0 ? (
            <RichEmptyState
              icon={User}
              title="No personas created yet"
              description="Create your first roleplay persona so AI characters know who you are in chats!"
              actionLabel="Create Persona"
              onAction={() => navigate('/personas/new')}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {personas.map((persona) => (
                <div 
                  key={persona.id} 
                  className="rp-card rounded-3xl overflow-hidden group relative cursor-pointer flex flex-col justify-between p-6 space-y-4"
                  onClick={() => navigate(`/personas/${persona.id}`)}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#c99b50]/35 bg-black/35">
                      {persona.avatar_url ? (
                        <img src={persona.avatar_url} alt={persona.name} className="w-full h-full object-cover" />
                      ) : (
                        <User size={28} className="text-warm-400" />
                      )}
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-serif font-bold text-lg text-[#fff2dc] truncate">{persona.name}</h3>
                        {persona.is_default && (
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold uppercase rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#c9bda9] line-clamp-2 leading-relaxed">
                        {persona.description || persona.personality || "No description provided."}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-[#c99b50]/20 pt-3 text-xs">
                    {!persona.is_default ? (
                      <button
                        onClick={(e) => handleSetDefault(persona.id, e)}
                        className="font-bold text-[#e6c377] hover:text-[#fff0be] hover:underline"
                      >
                        Set as Default
                      </button>
                    ) : (
                      <span className="text-emerald-500 font-bold">Active Persona</span>
                    )}

                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/personas/${persona.id}/edit`);
                        }}
                        className="p-1.5 text-warm-500 hover:text-warm-900 dark:hover:text-white rounded-lg transition-colors"
                        title="Edit Persona"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={(e) => handleDelete(persona.id, e)}
                        className="p-1.5 text-red-500 hover:text-red-700 rounded-lg transition-colors"
                        title="Delete Persona"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
