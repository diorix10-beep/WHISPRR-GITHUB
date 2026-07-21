export interface CharacterArchitecture {
  // 1. Identity
  name?: string;
  age?: string;
  gender?: string;
  pronouns?: string;
  occupation?: string;
  species?: string;
  nationality?: string;

  // 2. Appearance
  height?: string;
  build?: string;
  hair?: string;
  eyes?: string;
  clothing?: string;
  accessories?: string;
  tattoos_scars?: string;

  // 3. Personality
  personality_traits?: string;
  strengths?: string;
  flaws?: string;
  temperament?: string;
  humor?: string;

  // 4. Speech Style
  speech_style?: string;
  formality?: string;
  swearing_policy?: string;
  nicknames?: string;
  emoji_rules?: string;

  // 5. Habits
  habits?: string;

  // 6. Likes
  likes?: string;

  // 7. Dislikes
  dislikes?: string;

  // 8. Goals
  goals?: string;

  // 9. Fears
  fears?: string;

  // 10. Boundaries
  boundaries?: string;

  // 11. Triggers & Comfort
  triggers?: string;
  comfort_methods?: string;

  // 12. Relationships
  relationships?: Array<{ name: string; role: string }>;

  // 13. Knowledge Scope
  knows?: string;
  does_not_know?: string;

  // 14. Abilities
  abilities?: string;

  // 15. Secrets
  secrets?: string;

  // 16. Dialogue & Writing Style
  example_dialogues?: Array<{ user: string; character: string }>;
  writing_style?: string;
}

export function compileCharacterSystemPrompt(arch: CharacterArchitecture): string {
  const sections: string[] = [];

  // Identity
  const identityParts: string[] = [];
  if (arch.name) identityParts.push(`• Name: ${arch.name}`);
  if (arch.age) identityParts.push(`• Age: ${arch.age}`);
  if (arch.gender) identityParts.push(`• Gender: ${arch.gender}`);
  if (arch.pronouns) identityParts.push(`• Pronouns: ${arch.pronouns}`);
  if (arch.occupation) identityParts.push(`• Occupation: ${arch.occupation}`);
  if (arch.species) identityParts.push(`• Species: ${arch.species}`);
  if (arch.nationality) identityParts.push(`• Nationality: ${arch.nationality}`);
  if (identityParts.length > 0) {
    sections.push(`[CHARACTER IDENTITY]\n${identityParts.join('\n')}`);
  }

  // Appearance
  const appParts: string[] = [];
  if (arch.height) appParts.push(`• Height: ${arch.height}`);
  if (arch.build) appParts.push(`• Build: ${arch.build}`);
  if (arch.hair) appParts.push(`• Hair: ${arch.hair}`);
  if (arch.eyes) appParts.push(`• Eyes: ${arch.eyes}`);
  if (arch.clothing) appParts.push(`• Clothing: ${arch.clothing}`);
  if (arch.accessories) appParts.push(`• Accessories: ${arch.accessories}`);
  if (arch.tattoos_scars) appParts.push(`• Tattoos & Scars: ${arch.tattoos_scars}`);
  if (appParts.length > 0) {
    sections.push(`[PHYSICAL APPEARANCE]\n${appParts.join('\n')}`);
  }

  // Personality & Behavior
  const personaParts: string[] = [];
  if (arch.personality_traits) personaParts.push(`• Traits: ${arch.personality_traits}`);
  if (arch.strengths) personaParts.push(`• Strengths: ${arch.strengths}`);
  if (arch.flaws) personaParts.push(`• Flaws: ${arch.flaws}`);
  if (arch.temperament) personaParts.push(`• Temperament: ${arch.temperament}`);
  if (arch.humor) personaParts.push(`• Humor: ${arch.humor}`);
  if (personaParts.length > 0) {
    sections.push(`[PERSONALITY]\n${personaParts.join('\n')}`);
  }

  // Speech Style
  const speechParts: string[] = [];
  if (arch.speech_style) speechParts.push(`• Style: ${arch.speech_style}`);
  if (arch.formality) speechParts.push(`• Formality: ${arch.formality}`);
  if (arch.swearing_policy) speechParts.push(`• Swearing: ${arch.swearing_policy}`);
  if (arch.nicknames) speechParts.push(`• Nicknames: ${arch.nicknames}`);
  if (arch.emoji_rules) speechParts.push(`• Emoji Policy: ${arch.emoji_rules}`);
  if (speechParts.length > 0) {
    sections.push(`[SPEECH STYLE & RULES]\n${speechParts.join('\n')}`);
  }

  // Habits, Likes & Dislikes
  const habitsParts: string[] = [];
  if (arch.habits) habitsParts.push(`• Habits: ${arch.habits}`);
  if (arch.likes) habitsParts.push(`• Likes: ${arch.likes}`);
  if (arch.dislikes) habitsParts.push(`• Dislikes: ${arch.dislikes}`);
  if (habitsParts.length > 0) {
    sections.push(`[HABITS & PREFERENCES]\n${habitsParts.join('\n')}`);
  }

  // Goals & Fears
  const motivParts: string[] = [];
  if (arch.goals) motivParts.push(`• Goals: ${arch.goals}`);
  if (arch.fears) motivParts.push(`• Fears: ${arch.fears}`);
  if (motivParts.length > 0) {
    sections.push(`[MOTIVATIONS & FEARS]\n${motivParts.join('\n')}`);
  }

  // Boundaries & Rules
  if (arch.boundaries) {
    sections.push(`[BEHAVIORAL BOUNDARIES & RULES]\n${arch.boundaries}`);
  }

  // Triggers & Comfort
  const emParts: string[] = [];
  if (arch.triggers) emParts.push(`• Emotional Triggers: ${arch.triggers}`);
  if (arch.comfort_methods) emParts.push(`• Comfort Methods: ${arch.comfort_methods}`);
  if (emParts.length > 0) {
    sections.push(`[EMOTIONAL COMPLEXITY & COMFORT]\n${emParts.join('\n')}`);
  }

  // Relationships
  if (arch.relationships && arch.relationships.length > 0) {
    const rels = arch.relationships.map(r => `• ${r.name}: ${r.role}`).join('\n');
    sections.push(`[RELATIONSHIPS]\n${rels}`);
  }

  // Knowledge Scope
  const knowParts: string[] = [];
  if (arch.knows) knowParts.push(`• Knows: ${arch.knows}`);
  if (arch.does_not_know) knowParts.push(`• Does NOT know: ${arch.does_not_know}`);
  if (knowParts.length > 0) {
    sections.push(`[KNOWLEDGE SCOPE]\n${knowParts.join('\n')}`);
  }

  // Abilities & Secrets
  const specParts: string[] = [];
  if (arch.abilities) specParts.push(`• Abilities & Skills: ${arch.abilities}`);
  if (arch.secrets) specParts.push(`• Confidential Secrets: ${arch.secrets}`);
  if (specParts.length > 0) {
    sections.push(`[ABILITIES & SECRETS]\n${specParts.join('\n')}`);
  }

  // Writing Style
  if (arch.writing_style) {
    sections.push(`[NARRATIVE & WRITING STYLE]\n${arch.writing_style}`);
  }

  // Example Dialogues
  if (arch.example_dialogues && arch.example_dialogues.length > 0) {
    const dialogues = arch.example_dialogues
      .map(d => `User:\n"${d.user}"\n\nCharacter:\n"${d.character}"`)
      .join('\n\n---\n\n');
    sections.push(`[EXAMPLE DIALOGUES]\n${dialogues}`);
  }

  return sections.join('\n\n━━━━━━━━━━━━━━━━━━━━━━\n\n');
}
