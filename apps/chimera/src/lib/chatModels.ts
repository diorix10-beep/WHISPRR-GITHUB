/**
 * The Model House: the AI models a member can choose for their roleplay.
 *
 * Shared by the chat route (`api/ai-chat.ts`, which only ever uses a model from this list) and the
 * Model House page. Pure data and pure functions, no network.
 *
 * To offer a new model: add an entry here, make sure the provider key is set (OPENROUTER_API_KEY for
 * `openrouter`), and set its `status` to `available`. Rules that are enforced on the server, not here:
 *   - a `shards` model is only usable with a `shardsCost` (a whole number of SHARDS per reply, charged by the
 *     server before the model is called and refunded if no reply is delivered); without one it stays unusable;
 *   - an `uncensored` model is only ever used in a scene the member is verified and opted in for.
 */

export type ModelProvider = 'gemini' | 'openrouter';

export interface ChatModel {
  /** Stored in the member's preferences. For OpenRouter this is the provider's own model id. */
  id: string;
  /** Older ids members may still have saved. They resolve to this model; new saves use `id`. */
  aliases?: string[];
  /**
   * Gemini only: models to try, in order, if Google no longer serves `id` (a retired or renamed model
   * answers "not found"). Keeps replies flowing while a catalog entry is being updated.
   */
  fallbackApiModels?: string[];
  /** Extra output tokens on top of the reply length, for models that think before they answer. */
  thinkingHeadroom?: number;
  /** The model does not accept temperature / top_p (some Claude and GPT models). They are left out of the request. */
  noSampling?: boolean;
  /** The brand name members see. */
  name: string;
  provider: ModelProvider;
  /** Who makes the engine, for transparency. */
  company: string;
  engineName: string;
  description: string;
  strengths: string[];
  bestFor: string;
  consideration: string;
  tier: 'free' | 'shards';
  /** SHARDS taken for each reply (including a regeneration) from a `shards` model. Required for it to be usable. */
  shardsCost?: number;
  /** `soon` models are shown but cannot be chosen or used. */
  status: 'available' | 'soon';
  /** Largest reply the model is asked for. */
  maxOutputTokens?: number;
  /** Reasoning effort asked of the provider (OpenRouter). Roleplay wants a quick reply, not a long hidden chain of thought. */
  reasoningEffort?: 'none' | 'low';
  /** Visible and usable only to members listed in `chimera_model_testers`, so a model can be tried for real before everyone sees it. */
  testersOnly?: boolean;
  /** A model without its own safety training. Only usable in a verified adult scene. None exist yet. */
  uncensored?: boolean;
}

export const DEFAULT_MODEL_ID = 'gemini-3.1-flash-lite';

