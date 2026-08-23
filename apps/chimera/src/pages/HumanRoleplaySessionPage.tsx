import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, LockKeyhole, Send, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Session = { id: string; creator_id: string; title: string; description: string; setting: string; lore: string; rules: string; objectives: string; visibility: string; status: string; max_participants: number };
type Participant = { id: string; user_id: string; role: string; status: string; is_creator: boolean };
type Character = { id: string; owner_id: string; name: string; description: string };
type Message = { id: string; sender_id: string; character_id: string | null; message_type: string; content: string; sequence_number: number; created_at: string };

export default function HumanRoleplaySessionPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [messageType, setMessageType] = useState('dialogue');
  const [characterId, setCharacterId] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [realtimeState, setRealtimeState] = useState('connecting');
  const [showCharacterForm, setShowCharacterForm] = useState(false);
  const [characterName, setCharacterName] = useState('');
  const [characterDescription, setCharacterDescription] = useState('');
  const [characterSaving, setCharacterSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!sessionId) return;
    const load = async () => {
      const [sessionResult, participantResult, characterResult, messageResult] = await Promise.all([
        supabase.from('human_roleplay_sessions').select('*').eq('id', sessionId).single(),
        supabase.from('human_roleplay_participants').select('id, user_id, role, status, is_creator').eq('session_id', sessionId),
        supabase.from('human_roleplay_characters').select('id, owner_id, name, description').eq('session_id', sessionId),
        supabase.from('human_roleplay_messages').select('id, sender_id, character_id, message_type, content, sequence_number, created_at').eq('session_id', sessionId).is('deleted_at', null).order('sequence_number', { ascending: true }),
      ]);
      setSession(sessionResult.data as Session | null); setParticipants((participantResult.data ?? []) as Participant[]); setCharacters((characterResult.data ?? []) as Character[]); setLoading(false);
      setMessages((messageResult.data ?? []) as Message[]);
    };
    void load();
    const channel = supabase.channel(`human-roleplay:${sessionId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'human_roleplay_messages', filter: `session_id=eq.${sessionId}` }, payload => {
        const incoming = payload.new as Message;
        setMessages(current => current.some(message => message.id === incoming.id) ? current : [...current, incoming].sort((a, b) => a.sequence_number - b.sequence_number));
      })
      .subscribe(status => setRealtimeState(status === 'SUBSCRIBED' ? 'live' : status.toLowerCase()));
    return () => { void supabase.removeChannel(channel); };
  }, [sessionId]);
  const sendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!sessionId || !draft.trim() || sending) return;
    setSending(true); setSendError('');
    const { data, error } = await supabase.rpc('send_human_roleplay_message', { p_session_id: sessionId, p_content: draft.trim(), p_message_type: messageType, p_character_id: characterId || null });
    if (error) setSendError(error.message); else if (data) setMessages(current => current.some(message => message.id === (data as Message).id) ? current : [...current, data as Message]);
    if (!error) setDraft('');
    setSending(false);
  };
  const createCharacter = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!sessionId || !characterName.trim() || characterSaving) return;
    setCharacterSaving(true);
    const { data } = await supabase.rpc('create_human_roleplay_character', { p_session_id: sessionId, p_name: characterName.trim(), p_description: characterDescription.trim() });
    if (data) { setCharacters(current => [...current, data as Character]); setCharacterName(''); setCharacterDescription(''); setShowCharacterForm(false); }
    setCharacterSaving(false);
  };
  if (loading) return <main className="min-h-screen bg-[#08090e] p-8 text-white"><div className="mx-auto max-w-6xl animate-pulse rounded-3xl bg-white/5 p-12" /></main>;
  if (!session) return <main className="min-h-screen bg-[#08090e] p-8 text-white"><div className="mx-auto max-w-2xl rounded-3xl border border-rose-300/20 bg-rose-500/10 p-8"><h1 className="font-serif text-3xl">Session unavailable</h1><p className="mt-3 text-sm text-rose-100/80">This Human Roleplay session is private or no longer exists.</p><button onClick={() => navigate('/human-roleplay')} className="mt-6 text-sm font-bold text-[#e8c378]">Return to Human Roleplay</button></div></main>;
  return <main className="min-h-screen bg-[#08090e] px-4 py-8 text-white sm:px-6 lg:px-8"><div className="mx-auto max-w-6xl"><button onClick={() => navigate('/human-roleplay')} className="inline-flex items-center gap-2 text-xs font-bold text-[#b9aea3]"><ArrowLeft size={15} /> Human Roleplay</button><header className="mt-6 rounded-[2rem] border border-[#c99b50]/25 bg-[#11121a]/95 p-7 sm:p-10"><div className="flex flex-col justify-between gap-6 md:flex-row"><div><div className="inline-flex items-center gap-2 rounded-full border border-[#c99b50]/30 bg-[#c99b50]/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.2em] text-[#e8c378]"><LockKeyhole size={13} /> Human Roleplay · {session.visibility.replace('_', ' ')}</div><h1 className="mt-5 font-serif text-4xl font-extrabold sm:text-5xl">{session.title}</h1><p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#cfc2b4]">{session.description || 'A shared world created for real people.'}</p></div><div className="rounded-2xl border border-white/10 bg-white/[.03] p-5 md:min-w-48"><p className="text-xs font-bold uppercase tracking-wider text-[#958a80]">Participants</p><p className="mt-2 font-serif text-3xl">{participants.length} <span className="text-lg text-[#958a80]">/ {session.max_participants}</span></p><p className="mt-2 text-[10px] uppercase tracking-wider text-[#958a80]">Realtime: {realtimeState}</p></div></div></header><div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_.8fr]"><section className="rounded-3xl border border-white/10 bg-[#11121a]/90 p-7"><div className="flex items-center gap-3"><BookOpen className="text-[#e8c378]" size={21} /><div><h2 className="font-serif text-2xl">The shared timeline</h2><p className="mt-1 text-xs text-[#958a80]">A live room for real people, separate from AI Roleplay.</p></div></div><div className="mt-8 max-h-[32rem] space-y-3 overflow-y-auto pr-1">{messages.length ? messages.map(message => <article key={message.id} className="rounded-2xl border border-white/10 bg-white/[.03] p-4"><div className="flex items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-wider text-[#958a80]"><span>{message.message_type}{message.character_id ? ' · in character' : ''}</span><time>{new Date(message.created_at).toLocaleString()}</time></div><p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#e6d9ca]">{message.content}</p></article>) : <div className="rounded-2xl border border-dashed border-white/15 px-5 py-16 text-center"><p className="font-serif text-2xl">The first scene has not begun.</p><p className="mt-2 text-sm text-[#a99d91]">Write the opening move and invite your scene partner.</p></div>}</div><form onSubmit={sendMessage} className="mt-5 border-t border-white/10 pt-5"><div className="grid gap-3 sm:grid-cols-[auto_auto_1fr_auto]"><select value={messageType} onChange={event => setMessageType(event.target.value)} className="rounded-xl border border-white/10 bg-[#0b0c12] px-3 py-3 text-xs text-white"><option value="dialogue">Dialogue</option><option value="action">Action</option><option value="narration">Narration</option></select><select value={characterId} onChange={event => setCharacterId(event.target.value)} className="rounded-xl border border-white/10 bg-[#0b0c12] px-3 py-3 text-xs text-white"><option value="">As yourself</option>{characters.filter(character => participants.some(participant => participant.user_id === character.owner_id)).map(character => <option key={character.id} value={character.id}>{character.name}</option>)}</select><input value={draft} onChange={event => setDraft(event.target.value)} placeholder="Write the next move…" className="rounded-xl border border-white/10 bg-[#0b0c12] px-3 py-3 text-sm text-white placeholder:text-[#6f675f]" /><button disabled={sending || !draft.trim()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#d9b66c] px-4 py-3 text-sm font-extrabold text-[#2a1c12] disabled:opacity-50"><Send size={15} />{sending ? 'Sending…' : 'Send'}</button></div>{sendError && <p className="mt-3 text-xs font-bold text-rose-300">{sendError}</p>}<p className="mt-3 text-[10px] text-[#958a80]">Normal Human Roleplay messages do not cost SHARDS.</p></form></section><aside className="space-y-6"><section className="rounded-3xl border border-white/10 bg-[#11121a]/90 p-6"><div className="flex items-center gap-3"><Users className="text-[#e8c378]" size={20} /><h2 className="font-serif text-2xl">People in this world</h2></div><div className="mt-5 space-y-3">{participants.map(participant => <div key={participant.id} className="rounded-xl border border-white/10 bg-white/[.03] p-3 text-sm"><p className="font-bold">{participant.is_creator ? 'Creator' : 'Participant'}</p><p className="mt-1 text-xs text-[#958a80]">{participant.status}</p></div>)}</div></section><section className="rounded-3xl border border-white/10 bg-[#11121a]/90 p-6"><h2 className="font-serif text-2xl">World notes</h2><Note label="Setting" value={session.setting} /><Note label="Lore" value={session.lore} /><Note label="Rules" value={session.rules} /><Note label="Objectives" value={session.objectives} /></section><section className="rounded-3xl border border-dashed border-[#c99b50]/25 bg-[#c99b50]/5 p-6"><div className="flex items-center justify-between gap-3"><h2 className="font-serif text-xl">Characters</h2><button onClick={() => setShowCharacterForm(value => !value)} className="text-xs font-bold text-[#e8c378]">{showCharacterForm ? 'Close' : 'Create character'}</button></div>{showCharacterForm && <form onSubmit={createCharacter} className="mt-4 space-y-3"><input value={characterName} onChange={event => setCharacterName(event.target.value)} required placeholder="Character name" className="w-full rounded-xl border border-white/10 bg-[#0b0c12] px-3 py-3 text-sm text-white placeholder:text-[#6f675f]" /><textarea value={characterDescription} onChange={event => setCharacterDescription(event.target.value)} placeholder="A short introduction" rows={3} className="w-full resize-y rounded-xl border border-white/10 bg-[#0b0c12] px-3 py-3 text-sm text-white placeholder:text-[#6f675f]" /><button disabled={characterSaving} className="w-full rounded-xl bg-[#d9b66c] px-3 py-3 text-xs font-extrabold text-[#2a1c12]">{characterSaving ? 'Creating…' : 'Add to this world'}</button></form>}{characters.length ? characters.map(character => <div key={character.id} className="mt-3 rounded-xl border border-white/10 p-3"><p className="font-bold">{character.name}</p><p className="mt-1 text-xs text-[#a99d91]">{character.description || 'No description yet.'}</p></div>) : <p className="mt-2 text-sm text-[#a99d91]">Create the first character for this world.</p>}</section></aside></div></div></main>;
}

function Note({ label, value }: { label: string; value: string }) { return <div className="mt-4"><p className="text-[10px] font-extrabold uppercase tracking-wider text-[#e8c378]">{label}</p><p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[#b9aea3]">{value || 'Not defined yet.'}</p></div>; }
