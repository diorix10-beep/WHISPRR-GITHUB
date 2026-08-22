export interface ChimeraModelInfo {
  id: string;
  name: string;
  codename: string;
  provider?: 'gemini' | 'openrouter' | 'deepseek';
  company: string;
  engineName: string;
  description: string;
  strengths: string[];
  bestFor: string;
  consideration: string;
  context_length: string;
  is_nsfw_allowed: boolean;
  tier: 'free' | 'premium';
  kind?: 'core' | 'seasonal';
  season?: 'summer' | 'winter';
  edition?: string;
  availability?: 'available' | 'coming-soon' | 'returns-in-winter';
  creativePromise?: string;
}

export const AVAILABLE_MODELS: ChimeraModelInfo[] = [
  {
    id: 'chimera-aurelia-summer-2026',
    name: 'AURELIA',
    codename: '✦ AURELIA',
    company: 'CHIMERA Seasonal Edition',
    engineName: 'Engine announcement soon',
    description: 'A sun-warm storyteller made for vivid chemistry, playful initiative, and scenes that refuse to stand still.',
    strengths: ['Vivid Chemistry', 'Playful Initiative', 'Bright Scenes'],
    bestFor: 'Fast-moving adventures and luminous banter',
    consideration: 'This edition is still being prepared and cannot guide chats yet.',
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
    bestFor: 'Patient mysteries and intimate long-form scenes',
    consideration: 'This edition returns with the winter collection and cannot guide chats yet.',
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
    bestFor: 'Swift roleplay, spontaneous turns, and lively dialogue',
    consideration: 'Favors momentum over the most intricate prose on every reply.',
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
    bestFor: 'Responsive exchanges and clear, direct scene progression',
    consideration: 'Its voice can feel more direct than lyrical for slow, atmospheric scenes.',
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
    bestFor: 'Layered character voices and emotionally detailed scenes',
    consideration: 'May take a more deliberate pace for complex responses.',
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
    bestFor: 'Dense lore, sprawling worlds, and multi-chapter planning',
    consideration: 'Best when you want careful continuity more than quick-fire exchanges.',
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
    bestFor: 'Interlocking plots and difficult story decisions',
    consideration: 'Can be more contemplative than conversational in a fast scene.',
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
    bestFor: 'Open-ended worldbuilding and decisive scene direction',
    consideration: 'Its direct style may need more guidance for subtle, poetic scenes.',
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
    bestFor: 'Distinct personas and deeply committed character roleplay',
    consideration: 'A strong character voice can need firmer scene direction from you.',
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
    bestFor: 'Structured stories, consistent mechanics, and clear world rules',
    consideration: 'Can favor clarity and structure over a more experimental voice.',
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
    bestFor: 'Poetic prose, multilingual scenes, and textured worldbuilding',
    consideration: 'Its more literary voice may feel less immediate in rapid back-and-forth.',
    context_length: '128K tokens',
    is_nsfw_allowed: true,
    tier: 'premium'
  }
];

export const AVAILABLE_CHAT_MODELS = AVAILABLE_MODELS.filter(
  (model) => model.availability !== 'coming-soon' && model.availability !== 'returns-in-winter'
);

export const DEFAULT_CHIMERA_MODEL_ID = 'gemini-2.5-flash';

export function getChimeraModel(modelId?: string | null): ChimeraModelInfo {
  return AVAILABLE_MODELS.find((model) => model.id === modelId) ?? AVAILABLE_MODELS.find((model) => model.id === DEFAULT_CHIMERA_MODEL_ID)!;
}
