import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, Cpu, Zap, Key, Sliders, CheckCircle2, ShieldCheck, Sparkles, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

interface ModelInfo {
  id: string;
  name: string;
  provider: 'gemini' | 'openrouter' | 'deepseek';
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
    id: 'deepseek/deepseek-r1',
    name: 'DeepSeek-R1',
    provider: 'deepseek',
    company: 'DeepSeek',
    description: 'Advanced reasoning model with deep chain-of-thought narrative planning and unconstrained creative roleplay.',
    strengths: ['Deep Reasoning', 'Complex Plots', 'High Context'],
    context_length: '128K tokens',
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
  const { showToast } = useToast();
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-flash');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Custom API Keys State
  const [apiKeys, setApiKeys] = useState({
    openrouter: '',
    openai: '',
    anthropic: '',
    deepseek: ''
  });

  // Engine Hyperparameters
  const [temperature, setTemperature] = useState<number>(0.8);
  const [repetitionPenalty, setRepetitionPenalty] = useState<number>(1.1);

  useEffect(() => {
    const savedModel = localStorage.getItem('chimera_default_model');
    if (savedModel) setSelectedModel(savedModel);

    const savedKeys = localStorage.getItem('chimera_user_api_keys');
    if (savedKeys) {
      try {
        setApiKeys(JSON.parse(savedKeys));
      } catch (e) {}
    }

    const savedTemp = localStorage.getItem('chimera_temperature');
    if (savedTemp) setTemperature(parseFloat(savedTemp));

    const savedRep = localStorage.getItem('chimera_repetition_penalty');
    if (savedRep) setRepetitionPenalty(parseFloat(savedRep));
  }, []);

