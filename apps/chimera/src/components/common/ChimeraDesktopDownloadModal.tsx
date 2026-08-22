import { useState, useEffect } from 'react';
import { 
  X, Download, Monitor, Cpu, Shield, Sparkles, Check, 
  Code, FolderArchive, ExternalLink, Terminal, ChevronDown, ChevronUp, Laptop
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

interface ChimeraDesktopDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChimeraDesktopDownloadModal({ isOpen, onClose }: ChimeraDesktopDownloadModalProps) {
  const { showToast } = useToast();
  const [userOs, setUserOs] = useState<'mac' | 'windows' | 'linux'>('mac');
  const [showDeveloperSection, setShowDeveloperSection] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    // OS Auto-Detection
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (userAgent.includes('win')) {
      setUserOs('windows');
    } else if (userAgent.includes('mac')) {
      setUserOs('mac');
    } else if (userAgent.includes('linux')) {
      setUserOs('linux');
    }
  }, []);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const downloadLinks = {
    mac: {
      fileName: 'CHIMERA-Desktop-1.0.0-mac-arm64.dmg',
      label: 'Download CHIMERA for Mac',
      sublabel: 'macOS 12.0+ (Apple Silicon & Intel) • 84.2 MB .dmg',
      url: '/downloads/CHIMERA-Desktop-Setup-1.0.0.dmg',
      format: '.dmg'
    },
    windows: {
      fileName: 'CHIMERA-Desktop-1.0.0-Setup.exe',
      label: 'Download CHIMERA for Windows',
      sublabel: 'Windows 10 / 11 (64-bit) • 92.6 MB .exe',
      url: '/downloads/CHIMERA-Desktop-Setup-1.0.0.exe',
      format: '.exe'
    },
    linux: {
      fileName: 'CHIMERA-Desktop-1.0.0-x86_64.AppImage',
      label: 'Download CHIMERA for Linux',
      sublabel: 'Ubuntu / Debian / Arch • 88.1 MB .AppImage',
      url: '/downloads/CHIMERA-Desktop-Setup-1.0.0.AppImage',
      format: '.AppImage'
    }
  };

  const currentDownload = downloadLinks[userOs];

  const handleDownloadInstaller = (osType: 'mac' | 'windows' | 'linux') => {
    setIsDownloading(true);
    const target = downloadLinks[osType];

    // Trigger download
    const link = document.createElement('a');
    link.href = target.url;
    link.download = target.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Starting ${target.label} download (${target.format})...`, 'success');

    setTimeout(() => {
      setIsDownloading(false);
    }, 2000);
  };

  const handleDownloadSourceZip = () => {
    const link = document.createElement('a');
    link.href = 'https://github.com/diorix10-beep/CHIMERA-GITHUB/archive/refs/heads/main.zip';
    link.download = 'CHIMERA-Source-Code-v1.0.0.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Downloading CHIMERA Developer Source Code (.ZIP)...', 'info');
  };

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Download CHIMERA Desktop Application"
    >
      {/* Ambient Backdrop */}
      <div className="absolute inset-0 bg-warm-950/90 backdrop-blur-2xl" />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto no-scrollbar flex flex-col gap-0 rounded-3xl shadow-2xl border border-amber-500/20 bg-warm-900/95 backdrop-blur-2xl text-white animate-scale-in">
        
        {/* Header Header Banner */}
        <div className="relative p-6 sm:p-8 border-b border-white/10 overflow-hidden bg-gradient-to-br from-warm-950 via-warm-900 to-red-950/40">
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-amber-600/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-widest">
                <Monitor size={14} className="text-amber-400" />
                <span>CHIMERA Native Desktop Realm</span>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Install CHIMERA Desktop
              </h2>
              <p className="text-sm text-warm-300 font-medium leading-relaxed max-w-lg">
                Run CHIMERA natively on your computer with full local memory persistence, ultra-low latency roleplay, and zero browser distraction.
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-warm-400 hover:text-white transition-all hover:scale-105 active:scale-95"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 sm:p-8 space-y-6">

          {/* Primary Main Installer CTA Box */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-red-950/60 via-warm-950/80 to-amber-950/40 border border-amber-500/30 space-y-5 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                  <Laptop size={24} />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-white">
                    {currentDownload.label}
                  </h3>
                  <p className="text-xs text-amber-200/80 font-medium mt-0.5">
                    {currentDownload.sublabel}
                  </p>
                </div>
              </div>

              {/* OS Selector Tabs */}
              <div className="flex items-center gap-1 bg-warm-950/80 p-1 rounded-xl border border-white/10 text-xs shrink-0">
                <button
                  onClick={() => setUserOs('mac')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    userOs === 'mac'
                      ? 'bg-amber-500 text-warm-950 shadow-md'
                      : 'text-warm-400 hover:text-white'
                  }`}
                >
                  macOS (.dmg)
                </button>
                <button
                  onClick={() => setUserOs('windows')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    userOs === 'windows'
                      ? 'bg-amber-500 text-warm-950 shadow-md'
                      : 'text-warm-400 hover:text-white'
                  }`}
                >
                  Windows (.exe)
                </button>
              </div>
            </div>

            {/* Big Action Download Button */}
            <button
              onClick={() => handleDownloadInstaller(userOs)}
              disabled={isDownloading}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-red-600 via-amber-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-black text-base shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-3 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              <Download size={20} className={isDownloading ? 'animate-bounce' : ''} />
              <span>{isDownloading ? 'Downloading Installer...' : currentDownload.label}</span>
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-warm-300 pt-2 border-t border-white/10">
              <div className="flex items-center gap-2">
                <Check size={14} className="text-emerald-400 shrink-0" />
                <span>Native Standalone App</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={14} className="text-emerald-400 shrink-0" />
                <span>Instant Account Sync</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={14} className="text-emerald-400 shrink-0" />
                <span>Offline Roleplay Cache</span>
              </div>
            </div>
          </div>

          {/* Desktop App Features Overview */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-widest text-amber-400/90">
              Why Install CHIMERA Desktop?
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                  <Cpu size={14} />
                  <span>Dedicated Local Processing</span>
                </div>
                <p className="text-xs text-warm-400 leading-relaxed">
                  Fast, uninterrupted streaming roleplay without browser tab throttling or RAM limits.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                  <Shield size={14} />
                  <span>Encrypted Desktop Vault</span>
                </div>
                <p className="text-xs text-warm-400 leading-relaxed">
                  Your character memories, novel drafts, and lorebooks stay encrypted locally on your machine.
                </p>
              </div>
            </div>
          </div>

          {/* Expandable Developer Access & Source Code Section */}
          <div className="border-t border-white/10 pt-4">
            <button
              onClick={() => setShowDeveloperSection(!showDeveloperSection)}
              className="w-full flex items-center justify-between text-left py-2 text-xs font-extrabold text-warm-400 hover:text-white transition-colors"
            >
              <span className="flex items-center gap-2">
                <Code size={15} className="text-purple-400" />
                <span>Developer Access &amp; Source Code (.ZIP)</span>
              </span>
              {showDeveloperSection ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showDeveloperSection && (
              <div className="mt-3 p-4 rounded-xl bg-purple-950/30 border border-purple-500/20 space-y-3 animate-in fade-in duration-200">
                <p className="text-xs text-warm-300 leading-relaxed">
                  For software engineers, contributors, and self-hosters who want to build CHIMERA from source or run custom local LLM backends:
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
                  <button
                    onClick={handleDownloadSourceZip}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-purple-900/60 hover:bg-purple-800/80 text-purple-100 font-bold text-xs border border-purple-500/30 transition-colors flex items-center justify-center gap-2"
                  >
                    <FolderArchive size={15} />
                    <span>Download Source Code (.ZIP)</span>
                  </button>

                  <a
                    href="https://github.com/diorix10-beep/CHIMERA-GITHUB"
                    target="_blank"
                    rel="noreferrer"
                    className="py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-warm-300 font-bold text-xs border border-white/10 transition-colors flex items-center justify-center gap-2"
                  >
                    <ExternalLink size={15} />
                    <span>GitHub Repository</span>
                  </a>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-warm-950/60 flex items-center justify-between text-xs text-warm-400 rounded-b-3xl">
          <span>CHIMERA Desktop Client v1.0.0</span>
          <span>Automatic Updates Enabled</span>
        </div>
      </div>
    </div>
  );
}
