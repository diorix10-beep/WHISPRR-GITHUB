import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, User, UserCircle, Upload } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { UniversalImagePicker } from '../components/common/UniversalImagePicker';
import { supabase } from '../lib/supabase';
import type { Persona } from '../types';
import { compileCharacterSystemPrompt, type CharacterArchitecture } from '../lib/promptCompiler';

import { BookOpen } from 'lucide-react';
import type { Lorebook } from '../types';

export default function PersonaEditorPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [userLorebooks, setUserLorebooks] = useState<Lorebook[]>([]);
  
  const [formData, setFormData] = useState<Partial<Persona>>({
    name: '',
    description: '',
    gender: '',
    age: '',
    pronouns: '',
    personality: '',
    appearance: '',
    occupation: '',
    backstory: '',
    greeting: '',
    relationships: '',
    tags: [],
    lorebook_ids: [],
    is_public: false,
    is_default: false
  });

  useEffect(() => {
    if (user) {
      supabase.from('lorebooks').select('*').eq('user_id', user.id).then(({ data }) => {
        if (data) setUserLorebooks(data);
      });
    }
  }, [user]);

  useEffect(() => {
    if (isEditing && user) {
      fetchPersona();
    } else if (!isEditing) {
      const savedDraft = localStorage.getItem('chimera_new_persona_draft');
      if (savedDraft) {
        try {
          setFormData(JSON.parse(savedDraft));
          showToast('Restored unsaved new persona draft', 'info');
        } catch {}
      }
    }
  }, [id, user, isEditing]);

  const fetchPersona = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('personas')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      if (data.user_id !== user?.id) {
        showToast('You do not have permission to edit this persona', 'error');
        navigate('/personas');
        return;
      }
      
      setFormData(data);

      // Check draft override
      const draftKey = `chimera_persona_draft_${id}`;
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        try {
          setFormData(prev => ({ ...prev, ...JSON.parse(savedDraft) }));
          showToast('Restored unsaved persona draft', 'info');
        } catch {}
      }
    } catch (err) {
      console.error('Error fetching persona:', err);
      showToast('Failed to load persona', 'error');
      navigate('/personas');
    } finally {
      setLoading(false);
    }
  };

  // Auto-save draft protection (Rules 25 & 26)
  useEffect(() => {
    if (loading) return;
    const draftKey = isEditing ? `chimera_persona_draft_${id}` : 'chimera_new_persona_draft';
    const timer = setTimeout(() => {
      localStorage.setItem(draftKey, JSON.stringify(formData));
    }, 500);
    return () => clearTimeout(timer);
  }, [formData, isEditing, id, loading]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (!formData.name?.trim()) {
      showToast('Name is required', 'error');
      return;
    }

    try {
      setSaving(true);
      
      const payload = {
        ...formData,
        user_id: user.id,
        updated_at: new Date().toISOString()
      };

      let error;
      
      if (isEditing) {
        const { error: updateError } = await supabase
          .from('personas')
          .update(payload)
          .eq('id', id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('personas')
          .insert([payload]);
        error = insertError;
      }
      
      if (error) throw error;
      
      const draftKey = isEditing ? `chimera_persona_draft_${id}` : 'chimera_new_persona_draft';
      localStorage.removeItem(draftKey);

      showToast(`Persona ${isEditing ? 'updated' : 'created'} successfully!`, 'success');
      navigate('/personas');
    } catch (err) {
      console.error('Error saving persona:', err);
      const message = err instanceof Error ? err.message : 'Failed to save persona';
      showToast(message, 'error');
    } finally {
      setSaving(false);
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
    <div className="flex-1 p-6 md:p-8 max-w-4xl mx-auto w-full animate-fade-in-up">
      <button 
        onClick={() => navigate('/personas')}
        className="flex items-center gap-2 text-warm-500 hover:text-warm-700 dark:hover:text-warm-300 font-medium mb-6 transition-colors"
      >
        <ArrowLeft size={18} />
        Back to Personas
      </button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-warm-900 dark:text-warm-50">
            {isEditing ? 'Edit Persona' : 'Create New Persona'}
          </h1>
          <p className="text-warm-600 dark:text-warm-400 mt-2">
            Design the identity you will use when talking to AI characters.
          </p>
        </div>
        
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Save size={20} />
              {isEditing ? 'Save Changes' : 'Create Persona'}
            </>
          )}
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        
        {/* Basic Info */}
        <div className="bg-white dark:bg-warm-900 rounded-3xl border border-warm-200 dark:border-warm-800 p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-xl flex items-center justify-center">
              <UserCircle size={24} />
            </div>
            <h2 className="text-xl font-bold text-warm-900 dark:text-warm-50">Basic Details</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-bold text-warm-700 dark:text-warm-300 mb-2">
                Persona Name <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                value={formData.name || ''}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="e.g. Arthur Pendragon, generic_user, The Wanderer"
                className="w-full bg-warm-50 dark:bg-warm-950 border border-warm-200 dark:border-warm-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow dark:text-warm-50"
                required
              />
            </div>

            <div className="col-span-1 md:col-span-2">
              <UniversalImagePicker
                value={formData.avatar_url || null}
                onChange={(url) => setFormData({ ...formData, avatar_url: url })}
                label="Persona Avatar Picture"
                shape="circle"
              />
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-bold text-warm-700 dark:text-warm-300 mb-2">
                Short Description
              </label>
              <input 
                type="text" 
                value={formData.description || ''}
                onChange={e => setFormData({...formData, description: e.target.value})}
                placeholder="e.g. A weary traveler from the north, A cyberpunk hacker..."
                className="w-full bg-warm-50 dark:bg-warm-950 border border-warm-200 dark:border-warm-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow dark:text-warm-50"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-warm-700 dark:text-warm-300 mb-2">
                Gender
              </label>
              <input 
                type="text" 
                value={formData.gender || ''}
                onChange={e => setFormData({...formData, gender: e.target.value})}
                placeholder="e.g. Male, Female, Non-binary, Unknown"
                className="w-full bg-warm-50 dark:bg-warm-950 border border-warm-200 dark:border-warm-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow dark:text-warm-50"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-warm-700 dark:text-warm-300 mb-2">
                Age
              </label>
              <input 
                type="text" 
                value={formData.age || ''}
                onChange={e => setFormData({...formData, age: e.target.value})}
                placeholder="e.g. 25, Immortal, Unknown"
                className="w-full bg-warm-50 dark:bg-warm-950 border border-warm-200 dark:border-warm-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow dark:text-warm-50"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-warm-700 dark:text-warm-300 mb-2">
                Pronouns
              </label>
              <input 
                type="text" 
                value={formData.pronouns || ''}
                onChange={e => setFormData({...formData, pronouns: e.target.value})}
                placeholder="e.g. he/him, she/her, they/them"
                className="w-full bg-warm-50 dark:bg-warm-950 border border-warm-200 dark:border-warm-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow dark:text-warm-50"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-warm-700 dark:text-warm-300 mb-2">
                Occupation
              </label>
              <input 
                type="text" 
                value={formData.occupation || ''}
                onChange={e => setFormData({...formData, occupation: e.target.value})}
                placeholder="e.g. Knight, Student, CEO, Mage"
                className="w-full bg-warm-50 dark:bg-warm-950 border border-warm-200 dark:border-warm-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow dark:text-warm-50"
              />
            </div>
          </div>
        </div>

        {/* Persona-Bound Lorebooks (SillyTavern Feature) */}
        <div className="bg-white dark:bg-warm-900 rounded-3xl border border-warm-200 dark:border-warm-800 p-8 shadow-sm space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center font-bold">
              <BookOpen size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-warm-900 dark:text-warm-50">Persona-Bound Lorebooks</h2>
              <p className="text-xs text-warm-500">
                Link lorebooks (inventory, secret backstory, personal lore) directly to this Persona. Bound lore auto-injects across all chats!
              </p>
            </div>
          </div>

          {userLorebooks.length === 0 ? (
            <p className="text-xs text-warm-400 italic">No lorebooks created yet. Create lorebooks in the Lorebooks Studio to link them to your Persona.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {userLorebooks.map((lb) => {
                const isSelected = (formData.lorebook_ids || []).includes(lb.id);
                return (
                  <button
                    key={lb.id}
                    type="button"
                    onClick={() => {
                      const current = formData.lorebook_ids || [];
                      const next = isSelected ? current.filter(id => id !== lb.id) : [...current, lb.id];
                      setFormData({ ...formData, lorebook_ids: next });
                    }}
                    className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/50 text-amber-400 font-bold'
                        : 'bg-warm-50 dark:bg-warm-950 border-warm-200 dark:border-warm-800 text-warm-600 dark:text-warm-300 hover:border-warm-600'
                    }`}
                  >
                    <div className="truncate">
                      <p className="text-xs font-bold truncate">{lb.title}</p>
                      <p className="text-[10px] opacity-70">{lb.entry_count || 0} lore entries</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${isSelected ? 'bg-amber-500 text-black' : 'bg-warm-800 text-warm-400'}`}>
                      {isSelected ? 'Bound' : 'Bind'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-warm-900 rounded-3xl border border-warm-200 dark:border-warm-800 p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-xl flex items-center justify-center">
              <User size={24} />
            </div>
            <h2 className="text-xl font-bold text-warm-900 dark:text-warm-50">Identity & Lore</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-warm-700 dark:text-warm-300 mb-2">
                Appearance
              </label>
              <textarea 
                value={formData.appearance || ''}
                onChange={e => setFormData({...formData, appearance: e.target.value})}
                placeholder="Describe your persona's physical appearance, clothing, distinguishing marks..."
                rows={3}
                className="w-full bg-warm-50 dark:bg-warm-950 border border-warm-200 dark:border-warm-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow dark:text-warm-50 resize-y"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-warm-700 dark:text-warm-300 mb-2">
                Personality
              </label>
              <textarea 
                value={formData.personality || ''}
                onChange={e => setFormData({...formData, personality: e.target.value})}
                placeholder="Describe your persona's traits, flaws, speech patterns, and how they act..."
                rows={3}
                className="w-full bg-warm-50 dark:bg-warm-950 border border-warm-200 dark:border-warm-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow dark:text-warm-50 resize-y"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-warm-700 dark:text-warm-300 mb-2">
                Backstory
              </label>
              <textarea 
                value={formData.backstory || ''}
                onChange={e => setFormData({...formData, backstory: e.target.value})}
                placeholder="Where does this persona come from? What is their history?"
                rows={4}
                className="w-full bg-warm-50 dark:bg-warm-950 border border-warm-200 dark:border-warm-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow dark:text-warm-50 resize-y"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-warm-700 dark:text-warm-300 mb-2">
                Relationships & Dynamics
              </label>
              <textarea 
                value={formData.relationships || ''}
                onChange={e => setFormData({...formData, relationships: e.target.value})}
                placeholder="e.g. Brother to the King, Enemy of the state, childhood friend of [Character Name]..."
                rows={3}
                className="w-full bg-warm-50 dark:bg-warm-950 border border-warm-200 dark:border-warm-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow dark:text-warm-50 resize-y"
              />
              <p className="text-xs text-warm-500 mt-1">This helps the AI understand your connections within roleplays.</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 pb-12">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none text-lg"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save size={24} />
                {isEditing ? 'Save Changes' : 'Create Persona'}
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