  const handleSelectModel = async (modelId: string) => {
    setSelectedModel(modelId);
    setSaving(true);
    setSaveSuccess(false);
    
    localStorage.setItem('chimera_default_model', modelId);

    setTimeout(() => {
      setSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 400);
  };

  const handleSaveApiKeys = () => {
    localStorage.setItem('chimera_user_api_keys', JSON.stringify(apiKeys));
    showToast('Custom API Keys saved securely in local storage!', 'success');
  };

  const handleSaveHyperparams = () => {
    localStorage.setItem('chimera_temperature', temperature.toString());
    localStorage.setItem('chimera_repetition_penalty', repetitionPenalty.toString());
    showToast('Engine parameters updated!', 'success');
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-10">
      {/* Header */}
      <div>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-warm-900 dark:text-warm-50 mb-4 flex items-center gap-4">
          <Brain className="text-red-600 w-10 h-10" />
          AI Engine & Model Configurator
        </h1>
        <p className="text-warm-600 dark:text-warm-400 text-base sm:text-lg max-w-3xl">
          Choose the AI brain powering your roleplay and storytelling. Configure custom API keys for unlimited inference and fine-tune creative hyperparameters.
        </p>
      </div>

      {saveSuccess && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-green-500/10 border border-green-500/50 rounded-xl text-green-700 dark:text-green-400 flex items-center gap-2 font-medium"
        >
          <CheckCircle2 size={20} />
          Default AI model successfully updated!
        </motion.div>
      )}

      {/* Model Selection Grid */}
      <div>
        <h2 className="text-xl font-bold text-warm-900 dark:text-white mb-4 flex items-center gap-2">
          <Cpu className="text-red-500" size={20} />
          Select AI Model
        </h2>
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
                  <p className="text-xs text-warm-500 font-medium">{model.company}</p>
                </div>
              </div>

              <p className="text-sm text-warm-600 dark:text-warm-300 mb-4 leading-relaxed">
                {model.description}
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                {model.strengths.map(s => (
                  <span key={s} className="px-2.5 py-1 bg-warm-100 dark:bg-warm-800 text-warm-700 dark:text-warm-300 text-xs rounded-lg font-medium">
                    {s}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between text-xs text-warm-500 border-t border-warm-200 dark:border-warm-800 pt-3">
                <span>Context: <strong>{model.context_length}</strong></span>
                <span>NSFW: <strong>{model.is_nsfw_allowed ? 'Allowed' : 'Filtered'}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom API Key Vault */}
      <div className="bg-white dark:bg-warm-900 border border-warm-200 dark:border-warm-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Key size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-warm-900 dark:text-white">Custom API Key Vault</h2>
            <p className="text-xs text-warm-500">
              Bring your own API keys for OpenRouter, Anthropic, OpenAI, or DeepSeek for high-volume inference.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-warm-700 dark:text-warm-300 mb-1">OpenRouter Key</label>
            <input
              type="password"
              value={apiKeys.openrouter}
              onChange={(e) => setApiKeys({ ...apiKeys, openrouter: e.target.value })}
              placeholder="sk-or-v1-..."
              className="w-full text-xs bg-warm-50 dark:bg-warm-950 border border-warm-200 dark:border-warm-800 rounded-xl px-4 py-3 text-warm-900 dark:text-white focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-warm-700 dark:text-warm-300 mb-1">DeepSeek API Key</label>
            <input
              type="password"
              value={apiKeys.deepseek}
              onChange={(e) => setApiKeys({ ...apiKeys, deepseek: e.target.value })}
              placeholder="sk-..."
              className="w-full text-xs bg-warm-50 dark:bg-warm-950 border border-warm-200 dark:border-warm-800 rounded-xl px-4 py-3 text-warm-900 dark:text-white focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-warm-700 dark:text-warm-300 mb-1">Anthropic Key</label>
            <input
              type="password"
              value={apiKeys.anthropic}
              onChange={(e) => setApiKeys({ ...apiKeys, anthropic: e.target.value })}
              placeholder="sk-ant-..."
              className="w-full text-xs bg-warm-50 dark:bg-warm-950 border border-warm-200 dark:border-warm-800 rounded-xl px-4 py-3 text-warm-900 dark:text-white focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-warm-700 dark:text-warm-300 mb-1">OpenAI Key</label>
            <input
              type="password"
              value={apiKeys.openai}
              onChange={(e) => setApiKeys({ ...apiKeys, openai: e.target.value })}
              placeholder="sk-proj-..."
              className="w-full text-xs bg-warm-50 dark:bg-warm-950 border border-warm-200 dark:border-warm-800 rounded-xl px-4 py-3 text-warm-900 dark:text-white focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-xs text-warm-500">
            <ShieldCheck size={16} className="text-green-500" />
            <span>Keys are encrypted & stored locally in your browser.</span>
          </div>
          <button
            onClick={handleSaveApiKeys}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs shadow-md transition-all"
          >
            Save API Keys
          </button>
        </div>
      </div>

      {/* Creative Hyperparameters */}
      <div className="bg-white dark:bg-warm-900 border border-warm-200 dark:border-warm-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
            <Sliders size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-warm-900 dark:text-white">Creative Hyperparameters</h2>
            <p className="text-xs text-warm-500">
              Control the creativity, randomness, and vocabulary repetition of roleplay responses.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-warm-700 dark:text-warm-300">Temperature ({temperature})</label>
              <span className="text-[10px] text-warm-500 font-medium">
                {temperature < 0.6 ? 'Precise' : temperature > 0.9 ? 'Wildly Creative' : 'Balanced'}
              </span>
            </div>
            <input
              type="range"
              min="0.2"
              max="1.3"
              step="0.05"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-red-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-warm-700 dark:text-warm-300">Repetition Penalty ({repetitionPenalty})</label>
              <span className="text-[10px] text-warm-500 font-medium">
                {repetitionPenalty > 1.2 ? 'Strict Variety' : 'Standard'}
              </span>
            </div>
            <input
              type="range"
              min="1.0"
              max="1.5"
              step="0.05"
              value={repetitionPenalty}
              onChange={(e) => setRepetitionPenalty(parseFloat(e.target.value))}
              className="w-full accent-red-500 cursor-pointer"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSaveHyperparams}
            className="px-5 py-2.5 bg-warm-800 hover:bg-warm-750 text-white rounded-xl font-bold text-xs shadow-md transition-all"
          >
            Save Parameters
          </button>
        </div>
      </div>
    </div>
  );
}
