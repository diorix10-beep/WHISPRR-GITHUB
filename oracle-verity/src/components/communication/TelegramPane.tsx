import React from 'react';
import { X, Send, Bot, User } from 'lucide-react';
import { useTelegramStore } from '../../store/telegram.store';

interface Props {
  lang: 'en' | 'fr';
  accentColor: string;
  onClose: () => void;
}

export function TelegramPane({ lang, accentColor, onClose }: Props) {
  const { chats, markChatRead } = useTelegramStore();
  const [selectedChatId, setSelectedChatId] = React.useState<number | null>(null);

  const t = (en: string, fr: string) => lang === 'fr' ? fr : en;
  const chatList = Object.values(chats).sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());
  const selectedChat = selectedChatId ? chats[selectedChatId] : null;

  function handleSelectChat(chatId: number) {
    setSelectedChatId(chatId);
    markChatRead(chatId);
  }

  return (
    <div style={{
      position: 'absolute', inset: '20px', zIndex: 100,
      background: 'rgba(10,10,20,0.95)', backdropFilter: 'blur(40px)',
      borderRadius: '20px', border: `1px solid ${accentColor}30`,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      animation: 'slide-up 0.4s cubic-bezier(0.4,0,0.2,1)',
      boxShadow: `0 20px 40px rgba(0,0,0,0.5), 0 0 40px ${accentColor}10`
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#229ED9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Send size={16} color="white" style={{ marginLeft: '-2px' }} />
          </div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', margin: 0, color: 'white' }}>
              {t('Telegram Live Monitor', 'Moniteur Telegram en Direct')}
            </h2>
            <p style={{ fontFamily: 'var(--font-primary)', fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: '4px 0 0 0' }}>
              {t('Watch Oracle converse with humans.', 'Regardez Oracle converser avec des humains.')}
            </p>
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
          <X size={20} />
        </button>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Chat List */}
        <div style={{ width: '280px', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          {chatList.length === 0 ? (
            <div style={{ padding: '20px', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-primary)', fontSize: '13px', textAlign: 'center' }}>
              {t('No conversations yet.', 'Aucune conversation pour le moment.')}
            </div>
          ) : (
            chatList.map(chat => (
              <div 
                key={chat.chatId} 
                onClick={() => handleSelectChat(chat.chatId)}
                style={{
                  padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.02)', cursor: 'pointer',
                  background: selectedChatId === chat.chatId ? 'rgba(255,255,255,0.03)' : 'transparent',
                  display: 'flex', alignItems: 'center', gap: '12px'
                }}
              >
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={18} color="rgba(255,255,255,0.5)" />
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontFamily: 'var(--font-primary)', fontSize: '14px', fontWeight: 600, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {chat.userName}
                    </span>
                    {chat.unreadCount > 0 && (
                      <div style={{ background: accentColor, color: '#000', fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '99px' }}>
                        {chat.unreadCount}
                      </div>
                    )}
                  </div>
                  <div style={{ fontFamily: 'var(--font-primary)', fontSize: '12px', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {chat.messages[chat.messages.length - 1]?.text}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Chat Detail */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.2)', padding: '24px', overflowY: 'auto' }}>
          {selectedChat ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {selectedChat.messages.map(msg => (
                <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.isOracle ? 'flex-start' : 'flex-end' }}>
                  <div style={{ 
                    maxWidth: '75%', padding: '12px 16px', borderRadius: '14px',
                    background: msg.isOracle ? `${accentColor}15` : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${msg.isOracle ? `${accentColor}30` : 'rgba(255,255,255,0.1)'}`,
                    color: 'rgba(255,255,255,0.9)', fontFamily: 'var(--font-primary)', fontSize: '14px', lineHeight: 1.5
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', opacity: 0.5 }}>
                      {msg.isOracle ? <Bot size={12} /> : <User size={12} />}
                      <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 600 }}>{msg.senderName}</span>
                      <span style={{ fontSize: '9px', marginLeft: 'auto' }}>{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-primary)', fontSize: '14px' }}>
              {t('Select a conversation to monitor.', 'Sélectionnez une conversation à surveiller.')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
