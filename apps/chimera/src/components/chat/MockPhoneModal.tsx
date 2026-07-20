import { useState, useRef, useEffect } from 'react';
import { X, Send, Battery, Wifi, Signal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Message, Profile } from '../../types';
import { Avatar } from '../common/Avatar';

interface MessageWithProfile extends Message {
  profiles?: Profile;
}

interface MockPhoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: MessageWithProfile[];
  onSendMessage: (content: string) => Promise<void>;
  otherUser: Profile | null;
  currentUser: Profile | null;
}

export function MockPhoneModal({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  otherUser,
  currentUser
}: MockPhoneModalProps) {
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filter messages to only show those that are texts (prefixed with [SMS] or similar)
  const smsMessages = messages.filter(m => m.content?.includes('[SMS]'));

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, smsMessages]);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;

    setIsSending(true);
    try {
      await onSendMessage(`[SMS] ${inputText.trim()}`);
      setInputText('');
    } finally {
      setIsSending(false);
    }
  };

  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 font-sans">
      
      {/* iPhone Bezel */}
      <div className="relative w-full max-w-[375px] h-[812px] max-h-full bg-black rounded-[50px] shadow-2xl p-2 sm:p-3 overflow-hidden border-[4px] border-[#333]">
        
        {/* Screen */}
        <div className="relative w-full h-full bg-[#F2F2F7] dark:bg-[#000000] rounded-[40px] overflow-hidden flex flex-col">
          
          {/* Dynamic Island / Notch Area */}
          <div className="absolute top-0 inset-x-0 h-7 flex justify-center z-50 pt-2">
            <div className="w-[120px] h-[30px] bg-black rounded-full" />
          </div>

          {/* iOS Status Bar */}
          <div className="h-12 w-full flex justify-between items-center px-6 pt-3 text-[15px] font-semibold text-black dark:text-white z-40 relative">
            <span>{currentTime}</span>
            <div className="flex items-center gap-1.5">
              <Signal size={16} strokeWidth={2.5} />
              <Wifi size={16} strokeWidth={2.5} />
              <Battery size={20} strokeWidth={2} />
            </div>
          </div>

          {/* Messages App Header */}
          <div className="bg-[#F9F9F9]/90 dark:bg-[#1C1C1E]/90 backdrop-blur-md border-b border-gray-300 dark:border-gray-800 flex items-center justify-between px-4 py-2 relative z-30">
            <button 
              onClick={onClose}
              className="text-[#007AFF] text-[17px] flex items-center gap-1"
            >
              <X size={24} />
            </button>
            <div className="flex flex-col items-center">
              <Avatar emoji={otherUser?.avatar_emoji || '?'} photoUrl={otherUser?.photo_url || null} size="xs" />
              <span className="text-[11px] font-semibold text-black dark:text-white mt-1 leading-tight">
                {otherUser?.display_name || 'Unknown'}
              </span>
              <span className="text-[9px] text-gray-500 font-medium">
                +1 (555) 019-{otherUser?.id.replace(/[^0-9]/g, '').slice(0, 4).padEnd(4, '0') || '8429'}
              </span>
            </div>
            <div className="w-8" /> {/* Spacer for centering */}
          </div>

          {/* Chat Feed */}
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 bg-white dark:bg-black">
            {smsMessages.length === 0 ? (
              <div className="text-center text-gray-500 text-sm mt-10">
                iMessage<br/>Today
              </div>
            ) : (
              smsMessages.map((msg) => {
                const isOwn = msg.sender_id === currentUser?.id;
                const text = msg.content?.replace('[SMS]', '').trim();

                return (
                  <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] px-4 py-2.5 text-[17px] leading-[22px] ${
                      isOwn 
                        ? 'bg-[#007AFF] text-white rounded-2xl rounded-br-sm' 
                        : 'bg-[#E5E5EA] dark:bg-[#262628] text-black dark:text-white rounded-2xl rounded-bl-sm'
                    }`}>
                      {text}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* iMessage Input */}
          <div className="bg-[#F9F9F9]/90 dark:bg-[#1C1C1E]/90 backdrop-blur-md px-4 py-3 pb-8">
            <form onSubmit={handleSend} className="relative flex items-end">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="iMessage"
                rows={1}
                className="w-full bg-white dark:bg-black border border-gray-300 dark:border-gray-700 rounded-full py-2 pl-4 pr-10 text-[17px] focus:outline-none focus:ring-1 focus:ring-[#007AFF] resize-none max-h-32 text-black dark:text-white"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isSending}
                className="absolute right-1 bottom-1 p-1.5 bg-[#007AFF] text-white rounded-full disabled:opacity-50 disabled:bg-gray-400"
              >
                <Send size={16} className="ml-0.5" />
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
