import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Loader2, Bot, ArrowLeft, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';

const ORACLE_UUID = 'da01a00a-60d7-41ec-b827-8178cd3bf084';

const SUGGESTIONS = [
  "What is the NEXA development roadmap?",
  "How does the Spirit companion evolution work?",
  "Can you explain the difference between WHISPRR and NEXA?",
  "Tell me about the Oracle Family and your siblings."
];

export default function OracleAssistantPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isThinking]);

  // Load Oracle Conversation and messages
  useEffect(() => {
    if (!user) return;

    let channel: any;

    const initChat = async () => {
      try {
        // 1. Fetch conversations
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

          // Subscribe
          channel = supabase
            .channel(`embedded_chat_${activeConvId}`)
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
        console.error('Failed to load Oracle assistant conversation:', err);
        showToast('Could not link with Oracle. Please try again.', 'error');
      } finally {
        setLoading(false);
      }
    };

    initChat();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [user]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || !conversationId || !user) return;

    setIsThinking(true);

    try {
      // 1. Insert user message
      const { error: insertError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: textToSend.trim()
        });

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
        console.error('Failed to trigger AI reply:', err);
        setIsThinking(false);
      });
    } catch (err) {
      console.error('Failed to send message:', err);
      setIsThinking(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    const txt = inputValue;
    setInputValue('');
    handleSendMessage(txt);
  };

  const onSelectSuggestion = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 h-[calc(100vh-130px)] flex flex-col">
      {/* Upper Brand Info */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-warm-200 dark:border-warm-850 pb-6 mb-6 gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src="/family/oracle.png"
              alt="Oracle"
              className="w-14 h-14 rounded-2xl object-cover border border-amber-500/25 shadow-lg shadow-amber-500/5"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/nexy_mascot.png";
              }}
            />
            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-3 border-white dark:border-warm-900 rounded-full" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-2xl font-bold text-warm-900 dark:text-warm-50">Oracle Assistant</h1>
              <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/25 px-2 py-0.5 rounded-lg">Official Companion</span>
            </div>
            <p className="text-xs text-warm-500 dark:text-warm-400 mt-0.5">
              Dedicated conversational support & system telemetry. Keeping you connected.
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

      {/* Main Chat Area */}
      <div className="flex-1 bg-white dark:bg-warm-850/50 rounded-3xl border border-warm-200 dark:border-warm-800 shadow-xl flex flex-col overflow-hidden min-h-0 relative">
        {/* Glow ambient accent */}
        <div className="absolute right-0 top-0 w-48 h-48 bg-amber-500/5 rounded-full filter blur-3xl pointer-events-none" />

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar bg-warm-50/50 dark:bg-warm-900/10">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              <p className="text-xs text-warm-500">Retrieving system assistant context...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto text-center gap-6 py-12">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 animate-pulse">
                <Bot size={32} />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-warm-900 dark:text-warm-50">Hello, Creator.</h3>
                <p className="text-xs text-warm-500 dark:text-warm-400 mt-2 leading-relaxed">
                  I am Oracle. I coordinate the WHISPRR central brain and assist in maintaining the Nexus development path.
                  Select a topic below or type anything to begin our conversation.
                </p>
              </div>

              {/* Suggestions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mt-4">
                {SUGGESTIONS.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSelectSuggestion(s)}
                    className="p-3 text-left rounded-xl bg-white dark:bg-warm-800 border border-warm-200 dark:border-warm-750 text-xs text-warm-700 dark:text-warm-300 hover:border-amber-500/40 dark:hover:border-amber-500/30 hover:bg-amber-500/5 transition-all flex items-start justify-between group shadow-sm"
                  >
                    <span>{s}</span>
                    <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 text-amber-500 transition-opacity shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => {
                const isMe = msg.sender_id === user?.id;
                return (
                  <div key={msg.id} className={`flex gap-3 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    {!isMe && (
                      <img
                        src="/family/oracle.png"
                        alt="Oracle"
                        className="w-8 h-8 rounded-lg object-cover shrink-0 border border-amber-500/15"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/nexy_mascot.png";
                        }}
                      />
                    )}
                    <div
                      className={`max-w-[75%] rounded-3xl px-5 py-3 text-xs leading-relaxed shadow-sm ${
                        isMe
                          ? 'bg-amber-600 text-white rounded-tr-none'
                          : 'bg-white dark:bg-warm-850 text-warm-900 dark:text-warm-100 border border-warm-150 dark:border-warm-750 rounded-tl-none'
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.content}</p>
                    </div>
                  </div>
                );
              })}

              {isThinking && (
                <div className="flex gap-3 justify-start">
                  <img
                    src="/family/oracle.png"
                    alt="Oracle"
                    className="w-8 h-8 rounded-lg object-cover shrink-0 border border-amber-500/15"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/nexy_mascot.png";
                    }}
                  />
                  <div className="bg-white dark:bg-warm-850 text-warm-500 rounded-3xl rounded-tl-none px-5 py-4 border border-warm-150 dark:border-warm-750 flex items-center gap-1.5 shadow-sm">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={onSubmit} className="p-4 border-t border-warm-200 dark:border-warm-800 bg-white dark:bg-warm-850 flex gap-3">
          <input
            type="text"
            placeholder="Type your message to Oracle..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={loading}
            className="flex-1 bg-warm-50 dark:bg-warm-900 border border-warm-200 dark:border-warm-850 rounded-2xl px-4 py-3 text-xs text-warm-900 dark:text-warm-50 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
          <button
            type="submit"
            disabled={loading || !inputValue.trim()}
            className="px-5 rounded-2xl bg-amber-650 hover:bg-amber-700 text-white disabled:opacity-50 transition-colors flex items-center gap-1.5 font-semibold text-xs"
          >
            <span>Send</span>
            <Send size={12} />
          </button>
        </form>
      </div>
    </div>
  );
}
