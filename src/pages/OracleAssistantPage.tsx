import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function OracleAssistantPage() {
  const navigate = useNavigate();

  // Add route-oracle class to body to hide the floating widget bubble via CSS
  useEffect(() => {
    document.body.classList.add('route-oracle');
    return () => {
      document.body.classList.remove('route-oracle');
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 h-[calc(100vh-100px)] flex flex-col">
      {/* Header bar matching WHISPRR layout */}
      <div className="flex items-center justify-between border-b border-warm-200 dark:border-warm-850 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <img
            src="/family/oracle.png"
            alt="Oracle"
            className="w-10 h-10 rounded-xl object-cover border border-amber-500/25 shadow-md shadow-amber-500/5"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/nexy_mascot.png";
            }}
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-xl font-bold text-warm-900 dark:text-warm-50">Oracle Assistant</h1>
              <span className="text-[8px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1.5 py-0.2 rounded-md">Official Embed</span>
            </div>
            <p className="text-[10px] text-warm-500 dark:text-warm-400 mt-0.5">
              Secure full assistant channel co-managed by WHISPRR central intelligence.
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/ai-family')}
          className="flex items-center gap-1.5 text-xs text-warm-500 hover:text-warm-950 dark:hover:text-warm-100 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>View AI Family</span>
        </button>
      </div>

      {/* Embedded Iframe Container */}
      <div className="flex-1 bg-white dark:bg-warm-850/50 rounded-3xl border border-warm-200 dark:border-warm-800 shadow-xl overflow-hidden relative">
        {/* Glow ambient accent */}
        <div className="absolute right-0 top-0 w-48 h-48 bg-amber-500/5 rounded-full filter blur-3xl pointer-events-none" />
        
        <iframe
          src="https://app.quickchat.ai/i/5isdyzru54/ai-preview"
          title="Oracle Assistant"
          className="w-full h-full border-0 relative z-10"
          allow="microphone; clipboard-write; camera"
        />
      </div>
    </div>
  );
}
