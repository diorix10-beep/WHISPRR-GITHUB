// ============================================================
// ORACLE VERITY — NOTIFICATION FEED
// ============================================================

import React from 'react';
import { OracleNotification } from '../../store/oracle.store';
import { X, Bell, CheckCircle, AlertTriangle, Info, Zap } from 'lucide-react';

interface Props {
  notifications: OracleNotification[];
  lang: 'en' | 'fr';
  onClose: () => void;
  onMarkAllRead: () => void;
  accentColor: string;
}

function NotifIcon({ type, priority }: { type: OracleNotification['type'], priority?: OracleNotification['priority'] }) {
  const props = { size: 14 };
  if (priority === 'critical') return <Zap {...props} color="#ef4444" />;
  if (priority === 'high') return <AlertTriangle {...props} color="#f97316" />;
  
  switch (type) {
    case 'success': return <CheckCircle {...props} color="#22c55e" />;
    case 'warning': return <AlertTriangle {...props} color="#f59e0b" />;
    case 'alert': return <Zap {...props} color="#ef4444" />;
    default: return <Info {...props} color="#818cf8" />;
  }
}

function timeAgo(date: Date, lang: 'en' | 'fr'): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  if (lang === 'fr') {
    if (mins < 1) return 'À l\'instant';
    if (mins < 60) return `Il y a ${mins}m`;
    return `Il y a ${hours}h`;
  }
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  return `${hours}h ago`;
}

export function NotificationFeed({ notifications, lang, onClose, onMarkAllRead, accentColor }: Props) {
  return (
    <div
      style={{
        position: 'fixed',
        top: '60px',
        right: '16px',
        width: '340px',
        maxHeight: '480px',
        zIndex: 100,
        background: 'rgba(8,8,16,0.97)',
        backdropFilter: 'blur(32px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
        animation: 'slide-left 0.25s cubic-bezier(0.4,0,0.2,1) forwards',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 18px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bell size={14} color={accentColor} />
          <span style={{ fontFamily: 'var(--font-primary)', fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>
            {lang === 'fr' ? 'Notifications' : 'Notifications'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={onMarkAllRead}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '11px', color: accentColor, fontFamily: 'var(--font-primary)', fontWeight: 600,
            }}
          >
            {lang === 'fr' ? 'Tout lire' : 'Mark all read'}
          </button>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'flex' }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* List */}
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {notifications.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-primary)', fontSize: '13px' }}>
            {lang === 'fr' ? 'Aucune notification' : 'No notifications'}
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              style={{
                display: 'flex',
                gap: '12px',
                padding: '14px 18px',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                background: n.read ? 'transparent' : 'rgba(255,255,255,0.02)',
                animation: 'notification-enter 0.3s cubic-bezier(0.4,0,0.2,1) forwards',
              }}
            >
              <div style={{ marginTop: '2px', flexShrink: 0 }}>
                <NotifIcon type={n.type} priority={n.priority} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontFamily: 'var(--font-primary)', fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.88)' }}>
                    {n.title}
                  </span>
                  <span style={{ fontFamily: 'var(--font-primary)', fontSize: '10px', color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>
                    {timeAgo(n.timestamp, lang)}
                  </span>
                </div>
                <p style={{ fontFamily: 'var(--font-primary)', fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '3px', lineHeight: 1.5 }}>
                  {n.body}
                </p>
                {n.project && (
                  <span style={{
                    display: 'inline-block', marginTop: '6px', marginRight: '6px',
                    fontSize: '10px', fontWeight: 600, letterSpacing: '0.05em',
                    padding: '2px 8px', borderRadius: '99px',
                    background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)',
                    fontFamily: 'var(--font-primary)',
                  }}>
                    {n.project}
                  </span>
                )}
                {n.priority && ['high', 'critical'].includes(n.priority) && (
                  <span style={{
                    display: 'inline-block', marginTop: '6px',
                    fontSize: '10px', fontWeight: 600, letterSpacing: '0.05em',
                    padding: '2px 8px', borderRadius: '99px',
                    background: n.priority === 'critical' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(249, 115, 22, 0.15)', 
                    color: n.priority === 'critical' ? '#ef4444' : '#f97316',
                    fontFamily: 'var(--font-primary)',
                  }}>
                    {n.priority.toUpperCase()}
                  </span>
                )}
              </div>
              {!n.read && (
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: accentColor, flexShrink: 0, marginTop: '4px' }} />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
