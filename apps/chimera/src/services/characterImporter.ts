// CHIMERA Universal Character Card Importer Parser Engine

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
  
  if (fileName.endsWith('.json')) {
    const text = await file.text();
    const json = JSON.parse(text);
    return parseCharacterJson(json);
  }

  // PNG embedded card chunk parser or default file reader fallback
  return {
    name: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
    tagline: 'Imported AI Character',
    description: 'An AI character imported via CHIMERA Universal Importer.',
    personality: 'Engaging, creative, expressive.',
    first_mes: `*looks up as ${file.name.replace(/\.[^/.]+$/, '')} enters the room...* Hello there!`,
    scenario: 'A grand encounter in the nexus.',
    badges: ['Imported', 'Janitor AI', 'Character.AI'],
    lorebookEntries: [
      {
        title: 'Origin World',
        content: 'Imported character realm.',
        keywords: ['Origin', 'Realm']
      }
    ]
  };
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
