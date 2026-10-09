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

/**
 * Asks the chosen model for the character's next reply and returns the raw text.
 * Provider payloads, URLs and keys never reach the caller's error messages.
 */
export async function generateReply(call: ModelCall): Promise<string> {
  const { model, systemPrompt, turns, maxOutputTokens, keys } = call;
  if (model.provider === 'gemini') {
    if (!keys.gemini) throw new RequestError(503, 'The CHIMERA story engine is not configured yet.');
    const response = await providerFetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model.id}:generateContent?key=${keys.gemini}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: turns.map((turn) => ({ role: turn.role, parts: [{ text: turn.text }] })),
          generationConfig: { temperature: 0.9, topP: 0.95, topK: 40, maxOutputTokens },
        }),
      },
    );
    if (!response.ok) throw new RequestError(502, 'The character provider is temporarily unavailable.');
    const data = await response.json();
    const parts: Array<{ text?: string }> = data.candidates?.[0]?.content?.parts ?? [];
    return parts.map((part) => part.text ?? '').join('');
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
      temperature: 0.9,
      top_p: 0.95,
      max_tokens: maxOutputTokens,
    }),
  });
  if (!response.ok) throw new RequestError(502, `${model.name} is temporarily unavailable. Try again, or choose another model in the Model House.`);
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  return typeof content === 'string' ? content : '';
}
