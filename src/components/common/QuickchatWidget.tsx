import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageSquare, X, Send, Maximize2, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const ORACLE_UUID = 'da01a00a-60d7-41ec-b827-8178cd3bf084';

export function QuickchatWidget() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Set mounted state
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Scroll to bottom helper
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isThinking]);

  // Load conversation ID and messages
  useEffect(() => {
    if (!user || !isOpen) return;

    let channel: any;

    const initChat = async () => {
      setLoading(true);
      try {
        // 1. Find existing conversation with Oracle
        const { data: myConvs } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', user.id);

        const myIds = (myConvs || []).map(c => c.conversation_id);
        let activeConvId = null;

        if (myIds.length > 0) {
          const { data: match } = await supabase
            .from('conversation_participants')
            .select('conversation_id, conversations(type)')
            .in('conversation_id', myIds)
            .eq('user_id', ORACLE_UUID);

          const existing = match?.find((m: any) => m.conversations?.type === 'dm');
          if (existing) {
            activeConvId = existing.conversation_id;
          }
        }

        // 2. Create conversation if none exists
        if (!activeConvId) {
          const { data: newConv } = await supabase
            .from('conversations')
            .insert({ type: 'dm', created_by: user.id })
            .select()
            .single();

          if (newConv) {
            activeConvId = newConv.id;
            await supabase
              .from('conversation_participants')
              .insert([
                { conversation_id: newConv.id, user_id: user.id },
                { conversation_id: newConv.id, user_id: ORACLE_UUID }
              ]);
          }
        }

        if (activeConvId) {
          setConversationId(activeConvId);

          // Fetch messages
          const { data: msgs } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', activeConvId)
            .is('deleted_at', null)
            .order('created_at', { ascending: true });

          setMessages(msgs || []);

          // Subscribe in real-time
          channel = supabase
            .channel(`quickchat_widget_${activeConvId}`)
            .on('postgres_changes', { 
              event: 'INSERT', 
              schema: 'public', 
              table: 'messages', 
              filter: `conversation_id=eq.${activeConvId}` 
            }, (payload) => {
              setMessages(prev => {
                if (prev.some(m => m.id === payload.new.id)) return prev;
                return [...prev, payload.new];
              });
              if (payload.new.sender_id === ORACLE_UUID) {
                setIsThinking(false);
              }
            })
            .subscribe();
        }
      } catch (err) {
        console.error('Failed to initialize Oracle widget chat:', err);
      } finally {
        setLoading(false);
      }
    };

    initChat();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [user, isOpen]);

  // Hide widget on specific auth/onboarding/embedded pages to keep screen clean
  const isHiddenRoute = 
    location.pathname === '/auth' || 
    location.pathname === '/onboarding' || 
    location.pathname === '/oracle' || 
    location.pathname === '/help';

  if (!mounted || !user || !profile?.onboarding_complete || isHiddenRoute) return null;

  const targetEl = document.getElementById('quickchat-widget-root');
  if (!targetEl) return null;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !conversationId) return;

    const userMsgText = inputValue.trim();
    setInputValue('');
    setIsThinking(true);

    try {
      // 1. Insert user message
      const { error: insertError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: userMsgText
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // 2. Trigger AI reply worker
      const sessionRes = await supabase.auth.getSession();
      const token = sessionRes.data.session?.access_token;
      
      fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          bot_user_id: ORACLE_UUID
        })
      }).catch(err => {
        console.error('Failed to call ai-chat worker:', err);
        setIsThinking(false);
      });
    } catch (err) {
      console.error('Failed to send message to Oracle:', err);
      setIsThinking(false);
    }
  };

  const handleContinueInFull = () => {
    setIsOpen(false);
    navigate('/oracle');
  };

  return createPortal(
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
      {/* Floating Chat Panel */}
      {isOpen && (
        <div className="w-[340px] sm:w-[380px] h-[500px] bg-white dark:bg-warm-850 rounded-3xl border border-warm-200 dark:border-warm-750 shadow-2xl flex flex-col mb-4 overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="px-5 py-4 bg-gradient-to-r from-amber-950 via-warm-900 to-warm-900 text-white flex items-center justify-between border-b border-warm-750">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src="/family/oracle.png"
                  alt="Oracle"
                  className="w-9 h-9 rounded-xl object-cover border border-amber-500/25"
                  onError={(e) => {
                    // Fallback to mascot
                    (e.target as HTMLImageElement).src = "/nexy_mascot.png";
                  }}
                />
                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-warm-900 rounded-full" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-serif font-bold text-sm text-amber-400">Oracle</span>
                  <span className="text-[8px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 px-1.5 py-0.2 rounded border border-amber-500/20">System AI</span>
                </div>
                <p className="text-[10px] text-warm-300">Co-Founder & Central AI</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <button
                onClick={handleContinueInFull}
                title="Open in fullscreen"
                className="p-1.5 rounded-lg hover:bg-warm-800 text-warm-300 hover:text-white transition-colors"
              >
                <Maximize2 size={14} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-warm-800 text-warm-300 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-warm-50 dark:bg-warm-900 no-scrollbar">
            {messages.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 gap-3">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Sparkles size={24} className="animate-pulse" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-warm-800 dark:text-warm-200">Oracle is online</p>
                  <p className="text-[10px] text-warm-450 mt-1 max-w-[200px] leading-relaxed">
                    Ask me anything about WHISPRR, project updates, or the NEXA platform.
                  </p>
                </div>
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
              </div>
            )}

            {messages.map((msg) => {
              const isMe = msg.sender_id === user.id;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                      isMe
                        ? 'bg-amber-600 text-white rounded-tr-none'
                        : 'bg-white dark:bg-warm-800 text-warm-900 dark:text-warm-105 border border-warm-150 dark:border-warm-750 rounded-tl-none shadow-sm'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.content}</p>
                  </div>
                </div>
              );
            })}

            {isThinking && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-warm-800 text-warm-500 dark:text-warm-400 rounded-2xl rounded-tl-none px-4 py-3 text-xs border border-warm-150 dark:border-warm-750 flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Action Footer Option: Continue in Full Assistant link */}
          <div className="px-4 py-2 bg-warm-100 dark:bg-warm-800 border-t border-warm-200 dark:border-warm-750 flex justify-between items-center text-[10px]">
            <span className="text-warm-500">Need a larger screen?</span>
            <button
              onClick={handleContinueInFull}
              className="text-amber-600 dark:text-amber-400 font-semibold hover:underline flex items-center gap-1"
            >
              <span>Continue in Full Assistant</span>
              <Maximize2 size={10} />
            </button>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-warm-200 dark:border-warm-750 bg-white dark:bg-warm-850 flex gap-2">
            <input
              type="text"
              placeholder="Ask Oracle a question..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-1 bg-warm-50 dark:bg-warm-900 border border-warm-200 dark:border-warm-750 rounded-xl px-3 py-2 text-xs text-warm-900 dark:text-warm-50 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="p-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50 transition-colors"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}

      {/* Floating Widget Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
          isOpen
            ? 'bg-warm-800 text-white rotate-90 scale-95'
            : 'bg-amber-600 text-white hover:scale-105 active:scale-95 shadow-amber-500/25 border border-amber-500/20'
        }`}
      >
        {isOpen ? (
          <X size={24} />
        ) : (
          <div className="relative">
            <MessageSquare size={24} />
            <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500 border border-white dark:border-warm-850"></span>
            </span>
          </div>
        )}
      </button>
    </div>,
    targetEl
  );
}
