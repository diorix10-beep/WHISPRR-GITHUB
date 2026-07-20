import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, Cpu, Zap, Lock, Database, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface ModelInfo {
  id: string;
  name: string;
  provider: 'gemini' | 'openrouter';
  company: string;
  description: string;
  strengths: string[];
  context_length: string;
  is_nsfw_allowed: boolean;
  tier: 'free' | 'premium';
}

const AVAILABLE_MODELS: ModelInfo[] = [
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'gemini',
    company: 'Google',
    description: 'Blazing fast, highly capable model. Great for most roleplay and general conversation.',
    strengths: ['Speed', 'Creative Writing', 'Reasoning'],
    context_length: '2M tokens',
    is_nsfw_allowed: false,
    tier: 'free'
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'openrouter',
    company: 'Anthropic',
    description: 'The industry leader in nuanced roleplay, character voice, and complex storytelling.',
    strengths: ['Emotional Intelligence', 'Nuance', 'Formatting'],
    context_length: '200K tokens',
    is_nsfw_allowed: true,
    tier: 'premium'
  },
  {
    id: 'meta-llama/llama-3-70b-instruct',
    name: 'Llama 3 (70B)',
    provider: 'openrouter',
    company: 'Meta',
    description: 'A massive open-source model. Fully uncensored and great for intense, unrestricted narratives.',
    strengths: ['Uncensored', 'Directness', 'World-building'],
    context_length: '8K tokens',
    is_nsfw_allowed: true,
    tier: 'premium'
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    provider: 'openrouter',
    company: 'OpenAI',
    description: 'Powerful, intelligent, and highly logical. Good for complex scenarios and factual worldbuilding.',
    strengths: ['Logic', 'Consistency', 'World-building'],
    context_length: '128K tokens',
    is_nsfw_allowed: false,
    tier: 'premium'
  }
];

export default function ModelsPage() {
  const { user } = useAuth();
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-flash');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    // Attempt to load from localStorage first for immediate feedback
    const saved = localStorage.getItem('chimera_default_model');
    if (saved) setSelectedModel(saved);
  }, []);

  const handleSelectModel = async (modelId: string) => {
    setSelectedModel(modelId);
    setSaving(true);
    setSaveSuccess(false);
    
    // Save locally
    localStorage.setItem('chimera_default_model', modelId);

    // If user is logged in, you could also save this to a user_preferences table
    // For now, we simulate a network request
    setTimeout(() => {
      setSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 600);
  };

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="mb-10">
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-warm-900 dark:text-warm-50 mb-4 flex items-center gap-4">
          <Brain className="text-red-600 w-10 h-10" />
          AI Brain Configuration
        </h1>
        <p className="text-warm-500 dark:text-warm-400 text-lg max-w-3xl">
          Choose the "brain" that powers your characters. Different AI models have unique personalities, strengths, and restriction levels. 
          Your selected model will be used as the default for your chats.
        </p>
      </div>

      {saveSuccess && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-4 bg-green-500/10 border border-green-500/50 rounded-xl text-green-700 dark:text-green-400 flex items-center gap-2 font-medium"
        >
          <CheckCircle2 size={20} />
          Default AI model successfully updated.
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {AVAILABLE_MODELS.map((model) => (
          <div 
            key={model.id}
            onClick={() => handleSelectModel(model.id)}
            className={`relative p-6 rounded-2xl border-2 transition-all cursor-pointer group ${
              selectedModel === model.id 
                ? 'border-red-600 bg-red-50 dark:bg-red-900/10 shadow-lg shadow-red-600/5' 
                : 'border-warm-200 dark:border-warm-800 bg-white dark:bg-warm-900 hover:border-red-300 dark:hover:border-red-800/50 hover:shadow-md'
            }`}
          >
            {/* Tier Badge */}
            <div className="absolute top-4 right-4">
              {model.tier === 'premium' ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  PREMIUM
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                  FREE
                </span>
              )}
            </div>

            <div className="flex items-start gap-4 mb-4">
              <div className={`p-3 rounded-xl ${selectedModel === model.id ? 'bg-red-600 text-white' : 'bg-warm-100 dark:bg-warm-800 text-warm-600 dark:text-warm-300'}`}>
                {model.provider === 'gemini' ? <Zap size={24} /> : <Cpu size={24} />}
              </div>
              <div>
                <h3 className="font-serif text-xl font-bold text-warm-900 dark:text-white">
                  {model.name}
                </h3>
                <p className="text-sm font-medium text-warm-500 dark:text-warm-400 uppercase tracking-wider">
                  by {model.company}
                </p>
              </div>
            </div>

            <p className="text-warm-600 dark:text-warm-300 text-sm mb-6 min-h-[40px]">
              {model.description}
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-medium">
                <Database size={14} className="text-warm-400" />
                <span className="text-warm-700 dark:text-warm-200">Memory Context:</span>
                <span className="text-warm-500 bg-warm-100 dark:bg-warm-800 px-2 py-0.5 rounded">{model.context_length}</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium">
                <Lock size={14} className="text-warm-400" />
                <span className="text-warm-700 dark:text-warm-200">Content Restrictions:</span>
                <span className={`px-2 py-0.5 rounded ${model.is_nsfw_allowed ? 'text-red-700 bg-red-100 dark:bg-red-900/30' : 'text-blue-700 bg-blue-100 dark:bg-blue-900/30'}`}>
                  {model.is_nsfw_allowed ? 'Uncensored (NSFW Allowed)' : 'Strict (SFW Only)'}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-warm-100 dark:border-warm-800 flex flex-wrap gap-2">
              {model.strengths.map(strength => (
                <span key={strength} className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-warm-100 dark:bg-warm-800 text-warm-600 dark:text-warm-400 border border-warm-200 dark:border-warm-700">
                  {strength}
                </span>
              ))}
            </div>

            {selectedModel === model.id && (
              <div className="absolute -left-[1px] top-1/2 -translate-y-1/2 w-1.5 h-12 bg-red-600 rounded-r-full" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
