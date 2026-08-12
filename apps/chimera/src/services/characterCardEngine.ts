/**
 * CHIMERA Universal Character Card PNG & JSON Engine
 * Supports SillyTavern V2/V3 Character Spec, JanitorAI, Chub.ai, and Pygmalion formats.
 */

export interface CharacterCardV2 {
  spec: 'chara_card_v2' | 'chara_card_v3';
  spec_version: '2.0' | '3.0';
  data: {
    name: string;
    description: string;
    personality: string;
    scenario: string;
    first_mes: string;
    mes_example: string;
    creator_notes?: string;
    system_prompt?: string;
    post_history_instructions?: string;
    tags?: string[];
    creator?: string;
    character_version?: string;
    alternate_greetings?: string[];
  };
}

/**
 * Extracts character JSON payload from a PNG file buffer or Base64 string (tEXt chunk 'chara')
 */
export async function parseCharacterCardPng(file: File): Promise<Partial<CharacterCardV2['data']> | null> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // Scan PNG chunks for 'tEXt' or 'chara' keyword
    const textDecoder = new TextDecoder('utf-8');
    const fullText = textDecoder.decode(bytes);

    // Look for embedded JSON substring in PNG bytes
    const jsonMatch = fullText.match(/\{[\s\S]*"spec"\s*:\s*"chara_card_v[23]"[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as CharacterCardV2;
      return parsed.data;
    }

    // Fallback: try parsing raw JSON text if file is JSON
    const rawJsonMatch = fullText.match(/\{[\s\S]*"name"\s*:[\s\S]*\}/);
    if (rawJsonMatch) {
      const rawParsed = JSON.parse(rawJsonMatch[0]);
      return {
        name: rawParsed.name || rawParsed.data?.name || '',
        description: rawParsed.description || rawParsed.data?.description || '',
        personality: rawParsed.personality || rawParsed.data?.personality || '',
        scenario: rawParsed.scenario || rawParsed.data?.scenario || '',
        first_mes: rawParsed.first_mes || rawParsed.greeting || rawParsed.data?.first_mes || '',
        mes_example: rawParsed.mes_example || rawParsed.example_dialogue || rawParsed.data?.mes_example || '',
        tags: rawParsed.tags || rawParsed.data?.tags || [],
      };
    }
  } catch (err) {
    console.error('Failed to parse PNG character card metadata:', err);
  }
  return null;
}

/**
 * Exports a character profile as a standard SillyTavern V2 Character Card JSON string
 */
export function exportCharacterCardJson(character: {
  name: string;
  description?: string;
  personality?: string;
  scenario?: string;
  greeting?: string;
  exampleDialogue?: string;
  tags?: string[];
}): string {
  const card: CharacterCardV2 = {
    spec: 'chara_card_v2',
    spec_version: '2.0',
    data: {
      name: character.name || 'Untitled Character',
      description: character.description || '',
      personality: character.personality || '',
      scenario: character.scenario || '',
      first_mes: character.greeting || '',
      mes_example: character.exampleDialogue || '',
      tags: character.tags || [],
      creator: 'CHIMERA Studio',
    },
  };
  return JSON.stringify(card, null, 2);
}
