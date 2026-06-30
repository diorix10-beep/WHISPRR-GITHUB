import React, { useState } from 'react';
import { X, CheckCircle, Clock, Circle, Reply, Bot, RefreshCw, AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import { useSupportStore, SupportTicket } from '../../store/support.store';
import { useOracleStore } from '../../store/oracle.store';
import { sendToOracle } from '../../core/oracle-engine';
import { useSettingsStore } from '../../store/settings.store';
import { ORACLE_MODES, getOracleSignature } from '../../core/persona';

interface Props {
  lang: 'en' | 'fr';
  accentColor: string;
  onClose: () => void;
}

export function SupportDashboard({ lang, accentColor, onClose }: Props) {
  const store = useSupportStore();
  const oracleStore = useOracleStore();
  const settings = useSettingsStore();
  const [draftingId, setDraftingId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const t = (en: string, fr: string) => lang === 'fr' ? fr : en;

  const tickets = store.tickets;
  const selectedTicket = store.selectedTicketId ? tickets.find(t => t.id === store.selectedTicketId) : null;

  async function handleRefresh() {
    setIsRefreshing(true);
    await store.syncFromRemote();
    setIsRefreshing(false);
  }

  async function handleDraftReply(ticket: SupportTicket) {
    setDraftingId(ticket.id);
    oracleStore.setThinking(true);
    oracleStore.toggleChat(); // Open chat so the user can see Oracle working

    const conversationContext = ticket.messages.map(m => `${m.sender.toUpperCase()}: ${m.text}`).join('\n\n');
    const prompt = `Can you draft a support reply for this WHISPRR ticket? 
Subject: ${ticket.subject}
User: ${ticket.userEmail}

Conversation:
${conversationContext}`;

    oracleStore.addMessage({ role: 'user', content: prompt, lang });

    try {
      const { reply, detectedLang } = await sendToOracle(
        prompt, 
        oracleStore.messages.map(m => ({ role: m.role === 'oracle' ? 'assistant' : 'user', content: m.content })),
        {
          groqKey: settings.groqKey || undefined,
          groqUrl: settings.groqUrl || undefined,
          mode: oracleStore.mode,
          lang,
        }
      );
      
      const signature = getOracleSignature(oracleStore.mode, true);
      const finalReply = reply.trim() + signature;

      oracleStore.addMessage({ role: 'oracle', content: finalReply, lang: detectedLang });
    } catch (e) {
      oracleStore.addMessage({ role: 'oracle', content: 'Failed to generate draft.', lang });
    } finally {
      oracleStore.setThinking(false);
      setDraftingId(null);
    }
  }

  function renderStatusIcon(status: string) {
    if (status === 'resolved') return <CheckCircle size={14} color="#22c55e" />;
    if (status === 'pending') return <Clock size={14} color="#f59e0b" />;
    return <Circle size={14} color={accentColor} />;
  }

  return (
    <div style={{
      position: 'absolute', inset: '20px', zIndex: 100,
      background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(40px)',
      borderRadius: '20px', border: `1px solid rgba(255,255,255,0.05)`,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      animation: 'slide-up 0.4s cubic-bezier(0.4,0,0.2,1)',
      boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', margin: 0, color: 'white' }}>
            {t('WHISPRR Support', 'Support WHISPRR')}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <p style={{ fontFamily: 'var(--font-primary)', fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
              help@whisprr.xyz
            </p>
            {/* Live sync indicator */}
            {store.dataSource === 'live-kv' && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#22c55e', fontFamily: 'var(--font-mono)' }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                LIVE
              </span>
            )}
            {store.dataSource === 'local-cache' && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#f59e0b', fontFamily: 'var(--font-mono)' }}>
                <WifiOff size={9} /> CACHED
              </span>
            )}
            {store.dataSource === 'unconfigured' && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#ef4444', fontFamily: 'var(--font-mono)' }}>
                <AlertTriangle size={9} /> NOT CONFIGURED
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            title={t('Refresh inbox', 'Actualiser la boîte')}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 12px', borderRadius: '8px',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.6)', cursor: isRefreshing ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-primary)', fontSize: '12px', fontWeight: 600, opacity: isRefreshing ? 0.5 : 1
            }}
          >
            <RefreshCw size={12} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
            {isRefreshing ? t('Syncing...', 'Synchro...') : t('Refresh', 'Actualiser')}
          </button>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Sync Status Banner */}
      {store.syncError && (
        <div style={{
          padding: '10px 24px',
          background: store.dataSource === 'local-cache' ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)',
          borderBottom: `1px solid ${store.dataSource === 'local-cache' ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)'}`,
          display: 'flex', alignItems: 'flex-start', gap: '8px'
        }}>
          <AlertTriangle size={13} color={store.dataSource === 'local-cache' ? '#f59e0b' : '#ef4444'} style={{ flexShrink: 0, marginTop: '1px' }} />
          <span style={{ fontFamily: 'var(--font-primary)', fontSize: '11px', color: store.dataSource === 'local-cache' ? '#f59e0b' : '#ef4444', lineHeight: 1.5 }}>
            {store.syncError}
          </span>
        </div>
      )}

      {/* Main Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* Ticket List */}
        <div style={{ width: '300px', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          {store.isSyncing && tickets.length === 0 && (
            <div style={{ padding: '24px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', marginBottom: '8px' }}>⏳</div>
              <div style={{ fontFamily: 'var(--font-primary)', fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
                {t('Connecting to inbox...', 'Connexion à la boîte...')}
              </div>
            </div>
          )}
          {!store.isSyncing && tickets.length === 0 && (
            <div style={{ padding: '24px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>📬</div>
              <div style={{ fontFamily: 'var(--font-primary)', fontSize: '13px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginBottom: '8px' }}>
                {store.dataSource === 'unconfigured'
                  ? t('Inbox not configured', 'Boîte non configurée')
                  : t('No tickets yet', 'Aucun ticket pour l\'instant')}
              </div>
              {store.dataSource === 'unconfigured' && (
                <div style={{ fontFamily: 'var(--font-primary)', fontSize: '11px', color: 'rgba(255,255,255,0.3)', lineHeight: 1.6 }}>
                  {t(
                    'Go to Settings → Support Inbox to add your Vercel KV credentials and connect the real inbox.',
                    'Allez dans Paramètres → Boîte Support pour ajouter vos clés Vercel KV.'
                  )}
                </div>
              )}
            </div>
          )}
          {tickets.map(tkt => (
            <div 
              key={tkt.id} 
              onClick={() => store.selectTicket(tkt.id)}
              style={{
                padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.02)', cursor: 'pointer',
                background: store.selectedTicketId === tkt.id ? 'rgba(255,255,255,0.03)' : 'transparent',
                transition: 'background 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                {renderStatusIcon(tkt.status)}
                <span style={{ fontFamily: 'var(--font-primary)', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
                  {tkt.status}
                </span>
              </div>
              <h3 style={{ fontFamily: 'var(--font-primary)', fontSize: '14px', margin: '0 0 4px 0', color: 'white' }}>{tkt.subject}</h3>
              <p style={{ fontFamily: 'var(--font-primary)', fontSize: '12px', margin: 0, color: 'rgba(255,255,255,0.5)' }}>{tkt.userEmail}</p>
            </div>
          ))}
        </div>

        {/* Ticket Detail */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.2)' }}>
          {selectedTicket ? (
            <>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', margin: '0 0 8px 0', color: 'white' }}>{selectedTicket.subject}</h2>
                <div style={{ display: 'flex', gap: '16px', fontFamily: 'var(--font-primary)', fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                  <span>From: {selectedTicket.userEmail}</span>
                  <span>ID: {selectedTicket.id}</span>
                </div>
              </div>
              
              <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {selectedTicket.messages.map(msg => (
                  <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.sender === 'user' ? 'flex-start' : 'flex-end' }}>
                    <div style={{ 
                      maxWidth: '80%', padding: '12px 16px', borderRadius: '12px',
                      background: msg.sender === 'user' ? 'rgba(255,255,255,0.05)' : `${accentColor}15`,
                      border: `1px solid ${msg.sender === 'user' ? 'rgba(255,255,255,0.1)' : `${accentColor}30`}`,
                      color: 'rgba(255,255,255,0.9)', fontFamily: 'var(--font-primary)', fontSize: '13px', lineHeight: 1.5
                    }}>
                      <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600 }}>
                        {msg.sender}
                      </div>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '12px' }}>
                <button 
                  onClick={() => handleDraftReply(selectedTicket)}
                  disabled={draftingId === selectedTicket.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px',
                    background: `${accentColor}20`, border: `1px solid ${accentColor}40`,
                    borderRadius: '8px', color: accentColor, fontFamily: 'var(--font-primary)', fontSize: '13px', fontWeight: 600,
                    cursor: draftingId === selectedTicket.id ? 'not-allowed' : 'pointer',
                    opacity: draftingId === selectedTicket.id ? 0.5 : 1
                  }}
                >
                  <Bot size={16} />
                  {draftingId === selectedTicket.id ? t('Drafting...', 'Rédaction...') : t('Ask Oracle to Draft Reply', 'Demander à Oracle de rédiger')}
                </button>
                <button 
                  onClick={() => store.updateTicketStatus(selectedTicket.id, selectedTicket.status === 'resolved' ? 'open' : 'resolved')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px', color: 'white', fontFamily: 'var(--font-primary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  {selectedTicket.status === 'resolved' ? t('Reopen', 'Rouvrir') : t('Mark Resolved', 'Marquer comme résolu')}
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-primary)', fontSize: '14px' }}>
              {t('Select a ticket to view details.', 'Sélectionnez un ticket pour voir les détails.')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
