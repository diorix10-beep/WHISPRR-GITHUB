import { useEffect, useMemo, useRef, useState } from 'react';
import { Battery, CheckCheck, Edit3, MoreHorizontal, Reply, Send, Signal, Trash2, Wifi, X } from 'lucide-react';
import type { DeviceActivityApp, DeviceActivityMessage } from '../../lib/deviceActivity';

interface MockPhoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: DeviceActivityMessage[];
  appStyle: DeviceActivityApp;
  currentUserName: string;
  onReply: (body: string, replyTo: DeviceActivityMessage | null) => Promise<void>;
  onUpdateMessage: (messageId: string, body: string) => void;
  onDeleteMessage: (messageId: string) => void;
}

function getCurrentTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function MockPhoneModal({
  isOpen,
  onClose,
  messages,
  appStyle,
  currentUserName,
  onReply,
  onUpdateMessage,
  onDeleteMessage,
}: MockPhoneModalProps) {
  const [inputText, setInputText] = useState('');
  const [replyTarget, setReplyTarget] = useState<DeviceActivityMessage | null>(null);
  const [actionTargetId, setActionTargetId] = useState<string | null>(null);
  const [editingTarget, setEditingTarget] = useState<DeviceActivityMessage | null>(null);
  const [editText, setEditText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const longPressTimerRef = useRef<number | null>(null);
  const touchStartXRef = useRef<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const visibleMessages = useMemo(() => messages.filter((message) => !message.deleted), [messages]);
  const contacts = useMemo(() => Array.from(new Set(visibleMessages.map((message) => message.contact))), [visibleMessages]);
  const contactLabel = contacts.length === 1 ? contacts[0] : 'Device activity';
  const isWhatsapp = appStyle === 'whatsapp';

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, visibleMessages.length]);

  if (!isOpen) return null;

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || isSending) return;

    setIsSending(true);
    try {
      await onReply(inputText.trim(), replyTarget);
      setInputText('');
      setReplyTarget(null);
    } finally {
      setIsSending(false);
    }
  };

  const startLongPress = (message: DeviceActivityMessage) => {
    if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = window.setTimeout(() => setActionTargetId(message.id), 420);
  };

  const cancelLongPress = () => {
    if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current);
  };

  const beginEdit = (message: DeviceActivityMessage) => {
    setEditingTarget(message);
    setEditText(message.body);
    setActionTargetId(null);
  };

  const saveEdit = () => {
    if (!editingTarget || !editText.trim()) return;
    onUpdateMessage(editingTarget.id, editText.trim());
    setEditingTarget(null);
    setEditText('');
  };

  const getReplyPreview = (message: DeviceActivityMessage) => {
    if (!message.replyToId) return null;
    return visibleMessages.find((candidate) => candidate.id === message.replyToId) || null;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 font-sans backdrop-blur-sm">
      <div className="relative h-[812px] max-h-full w-full max-w-[390px] overflow-hidden rounded-[52px] border-[5px] border-[#1f1f24] bg-black p-2 shadow-2xl">
        <div className={`relative flex h-full flex-col overflow-hidden rounded-[42px] ${
          isWhatsapp ? 'bg-[#efe7dc]' : 'bg-[#f2f2f7] dark:bg-black'
        }`}>
          <div className="absolute inset-x-0 top-0 z-50 flex h-7 justify-center pt-2">
            <div className="h-[30px] w-[118px] rounded-full bg-black" />
          </div>

          <div className={`relative z-40 flex h-12 w-full items-center justify-between px-7 pt-3 text-[15px] font-semibold ${
            isWhatsapp ? 'text-white' : 'text-black dark:text-white'
          }`}>
            <span>{getCurrentTime()}</span>
            <div className="flex items-center gap-1.5">
              <Signal size={16} strokeWidth={2.5} />
              <Wifi size={16} strokeWidth={2.5} />
              <Battery size={20} strokeWidth={2} />
            </div>
          </div>

          <div className={`relative z-30 flex items-center gap-3 border-b px-4 py-3 ${
            isWhatsapp
              ? 'border-[#075e54]/20 bg-[#075e54] text-white'
              : 'border-gray-300 bg-[#f9f9f9]/95 text-black backdrop-blur-md dark:border-gray-800 dark:bg-[#1c1c1e]/95 dark:text-white'
          }`}>
            <button onClick={onClose} className={isWhatsapp ? 'text-white' : 'text-[#007aff]'} aria-label="Close phone">
              <X size={24} />
            </button>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-lg">
              {contactLabel.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{contactLabel}</p>
              <p className={`text-[11px] ${isWhatsapp ? 'text-white/75' : 'text-gray-500'}`}>
                {isWhatsapp ? 'online' : contacts.length > 1 ? `${contacts.length} conversations` : 'iMessage'}
              </p>
            </div>
            <MoreHorizontal size={22} className={isWhatsapp ? 'text-white/80' : 'text-gray-500'} />
          </div>

          <div className={`flex-1 overflow-y-auto px-4 py-5 ${
            isWhatsapp
              ? "bg-[#e7ddd3] bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.35),transparent_35%)]"
              : 'bg-white dark:bg-black'
          }`}>
            <div className="mb-5 text-center">
              <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                isWhatsapp ? 'bg-white/70 text-[#667781]' : 'bg-gray-200 text-gray-600 dark:bg-[#1c1c1e] dark:text-gray-400'
              }`}>
                Today
              </span>
            </div>

            <div className="space-y-3">
              {visibleMessages.map((message) => {
                const isOwn = message.direction === 'outgoing';
                const replyPreview = getReplyPreview(message);
                const isActionsOpen = actionTargetId === message.id;

                return (
                  <div
                    key={message.id}
                    className={`group relative flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    onTouchStart={(event) => {
                      touchStartXRef.current = event.touches[0].clientX;
                      startLongPress(message);
                    }}
                    onTouchEnd={(event) => {
                      cancelLongPress();
                      const delta = event.changedTouches[0].clientX - touchStartXRef.current;
                      if (Math.abs(delta) > 55) setReplyTarget(message);
                    }}
                    onMouseDown={() => startLongPress(message)}
                    onMouseUp={cancelLongPress}
                    onMouseLeave={cancelLongPress}
                    onContextMenu={(event) => {
                      event.preventDefault();
                      setActionTargetId(message.id);
                    }}
                  >
                    <div className={`max-w-[78%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                      {!isOwn && contacts.length > 1 && (
                        <span className="mb-1 ml-2 text-[11px] font-semibold text-gray-500">{message.contact}</span>
                      )}
                      <div className={`relative px-3.5 py-2.5 text-[16px] leading-[21px] shadow-sm ${
                        isWhatsapp
                          ? isOwn
                            ? 'rounded-2xl rounded-br-sm bg-[#dcf8c6] text-[#111b21]'
                            : 'rounded-2xl rounded-bl-sm bg-white text-[#111b21]'
                          : isOwn
                            ? 'rounded-2xl rounded-br-sm bg-[#007aff] text-white'
                            : 'rounded-2xl rounded-bl-sm bg-[#e5e5ea] text-black dark:bg-[#262628] dark:text-white'
                      }`}>
                        {replyPreview && (
                          <div className={`mb-2 border-l-4 px-2 py-1 text-xs ${
                            isWhatsapp ? 'border-[#25d366] bg-black/5 text-[#3b4a54]' : 'border-white/60 bg-black/10 text-current'
                          }`}>
                            <p className="font-bold">{replyPreview.direction === 'outgoing' ? currentUserName : replyPreview.contact}</p>
                            <p className="line-clamp-1 opacity-75">{replyPreview.body}</p>
                          </div>
                        )}
                        <p className="whitespace-pre-wrap">{message.body}</p>
                        <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                          isOwn ? (isWhatsapp ? 'text-[#667781]' : 'text-white/75') : 'text-gray-500'
                        }`}>
                          <span>{message.time}</span>
                          {message.edited && <span>edited</span>}
                          {isOwn && <CheckCheck size={13} className={isWhatsapp ? 'text-[#53bdeb]' : 'text-current'} />}
                        </div>
                      </div>

                      {isActionsOpen && (
                        <div className="mt-2 flex items-center gap-1 rounded-2xl border border-black/10 bg-black/80 p-1 text-white shadow-xl backdrop-blur">
                          <button onClick={() => { setReplyTarget(message); setActionTargetId(null); }} className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs hover:bg-white/10">
                            <Reply size={13} /> Reply
                          </button>
                          <button onClick={() => beginEdit(message)} className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs hover:bg-white/10">
                            <Edit3 size={13} /> Edit
                          </button>
                          <button onClick={() => { onDeleteMessage(message.id); setActionTargetId(null); }} className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs text-red-200 hover:bg-white/10">
                            <Trash2 size={13} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div ref={messagesEndRef} />
          </div>

          {replyTarget && (
            <div className={`border-t px-4 py-2 ${isWhatsapp ? 'border-black/10 bg-[#f0f2f5]' : 'border-gray-300 bg-[#f9f9f9] dark:border-gray-800 dark:bg-[#1c1c1e]'}`}>
              <div className="flex items-center justify-between rounded-2xl bg-black/5 px-3 py-2 text-xs text-gray-600 dark:text-gray-300">
                <div className="min-w-0">
                  <p className="font-bold">Replying to {replyTarget.direction === 'outgoing' ? currentUserName : replyTarget.contact}</p>
                  <p className="truncate">{replyTarget.body}</p>
                </div>
                <button onClick={() => setReplyTarget(null)} className="p-1"><X size={14} /></button>
              </div>
            </div>
          )}

          <div className={`px-4 py-3 pb-8 ${isWhatsapp ? 'bg-[#f0f2f5]' : 'bg-[#f9f9f9]/95 backdrop-blur-md dark:bg-[#1c1c1e]/95'}`}>
            <form onSubmit={handleSend} className="relative flex items-end gap-2">
              <textarea
                value={inputText}
                onChange={(event) => setInputText(event.target.value)}
                placeholder={isWhatsapp ? 'Message' : 'iMessage'}
                rows={1}
                className={`max-h-32 w-full resize-none rounded-full border px-4 py-2.5 pr-11 text-[16px] text-black focus:outline-none ${
                  isWhatsapp
                    ? 'border-transparent bg-white focus:ring-1 focus:ring-[#25d366]'
                    : 'border-gray-300 bg-white focus:ring-1 focus:ring-[#007aff] dark:border-gray-700 dark:bg-black dark:text-white'
                }`}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    void handleSend();
                  }
                }}
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isSending}
                className={`absolute bottom-1.5 right-1.5 rounded-full p-1.5 text-white disabled:bg-gray-400 disabled:opacity-50 ${
                  isWhatsapp ? 'bg-[#25d366]' : 'bg-[#007aff]'
                }`}
              >
                <Send size={16} className="ml-0.5" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {editingTarget && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 text-black shadow-2xl dark:bg-warm-900 dark:text-white">
            <h3 className="text-lg font-bold">Edit phone message</h3>
            <textarea
              value={editText}
              onChange={(event) => setEditText(event.target.value)}
              rows={4}
              className="mt-4 w-full rounded-2xl border border-warm-200 bg-warm-50 p-3 text-sm outline-none focus:ring-2 focus:ring-primary-500 dark:border-warm-700 dark:bg-warm-950"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setEditingTarget(null)} className="rounded-xl px-4 py-2 text-sm font-bold text-warm-500 hover:bg-warm-100 dark:hover:bg-warm-800">
                Cancel
              </button>
              <button onClick={saveEdit} className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
