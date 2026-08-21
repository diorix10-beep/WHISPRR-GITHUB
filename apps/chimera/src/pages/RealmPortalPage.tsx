import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Code2,
  Compass,
  Download,
  ExternalLink,
  Gem,
  Github,
  MessageCircle,
  MonitorDown,
  ScrollText,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const GITHUB_REPO_URL = 'https://github.com/diorix10-beep/WHISPRR-GITHUB';

const realmCards = [
  {
    title: 'Roleplay Rooms',
    description: 'Meet AI characters, begin scenes, and test model-powered replies inside the official CHIMERA realm.',
    icon: MessageCircle,
    href: '/characters',
    accent: 'from-[#f6c56f] to-[#c8793f]',
  },
  {
    title: 'Storytelling Desk',
    description: 'Draft chapters, build worlds, and shape fiction with VELLUM as the storytelling side of CHIMERA.',
    icon: BookOpen,
    href: '/stories',
    accent: 'from-purple-400 to-cyan-400',
  },
  {
    title: 'Creator Systems',
    description: 'Personas, lorebooks, memories, chat styles, and device activity are being opened feature by feature.',
    icon: ScrollText,
    href: '/discover',
    accent: 'from-rose-400 to-amber-300',
  },
];

const statusItems = [
  {
    label: 'Works now',
    items: ['Public CHIMERA website', 'Character discovery', 'AI roleplay chats', 'Model-powered replies', 'Early PWA install support'],
  },
  {
    label: 'Experimental',
    items: ['Personas', 'Lorebooks', 'Chat styles', 'Device activity scenes', 'Local developer setup'],
  },
  {
    label: 'Coming next',
    items: ['More realms', 'Cleaner creator onboarding', 'Launcher-style downloads', 'Community spaces', 'Safer production migration flow'],
  },
];

