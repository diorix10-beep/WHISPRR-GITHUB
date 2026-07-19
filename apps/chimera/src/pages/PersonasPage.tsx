import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Settings, User, Edit2, Trash2, CheckCircle, ShieldAlert } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import type { Persona } from '../types';

export default function PersonasPage() {
  const { user, profile } = useAuth();
  const { showToast } = useToast();
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
        // Table doesn't exist or RLS issue — show empty state
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
      
      // Update local state to reflect the change
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

  if (loading) {
    return (
      <div className="flex-1 p-6 md:p-8 flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-warm-900 dark:text-warm-50">My Personas</h1>
          <p className="text-warm-600 dark:text-warm-400 mt-2">
            Manage the identities you use to interact with AI characters.
          </p>
        </div>
        
        <button
          onClick={() => navigate('/personas/new')}
          className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
        >
          <Plus size={20} />
          Create Persona
        </button>
      </div>

      {/* Info Card */}
      <div className="bg-warm-100 dark:bg-warm-800/50 rounded-2xl p-6 mb-8 border border-warm-200 dark:border-warm-800 flex items-start gap-4">
        <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center shrink-0">
          <Settings size={24} />
        </div>
        <div>
          <h3 className="font-bold text-warm-900 dark:text-warm-50 text-lg mb-1">How Personas Work</h3>
          <p className="text-warm-700 dark:text-warm-300">
            A Persona is the character you play in a story. It is completely separate from your WHISPRR user profile (@{profile?.username}). AI characters will address you based on the persona you choose, allowing you to roleplay as different genders, ages, or entirely fictional entities.
          </p>
        </div>
      </div>

      {personas.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-warm-900 rounded-3xl border border-warm-200 dark:border-warm-800 shadow-sm">
          <div className="w-20 h-20 bg-warm-100 dark:bg-warm-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <User size={40} className="text-warm-400" />
          </div>
          <h3 className="text-xl font-bold text-warm-900 dark:text-warm-50 mb-2">No Personas Yet</h3>
          <p className="text-warm-500 max-w-md mx-auto mb-6">
            Create your first persona to deeply immerse yourself in roleplay.
          </p>
          <button
            onClick={() => navigate('/personas/new')}
            className="px-6 py-3 bg-primary-600 text-white font-bold rounded-xl shadow-lg hover:bg-primary-700 transition-colors"
          >
            Create Your First Persona
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {personas.map((persona) => (
            <div 
              key={persona.id} 
              className="bg-white dark:bg-warm-900 rounded-2xl border border-warm-200 dark:border-warm-800 overflow-hidden shadow-sm hover:shadow-md transition-all group relative cursor-pointer"
              onClick={() => navigate(`/personas/${persona.id}`)}
            >
              {persona.is_default && (
                <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-3 py-1 bg-primary-500 text-white text-xs font-bold rounded-full shadow-md">
                  <CheckCircle size={14} />
                  Default
                </div>
              )}
              
              <div className="h-24 bg-gradient-to-br from-primary-400 to-accent-400 dark:from-primary-600 dark:to-accent-600 w-full relative">
                {/* Actions overlay */}
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/personas/${persona.id}/edit`);
                    }}
                    className="w-8 h-8 bg-white/90 dark:bg-warm-900/90 hover:bg-white dark:hover:bg-warm-800 text-warm-700 dark:text-warm-200 rounded-full flex items-center justify-center shadow-sm transition-colors"
                    title="Edit Persona"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={(e) => handleDelete(persona.id, e)}
                    className="w-8 h-8 bg-white/90 dark:bg-warm-900/90 hover:bg-red-50 dark:hover:bg-red-900/50 text-red-500 rounded-full flex items-center justify-center shadow-sm transition-colors"
                    title="Delete Persona"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <div className="px-6 pb-6 pt-0 relative">
                <div className="w-20 h-20 bg-warm-100 dark:bg-warm-800 rounded-full border-4 border-white dark:border-warm-900 shadow-lg -mt-10 mb-4 overflow-hidden flex items-center justify-center shrink-0">
                  {persona.avatar_url ? (
                    <img src={persona.avatar_url} alt={persona.name} className="w-full h-full object-cover" />
                  ) : (
                    <User size={36} className="text-warm-400" />
                  )}
                </div>
                
                <h3 className="text-xl font-bold text-warm-900 dark:text-warm-50 truncate">{persona.name}</h3>
                
                <div className="flex flex-wrap gap-2 mt-2 mb-4">
                  {persona.gender && (
                    <span className="px-2 py-0.5 bg-warm-100 dark:bg-warm-800 text-warm-600 dark:text-warm-300 text-xs font-medium rounded-md">
                      {persona.gender}
                    </span>
                  )}
                  {persona.age && (
                    <span className="px-2 py-0.5 bg-warm-100 dark:bg-warm-800 text-warm-600 dark:text-warm-300 text-xs font-medium rounded-md">
                      {persona.age}
                    </span>
                  )}
                </div>
                
                <p className="text-warm-600 dark:text-warm-400 text-sm line-clamp-3 mb-6 min-h-[60px]">
                  {persona.description || "No description provided. Add one so AI characters know who you are!"}
                </p>
                
                {!persona.is_default && (
                  <button
                    onClick={(e) => handleSetDefault(persona.id, e)}
                    className="w-full py-2.5 bg-warm-100 dark:bg-warm-800 hover:bg-warm-200 dark:hover:bg-warm-700 text-warm-700 dark:text-warm-300 font-semibold text-sm rounded-xl transition-colors"
                  >
                    Set as Default Persona
                  </button>
                )}
                {persona.is_default && (
                  <div className="w-full py-2.5 border border-primary-500/20 bg-primary-50 dark:bg-primary-900/10 text-primary-600 dark:text-primary-400 font-semibold text-sm rounded-xl text-center">
                    Current Default
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
