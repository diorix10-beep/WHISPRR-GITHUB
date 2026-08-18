import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, LockKeyhole, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Session = { id: string; creator_id: string; title: string; description: string; setting: string; lore: string; rules: string; objectives: string; visibility: string; status: string; max_participants: number };
type Participant = { id: string; user_id: string; role: string; status: string; is_creator: boolean };
type Character = { id: string; owner_id: string; name: string; description: string };

export default function HumanRoleplaySessionPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!sessionId) return;
    const load = async () => {
      const [sessionResult, participantResult, characterResult] = await Promise.all([
        supabase.from('human_roleplay_sessions').select('*').eq('id', sessionId).single(),
        supabase.from('human_roleplay_participants').select('id, user_id, role, status, is_creator').eq('session_id', sessionId),
        supabase.from('human_roleplay_characters').select('id, owner_id, name, description').eq('session_id', sessionId),
      ]);
      setSession(sessionResult.data as Session | null); setParticipants((participantResult.data ?? []) as Participant[]); setCharacters((characterResult.data ?? []) as Character[]); setLoading(false);
    };
    void load();
  }, [sessionId]);
  if (loading) return <main className="min-h-screen bg-[#08090e] p-8 text-white"><div className="mx-auto max-w-6xl animate-pulse rounded-3xl bg-white/5 p-12" /></main>;
  if (!session) return <main className="min-h-screen bg-[#08090e] p-8 text-white"><div className="mx-auto max-w-2xl rounded-3xl border border-rose-300/20 bg-rose-500/10 p-8"><h1 className="font-serif text-3xl">Session unavailable</h1><p className="mt-3 text-sm text-rose-100/80">This Human Roleplay session is private or no longer exists.</p><button onClick={() => navigate('/human-roleplay')} className="mt-6 text-sm font-bold text-[#e8c378]">Return to Human Roleplay</button></div></main>;
  return <main className="min-h-screen bg-[#08090e] px-4 py-8 text-white sm:px-6 lg:px-8"><div className="mx-auto max-w-6xl"><button onClick={() => navigate('/human-roleplay')} className="inline-flex items-center gap-2 text-xs font-bold text-[#b9aea3]"><ArrowLeft size={15} /> Human Roleplay</button><header className="mt-6 rounded-[2rem] border border-[#c99b50]/25 bg-[#11121a]/95 p-7 sm:p-10"><div className="flex flex-col justify-between gap-6 md:flex-row"><div><div className="inline-flex items-center gap-2 rounded-full border border-[#c99b50]/30 bg-[#c99b50]/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.2em] text-[#e8c378]"><LockKeyhole size={13} /> Human Roleplay · {session.visibility.replace('_', ' ')}</div><h1 className="mt-5 font-serif text-4xl font-extrabold sm:text-5xl">{session.title}</h1><p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#cfc2b4]">{session.description || 'A shared world created for real people.'}</p></div><div className="rounded-2xl border border-white/10 bg-white/[.03] p-5 md:min-w-48"><p className="text-xs font-bold uppercase tracking-wider text-[#958a80]">Participants</p><p className="mt-2 font-serif text-3xl">{participants.length} <span className="text-lg text-[#958a80]">/ {session.max_participants}</span></p></div></div></header><div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_.8fr]"><section className="rounded-3xl border border-white/10 bg-[#11121a]/90 p-7"><div className="flex items-center gap-3"><BookOpen className="text-[#e8c378]" size={21} /><div><h2 className="font-serif text-2xl">The shared timeline</h2><p className="mt-1 text-xs text-[#958a80]">Your messages and events will live here separately from AI Roleplay.</p></div></div><div className="mt-8 rounded-2xl border border-dashed border-white/15 px-5 py-16 text-center"><p className="font-serif text-2xl">The first scene has not begun.</p><p className="mt-2 text-sm text-[#a99d91]">Phase 1 establishes the private world. Turn-by-turn messages will be added next.</p></div></section><aside className="space-y-6"><section className="rounded-3xl border border-white/10 bg-[#11121a]/90 p-6"><div className="flex items-center gap-3"><Users className="text-[#e8c378]" size={20} /><h2 className="font-serif text-2xl">People in this world</h2></div><div className="mt-5 space-y-3">{participants.map(participant => <div key={participant.id} className="rounded-xl border border-white/10 bg-white/[.03] p-3 text-sm"><p className="font-bold">{participant.is_creator ? 'Creator' : 'Participant'}</p><p className="mt-1 text-xs text-[#958a80]">{participant.status}</p></div>)}</div></section><section className="rounded-3xl border border-white/10 bg-[#11121a]/90 p-6"><h2 className="font-serif text-2xl">World notes</h2><Note label="Setting" value={session.setting} /><Note label="Lore" value={session.lore} /><Note label="Rules" value={session.rules} /><Note label="Objectives" value={session.objectives} /></section><section className="rounded-3xl border border-dashed border-[#c99b50]/25 bg-[#c99b50]/5 p-6"><h2 className="font-serif text-xl">Characters</h2>{characters.length ? characters.map(character => <div key={character.id} className="mt-3 rounded-xl border border-white/10 p-3"><p className="font-bold">{character.name}</p><p className="mt-1 text-xs text-[#a99d91]">{character.description || 'No description yet.'}</p></div>) : <p className="mt-2 text-sm text-[#a99d91]">Characters will be created inside this session.</p>}</section></aside></div></div></main>;
}

function Note({ label, value }: { label: string; value: string }) { return <div className="mt-4"><p className="text-[10px] font-extrabold uppercase tracking-wider text-[#e8c378]">{label}</p><p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[#b9aea3]">{value || 'Not defined yet.'}</p></div>; }