export default function RealmPortalPage() {
  const { user, profile } = useAuth();
  const displayName = profile?.display_name || profile?.username || user?.email?.split('@')[0] || 'Realm Visitor';

  return (
    <main className="min-h-screen overflow-hidden bg-[#07080c] text-white">
      <section className="relative isolate px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_top_left,rgba(218,164,87,0.24),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(118,91,255,0.22),transparent_30%),linear-gradient(180deg,#08090f_0%,#11101a_48%,#07080c_100%)]" />
        <div className="absolute inset-x-0 top-0 -z-10 h-64 bg-[linear-gradient(90deg,transparent,rgba(245,209,140,0.16),transparent)] blur-3xl" />

        <div className="mx-auto flex max-w-7xl flex-col gap-8">
          <div className="flex flex-col gap-4 rounded-[2rem] border border-[#d6a656]/20 bg-black/30 p-4 shadow-2xl shadow-black/40 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
            <Link to="/" className="flex items-center gap-3">
              <img src="/chimera_logo.png" alt="CHIMERA" className="h-12 w-12 rounded-2xl object-contain shadow-[0_0_24px_rgba(245,209,140,0.28)]" />
              <div>
                <p className="font-serif text-2xl font-black tracking-[0.18em] text-[#f8d796]">CHIMERA</p>
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-white/45">Realm Network</p>
              </div>
            </Link>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                to={user ? '/dashboard' : '/auth'}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#f5d18c] px-4 py-2.5 text-sm font-black text-[#171006] shadow-lg shadow-[#f5d18c]/20 transition hover:-translate-y-0.5 hover:bg-[#ffe0a3]"
              >
                Enter CHIMERA
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/download"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/8 px-4 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-white/12"
              >
                <Download size={16} />
                Download
              </Link>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
            <div className="flex min-h-[520px] flex-col justify-between rounded-[2.5rem] border border-[#d6a656]/20 bg-[#0b0c13]/80 p-6 shadow-2xl shadow-black/50 backdrop-blur-xl sm:p-8 lg:p-10">
              <div>
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#f5d18c]/25 bg-[#f5d18c]/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#f8d796]">
                  <Sparkles size={14} />
                  Early Realm Access
                </div>
                <h1 className="max-w-4xl font-serif text-5xl font-black leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-7xl">
                  The realms are not complete yet —
                  <span className="block bg-gradient-to-r from-[#f8d796] via-[#d5a957] to-[#ff8f70] bg-clip-text text-transparent">
                    but they are awake.
                  </span>
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-white/68">
                  CHIMERA is an official realm network for AI characters, roleplay, storytelling, worldbuilding, personas, lorebooks, and creator-led fiction. A first playable part of the platform is live now.
                </p>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-4">
                  <p className="text-3xl font-black text-[#f8d796]">01</p>
                  <p className="mt-1 text-sm font-bold text-white">Official web realm</p>
                  <p className="mt-1 text-xs leading-5 text-white/45">Hosted at chimera.it.com.</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-4">
                  <p className="text-3xl font-black text-[#f8d796]">PWA</p>
                  <p className="mt-1 text-sm font-bold text-white">Installable app</p>
                  <p className="mt-1 text-xs leading-5 text-white/45">One-tap launch where supported.</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-4">
                  <p className="text-3xl font-black text-[#f8d796]">Dev</p>
                  <p className="mt-1 text-sm font-bold text-white">Run locally</p>
                  <p className="mt-1 text-xs leading-5 text-white/45">GitHub preview for builders.</p>
                </div>
              </div>
            </div>

            <aside className="rounded-[2.5rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-6">
              <div className="rounded-[2rem] border border-[#f5d18c]/20 bg-[#101018] p-5">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-[#f5d18c]/30 blur-xl" />
                    <img src="/chimera_logo.png" alt="" className="relative h-20 w-20 rounded-full border border-[#f5d18c]/30 bg-black/40 object-contain p-2" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.24em] text-white/40">Signed in as</p>
                    <p className="mt-1 text-2xl font-black text-white">{displayName}</p>
                    <p className="text-sm font-semibold text-[#f8d796]">{user ? 'Realm account active' : 'Guest at the gate'}</p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <Link to="/profile" className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 transition hover:bg-white/10">
                    <UserRound size={18} className="text-[#f8d796]" />
                    <p className="mt-2 text-sm font-black">My Profile</p>
                  </Link>
                  <Link to="/shards" className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 transition hover:bg-white/10">
                    <Gem size={18} className="text-[#f8d796]" />
                    <p className="mt-2 text-sm font-black">SHARDS</p>
                  </Link>
                  <Link to="/characters" className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 transition hover:bg-white/10">
                    <Users size={18} className="text-[#f8d796]" />
                    <p className="mt-2 text-sm font-black">Characters</p>
                  </Link>
                  <Link to="/worlds" className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 transition hover:bg-white/10">
                    <Compass size={18} className="text-[#f8d796]" />
                    <p className="mt-2 text-sm font-black">Worlds</p>
                  </Link>
                </div>
              </div>

              <div className="mt-5 rounded-[2rem] border border-blue-400/20 bg-blue-950/20 p-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 text-blue-200" size={22} />
                  <div>
                    <p className="font-black text-blue-100">Fiction-first, not impersonation.</p>
                    <p className="mt-2 text-sm leading-6 text-blue-100/70">
                      CHIMERA hosts fictional, AI-generated roleplay experiences. Characters may be inspired by archetypes or user-created lore, but the platform must not claim to be the real person behind a fictionalized portrayal.
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="px-4 pb-12 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-3">
          {realmCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.title} to={card.href} className="group rounded-[2rem] border border-white/10 bg-white/[0.05] p-5 shadow-xl shadow-black/20 transition hover:-translate-y-1 hover:bg-white/[0.08]">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${card.accent} text-black shadow-lg`}>
                  <Icon size={24} />
                </div>
                <h2 className="mt-5 font-serif text-2xl font-black text-white">{card.title}</h2>
                <p className="mt-3 text-sm leading-6 text-white/58">{card.description}</p>
                <p className="mt-5 inline-flex items-center gap-2 text-sm font-black text-[#f8d796]">
                  Open gate
                  <ArrowRight size={15} className="transition group-hover:translate-x-1" />
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="px-4 pb-12 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-[2rem] border border-[#f5d18c]/20 bg-[#121018] p-6">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#f8d796]">Download path</p>
            <h2 className="mt-3 font-serif text-4xl font-black text-white">Official realm first. Local gate for builders.</h2>
            <p className="mt-4 text-sm leading-7 text-white/60">
              The easiest way to play is the official website. The GitHub version is a developer preview for people who want to run CHIMERA locally, study the code, or contribute.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/download" className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-black text-black transition hover:bg-[#f8d796]">
                <MonitorDown size={16} />
                Download / Run locally
              </Link>
              <a href={GITHUB_REPO_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-2xl border border-white/15 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/10">
                <Github size={16} />
                GitHub
                <ExternalLink size={13} />
              </a>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {statusItems.map((group) => (
              <div key={group.label} className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
                <p className="font-serif text-2xl font-black text-white">{group.label}</p>
                <ul className="mt-4 space-y-3">
                  {group.items.map((item) => (
                    <li key={item} className="flex gap-2 text-sm leading-5 text-white/60">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f8d796]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-white/10 bg-gradient-to-r from-[#211323] via-[#120f18] to-[#10212a] p-6 shadow-2xl shadow-black/30 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-white/55">
                <Code2 size={13} />
                Ownership & source access
              </div>
              <h2 className="mt-4 font-serif text-3xl font-black text-white">You may explore the code. You may help build the gates. CHIMERA remains Dior’s creation.</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-white/58">
                CHIMERA is source-available for learning, local development, and contribution. The CHIMERA name, logo, official realms, characters, lore, economy, and brand identity remain protected.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a href={`${GITHUB_REPO_URL}/blob/sync/chimera-main/LICENSE`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-2xl border border-white/15 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/10">
                License
                <ExternalLink size={13} />
              </a>
              <a href={`${GITHUB_REPO_URL}/blob/sync/chimera-main/BRAND.md`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-2xl border border-white/15 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/10">
                Brand rules
                <ExternalLink size={13} />
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
