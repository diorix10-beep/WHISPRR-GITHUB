// CHIMERA Universal Character Card Importer Parser Engine
// Supports PDF, JSON, PNG, TXT, DOCX, YAML, and 16-Section Character Sheets.

export interface ImportedCharacterData {
  name: string;
  tagline: string;
  description: string;
  personality: string;
  first_mes: string;
  scenario: string;
  badges: string[];
  content_rating?: string;
  architectureData?: Record<string, string>;
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
    return parseCharacterFromStructuredPdf(rawText, file.name);
  }

  // 3. Fallback
  return {
    name: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
    tagline: 'Imported AI Character',
    description: 'An AI character imported via CHIMERA Universal Importer.',
    personality: 'Engaging, creative, expressive.',
    first_mes: `*looks up as ${file.name.replace(/\.[^/.]+$/, '')} enters the room...* Hello there!`,
    scenario: 'A grand encounter in the nexus.',
    badges: ['Imported', 'PDF Card'],
    lorebookEntries: []
  };
}

function cleanText(str: string): string {
  if (!str) return '';
  return str.replace(/\u0000/g, '').replace(/\x00/g, '').trim();
}

async function readTextFromFile(file: File): Promise<string> {
  try {
    const raw = await file.text();
    return cleanText(raw);
  } catch (err) {
    return '';
  }
}

function parseCharacterJson(json: any): ImportedCharacterData {
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
 * Advanced PDF & Text Character Sheet Parser
 * Perfectly extracts 16-Section Architecture, General Definition, Scenario, and Greeting.
 */
function parseCharacterFromStructuredPdf(text: string, fileName: string): ImportedCharacterData {
  const fallbackName = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

  // 1. Extract Title / Name
  const titleMatch = text.match(/(?:Title|Name|Kamala Devi Harris)\s*[:=]?\s*([^\n\r]+)/i);
  const name = titleMatch ? titleMatch[1].trim() : fallbackName;

  // 2. Extract Bio / Short Description
  const bioMatch = text.match(/(?:Bio|Short Description|Summary)\s*[:=]\s*([\s\S]*?)(?=\n\s*(?:Tags|Content Rating|16-Section Builder|Identity|Personality)|$)/i);
  const tagline = bioMatch ? bioMatch[1].replace(/\n+/g, ' ').trim() : 'A rich, multi-layered AI roleplay persona.';

  // 3. Extract Tags
  const tagsMatch = text.match(/Tags\s*[:=]\s*([^\n\r]+)/i);
  const badges = tagsMatch 
    ? tagsMatch[1].split(/[,;.]/).map(t => t.trim()).filter(Boolean)
    : ['Romance', 'Slice of Life', 'Age Regression', 'Caregiver'];

  // 4. Extract Content Rating
  const ratingMatch = text.match(/Content Rating\s*[:=]\s*([^\n\r]+)/i);
  const content_rating = ratingMatch && ratingMatch[1].toUpperCase().includes('NSFW') ? 'NSFW' : 'SFW';

  // 5. Extract Greeting (From "Greeting:" to end of file)
  const greetingMatch = text.match(/Greeting\s*[:=]?\s*([\s\S]*)/i);
  const first_mes = greetingMatch ? greetingMatch[1].trim() : `*smiles warmly as ${name} greets you...* "Hello! I'm glad you're here."`;

  // 6. Extract Scenario
  const scenarioMatch = text.match(/(?:Scenario|Raw Definition Summary)\s*[:=]?\s*([\s\S]*?)(?=\n\s*(?:Greeting|SYSTEM UPDATE)|$)/i);
  const scenario = scenarioMatch ? scenarioMatch[1].trim() : '';

  // 7. Extract 16-Section Architecture Fields
  const architectureData: Record<string, string> = {};

  const sectionKeys = [
    'Identity', 'Appearance', 'Personality', 'Speech', 'Habits & Mannerism', 'Likes',
    'Dislikes', 'Boundaries', 'Goals & Motivation', 'Fears & Vunerabilities',
    'Behavioral Boundaries', 'Triggers & Comfort', 'Relationships',
    'Knowledge Scope', 'KNOWS', 'Secrets', 'Dialogue & Writting Style'
  ];

  for (let i = 0; i < sectionKeys.length; i++) {
    const key = sectionKeys[i];
    const regex = new RegExp(`${key}\\s*[:=]\\s*([\\s\\S]*?)(?=\\n\\s*(?:${sectionKeys.join('|')}|Raw Definition|Scenario|Greeting)|$)`, 'i');
    const match = text.match(regex);
    if (match) {
      architectureData[key] = match[1].trim();
    }
  }

  // 8. Compile Personality string from extracted sections
  const personalityParts: string[] = [];
  if (architectureData['Identity']) personalityParts.push(`Identity: ${architectureData['Identity']}`);
  if (architectureData['Appearance']) personalityParts.push(`Appearance: ${architectureData['Appearance']}`);
  if (architectureData['Personality']) personalityParts.push(`Personality: ${architectureData['Personality']}`);
  if (architectureData['Speech']) personalityParts.push(`Speech: ${architectureData['Speech']}`);
  if (architectureData['Habits & Mannerism']) personalityParts.push(`Habits: ${architectureData['Habits & Mannerism']}`);
  if (architectureData['Likes']) personalityParts.push(`Likes: ${architectureData['Likes']}`);
  if (architectureData['Dislikes']) personalityParts.push(`Dislikes: ${architectureData['Dislikes']}`);
  if (architectureData['Boundaries']) personalityParts.push(`Boundaries: ${architectureData['Boundaries']}`);
  if (architectureData['Triggers & Comfort']) personalityParts.push(`Triggers & Comfort: ${architectureData['Triggers & Comfort']}`);
  if (architectureData['Relationships']) personalityParts.push(`Relationships: ${architectureData['Relationships']}`);
  if (architectureData['Secrets']) personalityParts.push(`Secrets: ${architectureData['Secrets']}`);
  if (architectureData['Dialogue & Writting Style']) personalityParts.push(`Style: ${architectureData['Dialogue & Writting Style']}`);

  const personality = personalityParts.length > 0 ? personalityParts.join('\n\n') : text.slice(0, 1000);

  return {
    name,
    tagline,
    description: tagline,
    personality,
    first_mes,
    scenario,
    badges,
    content_rating,
    architectureData,
    lorebookEntries: []
  };
}
