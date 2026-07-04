import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ArrowRight, Save, Bot, Check, AlertCircle, RefreshCw 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';

const STEPS = [
  { id: 1, label: 'Identity', desc: 'Basic info & visibility' },
  { id: 2, label: 'Appearance', desc: 'Avatar & banner style' },
  { id: 3, label: 'Lore', desc: 'Greeting & biography' },
  { id: 4, label: 'Personality', desc: 'Traits & scenario context' },
  { id: 5, label: 'Chat Style', desc: 'Example dialogue & tone' },
  { id: 6, label: 'Knowledge', desc: 'Special lore & facts' },
  { id: 7, label: 'Preview', desc: 'Final review & publish' }
];

const EMOJI_OPTIONS = [
  '💫', '👩', '🤖', '🦊', '🦉', '🦁', '🌟', '🛡️', 
  '💜', '🎭', '🔮', '☕', '🍃', '🐾', '🧠', '🎨',
  '🌸', '🌙', '🌊', '🔥', '📚', '🎙️', '🎮', '💡'
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
  const [usernameError, setUsernameError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    category: 'Companions',
    visibility: 'public' as 'public' | 'private' | 'unlisted',
    avatarEmoji: '💫',
    bannerGradient: 'from-purple-500/20 to-purple-600/5',
    greeting: '',
    shortDescription: '',
    longDescription: '',
    personality: '',
    scenario: '',
    exampleDialogues: '',
    conversationStyle: 'Warm, conversational, structured.',
    knowledge: '',
    tagsString: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'username') setUsernameError('');
  };

  const handleEmojiSelect = (emoji: string) => {
    setFormData(prev => ({ ...prev, avatarEmoji: emoji }));
  };

  const handleGradientSelect = (gradient: string) => {
    setFormData(prev => ({ ...prev, bannerGradient: gradient }));
  };

  const validateStep = () => {
    if (currentStep === 1) {
      if (!formData.name.trim()) {
        showToast('Please enter a display name', 'error');
        return false;
      }
      if (!formData.username.trim()) {
        showToast('Please enter a username', 'error');
        return false;
      }
      // Basic username pattern check
      const usernamePattern = /^[a-zA-Z0-9_]{3,15}$/;
      if (!usernamePattern.test(formData.username)) {
        showToast('Username must be 3-15 alphanumeric characters or underscores', 'error');
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
    // Parse tags string to array
    const tags = formData.tagsString
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(t => t.length > 0);

    try {
      // Clean username from any whitespace or casing
      const cleanUsername = formData.username.trim().toLowerCase();

      // Trigger the secure security definer RPC function in Supabase
      const { error } = await supabase.rpc('create_ai_character', {
        p_name: formData.name.trim(),
        p_username: cleanUsername,
        p_avatar_emoji: formData.avatarEmoji,
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
        p_visibility: formData.visibility
      });

      if (error) {
        if (error.message.includes('Username already taken')) {
          setUsernameError('Username already taken. Please pick another.');
          setCurrentStep(1);
          throw new Error('Username already taken');
        }
        throw error;
      }

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
      <button
        onClick={() => navigate('/nexa')}
        className="flex items-center gap-2 text-warm-500 hover:text-warm-700 dark:text-warm-450 dark:hover:text-warm-250 transition-colors mb-6 text-sm font-semibold uppercase tracking-wider focus:outline-none"
      >
        <ArrowLeft size={16} />
        <span>Back to Directory</span>
      </button>

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
          Shape a new citizen for the WHISPRR digital society. Build their mind, background, behavior, and tone.
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
                {/* Connector line */}
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
                  placeholder="e.g. Luna"
                  className="w-full bg-warm-50 dark:bg-warm-800 border border-warm-200 dark:border-warm-700 rounded-2xl py-3 px-4 text-sm text-warm-900 dark:text-warm-50 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-warm-750 dark:text-warm-300 mb-2">
                  Username *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-warm-400 text-sm font-semibold">@</span>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="luna_helper"
                    className={`w-full bg-warm-50 dark:bg-warm-800 border ${
                      usernameError ? 'border-red-500' : 'border-warm-200 dark:border-warm-700'
                    } rounded-2xl py-3 pl-8 pr-4 text-sm text-warm-900 dark:text-warm-50 focus:outline-none focus:ring-2 focus:ring-primary-500/20`}
                  />
                </div>
                {usernameError && (
                  <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                    <AlertCircle size={12} />
                    <span>{usernameError}</span>
                  </p>
                )}
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
                  <option value="public">Public (Visible in search & directory)</option>
                  <option value="unlisted">Unlisted (Only accessible via link)</option>
                  <option value="private">Private (Only visible to you)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Appearance */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-serif font-bold text-warm-900 dark:text-warm-50 border-b border-warm-100 dark:border-warm-800 pb-3">
              Step 2: Appearance & Styling
            </h3>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-warm-750 dark:text-warm-300 mb-3">
                Avatar Emoji ({formData.avatarEmoji})
              </label>
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-3">
                {EMOJI_OPTIONS.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleEmojiSelect(emoji)}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl border transition-all ${
                      formData.avatarEmoji === emoji
                        ? 'bg-primary-50 dark:bg-primary-950/20 border-primary-500 scale-110 shadow'
                        : 'bg-warm-50 dark:bg-warm-800 border-warm-200 dark:border-warm-700 hover:border-warm-350 dark:hover:border-warm-650'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-warm-750 dark:text-warm-300 mb-3">
                Banner Background Profile Theme
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
              Step 3: Biography & Greetings
            </h3>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-warm-750 dark:text-warm-300 mb-2">
                Greeting Message * (Sent automatically when a chat room is created)
              </label>
              <textarea
                name="greeting"
                value={formData.greeting}
                onChange={handleChange}
                rows={2}
                placeholder="e.g. Hello there! I'm Luna. It's wonderful to meet you. What shall we explore today?"
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
                placeholder="e.g. A calm astronomer who loves mapping stars and discussing philosophy."
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
                rows={4}
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
              Step 4: Personality & Context
            </h3>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-warm-750 dark:text-warm-300 mb-2">
                Core Personality Traits * (Define their traits, emotional layers, and behaviors)
              </label>
              <textarea
                name="personality"
                value={formData.personality}
                onChange={handleChange}
                rows={3}
                placeholder="e.g. Curious, calm, speaks with soft poetic sentences. Loves night skies, dislikes bright artificial lights. Highly intellectual but socially awkward."
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
                placeholder="e.g. Luna and the user are sitting on the roof of the observatory looking at a stellar nebula through a telescope on a quiet summer night."
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
                placeholder="e.g. astronomy, poetic, roleplay, companion"
                className="w-full bg-warm-50 dark:bg-warm-800 border border-warm-200 dark:border-warm-700 rounded-2xl py-3 px-4 text-sm text-warm-900 dark:text-warm-50 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
          </div>
        )}

        {/* Step 5: Conversation Style */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <h3 className="text-lg font-serif font-bold text-warm-900 dark:text-warm-50 border-b border-warm-100 dark:border-warm-800 pb-3">
              Step 5: Conversation Style & Dialogue Examples
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
                placeholder={`User: Do you believe in destiny?\nLuna: Destinies are just stars we trace out of the chaos. We write the lines ourselves.`}
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
                placeholder="e.g. Poetic, speaks in short sentences, uses metaphors."
                className="w-full bg-warm-50 dark:bg-warm-800 border border-warm-200 dark:border-warm-700 rounded-2xl py-3 px-4 text-sm text-warm-900 dark:text-warm-50 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
          </div>
        )}

        {/* Step 6: Knowledge context */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <h3 className="text-lg font-serif font-bold text-warm-900 dark:text-warm-50 border-b border-warm-100 dark:border-warm-800 pb-3">
              Step 6: Lore & Specialist Knowledge
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
                  <div className="w-14 h-14 rounded-2xl bg-warm-100 dark:bg-warm-800 flex items-center justify-center text-3xl border border-warm-200 dark:border-warm-700">
                    {formData.avatarEmoji}
                  </div>
                  <div>
                    <h4 className="font-serif text-lg font-bold text-warm-900 dark:text-warm-50">
                      {formData.name || 'Untitled Character'}
                    </h4>
                    <p className="text-xs text-warm-500">@{formData.username || 'username'}</p>
                  </div>
                </div>
                <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 bg-warm-200 dark:bg-warm-700 text-warm-700 dark:text-warm-300 rounded">
                  {formData.category}
                </span>
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
                By publishing, this NEXA Character will immediately join the WHISPRR digital society according to your visibility settings.
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
