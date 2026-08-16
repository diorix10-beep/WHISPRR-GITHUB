import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, Cpu, Zap, Key, Sliders, CheckCircle2, ShieldCheck, Sparkles, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

interface ModelInfo {
  id: string;
  name: string;
  codename: string;
  provider?: 'gemini' | 'openrouter' | 'deepseek';
  company: string;
  engineName: string;
  description: string;
  strengths: string[];
  context_length: string;
  is_nsfw_allowed: boolean;
  tier: 'free' | 'premium';
  kind?: 'core' | 'seasonal';
  season?: 'summer' | 'winter';
  edition?: string;
  availability?: 'available' | 'coming-soon' | 'returns-in-winter';
  creativePromise?: string;
}

const AVAILABLE_MODELS: ModelInfo[] = [
  {
    id: 'chimera-aurelia-summer-2026',
    name: 'AURELIA',
    codename: '✦ AURELIA',
    company: 'CHIMERA Seasonal Edition',
    engineName: 'Engine announcement soon',
    description: 'A sun-warm storyteller made for vivid chemistry, playful initiative, and scenes that refuse to stand still.',
    strengths: ['Vivid Chemistry', 'Playful Initiative', 'Bright Scenes'],
    context_length: 'To be announced',
    is_nsfw_allowed: false,
    tier: 'premium',
    kind: 'seasonal',
    season: 'summer',
    edition: 'Summer 2026',
    availability: 'coming-soon',
    creativePromise: 'Golden-hour dialogue, quick emotional movement, and adventures with a pulse.'
  },
  {
    id: 'chimera-nivalis-winter-2026',
    name: 'NIVALIS',
    codename: '❄ NIVALIS',
    company: 'CHIMERA Seasonal Edition',
    engineName: 'Returning in winter',
    description: 'A moonlit storyteller for slow-burn tension, intimate mystery, and worlds that remember every snowfall.',
    strengths: ['Slow Burn', 'Atmosphere', 'Emotional Continuity'],
    context_length: 'To be announced',
    is_nsfw_allowed: false,
    tier: 'premium',
    kind: 'seasonal',
    season: 'winter',
    edition: 'Winter 2026',
    availability: 'returns-in-winter',
    creativePromise: 'Quiet tension, poetic scenes, and patient stories that stay with you.'
  },
  {
    id: 'gemini-2.5-flash',
    name: 'SUPERNOVA',
    codename: '✨ SUPERNOVA',
    provider: 'gemini',
    company: 'Google',
    engineName: 'Gemini 2.5 Flash',
    description: 'Blazing fast creative energy with 2M token context. Ideal for swift roleplay and dynamic conversation.',
    strengths: ['Speed', 'Creative Writing', '2M Context'],
    context_length: '2M tokens',
    is_nsfw_allowed: false,
    tier: 'free'
  },
  {
    id: 'deepseek/deepseek-v3',
    name: 'PULSAR',
    codename: '⚡ PULSAR',
    provider: 'deepseek',
    company: 'DeepSeek',
    engineName: 'DeepSeek-V3',
    description: 'Lightning-fast open architecture model offering highly responsive dialogue and multi-turn persona consistency.',
    strengths: ['Ultra Fast', 'High Precision', 'Fluid Prose'],
    context_length: '64K tokens',
    is_nsfw_allowed: true,
    tier: 'free'
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'ECLIPSE',
    codename: '🌓 ECLIPSE',
    provider: 'openrouter',
    company: 'Anthropic',
    engineName: 'Claude 3.5 Sonnet',
    description: 'Deep emotional shadow & light storytelling. The gold standard for character voice and narrative nuance.',
    strengths: ['Emotional Depth', 'Nuance', 'Formatting'],
    context_length: '200K tokens',
    is_nsfw_allowed: true,
    tier: 'premium'
  },
  {
    id: 'gemini-1.5-pro',
    name: 'HELIOS',
    codename: '☀️ HELIOS',
    provider: 'gemini',
    company: 'Google',
    engineName: 'Gemini 1.5 Pro',
    description: 'Immense analytical power and massive lore memory context. Perfect for complex multi-chapter web novels.',
    strengths: ['2M Context', 'Complex Lore', 'Analytical Depth'],
    context_length: '2M tokens',
    is_nsfw_allowed: false,
    tier: 'premium'
  },
  {
    id: 'deepseek/deepseek-r1',
    name: 'SINGULARITY',
    codename: '🕳️ SINGULARITY',
    provider: 'deepseek',
    company: 'DeepSeek',
    engineName: 'DeepSeek-R1',
    description: 'Infinite chain-of-thought depth with advanced reasoning and complex multi-layered plot planning.',
    strengths: ['Deep Reasoning', 'Complex Plots', 'Unconstrained'],
    context_length: '128K tokens',
    is_nsfw_allowed: true,
    tier: 'premium'
  },
  {
    id: 'meta-llama/llama-3-70b-instruct',
    name: 'NEBULA',
    codename: '💫 NEBULA',
    provider: 'openrouter',
    company: 'Meta',
    engineName: 'Llama 3 (70B)',
    description: 'Expansive, open-ended universe building. Fully uncensored for intense and raw roleplay scenarios.',
    strengths: ['Uncensored', 'Directness', 'World-building'],
    context_length: '8K tokens',
    is_nsfw_allowed: true,
    tier: 'premium'
  },
  {
    id: 'nousresearch/hermes-3-llama-3.1-405b',
    name: 'HERMES',
    codename: '📜 HERMES',
    provider: 'openrouter',
    company: 'Nous Research',
    engineName: 'Hermes 3 (405B)',
    description: 'Colossal 405-billion parameter model fine-tuned for deep roleplay fidelity, complex personas, and uncensored freedom.',
    strengths: ['405B Parameters', 'Uncensored', 'Persona Fidelity'],
    context_length: '128K tokens',
    is_nsfw_allowed: true,
    tier: 'premium'
  },
  {
    id: 'openai/gpt-4o',
    name: 'COSMOS',
    codename: '🌐 COSMOS',
    provider: 'openrouter',
    company: 'OpenAI',
    engineName: 'GPT-4o',
    description: 'Universal knowledge base with high structural logic, consistency, and precise scene mechanics.',
    strengths: ['Logic', 'Consistency', 'World Knowledge'],
    context_length: '128K tokens',
    is_nsfw_allowed: false,
    tier: 'premium'
  },
  {
    id: 'mistralai/mistral-large-2407',
    name: 'QUANTUM',
    codename: '🔮 QUANTUM',
    provider: 'openrouter',
    company: 'Mistral AI',
    engineName: 'Mistral Large 2',
    description: 'European flagship model with multi-lingual prose mastery and sophisticated worldbuilding mechanics.',
    strengths: ['Multi-lingual', 'Poetic Prose', 'High Precision'],
    context_length: '128K tokens',
    is_nsfw_allowed: true,
    tier: 'premium'
  }
];

