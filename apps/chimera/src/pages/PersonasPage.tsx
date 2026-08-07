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
    <div className="min-h-screen bg-warm-50 dark:bg-warm-900 text-warm-900 dark:text-warm-50 font-sans pb-24 relative overflow-hidden transition-colors duration-300">
      
      {/* Ambient Red/Purple Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-red-600/15 via-purple-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 relative z-10 pt-6">

        {/* ── 1. HERO SECTION ── */}
        <section className="flex flex-col items-center text-center pt-6 sm:pt-8 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider">
            <UserCheck size={14} />
            <span>{t('persona.personas_title')}</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl font-extrabold tracking-tight text-warm-900 dark:text-white">
            {t('persona.personas_title')}
          </h1>

          <p className="text-sm sm:text-base text-warm-600 dark:text-warm-300 max-w-xl mx-auto leading-relaxed">
            {t('persona.persona_desc')}
          </p>

          <button
            onClick={() => navigate('/personas/new')}
            className="px-6 py-3 rounded-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-extrabold text-xs shadow-lg shadow-red-600/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            <Plus size={16} strokeWidth={3} />
            <span>{t('persona.create_persona')}</span>
          </button>
        </section>


        {/* ── 2. ACTIVE DEFAULT PERSONA SHOWCASE ── */}
        {defaultPersona && (
          <section className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-warm-900 via-warm-900 to-warm-950 text-white border border-white/10 shadow-2xl relative overflow-hidden space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
              
              <div className="space-y-4 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold uppercase tracking-wider">
                  <CheckCircle size={14} />
                  <span>{t('persona.active_persona')}</span>
                </div>

                <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white leading-tight">
                  {defaultPersona.name}
                </h2>

                <p className="text-xs sm:text-sm text-warm-300 leading-relaxed line-clamp-3">
                  {defaultPersona.description || defaultPersona.personality || "Your primary active identity for AI character roleplays."}
                </p>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => navigate(`/personas/${defaultPersona.id}/edit`)}
                    className="px-6 py-3 rounded-full bg-white hover:bg-warm-100 text-black font-extrabold text-xs shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <Edit2 size={16} />
                    <span>Edit Active Persona</span>
                  </button>
                </div>
              </div>

              {/* Avatar Showcase */}
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl bg-warm-800 border-4 border-white/20 shadow-2xl overflow-hidden flex items-center justify-center shrink-0 self-center md:self-auto">
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
            <h2 className="font-serif text-2xl font-bold text-warm-900 dark:text-white">
              All Personas ({personas.length})
            </h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 rounded-3xl bg-warm-200 dark:bg-warm-800 animate-pulse" />
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
                  className="bg-white dark:bg-warm-850 rounded-3xl border border-warm-200 dark:border-warm-750 overflow-hidden shadow-sm hover:shadow-xl transition-all group relative cursor-pointer flex flex-col justify-between p-6 space-y-4"
                  onClick={() => navigate(`/personas/${persona.id}`)}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-warm-100 dark:bg-warm-800 border border-warm-200 dark:border-warm-700 overflow-hidden flex items-center justify-center shrink-0">
                      {persona.avatar_url ? (
                        <img src={persona.avatar_url} alt={persona.name} className="w-full h-full object-cover" />
                      ) : (
                        <User size={28} className="text-warm-400" />
                      )}
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-lg text-warm-900 dark:text-white truncate">{persona.name}</h3>
                        {persona.is_default && (
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold uppercase rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-warm-500 dark:text-warm-400 line-clamp-2 leading-relaxed">
                        {persona.description || persona.personality || "No description provided."}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-warm-100 dark:border-warm-800 text-xs">
                    {!persona.is_default ? (
                      <button
                        onClick={(e) => handleSetDefault(persona.id, e)}
                        className="text-red-600 dark:text-red-400 font-bold hover:underline"
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
