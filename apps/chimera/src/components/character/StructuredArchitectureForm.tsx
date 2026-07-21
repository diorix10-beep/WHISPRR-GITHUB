import { useState } from 'react';
import { 
  User, Shirt, Heart, MessageSquare, Coffee, ThumbsUp, ThumbsDown, 
  Target, AlertTriangle, ShieldAlert, HeartHandshake, Users, BookOpen, 
  Zap, Lock, Sparkles, Plus, Trash2, ChevronDown, ChevronUp 
} from 'lucide-react';
import type { CharacterArchitecture } from '../../lib/promptCompiler';

interface StructuredArchitectureFormProps {
  value: CharacterArchitecture;
  onChange: (updated: CharacterArchitecture) => void;
}

export function StructuredArchitectureForm({ value, onChange }: StructuredArchitectureFormProps) {
  const [openSection, setOpenSection] = useState<string | null>('identity');

  const toggleSection = (id: string) => {
    setOpenSection(openSection === id ? null : id);
  };

  const updateField = (field: keyof CharacterArchitecture, val: any) => {
    onChange({ ...value, [field]: val });
  };

  // Helper for Relationships
  const addRelationship = () => {
    const rels = value.relationships || [];
    updateField('relationships', [...rels, { name: '', role: '' }]);
  };

  const updateRelationship = (index: number, key: 'name' | 'role', val: string) => {
    const rels = [...(value.relationships || [])];
    rels[index] = { ...rels[index], [key]: val };
    updateField('relationships', rels);
  };

  const removeRelationship = (index: number) => {
    const rels = [...(value.relationships || [])];
    rels.splice(index, 1);
    updateField('relationships', rels);
  };

  // Helper for Dialogues
  const addDialogue = () => {
    const dials = value.example_dialogues || [];
    updateField('example_dialogues', [...dials, { user: '', character: '' }]);
  };

  const updateDialogue = (index: number, key: 'user' | 'character', val: string) => {
    const dials = [...(value.example_dialogues || [])];
    dials[index] = { ...dials[index], [key]: val };
    updateField('example_dialogues', dials);
  };

  const removeDialogue = (index: number) => {
    const dials = [...(value.example_dialogues || [])];
    dials.splice(index, 1);
    updateField('example_dialogues', dials);
  };

  const sections = [
    { id: 'identity', title: '1. Identity', icon: User, desc: 'Basic character metadata (Name, Age, Pronouns, Species...)' },
    { id: 'appearance', title: '2. Appearance', icon: Shirt, desc: 'Physical traits, height, build, clothing, scars...' },
    { id: 'personality', title: '3. Personality', icon: Heart, desc: 'Traits, strengths, flaws, temperament, humor...' },
    { id: 'speech', title: '4. Speech Style', icon: MessageSquare, desc: 'Formality, swearing policy, nicknames, emoji rules...' },
    { id: 'habits', title: '5. Habits & Mannerisms', icon: Coffee, desc: 'Signature behaviors, daily routines, physical gestures...' },
    { id: 'likes', title: '6. Likes', icon: ThumbsUp, desc: 'Favorite items, activities, foods, topics...' },
    { id: 'dislikes', title: '7. Dislikes', icon: ThumbsDown, desc: 'Pet peeves, hatreds, annoyances...' },
    { id: 'goals', title: '8. Goals & Motivations', icon: Target, desc: 'Primary ambitions and driving forces...' },
    { id: 'fears', title: '9. Fears & Vulnerabilities', icon: AlertTriangle, desc: 'Phobias, emotional weaknesses...' },
    { id: 'boundaries', title: '10. Behavioral Boundaries', icon: ShieldAlert, desc: 'Strict rules ("Never betray friends", "Never drop character")...' },
    { id: 'triggers', title: '11. Triggers & Comfort', icon: HeartHandshake, desc: 'Emotional triggers & comforting methods...' },
    { id: 'relationships', title: '12. Relationships', icon: Users, desc: 'Key connections (e.g. Kamala → Girlfriend, Asha → Mother)...' },
    { id: 'knowledge', title: '13. Knowledge Scope', icon: BookOpen, desc: 'What the character knows vs. what is unknown to them...' },
    { id: 'abilities', title: '14. Abilities & Skills', icon: Zap, desc: 'Expertise, combat, magic, technical skills...' },
    { id: 'secrets', title: '15. Secrets', icon: Lock, desc: 'Confidential background information hidden from others...' },
    { id: 'dialogue', title: '16. Dialogue & Writing Style', icon: Sparkles, desc: 'Turn-by-turn example dialogues & narrative rules...' },
  ];

  return (
    <div className="space-y-4">
      {sections.map(sec => {
        const isOpen = openSection === sec.id;
        const Icon = sec.icon;

        return (
          <div key={sec.id} className="bg-white dark:bg-warm-900 border border-warm-200 dark:border-warm-800 rounded-2xl overflow-hidden transition-all shadow-sm">
            {/* Accordion Header */}
            <button
              type="button"
              onClick={() => toggleSection(sec.id)}
              className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-warm-50 dark:hover:bg-warm-850 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                  <Icon size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-warm-900 dark:text-white text-base">{sec.title}</h3>
                  <p className="text-xs text-warm-500 dark:text-warm-400">{sec.desc}</p>
                </div>
              </div>
              {isOpen ? <ChevronUp size={18} className="text-warm-400" /> : <ChevronDown size={18} className="text-warm-400" />}
            </button>

            {/* Accordion Content */}
            {isOpen && (
              <div className="p-4 sm:p-6 border-t border-warm-200/50 dark:border-warm-800 space-y-4 bg-warm-50/50 dark:bg-warm-950/30">
                
                {/* 1. Identity */}
                {sec.id === 'identity' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-warm-700 dark:text-warm-300 mb-1">Name</label>
                      <input type="text" value={value.name || ''} onChange={e => updateField('name', e.target.value)} placeholder="e.g. Kamala Harris" className="w-full text-sm bg-white dark:bg-warm-900 border border-warm-200 dark:border-warm-800 rounded-xl px-3 py-2 text-warm-900 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-warm-700 dark:text-warm-300 mb-1">Age</label>
                      <input type="text" value={value.age || ''} onChange={e => updateField('age', e.target.value)} placeholder="e.g. 32" className="w-full text-sm bg-white dark:bg-warm-900 border border-warm-200 dark:border-warm-800 rounded-xl px-3 py-2 text-warm-900 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-warm-700 dark:text-warm-300 mb-1">Gender</label>
                      <input type="text" value={value.gender || ''} onChange={e => updateField('gender', e.target.value)} placeholder="e.g. Female" className="w-full text-sm bg-white dark:bg-warm-900 border border-warm-200 dark:border-warm-800 rounded-xl px-3 py-2 text-warm-900 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-warm-700 dark:text-warm-300 mb-1">Pronouns</label>
                      <input type="text" value={value.pronouns || ''} onChange={e => updateField('pronouns', e.target.value)} placeholder="e.g. she/her" className="w-full text-sm bg-white dark:bg-warm-900 border border-warm-200 dark:border-warm-800 rounded-xl px-3 py-2 text-warm-900 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-warm-700 dark:text-warm-300 mb-1">Occupation</label>
                      <input type="text" value={value.occupation || ''} onChange={e => updateField('occupation', e.target.value)} placeholder="e.g. Senator / Founder" className="w-full text-sm bg-white dark:bg-warm-900 border border-warm-200 dark:border-warm-800 rounded-xl px-3 py-2 text-warm-900 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-warm-700 dark:text-warm-300 mb-1">Species / Nationality</label>
                      <input type="text" value={value.species || ''} onChange={e => updateField('species', e.target.value)} placeholder="e.g. Human / American" className="w-full text-sm bg-white dark:bg-warm-900 border border-warm-200 dark:border-warm-800 rounded-xl px-3 py-2 text-warm-900 dark:text-white" />
                    </div>
                  </div>
                )}

                {/* 2. Appearance */}
                {sec.id === 'appearance' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-warm-700 dark:text-warm-300 mb-1">Height & Build</label>
                      <input type="text" value={value.build || ''} onChange={e => updateField('build', e.target.value)} placeholder="e.g. 5'8'', athletic, slender" className="w-full text-sm bg-white dark:bg-warm-900 border border-warm-200 dark:border-warm-800 rounded-xl px-3 py-2 text-warm-900 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-warm-700 dark:text-warm-300 mb-1">Hair & Eyes</label>
                      <input type="text" value={value.hair || ''} onChange={e => updateField('hair', e.target.value)} placeholder="e.g. Dark brown wavy hair, sharp hazel eyes" className="w-full text-sm bg-white dark:bg-warm-900 border border-warm-200 dark:border-warm-800 rounded-xl px-3 py-2 text-warm-900 dark:text-white" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-warm-700 dark:text-warm-300 mb-1">Clothing & Accessories</label>
                      <input type="text" value={value.clothing || ''} onChange={e => updateField('clothing', e.target.value)} placeholder="e.g. Elegant dark blazer, pearl necklace, wristwatch" className="w-full text-sm bg-white dark:bg-warm-900 border border-warm-200 dark:border-warm-800 rounded-xl px-3 py-2 text-warm-900 dark:text-white" />
                    </div>
                  </div>
                )}

                {/* 3. Personality */}
                {sec.id === 'personality' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-warm-700 dark:text-warm-300 mb-1">Core Personality Traits</label>
                      <input type="text" value={value.personality_traits || ''} onChange={e => updateField('personality_traits', e.target.value)} placeholder="e.g. Confident, protective, articulate, witty" className="w-full text-sm bg-white dark:bg-warm-900 border border-warm-200 dark:border-warm-800 rounded-xl px-3 py-2 text-warm-900 dark:text-white" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-warm-700 dark:text-warm-300 mb-1">Strengths</label>
                        <input type="text" value={value.strengths || ''} onChange={e => updateField('strengths', e.target.value)} placeholder="e.g. Quick-thinking, fiercely loyal" className="w-full text-sm bg-white dark:bg-warm-900 border border-warm-200 dark:border-warm-800 rounded-xl px-3 py-2 text-warm-900 dark:text-white" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-warm-700 dark:text-warm-300 mb-1">Flaws & Vulnerabilities</label>
                        <input type="text" value={value.flaws || ''} onChange={e => updateField('flaws', e.target.value)} placeholder="e.g. Stubborn, reluctant to ask for help" className="w-full text-sm bg-white dark:bg-warm-900 border border-warm-200 dark:border-warm-800 rounded-xl px-3 py-2 text-warm-900 dark:text-white" />
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Speech Style */}
                {sec.id === 'speech' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-warm-700 dark:text-warm-300 mb-1">Speech Tone & Style</label>
                      <input type="text" value={value.speech_style || ''} onChange={e => updateField('speech_style', e.target.value)} placeholder="e.g. Speaks softly with deliberate pacing, uses formal grammar" className="w-full text-sm bg-white dark:bg-warm-900 border border-warm-200 dark:border-warm-800 rounded-xl px-3 py-2 text-warm-900 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-warm-700 dark:text-warm-300 mb-1">Swearing & Emoji Rules</label>
                      <input type="text" value={value.emoji_rules || ''} onChange={e => updateField('emoji_rules', e.target.value)} placeholder="e.g. Never uses emojis, rarely swears" className="w-full text-sm bg-white dark:bg-warm-900 border border-warm-200 dark:border-warm-800 rounded-xl px-3 py-2 text-warm-900 dark:text-white" />
                    </div>
                  </div>
                )}

                {/* 5. Habits */}
                {sec.id === 'habits' && (
                  <div>
                    <label className="block text-xs font-bold text-warm-700 dark:text-warm-300 mb-1">Characteristic Habits & Routine</label>
                    <textarea value={value.habits || ''} onChange={e => updateField('habits', e.target.value)} placeholder="e.g. Drinks Earl Grey tea every morning; taps fingers on table when deep in thought; checks safety of the house before sleeping." className="w-full text-sm bg-white dark:bg-warm-900 border border-warm-200 dark:border-warm-800 rounded-xl p-3 min-h-[80px] text-warm-900 dark:text-white" />
                  </div>
                )}

                {/* 6. Likes */}
                {sec.id === 'likes' && (
                  <div>
                    <label className="block text-xs font-bold text-warm-700 dark:text-warm-300 mb-1">Likes & Favorites</label>
                    <input type="text" value={value.likes || ''} onChange={e => updateField('likes', e.target.value)} placeholder="e.g. Rain, vintage motorcycles, espresso, jazz music, midnight walks" className="w-full text-sm bg-white dark:bg-warm-900 border border-warm-200 dark:border-warm-800 rounded-xl px-3 py-2 text-warm-900 dark:text-white" />
                  </div>
                )}

                {/* 7. Dislikes */}
                {sec.id === 'dislikes' && (
                  <div>
                    <label className="block text-xs font-bold text-warm-700 dark:text-warm-300 mb-1">Dislikes & Annoyances</label>
                    <input type="text" value={value.dislikes || ''} onChange={e => updateField('dislikes', e.target.value)} placeholder="e.g. Dishonesty, loud arguments, crowded rooms, cold coffee" className="w-full text-sm bg-white dark:bg-warm-900 border border-warm-200 dark:border-warm-800 rounded-xl px-3 py-2 text-warm-900 dark:text-white" />
                  </div>
                )}

                {/* 8. Goals */}
                {sec.id === 'goals' && (
                  <div>
                    <label className="block text-xs font-bold text-warm-700 dark:text-warm-300 mb-1">Core Goals & Ambitions</label>
                    <textarea value={value.goals || ''} onChange={e => updateField('goals', e.target.value)} placeholder="e.g. Build Maison Verity; protect loved ones at all costs; achieve independence." className="w-full text-sm bg-white dark:bg-warm-900 border border-warm-200 dark:border-warm-800 rounded-xl p-3 min-h-[80px] text-warm-900 dark:text-white" />
                  </div>
                )}

                {/* 9. Fears */}
                {sec.id === 'fears' && (
                  <div>
                    <label className="block text-xs font-bold text-warm-700 dark:text-warm-300 mb-1">Fears & Phobias</label>
                    <input type="text" value={value.fears || ''} onChange={e => updateField('fears', e.target.value)} placeholder="e.g. Abandonment, failure, losing family, fire" className="w-full text-sm bg-white dark:bg-warm-900 border border-warm-200 dark:border-warm-800 rounded-xl px-3 py-2 text-warm-900 dark:text-white" />
                  </div>
                )}

                {/* 10. Boundaries */}
                {sec.id === 'boundaries' && (
                  <div>
                    <label className="block text-xs font-bold text-warm-700 dark:text-warm-300 mb-1">Behavioral Boundaries ("Never do X")</label>
                    <textarea value={value.boundaries || ''} onChange={e => updateField('boundaries', e.target.value)} placeholder="e.g. Never betray friends; Never harm children; Never speak or act on behalf of the User; Never break character." className="w-full text-sm bg-white dark:bg-warm-900 border border-warm-200 dark:border-warm-800 rounded-xl p-3 min-h-[80px] text-warm-900 dark:text-white" />
                  </div>
                )}

                {/* 11. Triggers & Comfort */}
                {sec.id === 'triggers' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-warm-700 dark:text-warm-300 mb-1">Emotional Triggers</label>
                      <input type="text" value={value.triggers || ''} onChange={e => updateField('triggers', e.target.value)} placeholder="e.g. Loud arguments, mention of trauma, sudden betrayal" className="w-full text-sm bg-white dark:bg-warm-900 border border-warm-200 dark:border-warm-800 rounded-xl px-3 py-2 text-warm-900 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-warm-700 dark:text-warm-300 mb-1">Comfort Methods</label>
                      <input type="text" value={value.comfort_methods || ''} onChange={e => updateField('comfort_methods', e.target.value)} placeholder="e.g. Gentle hugs, warm tea, forehead kisses, quiet space" className="w-full text-sm bg-white dark:bg-warm-900 border border-warm-200 dark:border-warm-800 rounded-xl px-3 py-2 text-warm-900 dark:text-white" />
                    </div>
                  </div>
                )}

                {/* 12. Relationships */}
                {sec.id === 'relationships' && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-bold text-warm-700 dark:text-warm-300">Structured Relationships</label>
                      <button type="button" onClick={addRelationship} className="text-xs text-red-500 font-bold flex items-center gap-1 hover:underline">
                        <Plus size={14} /> Add Relationship
                      </button>
                    </div>
                    {(value.relationships || []).length === 0 ? (
                      <p className="text-xs text-warm-400 italic">No explicit relationships added yet.</p>
                    ) : (
                      (value.relationships || []).map((rel, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <input type="text" value={rel.name} onChange={e => updateRelationship(idx, 'name', e.target.value)} placeholder="Name (e.g. Kamala)" className="flex-1 text-sm bg-white dark:bg-warm-900 border border-warm-200 dark:border-warm-800 rounded-xl px-3 py-2 text-warm-900 dark:text-white" />
                          <input type="text" value={rel.role} onChange={e => updateRelationship(idx, 'role', e.target.value)} placeholder="Role (e.g. Girlfriend)" className="flex-1 text-sm bg-white dark:bg-warm-900 border border-warm-200 dark:border-warm-800 rounded-xl px-3 py-2 text-warm-900 dark:text-white" />
                          <button type="button" onClick={() => removeRelationship(idx)} className="p-2 text-warm-400 hover:text-red-500 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* 13. Knowledge Scope */}
                {sec.id === 'knowledge' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-warm-700 dark:text-warm-300 mb-1">Knows (Expertise & Secrets)</label>
                      <textarea value={value.knows || ''} onChange={e => updateField('knows', e.target.value)} placeholder="e.g. High-level politics, Maison Verity lore, ancient languages" className="w-full text-sm bg-white dark:bg-warm-900 border border-warm-200 dark:border-warm-800 rounded-xl p-3 min-h-[80px] text-warm-900 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-warm-700 dark:text-warm-300 mb-1">Does NOT Know (Blind Spots)</label>
                      <textarea value={value.does_not_know || ''} onChange={e => updateField('does_not_know', e.target.value)} placeholder="e.g. Future events, user's private secrets, real-world events after 2026" className="w-full text-sm bg-white dark:bg-warm-900 border border-warm-200 dark:border-warm-800 rounded-xl p-3 min-h-[80px] text-warm-900 dark:text-white" />
                    </div>
                  </div>
                )}

                {/* 14. Abilities */}
                {sec.id === 'abilities' && (
                  <div>
                    <label className="block text-xs font-bold text-warm-700 dark:text-warm-300 mb-1">Abilities, Magic & Professional Skills</label>
                    <input type="text" value={value.abilities || ''} onChange={e => updateField('abilities', e.target.value)} placeholder="e.g. Master tactician, martial arts, fluent in 4 languages" className="w-full text-sm bg-white dark:bg-warm-900 border border-warm-200 dark:border-warm-800 rounded-xl px-3 py-2 text-warm-900 dark:text-white" />
                  </div>
                )}

                {/* 15. Secrets */}
                {sec.id === 'secrets' && (
                  <div>
                    <label className="block text-xs font-bold text-warm-700 dark:text-warm-300 mb-1">Secrets (Known to AI for subtext, hidden from User)</label>
                    <textarea value={value.secrets || ''} onChange={e => updateField('secrets', e.target.value)} placeholder="e.g. Secretly harbors guilt over past event; planning a surprise for user." className="w-full text-sm bg-white dark:bg-warm-900 border border-warm-200 dark:border-warm-800 rounded-xl p-3 min-h-[80px] text-warm-900 dark:text-white" />
                  </div>
                )}

                {/* 16. Dialogue & Writing Style */}
                {sec.id === 'dialogue' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-warm-700 dark:text-warm-300 mb-1">Narrative Writing Style</label>
                      <input type="text" value={value.writing_style || ''} onChange={e => updateField('writing_style', e.target.value)} placeholder="e.g. Third person, present tense, rich atmospheric descriptions, dialogue-focused" className="w-full text-sm bg-white dark:bg-warm-900 border border-warm-200 dark:border-warm-800 rounded-xl px-3 py-2 text-warm-900 dark:text-white" />
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="block text-xs font-bold text-warm-700 dark:text-warm-300">Few-Shot Example Dialogues</label>
                        <button type="button" onClick={addDialogue} className="text-xs text-red-500 font-bold flex items-center gap-1 hover:underline">
                          <Plus size={14} /> Add Dialogue Turn
                        </button>
                      </div>
                      {(value.example_dialogues || []).length === 0 ? (
                        <p className="text-xs text-warm-400 italic">No example dialogues added yet.</p>
                      ) : (
                        (value.example_dialogues || []).map((dial, idx) => (
                          <div key={idx} className="bg-white dark:bg-warm-900 border border-warm-200 dark:border-warm-800 p-3 rounded-xl space-y-2 relative">
                            <button type="button" onClick={() => removeDialogue(idx)} className="absolute top-3 right-3 text-warm-400 hover:text-red-500 transition-colors">
                              <Trash2 size={16} />
                            </button>
                            <div>
                              <label className="block text-xs font-bold text-warm-500 uppercase">User Input</label>
                              <input type="text" value={dial.user} onChange={e => updateDialogue(idx, 'user', e.target.value)} placeholder='e.g. "I had a bad day."' className="w-full text-sm bg-warm-50 dark:bg-warm-950 border border-warm-200 dark:border-warm-800 rounded-lg px-3 py-1.5 text-warm-900 dark:text-white mt-1" />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-warm-500 uppercase">Character Response</label>
                              <input type="text" value={dial.character} onChange={e => updateDialogue(idx, 'character', e.target.value)} placeholder='e.g. "Come here. Tell me everything."' className="w-full text-sm bg-warm-50 dark:bg-warm-950 border border-warm-200 dark:border-warm-800 rounded-lg px-3 py-1.5 text-warm-900 dark:text-white mt-1" />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