export const CHAT_MODELS: ChatModel[] = [
  {
    // Gemini 2.5 Flash is retired by Google on 2026-10-20. Members who saved it keep SUPERNOVA (alias).
    id: 'gemini-3.1-flash-lite',
    aliases: ['gemini-2.5-flash'],
    fallbackApiModels: ['gemini-2.5-flash'],
    thinkingHeadroom: 2048,
    name: 'SUPERNOVA',
    provider: 'gemini',
    company: 'Google',
    engineName: 'Gemini 3.1 Flash Lite',
    description: 'Fast, lively and consistent. The everyday engine for roleplay and quick back-and-forth.',
    strengths: ['Speed', 'Lively dialogue', 'Long memory'],
    bestFor: 'Swift roleplay, spontaneous turns and dynamic conversation',
    consideration: 'Favors momentum over the most intricate prose on every reply.',
    tier: 'free',
    status: 'available',
  },
  // Paid models, in testing: `testersOnly` keeps them hidden from everyone but the members listed in
  // `chimera_model_testers` until they have been tried for real. Prices (SHARDS per reply) are about twice the
  // provider's cost for a typical reply (10k tokens in, ~1.5k out including a little reasoning) at the best pack price.
  {
    id: 'deepseek/deepseek-v4.1-flash',
    name: 'PULSAR',
    provider: 'openrouter',
    company: 'DeepSeek',
    engineName: 'DeepSeek V4.1 Flash',
    description: 'An economical engine for long scenes where you want many turns for few SHARDS.',
    strengths: ['Low price', 'Very long memory window'],
    bestFor: 'Long back-and-forth scenes on a small budget',
    consideration: 'New to CHIMERA: its writing style has not been tuned for our characters yet.',
    tier: 'shards',
    shardsCost: 3,
    status: 'available',
    testersOnly: true,
    reasoningEffort: 'low',
    thinkingHeadroom: 1024,
  },
  {
    id: 'mistralai/mistral-large-4-0',
    name: 'QUANTUM',
    provider: 'openrouter',
    company: 'Mistral AI',
    engineName: 'Mistral Large 4',
    description: 'A large general-purpose engine from Mistral, run without extra deliberation so replies come quickly.',
    strengths: ['Large model', 'Very long memory window', 'Direct replies'],
    bestFor: 'Everyday roleplay with a larger model than the free engine',
    consideration: 'New to CHIMERA: its writing style has not been tuned for our characters yet.',
    tier: 'shards',
    shardsCost: 5,
    status: 'available',
    testersOnly: true,
    reasoningEffort: 'none',
  },
  {
    id: 'google/gemini-3.8-flash',
    name: 'HELIOS',
    provider: 'openrouter',
    company: 'Google',
    engineName: 'Gemini 3.8 Flash',
    description: 'Google’s newer and larger Flash engine, for scenes with many threads to keep straight.',
    strengths: ['Newer Gemini engine', 'Very long memory window', 'Multi-step reasoning'],
    bestFor: 'Complex scenes with several characters and plot threads',
    consideration: 'It always thinks a little before answering, so replies can take a moment longer.',
    tier: 'shards',
    shardsCost: 7,
    status: 'available',
    testersOnly: true,
    reasoningEffort: 'low',
    thinkingHeadroom: 1536,
  },
  {
    id: 'anthropic/claude-sonnet-5.5',
    name: 'ECLIPSE',
    provider: 'openrouter',
    company: 'Anthropic',
    engineName: 'Claude Sonnet 5.5',
    description: 'The premium engine and the most expensive choice: the strongest model on offer.',
    strengths: ['Premium engine', 'Very long memory window'],
    bestFor: 'Scenes you want to be at their best, when SHARDS are not a concern',
    consideration: 'It follows its own content rules, so it may decline some dark themes. It always thinks before answering.',
    tier: 'shards',
    shardsCost: 18,
    status: 'available',
    testersOnly: true,
    noSampling: true,
    reasoningEffort: 'low',
    thinkingHeadroom: 1536,
  },
  {
    id: 'chimera-aurelia-summer-2026',
    name: 'AURELIA',
    provider: 'openrouter',
    company: 'CHIMERA Seasonal Edition',
    engineName: 'Engine announcement soon',
    description: 'A sun-warm storyteller made for vivid chemistry, playful initiative and scenes that refuse to stand still.',
    strengths: ['Vivid chemistry', 'Playful initiative', 'Bright scenes'],
    bestFor: 'Fast-moving adventures and luminous banter',
    consideration: 'This edition is still being prepared and cannot guide chats yet.',
    tier: 'shards',
    status: 'soon',
  },
  {
    id: 'chimera-nivalis-winter-2026',
    name: 'NIVALIS',
    provider: 'openrouter',
    company: 'CHIMERA Seasonal Edition',
    engineName: 'Returning in winter',
    description: 'A moonlit storyteller for slow-burn tension, intimate mystery and worlds that remember every snowfall.',
    strengths: ['Slow burn', 'Atmosphere', 'Emotional continuity'],
    bestFor: 'Patient mysteries and intimate long-form scenes',
    consideration: 'This edition returns with the winter collection and cannot guide chats yet.',
    tier: 'shards',
    status: 'soon',
  },
];

export function findModel(id: string | null | undefined, catalog: ChatModel[] = CHAT_MODELS): ChatModel | null {
  if (!id) return null;
  return catalog.find((model) => model.id === id || model.aliases?.includes(id)) ?? null;
}

/** The Gemini models to try for the default engine's background jobs (memory, turning points), best first. */
export function defaultGeminiModels(catalog: ChatModel[] = CHAT_MODELS): string[] {
  const model = findModel(DEFAULT_MODEL_ID, catalog);
  return model ? [model.id, ...(model.fallbackApiModels ?? [])] : [DEFAULT_MODEL_ID];
}

/** The SHARDS a reply from this model costs: 0 for a free model, a positive whole number for a paid one. */
export function replyCost(model: ChatModel): number {
  return model.tier === 'shards' ? (model.shardsCost ?? 0) : 0;
}

/**
 * What a member can use. A paid model needs a valid price, so a model can never be used for free just
 * because it is listed or because its price was forgotten.
 */
export function isUsable(model: ChatModel | null, tester = false): model is ChatModel {
  if (!model || model.status !== 'available') return false;
  if (model.testersOnly && !tester) return false;
  if (model.tier === 'free') return true;
  return Number.isInteger(model.shardsCost) && (model.shardsCost ?? 0) > 0 && (model.shardsCost ?? 0) <= 10_000;
}

export function usableModels(catalog: ChatModel[] = CHAT_MODELS, tester = false): ChatModel[] {
  return catalog.filter((model) => isUsable(model, tester));
}

export interface ModelChoice {
  /** The member's own default (their Model House choice). */
  member?: string | null;
  /** The character creator's recommended model. */
  character?: string | null;
}

/**
 * Picks the model for a reply: the member's choice, then the character's (free models only), then the default. A model
 * that is unknown, not usable, or uncensored outside an adult scene is skipped, never used.
 */
export function resolveModel(choice: ModelChoice, scene: { adultVerified: boolean; tester?: boolean }, catalog: ChatModel[] = CHAT_MODELS): ChatModel {
  const allowed = (model: ChatModel | null): model is ChatModel => isUsable(model, scene.tester === true) && (!model.uncensored || scene.adultVerified);
  const own = findModel(choice.member, catalog);
  if (allowed(own)) return own;
  // A creator's recommendation can never spend the player's SHARDS: only the player's own choice can.
  const recommended = findModel(choice.character, catalog);
  if (allowed(recommended) && recommended.tier === 'free') return recommended;
  const fallback = findModel(DEFAULT_MODEL_ID, catalog);
  if (!fallback) throw new Error('The default model is missing from the catalog.');
  return fallback;
}
