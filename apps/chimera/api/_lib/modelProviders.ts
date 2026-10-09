import { providerFetch, RequestError } from './requestProtection.js';
import type { ChatModel } from '../../src/lib/chatModels.js';

export interface ModelTurn {
  role: 'user' | 'model';
  text: string;
}

export interface ProviderKeys {
  gemini?: string;
  openrouter?: string;
}

export interface ModelCall {
  model: ChatModel;
  systemPrompt: string;
  turns: ModelTurn[];
  maxOutputTokens: number;
  keys: ProviderKeys;
}

/** Keys come from the environment. A model whose provider has no key is reported, never silently swapped. */
export function providerKeys(env: Record<string, string | undefined> = process.env): ProviderKeys {
  return { gemini: env.GEMINI_API_KEY_SERVER || env.GEMINI_API_KEY, openrouter: env.OPENROUTER_API_KEY };
}

export interface GeminiAnswer {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
}

/** True when Google says the model itself is gone (retired, renamed, not supported), not that this request was bad. */
function modelIsGone(status: number, text: string): boolean {
  if (status === 404) return true;
  return (status === 400 || status === 403) && /not found|not supported|no longer|deprecat|retired|decommission/i.test(text);
}

/**
 * Calls Gemini with the first model that Google still serves. Only a "model is gone" answer moves on to
 * the next model; any other failure stops at once. Errors never include the key, the URL or Google's text.
 */
export async function geminiGenerate(key: string, apiModels: string[], body: unknown): Promise<{ data: GeminiAnswer; model: string }> {
  const payload = JSON.stringify(body);
  for (let index = 0; index < apiModels.length; index += 1) {
    const model = apiModels[index];
    const response = await providerFetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
    });
    if (response.ok) return { data: (await response.json()) as GeminiAnswer, model };
    const text = await response.text().catch(() => '');
    if (index < apiModels.length - 1 && modelIsGone(response.status, text)) continue;
    throw new RequestError(502, 'The character provider is temporarily unavailable.');
  }
  throw new RequestError(502, 'The character provider is temporarily unavailable.');
}

/** The text parts of a Gemini answer, joined. Thought summaries are never requested, so every part is reply text. */
export function geminiText(data: unknown): string {
  const parts = (data as GeminiAnswer | null)?.candidates?.[0]?.content?.parts ?? [];
  return parts.map((part) => part.text ?? '').join('');
}

/**
 * Asks the chosen model for the character's next reply and returns the raw text.
 * Provider payloads, URLs and keys never reach the caller's error messages.
 */
export async function generateReply(call: ModelCall): Promise<string> {
  const { model, systemPrompt, turns, maxOutputTokens, keys } = call;
  if (model.provider === 'gemini') {
    if (!keys.gemini) throw new RequestError(503, 'The CHIMERA story engine is not configured yet.');
    const { data } = await geminiGenerate(keys.gemini, [model.id, ...(model.fallbackApiModels ?? [])], {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: turns.map((turn) => ({ role: turn.role, parts: [{ text: turn.text }] })),
      generationConfig: { temperature: 0.9, topP: 0.95, topK: 40, maxOutputTokens },
    });
    return geminiText(data);
  }

  if (!keys.openrouter) throw new RequestError(503, `${model.name} is not available right now. Choose another model in the Model House.`);
  const response = await providerFetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${keys.openrouter}`,
      'X-Title': 'CHIMERA',
    },
    body: JSON.stringify({
      model: model.id,
      messages: [
        { role: 'system', content: systemPrompt },
        ...turns.map((turn) => ({ role: turn.role === 'model' ? 'assistant' : 'user', content: turn.text })),
      ],
      ...(model.noSampling ? {} : { temperature: 0.9, top_p: 0.95 }),
      max_tokens: maxOutputTokens,
    }),
  });
  if (!response.ok) throw new RequestError(502, `${model.name} is temporarily unavailable. Try again, or choose another model in the Model House.`);
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  return typeof content === 'string' ? content : '';
}
