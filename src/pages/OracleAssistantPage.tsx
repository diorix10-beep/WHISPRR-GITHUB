import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function OracleAssistantPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Set route class on body
    document.body.classList.add('route-oracle');

    // 2. Remove any existing floating widget iframes
    const removeExistingIframes = () => {
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach(iframe => {
        if (
          iframe.src.includes('quickchat.ai') || 
          iframe.src.includes('5isdyzru54') || 
          iframe.id === 'quickchat-iframe'
        ) {
          iframe.remove();
        }
      });
    };
    
    removeExistingIframes();

    // 3. Clear existing window instance to allow fresh re-initialization
    // @ts-ignore
    delete window._quickchat;

    // 4. Inject the embedded snippet
    (function(e: any, a: any, d: any, i: any, c: any, t: any = a.createElement(d)){
      e[c] = e[c] || function(){ (e[c].q = e[c].q || []).push(arguments) };
      t.src = i;
      t.async = true;
      a.body.insertAdjacentElement("beforeend", t);
    })(window, document, "script", "https://bubble.quickchat.ai/chat.js", "_quickchat");

    // @ts-ignore
    window._quickchat("containerId", "quickchat-embedded");
    // @ts-ignore
    window._quickchat("init", "5isdyzru54");

    // 5. Cleanup on unmount (leaving `/oracle` page)
    return () => {
      document.body.classList.remove('route-oracle');
      
      const container = document.getElementById('quickchat-embedded');
      if (container) {
        container.innerHTML = '';
      }

      // Remove embedded iframes
      removeExistingIframes();

      // Clear instance
      // @ts-ignore
      delete window._quickchat;

      // Re-inject and initialize the global floating widget bubble
      (function(e: any, a: any, d: any, i: any, c: any, t: any = a.createElement(d)){
        e[c] = e[c] || function(){ (e[c].q = e[c].q || []).push(arguments) };
        t.src = i;
        t.async = true;
        a.body.insertAdjacentElement("beforeend", t);
      })(window, document, "script", "https://bubble.quickchat.ai/chat.js", "_quickchat");

      // @ts-ignore
      window._quickchat("init", "5isdyzru54");
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 min-h-[calc(100vh-100px)] flex flex-col">
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

      {/* Embedded Element */}
      <div className="flex-1 bg-white dark:bg-warm-850/50 rounded-3xl border border-warm-200 dark:border-warm-800 shadow-xl overflow-hidden relative p-4 flex items-center justify-center">
        {/* Glow ambient accent */}
        <div className="absolute right-0 top-0 w-48 h-48 bg-amber-500/5 rounded-full filter blur-3xl pointer-events-none" />
        
        {/* Exact DOM ID requested by user */}
        <div 
          id="quickchat-embedded" 
          className="w-full relative z-10" 
          style={{ height: '600px', overflow: 'hidden' }}
        />
      </div>
    </div>
  );
}
