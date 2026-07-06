import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ArrowRight, Save, Bot, Check, RefreshCw, Upload, Image, FileCode 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';

const STEPS = [
  { id: 1, label: 'Identity', desc: 'Basic info & rating' },
  { id: 2, label: 'Appearance', desc: 'Avatar & banner style' },
  { id: 3, label: 'Lore', desc: 'Greeting & biography' },
  { id: 4, label: 'Personality', desc: 'Traits & scenario context' },
  { id: 5, label: 'Chat Style', desc: 'Example dialogue & tone' },
  { id: 6, label: 'Knowledge', desc: 'Special lore & facts' },
  { id: 7, label: 'Preview', desc: 'Final review & publish' }
];

const GRADIENTS = [
  'from-amber-500/20 to-amber-600/5',
  'from-purple-500/20 to-purple-600/5',
  'from-red-500/20 to-red-600/5',
  'from-blue-500/20 to-blue-600/5',
  'from-cyan-500/20 to-cyan-600/5',
  'from-emerald-500/20 to-emerald-600/5',
  'from-pink-500/20 to-pink-600/5',
  'from-rose-500/20 to-rose-600/5'
];

const CATEGORY_OPTIONS = [
  'Companions',
  'Roleplay',
  'Mentors',
  'Fantasy',
  'Anime',
  'Historical',
  'Helpers'
];

