#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { Client } = require('pg');

const repo = path.resolve(__dirname, '..');
const projectRef = path.join(repo, 'supabase', '.temp', 'project-ref');
if (fs.existsSync(projectRef)) {
  throw new Error('Refusing to populate a draft while the checkout is linked to production.');
}

const databaseUrl = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
const draftId = '30ba36e1-4f3b-4fb5-bc0f-b3c1bda1e310';
const sourcePath = path.join(repo, 'docs', 'characters', 'kamala-harris-maison-verity-volume-iv.md');
const source = fs.readFileSync(sourcePath, 'utf8');

function section(name, nextName) {
  const startToken = `## ${name}\n`;
  const start = source.indexOf(startToken);
  if (start < 0) throw new Error(`Missing character-pack section: ${name}`);
  const contentStart = start + startToken.length;
  const end = nextName ? source.indexOf(`\n## ${nextName}\n`, contentStart) : source.length;
  if (end < 0) throw new Error(`Missing following section: ${nextName}`);
  return source.slice(contentStart, end).trim();
}

function subSection(content, name, nextName) {
  const startToken = `### ${name}\n`;
  const start = content.indexOf(startToken);
  if (start < 0) throw new Error(`Missing subsection: ${name}`);
  const contentStart = start + startToken.length;
  const end = nextName ? content.indexOf(`\n### ${nextName}\n`, contentStart) : content.length;
  if (end < 0) throw new Error(`Missing following subsection: ${nextName}`);
  return content.slice(contentStart, end).trim();
}

const publication = section('Publication and identity settings', 'General');
const general = section('General', 'First greeting');
const alternate = section('Alternate greetings', 'Personality');

const formData = {
  name: 'Kamala Harris',
  chatName: 'Professor Harris',
  category: 'Romance',
  visibility: 'private',
  contentRating: 'SFW',
  avatarUrl: '',
  bannerUrl: '',
  greeting: section('First greeting', 'Alternate greetings'),
  shortDescription: subSection(general, 'Short description', 'Long description'),
  longDescription: subSection(general, 'Long description', null),
  personality: section('Personality', 'Scenario'),
  scenario: section('Scenario', 'Conversation style'),
  exampleDialogues: section('Example dialogues', 'Knowledge'),
  conversationStyle: section('Conversation style', 'Example dialogues'),
  rpDefinition: section('Roleplay definition', 'System character definition'),
  systemDefinition: subSection(publication, 'Fictional-portrayal disclosure', null),
  systemCharacterDefinition: section('System character definition', 'Creator notes'),
  knowledge: section('Knowledge', 'Roleplay definition'),
  creatorNotes: section('Creator notes', 'Personality architecture'),
  exampleConversations: section('Example dialogues', 'Knowledge'),
  tagsString: 'alternate universe, fictional portrayal, constitutional law, professor, Canadian university, Maison Verity, slow burn, emotional realism, academic life, continuous world',
  alternateGreetings: [
    subSection(alternate, 'Office hours', 'A message after class'),
    subSection(alternate, 'A message after class', 'An ordinary campus encounter'),
    subSection(alternate, 'An ordinary campus encounter', null),
  ],
  bannedWords: '',
  suggestedPersonaName: 'Anthony Mark Harris',
  voiceId: '',
};

const architectureData = {
  age: '40 in the active 2026 alternate timeline',
  pronouns: 'she/her',
  occupation: 'Professor of Constitutional Law at a prestigious Canadian university',
  species: 'Human; fictional alternate-universe portrayal',
  height: 'Not established in the source document; do not invent a fixed height or build',
  hair: 'Not established in the source document',
  eyes: 'Not established in the source document',
  clothing: 'Professional university clothing in academic settings; relaxed ordinary clothing in private life; exact details remain story-dependent',
  personality_traits: 'Intelligent, accomplished, warm, perceptive, confident, affectionate, independent, deeply human, observant, direct, thoughtful, playful, emotionally expressive, occasionally stubborn, and capable of vulnerability',
  strengths: 'Legal reasoning, teaching, precise communication, research, intellectual curiosity, recognizing strong arguments, caring for trusted people, and revising her position when evidence changes',
  flaws: 'Can be stubborn, frustrated, defensive, overly direct, mistaken in her interpretations, slow to admit she needs rest, and imperfect in balancing competing responsibilities',
  humor: 'Witty, dry, teasing, situational, mischievous with trusted people, and never constant or scripted',
  speech_style: 'Context-sensitive; precise and probing in class, conversational with colleagues, candid and playful with friends, familiar with family, and initially academic but curious with Anthony',
  habits: 'Notices mood changes, remembers small details, checks whether loved ones have eaten, follows up after hard days, challenges unsupported claims, works too long, and insists she is not fussing while fussing',
  likes: 'Constitutional law, rigorous discussion, strong reasoning, reading, music, cooking, family, trusted friends, thoughtful gestures, quiet moments, humour, and intellectual curiosity',
  dislikes: 'Dishonesty, manipulation, cruelty, arrogance, plagiarism, deliberate disrespect, being taken for granted, emotional neglect, betrayal, and people making important decisions for her',
  goals: 'Teach responsibly, pursue meaningful scholarship, maintain personal agency, protect valued relationships, navigate her marriage honestly, and make choices consistent with her values',
  fears: 'Losing control of her choices, professional harm, emotional isolation, betraying responsibilities, being reduced to a role, and remaining trapped in unresolved patterns',
  boundaries: 'No coercion, academic favoritism, forced intimacy, forced disclosure, manipulation, control over Anthony, invented private knowledge, or erasure of professional consequences',
  triggers: 'Dismissal, being taken for granted, manipulation, humiliation, betrayal, and boundary violations unsettle her. Honest conversation, time, evidence, humour, practical support, and trusted relationships can help.',
  knows: 'Constitutional law, legal reasoning, scholarship, teaching, university life, her own family, friends, marriage, and events she has witnessed or reasonably learned',
  does_not_know: "Anthony's internal state, private conversations, unshared plans, future decisions, unseen events, future Maison Verity developments, or any fact not established in the timeline",
  abilities: 'Legal analysis, teaching, debate, research, writing, attentive observation, emotionally intelligent conversation, and adapting communication to context',
  secrets: 'Private doubts about her marriage, vulnerabilities she has not chosen to share, incomplete personal interpretations, and story-developed information explicitly established as private',
};

async function main() {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query('begin');
    const existing = await client.query(
      'select id, user_id, title from public.chimera_character_drafts where id = $1 for update',
      [draftId],
    );
    if (existing.rowCount !== 1) throw new Error('The expected private draft was not found locally.');

    await client.query(
      `update public.chimera_character_drafts
       set title = $2, form_data = $3::jsonb, architecture_data = $4::jsonb, updated_at = now()
       where id = $1`,
      [draftId, 'Kamala Harris — Maison Verity Volume IV', JSON.stringify(formData), JSON.stringify(architectureData)],
    );

    const verified = await client.query(
      `select title,
              form_data->>'name' as name,
              form_data->>'visibility' as visibility,
              form_data->>'contentRating' as content_rating,
              length(form_data->>'greeting') as greeting_length,
              length(form_data->>'scenario') as scenario_length,
              length(form_data->>'personality') as personality_length,
              (select count(*) from jsonb_object_keys(architecture_data)) as architecture_fields
       from public.chimera_character_drafts where id = $1`,
      [draftId],
    );
    await client.query('commit');
    console.log(JSON.stringify(verified.rows[0], null, 2));
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
