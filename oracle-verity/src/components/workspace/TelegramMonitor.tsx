import React from 'react';
import { useTelegramStore } from '../../store/telegram.store';
import { useSettingsStore } from '../../store/settings.store';
import { MessageCircle, Wifi, WifiOff } from 'lucide-react';
import { getMemberById } from '../../core/family-roster';

export function TelegramMonitor({ accentColor }: { accentColor: string }) {
  const { chats, isPolling } = useTelegramStore();
  const settings = useSettingsStore();

  const hasBot = !!(settings.telegramToken || settings.familyTelegramToken);

  // Flatten all messages across all chats, newest first
  const allMessages = Object.values(chats)
    .flatMap(chat => chat.messages)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 8);

  return (
    <div style={{
      borderRadius: '12px',
      background: 'rgba(0,0,0,0.5)',
      border: `1px solid ${accentColor}20`,
      overflow: 'hidden',
      flex: 1,
      minWidth: '200px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        padding: '8px 12px',
        background: 'rgba(10,10,20,0.9)',
        borderBottom: `1px solid ${accentColor}15`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(255,255,255,0.7)'
        }}>
          <MessageCircle size={12} color={accentColor} />
          Telegram Live
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          {hasBot && isPolling ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: '#22c55e', fontFamily: 'var(--font-mono)' }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
              LIVE
            </span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-mono)' }}>
              <WifiOff size={9} />
              {hasBot ? 'CONNECTING...' : 'NO BOT'}
            </span>
          )}
        </span>
      </div>

      {/* Messages */}
      <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '7px', flex: 1, overflowY: 'auto' }}>
        {allMessages.length === 0 ? (
          <div style={{ padding: '16px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: '18px', marginBottom: '6px' }}>✈️</div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-primary)', lineHeight: 1.5 }}>
              {hasBot
                ? 'Waiting for messages...\nSend a message to your Telegram bot to see it here.'
                : 'Add a Telegram Bot Token in Settings to enable live monitoring.'
              }
            </div>
          </div>
        ) : (
          allMessages.map((msg, i) => {
            // Try to match sender to a family member for coloring
            const familyMember = getMemberById(msg.senderName.toLowerCase());
            const bubbleColor = familyMember ? familyMember.color : (msg.isOracle ? accentColor : 'rgba(255,255,255,0.5)');
            const ts = new Date(msg.timestamp);
            const timeLabel = ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <div key={msg.id || i} style={{
                padding: '7px 9px',
                borderRadius: '8px',
                background: msg.isOracle
                  ? `${accentColor}10`
                  : 'rgba(255,255,255,0.03)',
                borderLeft: `2px solid ${bubbleColor}60`,
              }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px'
                }}>
                  <span style={{
                    fontSize: '9px', color: bubbleColor, fontWeight: 700,
                    fontFamily: 'var(--font-mono)', letterSpacing: '0.03em'
                  }}>
                    {msg.isOracle ? '✨ ' : '@'}{msg.senderName}
                  </span>
                  <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-mono)' }}>
                    {timeLabel}
                  </span>
                </div>
                <div style={{
                  fontSize: '11px', color: 'rgba(255,255,255,0.8)',
                  lineHeight: 1.4, fontFamily: 'var(--font-primary)',
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word'
                }}>
                  {msg.text.length > 120 ? msg.text.slice(0, 120) + '…' : msg.text}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
