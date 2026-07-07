import { useState, useRef, useEffect } from 'react';
import { Sparkles, X, ChevronRight, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ContextualOracleProps {
  context: {
    page: string;
    details?: string;
  };
}

interface ChatMessage {
  id: string;
  role: 'user' | 'oracle';
  content: string;
  timestamp: Date;
}

export function ContextualOracle({ context }: ContextualOracleProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Initial Contextual Greeting
  useEffect(() => {
    if (isOpen && messages.length === 0 && !isLoading) {
      sendContextualGreeting();
    }
  }, [isOpen]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  const sendContextualGreeting = async () => {
    setIsLoading(true);
    try {
      const systemDirective = `[System Directive: The user is currently in the ${context.page} section. ${context.details || ''} Proactively offer help related to this context in a short, friendly, one-sentence greeting.]`;
      
      const res = await fetch('/api/oracle-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: systemDirective, is_system_directive: true }),
      });
      const data = await res.json();
      
      if (res.ok && data.response) {
        setMessages([{
          id: `oracle-${Date.now()}`,
          role: 'oracle',
          content: data.response,
          timestamp: new Date()
        }]);
      }
    } catch (err) {
      // Silently fail the greeting if network issue
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/oracle-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text, 
          context_page: context.page, 
          context_details: context.details 
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMessages(prev => [...prev, {
        id: `oracle-${Date.now()}`,
        role: 'oracle',
        content: data.response || 'I am here to help.',
        timestamp: new Date(),
      }]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: `oracle-error-${Date.now()}`,
        role: 'oracle',
        content: err.message || 'I had trouble connecting. Could you try again?',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Minimized State
  if (!isOpen) {
    return (
      <div 
        className={`fixed bottom-24 lg:bottom-12 right-4 lg:right-6 z-40 transition-all duration-300 ${
          isHovered ? 'translate-x-0' : 'translate-x-2'
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-3 bg-white dark:bg-warm-850 border-2 border-amber-500/30 rounded-full py-2 px-3 shadow-lg hover:shadow-xl hover:border-amber-500 transition-all group"
        >
          <div className="relative">
            <img
              src="/family/oracle.png"
              alt="Oracle"
              className="w-8 h-8 rounded-full object-cover border border-amber-500/20"
              onError={(e) => { (e.target as HTMLImageElement).src = '/nexy_mascot.png'; }}
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white dark:border-warm-900 animate-pulse" />
          </div>
          <div className="flex flex-col items-start pr-2">
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 leading-none">Oracle</span>
            <span className="text-[10px] text-warm-500 dark:text-warm-400 mt-0.5">Need help creating?</span>
          </div>
          <ChevronRight size={14} className="text-amber-500 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </button>
      </div>
    );
  }

  // Expanded State
  return (
    <div className="fixed bottom-24 lg:bottom-12 right-4 lg:right-6 z-50 w-80 sm:w-96 bg-white dark:bg-warm-850 rounded-2xl shadow-2xl border border-amber-500/20 flex flex-col overflow-hidden animate-slide-up" style={{ height: '500px', maxHeight: '70vh' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-b border-amber-500/20">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src="/family/oracle.png"
              alt="Oracle"
              className="w-8 h-8 rounded-full object-cover border border-amber-500/30 shadow-sm"
              onError={(e) => { (e.target as HTMLImageElement).src = '/nexy_mascot.png'; }}
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white dark:border-warm-850" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-warm-900 dark:text-warm-50 flex items-center gap-1.5">
              Oracle <Sparkles size={12} className="text-amber-500" />
            </h3>
            <p className="text-[10px] text-warm-500 dark:text-warm-400">Contextual Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/oracle')}
            className="text-[10px] text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 px-2 py-1 rounded transition-colors"
          >
            Open Hub
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 text-warm-500 hover:text-warm-900 dark:hover:text-warm-100 hover:bg-warm-100 dark:hover:bg-warm-800 rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-fade-in`}>
            {msg.role === 'oracle' && (
              <img
                src="/family/oracle.png"
                alt="Oracle"
                className="w-6 h-6 rounded-full object-cover border border-amber-500/20 shadow-sm flex-shrink-0 mt-0.5"
                onError={(e) => { (e.target as HTMLImageElement).src = '/nexy_mascot.png'; }}
              />
            )}
            <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-[12px] leading-relaxed ${
              msg.role === 'user'
                ? 'bg-primary-600 text-white rounded-tr-sm'
                : 'bg-warm-50 dark:bg-warm-900 text-warm-900 dark:text-warm-50 border border-warm-200 dark:border-warm-700 rounded-tl-sm shadow-sm'
            }`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-2 animate-fade-in">
            <img
              src="/family/oracle.png"
              alt="Oracle"
              className="w-6 h-6 rounded-full object-cover border border-amber-500/20 shadow-sm flex-shrink-0 mt-0.5"
              onError={(e) => { (e.target as HTMLImageElement).src = '/nexy_mascot.png'; }}
            />
            <div className="bg-warm-50 dark:bg-warm-900 border border-warm-200 dark:border-warm-700 rounded-2xl rounded-tl-sm px-3 py-2 shadow-sm flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-warm-200 dark:border-warm-800 bg-white dark:bg-warm-850">
        <div className="flex items-end gap-2 bg-warm-50 dark:bg-warm-900 rounded-xl p-1 border border-warm-200 dark:border-warm-700 focus-within:border-amber-500/50 focus-within:ring-1 focus-within:ring-amber-500/50 transition-all">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask for guidance..."
            rows={1}
            className="flex-1 bg-transparent border-none px-3 py-2 text-[12px] focus:outline-none focus:ring-0 resize-none max-h-24 text-warm-900 dark:text-warm-50 placeholder:text-warm-400"
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 96) + 'px';
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="w-8 h-8 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:bg-warm-300 dark:disabled:bg-warm-700 text-white flex items-center justify-center transition-colors shadow-sm disabled:shadow-none m-1 flex-shrink-0"
          >
            <Send size={14} className={isLoading ? 'opacity-50' : ''} />
          </button>
        </div>
      </div>
    </div>
  );
}
