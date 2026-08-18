import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, LockKeyhole, Plus, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Session = { id: string; title: string; description: string; visibility: string; status: string; max_participants: number; updated_at: string };

export default function HumanRoleplayHubPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('human_roleplay_sessions').select('id, title, description, visibility, status, max_participants, updated_at').order('updated_at', { ascending: false });
      setSessions((data ?? []) as Session[]);
      setLoading(false);
    };
    void load();
  }, []);

  return <main className="min-h-screen bg-[#08090e] px-4 py-10 text-white sm:px-6 lg:px-8">
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#e8c378]">Human Roleplay</p><h1 className="mt-3 font-serif text-4xl font-extrabold sm:text-5xl">Enter a shared world.</h1><p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#cfc2b4]">Create a private scenario and invite real people to shape it with you. This space is separate from Lia and every AI conversation.</p></div>
        <Link to="/human-roleplay/create" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#d9b66c] px-5 py-3 text-sm font-extrabold text-[#2a1c12]"><Plus size={17} /> Create a session</Link>
      </div>
      <section className="mt-10 rounded-3xl border border-[#c99b50]/25 bg-[#11121a]/90 p-6 sm:p-8">
        <div className="flex items-center gap-3"><LockKeyhole className="text-[#e8c378]" size={21} /><div><h2 className="font-serif text-2xl">Your sessions</h2><p className="mt-1 text-sm text-[#a99d91]">Private and invite-only sessions you can access appear here.</p></div></div>
        {loading ? <div className="mt-6 h-24 animate-pulse rounded-2xl bg-white/5" /> : sessions.length ? <div className="mt-6 grid gap-4 md:grid-cols-2">{sessions.map(session => <Link key={session.id} to={`/human-roleplay/${session.id}`} className="rounded-2xl border border-white/10 bg-white/[.03] p-5 transition hover:border-[#c99b50]/50 hover:bg-white/[.06]"><div className="flex items-start justify-between gap-3"><div><h3 className="font-serif text-xl">{session.title}</h3><p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#b9aea3]">{session.description || 'A new shared world waiting to begin.'}</p></div><ArrowRight className="shrink-0 text-[#e8c378]" size={18} /></div><div className="mt-5 flex items-center gap-4 text-xs font-bold uppercase tracking-wider text-[#958a80]"><span className="inline-flex items-center gap-1"><Users size={14} /> Up to {session.max_participants}</span><span>{session.visibility.replace('_', ' ')}</span></div></Link>)}</div> : <div className="mt-6 rounded-2xl border border-dashed border-white/15 px-5 py-12 text-center"><Users className="mx-auto text-[#e8c378]/70" size={28} /><p className="mt-4 font-serif text-xl">No Human Roleplay sessions yet.</p><p className="mt-2 text-sm text-[#a99d91]">Start a private world and invite someone you trust.</p><Link to="/human-roleplay/create" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#e8c378]">Create your first session <ArrowRight size={15} /></Link></div>}
      </section>
    </div>
  </main>;
}