export default function ModelsPage() {
  const { user, chimeraPreferences, updateChimeraPreferences } = useAuth();
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
    if (chimeraPreferences?.default_ai_model) {
      setSelectedModel(chimeraPreferences.default_ai_model);
    } else if (savedModel) {
      setSelectedModel(savedModel);
    }

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
  }, [chimeraPreferences?.default_ai_model]);

  const handleSelectModel = async (modelId: string) => {
    const model = AVAILABLE_MODELS.find((candidate) => candidate.id === modelId);
    if (!model || model.availability === 'coming-soon' || model.availability === 'returns-in-winter') {
      showToast(`${model?.name ?? 'This edition'} is not available to power chats yet.`, 'info');
      return;
    }

    setSelectedModel(modelId);
    setSaving(true);
    setSaveSuccess(false);
    
    localStorage.setItem('chimera_default_model', modelId);

    if (user) {
      try {
        await updateChimeraPreferences({ default_ai_model: modelId });
      } catch {
        setSaving(false);
        showToast('The model was selected locally, but CHIMERA could not save it to your account.', 'error');
        return;
      }
    }

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
          The CHIMERA Model House
        </h1>
        <p className="text-warm-600 dark:text-warm-400 text-base sm:text-lg max-w-3xl">
          Choose the creative voice behind your stories. Every CHIMERA model is selected for a distinct way of moving through a scene; technical engine details stay in the background.
        </p>
      </div>

      {saveSuccess && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-green-500/10 border border-green-500/50 rounded-xl text-green-700 dark:text-green-400 flex items-center gap-2 font-medium"
        >
          <CheckCircle2 size={20} />
          Your default CHIMERA model has been chosen.
        </motion.div>
      )}

      {/* Seasonal editions */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-4">
          <div>
            <h2 className="text-xl font-bold text-warm-900 dark:text-white flex items-center gap-2">
              <Sparkles className="text-amber-500" size={20} />
              Seasonal Editions
            </h2>
            <p className="text-sm text-warm-600 dark:text-warm-400 mt-1">
              A returning CHIMERA tradition — limited creative voices, made to feel like a new season has entered the story.
            </p>
          </div>
          <span className="text-xs font-semibold tracking-[0.14em] uppercase text-amber-600 dark:text-amber-400">The year begins here</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {AVAILABLE_MODELS.filter((model) => model.kind === 'seasonal').map((model) => {
            const isAvailable = model.availability === 'available';
            return (
              <button
                key={model.id}
                type="button"
                onClick={() => handleSelectModel(model.id)}
                className={`relative text-left p-6 rounded-2xl border transition-all ${
                  isAvailable
                    ? 'border-amber-500/50 bg-gradient-to-br from-amber-500/10 via-warm-900 to-purple-950/30 hover:border-amber-400 cursor-pointer'
                    : 'border-amber-500/25 bg-gradient-to-br from-amber-500/5 via-warm-900 to-purple-950/20 cursor-not-allowed opacity-90'
                }`}
                aria-label={`${model.name}, ${model.availability === 'returns-in-winter' ? 'returning in winter' : 'coming soon'}`}
              >
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div>
                    <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-amber-600 dark:text-amber-300">{model.edition}</p>
                    <h3 className="font-serif text-2xl font-bold text-warm-900 dark:text-white mt-1">{model.codename}</h3>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300">
                    {model.availability === 'returns-in-winter' ? 'RETURNS IN WINTER' : 'COMING SOON'}
                  </span>
                </div>
                <p className="text-sm text-warm-600 dark:text-warm-300 leading-relaxed">{model.description}</p>
                <p className="mt-4 pt-4 border-t border-amber-500/15 text-sm font-medium italic text-amber-800 dark:text-amber-200">{model.creativePromise}</p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {model.strengths.map((strength) => (
                    <span key={strength} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-warm-100/80 dark:bg-warm-800/80 text-warm-700 dark:text-warm-200">{strength}</span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Current guiding voice */}
      <section className="relative overflow-hidden rounded-3xl border border-red-500/30 bg-gradient-to-br from-red-950/30 via-warm-900 to-purple-950/30 p-6 sm:p-8 shadow-xl">
        <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-amber-400/10 blur-3xl" />
        {(() => {
          const guidingModel = AVAILABLE_MODELS.find((model) => model.id === selectedModel) ?? AVAILABLE_MODELS[2];
          return (
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-red-300">Currently guiding your stories</p>
                <h2 className="mt-2 font-serif text-3xl font-bold text-white">{guidingModel.codename}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-warm-300">{guidingModel.description}</p>
              </div>
              <div className="shrink-0 rounded-2xl border border-amber-400/30 bg-black/20 px-5 py-4 text-sm text-amber-100">
                <p className="font-semibold">{user ? 'Saved to your CHIMERA account' : 'Saved on this device'}</p>
                <p className="mt-1 text-xs text-warm-400">{guidingModel.engineName}</p>
              </div>
            </div>
          );
        })()}
      </section>

      {/* Core model selection grid */}
      <div>
        <h2 className="text-xl font-bold text-warm-900 dark:text-white mb-4 flex items-center gap-2">
          <Cpu className="text-red-500" size={20} />
          The Core Constellation
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {AVAILABLE_MODELS.filter((model) => model.kind !== 'seasonal').map((model) => (
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
                  <h3 className="font-serif text-xl font-bold text-warm-900 dark:text-white flex items-center gap-2">
                    {model.codename}
                  </h3>
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium tracking-wide mt-0.5">CHIMERA core voice</p>
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
              <details className="mt-3 text-xs text-warm-500 dark:text-warm-400">
                <summary className="cursor-pointer hover:text-warm-700 dark:hover:text-warm-200">Engine details</summary>
                <p className="mt-2 leading-relaxed">Powered by {model.company} · {model.engineName}</p>
              </details>
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
