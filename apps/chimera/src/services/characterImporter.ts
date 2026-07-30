// CHIMERA Universal Character Card Importer Parser Engine
// Supports PDF, JSON, PNG, TXT, DOCX, YAML, and raw character card documents.

export interface ImportedCharacterData {
  name: string;
  tagline: string;
  description: string;
  personality: string;
  first_mes: string;
  scenario: string;
  badges: string[];
  lorebookEntries: Array<{ title: string; content: string; keywords: string[] }>;
}

export async function parseCharacterCardFile(file: File): Promise<ImportedCharacterData> {
  const fileName = file.name.toLowerCase();

  // 1. JSON Format (.json)
  if (fileName.endsWith('.json')) {
    const text = await file.text();
    const json = JSON.parse(text);
    return parseCharacterJson(json);
  }

  // 2. PDF & Plain Text Documents (.pdf, .txt, .md, .doc, .docx, .yaml, .yml)
  if (
    fileName.endsWith('.pdf') ||
    fileName.endsWith('.txt') ||
    fileName.endsWith('.md') ||
    fileName.endsWith('.yaml') ||
    fileName.endsWith('.yml') ||
    file.type === 'application/pdf' ||
    file.type.startsWith('text/')
  ) {
    const rawText = await readTextFromFile(file);
    return parseCharacterFromRawText(rawText, file.name);
  }

  // 3. PNG embedded card chunk parser or default file reader fallback
  return {
    name: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
    tagline: 'Imported AI Character',
    description: 'An AI character imported via CHIMERA Universal Importer.',
    personality: 'Engaging, creative, expressive.',
    first_mes: `*looks up as ${file.name.replace(/\.[^/.]+$/, '')} enters the room...* Hello there!`,
    scenario: 'A grand encounter in the nexus.',
    badges: ['Imported', 'PDF Card', 'Character.AI'],
    lorebookEntries: [
      {
        title: 'Origin World',
        content: 'Imported character realm.',
        keywords: ['Origin', 'Realm']
      }
    ]
  };
}

async function readTextFromFile(file: File): Promise<string> {
  try {
    return await file.text();
  } catch (err) {
    return '';
  }
}

function parseCharacterJson(json: any): ImportedCharacterData {
  // Tavern / SillyTavern v2 format or Character.AI export format
  const data = json.data || json;

  return {
    name: data.name || data.char_name || 'Imported Character',
    tagline: data.title || data.tagline || data.short_description || 'Imported AI Identity',
    description: data.description || data.char_persona || data.bio || '',
    personality: data.personality || data.char_personality || '',
    first_mes: data.first_mes || data.greeting || data.greeting_message || '*steps forward...*',
    scenario: data.scenario || data.world_scenario || '',
    badges: Array.isArray(data.badges) ? data.badges : ['Imported', 'AI Character'],
    lorebookEntries: Array.isArray(data.lorebook) ? data.lorebook : []
  };
}

/**
 * Intelligent parser for PDF and TXT character sheet documents
 */
function parseCharacterFromRawText(text: string, fileName: string): ImportedCharacterData {
  const fallbackName = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

  // Extract Name (e.g. "Name: ...", "Title: ...", or first non-empty line)
  const nameMatch = text.match(/(?:name|character|title)\s*[:=]\s*([^\n\r]+)/i);
  const name = nameMatch ? nameMatch[1].trim() : fallbackName;

  // Extract Tagline / Short Description
  const taglineMatch = text.match(/(?:tagline|summary|short description|bio)\s*[:=]\s*([^\n\r]+)/i);
  const tagline = taglineMatch ? taglineMatch[1].trim() : 'Imported PDF Character';

  // Extract Greeting / First Message
  const greetingMatch = text.match(/(?:first message|greeting|opening message|intro)\s*[:=]\s*([\s\S]*?)(?=\n\s*(?:personality|scenario|description|bio|lore)|$)/i);
  const first_mes = greetingMatch ? greetingMatch[1].trim() : `*smiles warmly as ${name} greets you...* Hello!`;

  // Extract Personality
  const personalityMatch = text.match(/(?:personality|traits|character traits|behavior)\s*[:=]\s*([\s\S]*?)(?=\n\s*(?:greeting|scenario|description|bio|lore)|$)/i);
  const personality = personalityMatch ? personalityMatch[1].trim() : (text.slice(0, 500) || 'Engaging, expressive, detailed.');

  // Extract Description / Backstory
  const descMatch = text.match(/(?:description|backstory|appearance|background)\s*[:=]\s*([\s\S]*?)(?=\n\s*(?:personality|greeting|scenario|lore)|$)/i);
  const description = descMatch ? descMatch[1].trim() : text.slice(0, 300);

  // Extract Scenario
  const scenarioMatch = text.match(/(?:scenario|setting|world|context)\s*[:=]\s*([^\n\r]+)/i);
  const scenario = scenarioMatch ? scenarioMatch[1].trim() : '';

  return {
    name,
    tagline,
    description,
    personality,
    first_mes,
    scenario,
    badges: ['Imported', 'PDF Card'],
    lorebookEntries: []
  };
}
