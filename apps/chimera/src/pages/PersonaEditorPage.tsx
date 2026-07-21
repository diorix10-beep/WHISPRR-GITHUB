import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, User, UserCircle, Upload } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import type { Persona } from '../types';
import { StructuredArchitectureForm } from '../components/character/StructuredArchitectureForm';
import { compileCharacterSystemPrompt, type CharacterArchitecture } from '../lib/promptCompiler';

export default function PersonaEditorPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  
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
    is_public: false,
    is_default: false
  });

  useEffect(() => {
    if (isEditing && user) {
      fetchPersona();
    }
  }, [id, user]);

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
    } catch (err) {
      console.error('Error fetching persona:', err);
      showToast('Failed to load persona', 'error');
      navigate('/personas');
    } finally {
      setLoading(false);
    }
  };

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
      
      showToast(`Persona ${isEditing ? 'updated' : 'created'} successfully!`, 'success');
      navigate('/personas');
    } catch (err) {
      console.error('Error saving persona:', err);
      showToast('Failed to save persona', 'error');
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
              <label className="block text-sm font-bold text-warm-700 dark:text-warm-300 mb-2">
                Profile Picture (Avatar Photo URL)
              </label>
              <div className="flex items-center gap-4">
                {formData.avatar_url ? (
                  <img src={formData.avatar_url} alt="Persona Avatar" className="w-14 h-14 rounded-full object-cover border border-warm-300 dark:border-warm-700 shadow-sm" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-warm-200 dark:bg-warm-800 flex items-center justify-center text-warm-500">
                    <User size={24} />
                  </div>
                )}
                <input 
                  type="url" 
                  value={formData.avatar_url || ''}
                  onChange={e => setFormData({...formData, avatar_url: e.target.value})}
                  placeholder="https://example.com/my-profile-picture.jpg"
                  className="flex-1 bg-warm-50 dark:bg-warm-950 border border-warm-200 dark:border-warm-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow dark:text-warm-50 text-sm"
                />
              </div>
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

        {/* 16-Section Persona Architecture */}
        <div className="bg-white dark:bg-warm-900 rounded-3xl border border-warm-200 dark:border-warm-800 p-8 shadow-sm space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center font-bold">
              16
            </div>
            <div>
              <h2 className="text-xl font-bold text-warm-900 dark:text-warm-50">Structured Persona Architecture</h2>
              <p className="text-xs text-warm-500">
                Provide structured fields so AI characters understand your speech style, boundaries, goals, and habits.
              </p>
            </div>
          </div>

          <StructuredArchitectureForm
            value={{
              name: formData.name,
              gender: formData.gender,
              age: formData.age,
              pronouns: formData.pronouns,
              occupation: formData.occupation,
              personality_traits: formData.personality,
              clothing: formData.appearance,
              habits: formData.backstory,
            }}
            onChange={(updated) => {
              const compiled = compileCharacterSystemPrompt(updated);
              setFormData(prev => ({
                ...prev,
                name: updated.name || prev.name,
                gender: updated.gender || prev.gender,
                age: updated.age || prev.age,
                pronouns: updated.pronouns || prev.pronouns,
                occupation: updated.occupation || prev.occupation,
                personality: compiled,
                appearance: updated.clothing || prev.appearance,
              }));
            }}
          />
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
