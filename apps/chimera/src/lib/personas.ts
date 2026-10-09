import { supabase } from './supabase';

export const PERSONA_LIMITS = {
  name: 60,
  pronouns: 40,
  age: 20,
  gender: 40,
  occupation: 100,
  description: 1000,
  personality: 2000,
  appearance: 1000,
  backstory: 4000,
} as const;

export interface PersonaForm {
  name: string;
  pronouns: string;
  age: string;
  gender: string;
  occupation: string;
  description: string;
  personality: string;
  appearance: string;
  backstory: string;
  isDefault: boolean;
}

export const EMPTY_PERSONA: PersonaForm = {
  name: '',
  pronouns: '',
  age: '',
  gender: '',
  occupation: '',
  description: '',
  personality: '',
  appearance: '',
  backstory: '',
  isDefault: false,
};

export interface PersonaSummary {
  id: string;
  name: string;
  is_default: boolean;
  description?: string | null;
}

const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11,
  twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
};

/**
 * True when the age text clearly says under 18 ("16", "sixteen years old", "minor"). Adult scenes
 * are refused for such a persona. An empty or unclear age is not treated as under 18: the
 * safety rules in the prompt still apply, and the player cannot be asked for proof here.
 */
export function ageIsUnder18(age: string | null | undefined): boolean {
  const text = (age ?? '').toLowerCase();
  if (!text.trim()) return false;
  if (/\b(minor|underage|under-age|child|kid|teen|teenager|juvenile)\b/.test(text)) return true;
  const digits = text.match(/\d{1,3}/);
  if (digits) return Number(digits[0]) < 18;
  // "twenty-seven" and "thirty one" contain a small number word but are adults.
  if (/\b(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred)\b/.test(text)) return false;
  const word = text.match(/\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen)\b/);
  return word ? NUMBER_WORDS[word[1]] < 18 : false;
}

export function validatePersona(form: PersonaForm): string | null {
  if (!form.name.trim()) return 'Give your persona a name.';
  const checks: Array<[string, string, number]> = [
    ['Name', form.name, PERSONA_LIMITS.name],
    ['Pronouns', form.pronouns, PERSONA_LIMITS.pronouns],
    ['Age', form.age, PERSONA_LIMITS.age],
    ['Gender', form.gender, PERSONA_LIMITS.gender],
    ['Occupation', form.occupation, PERSONA_LIMITS.occupation],
    ['Description', form.description, PERSONA_LIMITS.description],
    ['Personality', form.personality, PERSONA_LIMITS.personality],
    ['Appearance', form.appearance, PERSONA_LIMITS.appearance],
    ['Backstory', form.backstory, PERSONA_LIMITS.backstory],
  ];
  for (const [label, value, max] of checks) {
    if (value.length > max) return `${label} is too long (${value.length} of ${max} characters).`;
  }
  return null;
}

const orNull = (value: string) => (value.trim() ? value.trim() : null);

/** Row for the personas table. Personas stay private: the public flag is never set from here. */
export function personaRow(form: PersonaForm) {
  return {
    name: form.name.trim(),
    pronouns: orNull(form.pronouns),
    age: orNull(form.age),
    gender: orNull(form.gender),
    occupation: orNull(form.occupation),
    description: form.description.trim(),
    personality: form.personality.trim(),
    appearance: form.appearance.trim(),
    backstory: form.backstory.trim(),
    is_default: form.isDefault,
    is_public: false,
  };
}

export function formFromPersona(row: Record<string, unknown>): PersonaForm {
  const text = (key: string) => (typeof row[key] === 'string' ? (row[key] as string) : '');
  return {
    name: text('name'),
    pronouns: text('pronouns'),
    age: text('age'),
    gender: text('gender'),
    occupation: text('occupation'),
    description: text('description'),
    personality: text('personality'),
    appearance: text('appearance'),
    backstory: text('backstory'),
    isDefault: row.is_default === true,
  };
}

export async function loadMyPersonas(userId: string): Promise<PersonaSummary[]> {
  const { data, error } = await supabase
    .from('personas')
    .select('id, name, is_default, description')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('name', { ascending: true });
  if (error) throw error;
  return (data ?? []) as PersonaSummary[];
}
