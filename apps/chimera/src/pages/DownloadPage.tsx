import { Link } from 'react-router-dom';
import {
  ArrowLeft,
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
const GITHUB_ZIP_URL = `${GITHUB_REPO_URL}/archive/refs/heads/${GITHUB_BRANCH}.zip`;

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
                <span className="block text-[#f8d796]">Run CHIMERA locally.</span>
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-white/65">
                CHIMERA early access is download-first. Get the developer preview, run it with your own local environment, and use the official website as the front gate for updates, docs, and source access.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a href={GITHUB_ZIP_URL} className="inline-flex items-center gap-2 rounded-2xl bg-[#f5d18c] px-5 py-3 text-sm font-black text-black transition hover:-translate-y-0.5 hover:bg-[#ffe0a3]">
                  <Download size={16} />
                  Download ZIP
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
                  <p className="text-xl font-black text-white">Download the preview first</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-white/60">
                The official website is the front gate, but this early-access round is for people who want to download the source, run CHIMERA locally, and help shape the system before the hosted realm becomes the main public experience.
              </p>
              <div className="mt-5 rounded-2xl border border-[#f5d18c]/15 bg-[#f5d18c]/10 p-4">
                <p className="text-sm font-black text-[#f8d796]">Need the files?</p>
                <p className="mt-2 text-xs leading-5 text-white/55">
                  Use <span className="font-bold text-white">Download ZIP</span> for the direct source archive, or use GitHub if you want to clone, fork, inspect commits, or contribute.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 text-[#f8d796]" size={24} />
              <div>
                <h2 className="font-serif text-3xl font-black">What this download means</h2>
                <p className="mt-3 text-sm leading-7 text-white/58">
                  Downloading CHIMERA gives you access to the developer preview code for learning, local development, and contribution. It does not grant ownership of the CHIMERA name, official realms, logo, characters, lore, economy, or hosted production service.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {['Official production lives at chimera.it.com.', 'Local development uses your own local environment values.', 'Production Supabase data is not part of the downloadable preview.', 'Forks must not pretend to be official CHIMERA.'].map((item) => (
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
              <h2 className="font-serif text-3xl font-black">Run locally</h2>
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

        <section className="mt-8 rounded-[2rem] border border-white/10 bg-gradient-to-r from-[#1d1729] to-[#101a22] p-6">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-white/45">
                <Code2 size={13} />
                Source-available, not brand-free
              </div>
              <h2 className="mt-3 font-serif text-3xl font-black">CHIMERA is Dior’s creation.</h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-white/58">
                The code can be explored for learning, local development, and contribution. The official CHIMERA identity remains protected by the project license and brand rules.
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
