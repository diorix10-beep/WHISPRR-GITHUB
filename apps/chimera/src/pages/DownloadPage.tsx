import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Code2,
  Copy,
  Download,
  ExternalLink,
  Github,
  MonitorDown,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
} from 'lucide-react';

const GITHUB_REPO_URL = 'https://github.com/diorix10-beep/WHISPRR-GITHUB';
const GITHUB_BRANCH = 'sync/chimera-main';

const setupSteps = [
  {
    title: 'Clone the repository',
    command: 'git clone https://github.com/diorix10-beep/WHISPRR-GITHUB.git',
  },
  {
    title: 'Install dependencies',
    command: 'npm install',
  },
  {
    title: 'Prepare local environment values',
    command: 'cp .env.example .env',
  },
  {
    title: 'Start local Supabase with Docker',
    command: 'npm run supabase:local:start',
  },
  {
    title: 'Run CHIMERA locally',
    command: 'npm run dev:chimera:local',
  },
];

export default function DownloadPage() {
  const copyCommand = async (command: string) => {
    await navigator.clipboard?.writeText(command);
  };

  return (
    <main className="min-h-screen bg-[#07080c] px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Link to="/" className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-bold text-white/75 transition hover:bg-white/10 hover:text-white">
          <ArrowLeft size={16} />
          Back to Realm Portal
        </Link>

        <section className="mt-8 overflow-hidden rounded-[2.5rem] border border-[#f5d18c]/20 bg-[radial-gradient(circle_at_top_left,rgba(245,209,140,0.18),transparent_34%),linear-gradient(135deg,#11101a,#07080c)] p-6 shadow-2xl shadow-black/40 sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#f5d18c]/20 bg-[#f5d18c]/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#f8d796]">
                <MonitorDown size={14} />
                CHIMERA Developer Preview
              </div>
              <h1 className="mt-5 font-serif text-5xl font-black leading-none text-white sm:text-6xl">
                Download the gate.
                <span className="block text-[#f8d796]">Or enter the realm.</span>
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-white/65">
                Enter CHIMERA in your browser, or install the native desktop app for a focused workspace that keeps the same characters, stories, worlds, and roleplays close at hand.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link to="/discover" className="inline-flex items-center gap-2 rounded-2xl bg-[#f5d18c] px-5 py-3 text-sm font-black text-black transition hover:-translate-y-0.5 hover:bg-[#ffe0a3]">
                  Enter Realm
                  <ArrowRight size={16} />
                </Link>
                <a href="#desktop-installers" className="inline-flex items-center gap-2 rounded-2xl bg-[#f5d18c] px-5 py-3 text-sm font-black text-black transition hover:-translate-y-0.5 hover:bg-[#ffe0a3]">
                  <Download size={16} />
                  Get CHIMERA Desktop
                </a>
                <a href={GITHUB_REPO_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.06] px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-white/10">
                  <Github size={16} />
                  Open GitHub
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-black/30 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5d18c] text-black">
                  <Download size={22} />
                </div>
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.16em] text-white/40">Recommended now</p>
                  <p className="text-xl font-black text-white">Choose your gate</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-white/60">
                If someone only wants to see CHIMERA, they should enter the public realm. If they want a normal installed application, they should choose the desktop installer. Source code remains available separately for developers.
              </p>
              <div className="mt-5 rounded-2xl border border-[#f5d18c]/15 bg-[#f5d18c]/10 p-4">
                <p className="text-sm font-black text-[#f8d796]">Desktop app first</p>
                <p className="mt-2 text-xs leading-5 text-white/55">
                  Install CHIMERA like a normal application. Use <span className="font-bold text-white">Developer Access</span> only when you want to inspect, clone, or contribute to the source.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="desktop-installers" className="mt-8 scroll-mt-6 rounded-[2rem] border border-[#f5d18c]/20 bg-[#15131d] p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#f8d796]">Native desktop</p>
              <h2 className="mt-2 font-serif text-3xl font-black">Installers are being prepared</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-white/58">The Tauri 2 desktop shell is now part of the project. Signed macOS and Windows installers will appear here once their target-platform builds are produced.</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2 text-xs font-black">
              <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-white/55">macOS · .dmg pending</span>
              <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-white/55">Windows · .msi pending</span>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 text-[#f8d796]" size={24} />
              <div>
                <h2 className="font-serif text-3xl font-black">Choose your way into CHIMERA</h2>
                <p className="mt-3 text-sm leading-7 text-white/58">
                  The desktop application is for people who want to use CHIMERA. Developer Access is for people who want to study or contribute to the project. They are intentionally separate downloads.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {['The desktop app keeps the official CHIMERA identity.', 'Sign in with the same account you use on the web.', 'The app uses the existing secure Supabase and server API boundary.', 'Developer builds and forks must not pretend to be official CHIMERA.'].map((item) => (
                <div key={item} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-sm text-white/68">
                  <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-300" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[#0d0e15] p-6">
            <div className="flex items-center gap-3">
              <TerminalSquare className="text-[#f8d796]" size={24} />
              <h2 className="font-serif text-3xl font-black">Developer Access</h2>
            </div>
            <div className="mt-5 space-y-3">
              {setupSteps.map((step, index) => (
                <div key={step.command} className="rounded-2xl border border-white/10 bg-black/35 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-white">
                      {index + 1}. {step.title}
                    </p>
                    <button
                      type="button"
                      onClick={() => void copyCommand(step.command)}
                      className="rounded-xl border border-white/10 p-2 text-white/45 transition hover:bg-white/10 hover:text-white"
                      aria-label={`Copy command: ${step.title}`}
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                  <pre className="mt-3 overflow-x-auto rounded-xl bg-black/55 p-3 text-xs text-[#f8d796]"><code>{step.command}</code></pre>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-[#f5d18c]/20 bg-gradient-to-r from-[#1d1729] to-[#101a22] p-6">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-white/45">
                <Code2 size={13} />
                Source-available, not brand-free
              </div>
              <h2 className="mt-3 font-serif text-3xl font-black">Need the source code?</h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-white/58">
                Open the repository only if you are a developer, contributor, or auditor. The official CHIMERA identity remains protected by the project license and brand rules.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a href={`${GITHUB_REPO_URL}/blob/sync/chimera-main/LICENSE`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-black text-black transition hover:bg-[#f8d796]">
                License
                <ExternalLink size={13} />
              </a>
              <a href={`${GITHUB_REPO_URL}/blob/sync/chimera-main/BRAND.md`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-2xl border border-white/15 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/10">
                Brand rules
                <ExternalLink size={13} />
              </a>
            </div>
          </div>
        </section>

        <p className="mt-8 flex items-center justify-center gap-2 text-center text-sm text-white/35">
          <Sparkles size={14} />
          The realms are not complete yet — but they are awake.
        </p>
      </div>
    </main>
  );
}