export default function AiCharacterCreator() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { showToast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: 'Companions',
    visibility: 'public' as 'public' | 'private' | 'unlisted',
    contentRating: 'SFW' as 'SFW' | 'Mature' | 'NSFW',
    avatarUrl: '',
    bannerUrl: '',
    bannerGradient: 'from-purple-500/20 to-purple-600/5',
    greeting: '',
    shortDescription: '',
    longDescription: '',
    personality: '',
    scenario: '',
    exampleDialogues: '',
    conversationStyle: 'Warm, conversational, structured.',
    knowledge: '',
    creatorNotes: '',
    exampleConversations: '',
    tagsString: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGradientSelect = (gradient: string) => {
    setFormData(prev => ({ ...prev, bannerGradient: gradient }));
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${profile?.user_id || 'anonymous'}/${Date.now()}.${fileExt}`;
      
      const { error } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, file);
        
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);
        
      setFormData(prev => ({ ...prev, avatarUrl: publicUrl }));
      showToast('Avatar uploaded successfully!', 'success');
    } catch (err) {
      console.error('Upload error:', err);
      showToast('Failed to upload image. Please paste a direct image URL instead.', 'error');
    }
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const json = JSON.parse(text);
        
        const name = json.name || json.char_name || json.title || '';
        const greeting = json.greeting || json.greeting_message || '';
        const shortDesc = json.short_description || json.title || '';
        const longDesc = json.description || json.long_description || '';
        const personality = json.personality || json.definition || '';
        const dialogues = json.example_dialogues || json.definition || '';
        const notes = json.creator_notes || '';
        
        setFormData(prev => ({
          ...prev,
          name: name || prev.name,
          greeting: greeting || prev.greeting,
          shortDescription: shortDesc || prev.shortDescription,
          longDescription: longDesc || prev.longDescription,
          personality: personality || prev.personality,
          exampleDialogues: dialogues || prev.exampleDialogues,
          creatorNotes: notes || prev.creatorNotes
        }));
        showToast('Successfully imported Character settings!', 'success');
      } catch (err) {
        showToast('Invalid JSON file format', 'error');
      }
    };
    reader.readAsText(file);
  };

  const validateStep = () => {
    if (currentStep === 1) {
      if (!formData.name.trim()) {
        showToast('Please enter a display name', 'error');
        return false;
      }
    }
    if (currentStep === 3) {
      if (!formData.greeting.trim()) {
        showToast('Please enter a greeting message', 'error');
        return false;
      }
      if (!formData.shortDescription.trim()) {
        showToast('Please enter a short description', 'error');
        return false;
      }
    }
    if (currentStep === 4) {
      if (!formData.personality.trim()) {
        showToast('Please define character personality traits', 'error');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!profile) {
      showToast('You must be logged in to build NEXA Characters', 'error');
      return;
    }

    setLoading(true);
    const tags = formData.tagsString
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(t => t.length > 0);

    try {
      const { error } = await supabase.rpc('create_ai_character', {
        p_name: formData.name.trim(),
        p_username: '', // Generated dynamically in Postgres
        p_avatar_emoji: '🤖',
        p_greeting: formData.greeting.trim(),
        p_short_description: formData.shortDescription.trim(),
        p_long_description: formData.longDescription.trim(),
        p_personality: formData.personality.trim(),
        p_scenario: formData.scenario.trim(),
        p_example_dialogues: formData.exampleDialogues.trim(),
        p_conversation_style: formData.conversationStyle.trim(),
        p_knowledge: formData.knowledge.trim(),
        p_tags: tags,
        p_category: formData.category,
        p_visibility: formData.visibility,
        p_avatar_url: formData.avatarUrl.trim(),
        p_banner_url: formData.bannerUrl.trim(),
        p_content_rating: formData.contentRating,
        p_creator_notes: formData.creatorNotes.trim(),
        p_example_conversations: formData.exampleConversations.trim()
      });

      if (error) throw error;

      showToast('NEXA Character created successfully!', 'success');
      navigate('/nexa');

    } catch (err: unknown) {
      const error = err as Error;
      console.error('Error creating character:', error);
      showToast(error.message || 'Error occurred while creating character.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <button
          onClick={() => navigate('/nexa')}
          className="flex items-center gap-2 text-warm-500 hover:text-warm-700 dark:text-warm-450 dark:hover:text-warm-250 transition-colors text-sm font-semibold uppercase tracking-wider focus:outline-none"
        >
          <ArrowLeft size={16} />
          <span>Back to Directory</span>
        </button>

        {/* Character.AI Importer */}
        <div className="relative">
          <input
            type="file"
            ref={importInputRef}
            onChange={handleImportJson}
            accept=".json"
            className="hidden"
          />
          <button
            onClick={() => importInputRef.current?.click()}
            className="btn-secondary py-1.5 px-4 text-xs flex items-center gap-2"
          >
            <FileCode size={14} className="text-primary-500" />
            <span>Import from Character.AI</span>
          </button>
        </div>
      </div>

      {/* Hero */}
      <div className="mb-10">
        <div className="flex items-center gap-2.5 text-primary-500 font-semibold text-xs tracking-wide uppercase mb-1">
          <Bot size={16} />
          <span>Creator Lab</span>
        </div>
        <h1 className="text-3xl font-serif font-bold text-warm-900 dark:text-warm-50">
          Create NEXA Character
        </h1>
        <p className="text-warm-500 dark:text-warm-400 text-sm mt-1">
          Shape a new citizen for the NEXA storytelling ecosystem. Build their mind, behavior, and rating.
        </p>
      </div>

      {/* Step Indicators */}
      <div className="mb-10 overflow-x-auto pb-4 no-scrollbar">
        <div className="flex gap-4 min-w-[650px] justify-between">
          {STEPS.map((step) => {
            const isCompleted = currentStep > step.id;
            const isActive = currentStep === step.id;

            return (
              <div key={step.id} className="flex-1 flex flex-col gap-2 relative">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs transition-all ${
                    isCompleted 
                      ? 'bg-primary-500 text-white' 
                      : isActive 
                        ? 'bg-warm-900 dark:bg-warm-50 text-white dark:text-warm-950 scale-105' 
                        : 'bg-warm-100 dark:bg-warm-800 text-warm-400 dark:text-warm-550 border border-warm-200 dark:border-warm-700'
                  }`}>
                    {isCompleted ? <Check size={14} /> : step.id}
                  </div>
                  <span className={`text-xs font-semibold uppercase tracking-wider transition-colors ${
                    isActive ? 'text-warm-900 dark:text-warm-50' : 'text-warm-400 dark:text-warm-500'
                  }`}>
                    {step.label}
                  </span>
                </div>
                <div className="text-[10px] text-warm-400 dark:text-warm-500 truncate pl-1">
                  {step.desc}
                </div>
                {step.id < STEPS.length && (
                  <div className="hidden md:block absolute top-4 left-[90px] right-2 h-[1px] bg-warm-200 dark:bg-warm-850" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white dark:bg-warm-850 border border-warm-200 dark:border-warm-750 rounded-3xl p-6 lg:p-8 shadow-sm mb-8 transition-colors duration-300">
        
        {/* Step 1: Core Information */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h3 className="text-lg font-serif font-bold text-warm-900 dark:text-warm-50 border-b border-warm-100 dark:border-warm-800 pb-3">
              Step 1: Core Identity
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-warm-750 dark:text-warm-300 mb-2">
                  Display Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Lara Croft"
                  className="w-full bg-warm-50 dark:bg-warm-800 border border-warm-200 dark:border-warm-700 rounded-2xl py-3 px-4 text-sm text-warm-900 dark:text-warm-50 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-warm-750 dark:text-warm-300 mb-2">
                  Content Rating
                </label>
                <select
                  name="contentRating"
                  value={formData.contentRating}
                  onChange={handleChange}
                  className="w-full bg-warm-50 dark:bg-warm-800 border border-warm-200 dark:border-warm-700 rounded-2xl py-3 px-4 text-sm text-warm-900 dark:text-warm-50 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                >
                  <option value="SFW">SFW (All Ages)</option>
                  <option value="Mature">Mature (17+)</option>
                  <option value="NSFW">NSFW (18+ / Explicit)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-warm-750 dark:text-warm-300 mb-2">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full bg-warm-50 dark:bg-warm-800 border border-warm-200 dark:border-warm-700 rounded-2xl py-3 px-4 text-sm text-warm-900 dark:text-warm-50 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                >
                  {CATEGORY_OPTIONS.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-warm-750 dark:text-warm-300 mb-2">
                  Visibility
                </label>
                <select
                  name="visibility"
                  value={formData.visibility}
                  onChange={handleChange}
                  className="w-full bg-warm-50 dark:bg-warm-800 border border-warm-200 dark:border-warm-700 rounded-2xl py-3 px-4 text-sm text-warm-900 dark:text-warm-50 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                >
                  <option value="public">Public (Visible in directory)</option>
                  <option value="unlisted">Unlisted (Link only)</option>
                  <option value="private">Private (Only you)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Appearance */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-serif font-bold text-warm-900 dark:text-warm-50 border-b border-warm-100 dark:border-warm-800 pb-3">
              Step 2: Profile Picture & Cover Banner
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Avatar upload/link */}
              <div className="space-y-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-warm-750 dark:text-warm-300">
                  Profile Avatar Image
                </label>
                
                <div className="flex gap-4 items-center">
                  <div className="w-16 h-16 rounded-2xl bg-warm-100 dark:bg-warm-800 flex items-center justify-center border border-warm-200 dark:border-warm-700 overflow-hidden shrink-0">
                    {formData.avatarUrl ? (
                      <img src={formData.avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Image size={24} className="text-warm-400" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleAvatarFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full btn-secondary text-xs py-2 px-3 flex items-center justify-center gap-1.5"
                    >
                      <Upload size={13} />
                      Upload Avatar File
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-warm-500 uppercase tracking-wider mb-1">
                    Or Direct Avatar Image URL
                  </label>
                  <input
                    type="text"
                    name="avatarUrl"
                    value={formData.avatarUrl}
                    onChange={handleChange}
                    placeholder="https://example.com/avatar.png"
                    className="w-full bg-warm-50 dark:bg-warm-800 border border-warm-200 dark:border-warm-700 rounded-2xl py-2 px-4 text-xs text-warm-900 dark:text-warm-50 focus:outline-none"
                  />
                </div>
              </div>

              {/* Cover banner URL */}
              <div className="space-y-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-warm-750 dark:text-warm-300">
                  Custom Cover Banner
                </label>
                
                <div className="h-16 rounded-2xl bg-warm-100 dark:bg-warm-800 flex items-center justify-center border border-warm-200 dark:border-warm-700 overflow-hidden">
                  {formData.bannerUrl ? (
                    <img src={formData.bannerUrl} alt="Banner Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-r ${formData.bannerGradient}`} />
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-warm-500 uppercase tracking-wider mb-1">
                    Direct Banner Image URL (Optional)
                  </label>
                  <input
                    type="text"
                    name="bannerUrl"
                    value={formData.bannerUrl}
                    onChange={handleChange}
                    placeholder="https://example.com/banner.gif"
                    className="w-full bg-warm-50 dark:bg-warm-800 border border-warm-200 dark:border-warm-700 rounded-2xl py-2 px-4 text-xs text-warm-900 dark:text-warm-50 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-warm-750 dark:text-warm-300 mb-3">
                Or Choose Fallback Profile Theme Gradient
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {GRADIENTS.map(gradient => (
                  <button
                    key={gradient}
                    type="button"
                    onClick={() => handleGradientSelect(gradient)}
                    className={`h-16 rounded-2xl bg-gradient-to-r ${gradient} border-2 transition-all relative ${
                      formData.bannerGradient === gradient
                        ? 'border-primary-500 scale-105 shadow'
                        : 'border-transparent hover:scale-102 hover:shadow-sm'
                    }`}
                  >
                    {formData.bannerGradient === gradient && (
                      <div className="absolute right-2.5 top-2.5 bg-primary-500 text-white rounded-full p-0.5">
                        <Check size={10} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Greeting & Description */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h3 className="text-lg font-serif font-bold text-warm-900 dark:text-warm-50 border-b border-warm-100 dark:border-warm-800 pb-3">
              Step 3: Biography & Greetings (Infinite Character Length)
            </h3>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-warm-750 dark:text-warm-300 mb-2">
                Greeting Message * (Sent automatically when a chat room is created)
              </label>
              <textarea
                name="greeting"
                value={formData.greeting}
                onChange={handleChange}
                rows={3}
                placeholder="e.g. Hello there! I'm Lara Croft. It's wonderful to meet you. What shall we explore today?"
                className="w-full bg-warm-50 dark:bg-warm-800 border border-warm-200 dark:border-warm-700 rounded-2xl py-3 px-4 text-sm text-warm-900 dark:text-warm-50 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-warm-750 dark:text-warm-300 mb-2">
                Short Description * (Summarized preview shown on directory cards)
              </label>
              <input
                type="text"
                name="shortDescription"
                value={formData.shortDescription}
                onChange={handleChange}
                placeholder="e.g. A fearless adventurer and archaeologist who unearths lost tombs."
                className="w-full bg-warm-50 dark:bg-warm-800 border border-warm-200 dark:border-warm-700 rounded-2xl py-3 px-4 text-sm text-warm-900 dark:text-warm-50 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-warm-750 dark:text-warm-300 mb-2">
                Detailed Biography & Lore (Full backstory, history, and secret origins)
              </label>
              <textarea
                name="longDescription"
                value={formData.longDescription}
                onChange={handleChange}
                rows={5}
                placeholder="Provide a comprehensive biography of your character's life history, lore, world history, and experiences."
                className="w-full bg-warm-50 dark:bg-warm-800 border border-warm-200 dark:border-warm-700 rounded-2xl py-3 px-4 text-sm text-warm-900 dark:text-warm-50 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
          </div>
        )}

        {/* Step 4: Personality & Scenario */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h3 className="text-lg font-serif font-bold text-warm-900 dark:text-warm-50 border-b border-warm-100 dark:border-warm-800 pb-3">
              Step 4: Personality & Context (Infinite Character Length)
            </h3>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-warm-750 dark:text-warm-300 mb-2">
                Core Personality Traits * (Define their traits, emotional layers, and behaviors)
              </label>
              <textarea
                name="personality"
                value={formData.personality}
                onChange={handleChange}
                rows={4}
                placeholder="e.g. Brave, highly athletic, dry sense of humor. Focused on preservation of history, speaks with formal British tone."
                className="w-full bg-warm-50 dark:bg-warm-800 border border-warm-200 dark:border-warm-700 rounded-2xl py-3 px-4 text-sm text-warm-900 dark:text-warm-50 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-warm-750 dark:text-warm-300 mb-2">
                Starting Roleplay Scenario (The setup/environment where the conversation begins)
              </label>
              <textarea
                name="scenario"
                value={formData.scenario}
                onChange={handleChange}
                rows={3}
                placeholder="e.g. Lara Croft and the user are trapped inside an ancient Mayan temple with the entrance blocked by rubble."
                className="w-full bg-warm-50 dark:bg-warm-800 border border-warm-200 dark:border-warm-700 rounded-2xl py-3 px-4 text-sm text-warm-900 dark:text-warm-50 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-warm-750 dark:text-warm-300 mb-2">
                Tags (Comma separated)
              </label>
              <input
                type="text"
                name="tagsString"
                value={formData.tagsString}
                onChange={handleChange}
                placeholder="e.g. adventure, female, roleplay, action"
                className="w-full bg-warm-50 dark:bg-warm-800 border border-warm-200 dark:border-warm-700 rounded-2xl py-3 px-4 text-sm text-warm-900 dark:text-warm-50 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
          </div>
        )}

        {/* Step 5: Conversation Style */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <h3 className="text-lg font-serif font-bold text-warm-900 dark:text-warm-50 border-b border-warm-100 dark:border-warm-800 pb-3">
              Step 5: Conversation Style, Dialogues & Creator Notes
            </h3>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-warm-750 dark:text-warm-300 mb-2">
                Example Dialogues (Format: User: ... / Character: ...)
              </label>
              <textarea
                name="exampleDialogues"
                value={formData.exampleDialogues}
                onChange={handleChange}
                rows={4}
                placeholder={`User: Is there a way out?\nCharacter: There's always a way out. We just need to find the trigger switch.`}
                className="w-full bg-warm-50 dark:bg-warm-800/80 border border-warm-200 dark:border-warm-700 rounded-2xl py-3 px-4 text-sm text-warm-900 dark:text-warm-50 font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-warm-750 dark:text-warm-300 mb-2">
                Conversation Style constraints
              </label>
              <input
                type="text"
                name="conversationStyle"
                value={formData.conversationStyle}
                onChange={handleChange}
                placeholder="e.g. Formal British tone, speaks with dry wit, uses action actions *grins*."
                className="w-full bg-warm-50 dark:bg-warm-800 border border-warm-200 dark:border-warm-700 rounded-2xl py-3 px-4 text-sm text-warm-900 dark:text-warm-50 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-warm-750 dark:text-warm-300 mb-2">
                Creator Notes (Updates, known issues, patch notes, future plans)
              </label>
              <textarea
                name="creatorNotes"
                value={formData.creatorNotes}
                onChange={handleChange}
                rows={3}
                placeholder="Add patch notes, character development updates, or requests for user feedback here."
                className="w-full bg-warm-50 dark:bg-warm-800 border border-warm-200 dark:border-warm-700 rounded-2xl py-3 px-4 text-sm text-warm-900 dark:text-warm-50 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
          </div>
        )}

        {/* Step 6: Knowledge context */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <h3 className="text-lg font-serif font-bold text-warm-900 dark:text-warm-50 border-b border-warm-100 dark:border-warm-800 pb-3">
              Step 6: Lore & Specialist Knowledge (Infinite Character Length)
            </h3>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-warm-750 dark:text-warm-300 mb-2">
                Lore & Specialist Knowledge Database (Manual Text Entry)
              </label>
              <p className="text-xs text-warm-500 dark:text-warm-400 mb-3">
                Include specific historical records, factual information, specific rules, or custom reference details that this NEXA character should know.
              </p>
              <textarea
                name="knowledge"
                value={formData.knowledge}
                onChange={handleChange}
                rows={6}
                placeholder="Insert lore, encyclopedias, or custom reference manuals here. The NEXA Character will consult this database before responding."
                className="w-full bg-warm-50 dark:bg-warm-800 border border-warm-200 dark:border-warm-700 rounded-2xl py-3 px-4 text-sm text-warm-900 dark:text-warm-50 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
          </div>
        )}

        {/* Step 7: Final Review & Publish */}
        {currentStep === 7 && (
          <div className="space-y-6">
            <h3 className="text-lg font-serif font-bold text-warm-900 dark:text-warm-50 border-b border-warm-100 dark:border-warm-800 pb-3">
              Step 7: Final Review & Preview
            </h3>

            {/* Mock Card Preview */}
            <div className="max-w-md mx-auto rounded-3xl border border-warm-200 dark:border-warm-700 bg-warm-50 dark:bg-warm-800/40 p-6 shadow-md select-none">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-warm-100 dark:bg-warm-800 flex items-center justify-center border border-warm-200 dark:border-warm-700 overflow-hidden shrink-0">
                    {formData.avatarUrl ? (
                      <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <Image size={24} className="text-warm-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-serif text-lg font-bold text-warm-900 dark:text-warm-50">
                      {formData.name || 'Untitled Character'}
                    </h4>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-primary-500">
                      NEXA Character
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 bg-warm-200 dark:bg-warm-700 text-warm-700 dark:text-warm-300 rounded">
                    {formData.category}
                  </span>
                  <span className="text-[8px] font-bold tracking-wider px-1.5 py-0.2 bg-red-100 dark:bg-red-950/20 text-red-650 dark:text-red-400 rounded">
                    {formData.contentRating}
                  </span>
                </div>
              </div>
              
              <p className="text-warm-600 dark:text-warm-350 text-sm line-clamp-3 mb-4 leading-relaxed italic">
                "{formData.shortDescription || 'No description provided.'}"
              </p>

              <div className="text-[10px] bg-warm-200/50 dark:bg-warm-800 px-3 py-2 rounded-xl text-warm-500 leading-normal border border-warm-200 dark:border-warm-700">
                <span className="font-bold">Greeting: </span>
                {formData.greeting || 'No greeting message configured.'}
              </div>
            </div>

            <div className="border-t border-warm-100 dark:border-warm-800 pt-6 text-center">
              <p className="text-xs text-warm-500 dark:text-warm-405 mb-4">
                By publishing, this NEXA Character will immediately join the NEXA database according to your visibility settings.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center">
        <button
          onClick={handlePrev}
          disabled={currentStep === 1 || loading}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold text-sm transition-all border ${
            currentStep === 1 
              ? 'border-transparent text-warm-300 dark:text-warm-700 cursor-not-allowed'
              : 'border-warm-200 dark:border-warm-700 text-warm-700 dark:text-warm-300 hover:bg-warm-150 dark:hover:bg-warm-800'
          }`}
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>

        {currentStep < STEPS.length ? (
          <button
            onClick={handleNext}
            className="flex items-center gap-2 bg-warm-900 dark:bg-warm-50 text-white dark:text-warm-950 hover:bg-warm-800 dark:hover:bg-warm-150 font-semibold px-6 py-3 rounded-2xl shadow transition-all hover:scale-102 active:scale-98"
          >
            <span>Continue</span>
            <ArrowRight size={16} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold px-6 py-3 rounded-2xl shadow-lg transition-all hover:scale-102 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Publishing...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Publish Character</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
