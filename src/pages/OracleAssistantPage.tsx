import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, RotateCcw, Sparkles } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'oracle';
  content: string;
  timestamp: Date;
}

const CONV_ID_KEY = 'whisprr_oracle_conv_id';
const CHAT_HISTORY_KEY = 'whisprr_oracle_chat_history';

export default function OracleAssistantPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [convId, setConvId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load persisted conversation on mount
  useEffect(() => {
    const savedConvId = localStorage.getItem(CONV_ID_KEY);
    const savedHistory = localStorage.getItem(CHAT_HISTORY_KEY);

    if (savedConvId) setConvId(savedConvId);
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setMessages(parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
      } catch { /* ignore corrupted data */ }
    }
  }, []);

  // Persist conversation whenever it changes
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
    }
    if (convId) {
      localStorage.setItem(CONV_ID_KEY, convId);
    }
  }, [messages, convId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleNewConversation = useCallback(() => {
    setMessages([]);
    setConvId(null);
    setInput('');
    localStorage.removeItem(CONV_ID_KEY);
    localStorage.removeItem(CHAT_HISTORY_KEY);
    inputRef.current?.focus();
  }, []);

  const handleSend = useCallback(async () => {
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
        body: JSON.stringify({ text, conv_id: convId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      // Save conversation ID for continuity
      if (data.conv_id) {
        setConvId(data.conv_id);
      }

      const oracleMessage: ChatMessage = {
        id: `oracle-${Date.now()}`,
        role: 'oracle',
        content: data.response || 'I received your message but had trouble formulating a response. Could you try again?',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, oracleMessage]);
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `oracle-error-${Date.now()}`,
        role: 'oracle',
        content: err.message || 'I\'m having trouble connecting right now. Please try again in a moment.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, convId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(date);
  };

  // Quick suggestion chips for empty state
  const suggestions = [
    'What is WHISPRR?',
    'How do I create a character?',
    'Tell me about NEXA',
    'What can you help me with?',
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 min-h-[calc(100vh-100px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-warm-200 dark:border-warm-800 pb-4 mb-0 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src="/family/oracle.png"
              alt="Oracle"
              className="w-11 h-11 rounded-xl object-cover border border-amber-500/25 shadow-md shadow-amber-500/10"
              onError={(e) => { (e.target as HTMLImageElement).src = '/nexy_mascot.png'; }}
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white dark:border-warm-900" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-lg font-bold text-warm-900 dark:text-warm-50">Oracle</h1>
              <span className="text-[8px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded-md">Online</span>
            </div>
            <p className="text-[10px] text-warm-500 dark:text-warm-400 mt-0.5">
              Your creative companion across the WHISPRR ecosystem
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleNewConversation}
            className="flex items-center gap-1.5 text-[10px] text-warm-500 hover:text-warm-900 dark:hover:text-warm-100 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-warm-100 dark:hover:bg-warm-800"
            title="Start new conversation"
          >
            <RotateCcw size={12} />
            <span className="hidden sm:inline">New Chat</span>
          </button>
          <button
            onClick={() => navigate('/ai-family')}
            className="flex items-center gap-1.5 text-[10px] text-warm-500 hover:text-warm-900 dark:hover:text-warm-100 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-warm-100 dark:hover:bg-warm-800"
          >
            <ArrowLeft size={12} />
            <span className="hidden sm:inline">AI Family</span>
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 min-h-0" style={{ maxHeight: 'calc(100vh - 280px)' }}>
        {/* Welcome State */}
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center">
            <div className="relative mb-5">
              <div className="absolute inset-0 bg-amber-500/10 rounded-full blur-2xl scale-150" />
              <img
                src="/family/oracle.png"
                alt="Oracle"
                className="w-20 h-20 rounded-2xl object-cover border-2 border-amber-500/20 shadow-xl shadow-amber-500/10 relative z-10"
                onError={(e) => { (e.target as HTMLImageElement).src = '/nexy_mascot.png'; }}
              />
              <div className="absolute -top-1 -right-1 z-20">
                <Sparkles size={16} className="text-amber-500 animate-pulse" />
              </div>
            </div>
            <h2 className="font-serif text-xl font-bold text-warm-900 dark:text-warm-50 mb-2">
              Hey there! I'm Oracle ✨
            </h2>
            <p className="text-xs text-warm-500 dark:text-warm-400 max-w-sm mb-6 leading-relaxed">
              I'm your creative companion across the WHISPRR ecosystem. Ask me anything about WHISPRR, NEXA, character creation, communities, or just chat!
            </p>

            {/* Suggestion Chips */}
            <div className="flex flex-wrap gap-2 justify-center max-w-md">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setInput(suggestion);
                    setTimeout(() => inputRef.current?.focus(), 50);
                  }}
                  className="text-[11px] px-3 py-2 rounded-xl border border-warm-200 dark:border-warm-700 text-warm-600 dark:text-warm-300 hover:bg-amber-50 dark:hover:bg-amber-950/20 hover:border-amber-300 dark:hover:border-amber-700 transition-all hover:shadow-sm"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message List */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-fade-in`}
          >
            {/* Avatar */}
            {msg.role === 'oracle' && (
              <img
                src="/family/oracle.png"
                alt="Oracle"
                className="w-8 h-8 rounded-xl object-cover border border-amber-500/20 shadow-sm flex-shrink-0 mt-1"
                onError={(e) => { (e.target as HTMLImageElement).src = '/nexy_mascot.png'; }}
              />
            )}

            {/* Bubble */}
            <div
              className={`max-w-[75%] sm:max-w-[65%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary-600 text-white rounded-br-md'
                  : 'bg-white dark:bg-warm-800 text-warm-900 dark:text-warm-50 border border-warm-200 dark:border-warm-700 rounded-bl-md shadow-sm'
              }`}
            >
              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
              <p className={`text-[9px] mt-1.5 ${
                msg.role === 'user' ? 'text-white/60' : 'text-warm-400 dark:text-warm-500'
              }`}>
                {formatTime(msg.timestamp)}
              </p>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isLoading && (
          <div className="flex gap-3 animate-fade-in">
            <img
              src="/family/oracle.png"
              alt="Oracle"
              className="w-8 h-8 rounded-xl object-cover border border-amber-500/20 shadow-sm flex-shrink-0 mt-1"
              onError={(e) => { (e.target as HTMLImageElement).src = '/nexy_mascot.png'; }}
            />
            <div className="bg-white dark:bg-warm-800 border border-warm-200 dark:border-warm-700 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-warm-200 dark:border-warm-800 pt-3 flex-shrink-0">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message Oracle..."
              rows={1}
              className="w-full bg-white dark:bg-warm-800 border border-warm-200 dark:border-warm-700 rounded-xl px-4 py-3 pr-4 text-[13px] focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 resize-none transition-all placeholder:text-warm-400"
              style={{ minHeight: '44px', maxHeight: '120px' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 120) + 'px';
              }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0 w-11 h-11 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-warm-300 dark:disabled:bg-warm-700 text-white flex items-center justify-center transition-all shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30 disabled:shadow-none"
          >
            <Send size={16} className={isLoading ? 'opacity-50' : ''} />
          </button>
        </div>
        <p className="text-[9px] text-warm-400 dark:text-warm-500 text-center mt-2">
          Oracle is powered by WHISPRR intelligence. Conversations are stored locally on your device.
        </p>
      </div>
    </div>
  );
}
