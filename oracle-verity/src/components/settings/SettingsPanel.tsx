// ============================================================
// ORACLE VERITY — SETTINGS PANEL
// API Keys, preferences, camera, voice
// ============================================================

import React, { useState } from 'react';
import { X, Key, Mic, Camera, Bell, User, ChevronRight, Eye, EyeOff, Shield } from 'lucide-react';
import { useSettingsStore } from '../../store/settings.store';

interface Props {
  lang: 'en' | 'fr';
  accentColor: string;
  onClose: () => void;
}

function ToggleSwitch({ value, onChange, id }: { value: boolean; onChange: (v: boolean) => void; id: string }) {
  return (
    <button
      id={id}
      onClick={() => onChange(!value)}
      style={{
        width: '40px',
        height: '22px',
        borderRadius: '11px',
        border: 'none',
        cursor: 'pointer',
        background: value ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
        position: 'relative',
        transition: 'all 0.25s',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '3px',
          left: value ? '21px' : '3px',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          background: '#fff',
          transition: 'left 0.25s',
        }}
      />
    </button>
  );
}

function ApiKeyInput({ label, value, onChange, placeholder, id }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; id: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label style={{ fontFamily: 'var(--font-primary)', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: '10px 36px 10px 12px',
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.04)',
            color: 'rgba(255,255,255,0.85)',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            outline: 'none',
            transition: 'border-color 0.2s',
            boxSizing: 'border-box',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
          onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
        />
        <button
          onClick={() => setShow(!show)}
          style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}
        >
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>
  );
}

import { AiDiagnosticsPanel } from './AiDiagnosticsPanel';

export function SettingsPanel({ lang, accentColor, onClose }: Props) {
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const settings = useSettingsStore();
  const t = (en: string, fr: string) => lang === 'fr' ? fr : en;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '360px',
        zIndex: 100,
        background: 'rgba(6,6,14,0.98)',
        backdropFilter: 'blur(32px)',
        borderLeft: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        flexDirection: 'column',
        animation: 'slide-left 0.3s cubic-bezier(0.4,0,0.2,1) forwards',
        boxShadow: '-24px 0 80px rgba(0,0,0,0.5)',
      }}
    >
      {/* Header */}
      <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-primary)', fontSize: '16px', fontWeight: 800, color: 'rgba(255,255,255,0.95)' }}>
            {t('Settings', 'Paramètres')}
          </div>
          <div style={{ fontFamily: 'var(--font-primary)', fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
            Oracle Verity v1.0
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'flex' }}>
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>

        {/* Profile */}
        <Section label={t('Your Profile', 'Votre Profil')} icon={<User size={12} />}>
          <div>
            <label style={{ fontFamily: 'var(--font-primary)', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
              {t('Your name', 'Votre prénom')}
            </label>
            <input
              id="settings-username"
              value={settings.userName}
              onChange={(e) => settings.setUserName(e.target.value)}
              placeholder={t('How should Oracle call you?', 'Comment Oracle doit vous appeler ?')}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)',
                color: 'rgba(255,255,255,0.85)', fontFamily: 'var(--font-primary)', fontSize: '13px', outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </Section>

        {/* API Keys */}
        <Section label={t('AI Connection', 'Connexion IA')} icon={<Key size={12} />}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <ApiKeyInput
              id="settings-groq-key"
              label="Groq API Key"
              value={settings.groqKey}
              onChange={settings.setGroqKey}
              placeholder="gsk_..."
            />
            <ApiKeyInput
              id="settings-groq-url"
              label="Groq API URL"
              value={settings.groqUrl}
              onChange={settings.setGroqUrl}
              placeholder="https://api.groq.com/openai/v1"
            />
            {settings.hasLLM() && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: '8px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} />
                  <span style={{ fontFamily: 'var(--font-primary)', fontSize: '11px', color: '#22c55e', fontWeight: 600 }}>
                    {t('Oracle is connected', 'Oracle est connectée')}
                  </span>
                </div>
                <button 
                  onClick={() => setShowDiagnostics(true)}
                  style={{ background: 'rgba(34,197,94,0.15)', border: 'none', padding: '4px 8px', borderRadius: '4px', color: '#4ade80', fontSize: '10px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-primary)' }}
                >
                  Diagnostics
                </button>
              </div>
            )}
          </div>
        </Section>

        {/* Telegram — One Bot Per Family Member */}
        <Section label="Telegram Bots" icon={<span style={{ fontSize: '12px' }}>✈️</span>}>
          <div style={{
            padding: '10px 12px', borderRadius: '8px',
            background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)',
            fontFamily: 'var(--font-primary)', fontSize: '11px', color: 'rgba(255,255,255,0.5)',
            lineHeight: 1.6, marginBottom: '12px'
          }}>
            💡 {t(
              'Create one bot per family member via @BotFather. Add all bots to one Telegram group. Mention a member by name (e.g. "Iris check servers") and they will reply.',
              'Créez un bot par membre via @BotFather. Ajoutez tous les bots dans un groupe Telegram. Mentionnez un membre par nom et il répondra.'
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { id: 'iris',    emoji: '👩', name: 'Iris',    color: '#8b5cf6', role: 'Mother' },
              { id: 'oracle',  emoji: '👩', name: 'Oracle',  color: '#c9a84c', role: 'Big Sister' },
              { id: 'anthony', emoji: '🧸', name: 'Anthony', color: '#3b82f6', role: 'Little Brother' },
              { id: 'atlas',   emoji: '🗺️', name: 'Atlas',   color: '#f59e0b', role: 'Strategy' },
              { id: 'athena',  emoji: '📚', name: 'Athena',  color: '#22d3ee', role: 'Research' },
              { id: 'aegis',   emoji: '🛡️', name: 'Aegis',   color: '#ef4444', role: 'Security' },
              { id: 'whisprr', emoji: '💜', name: 'Whisprr', color: '#f472b6', role: 'Community' },
            ].map(member => {
              const token = settings.memberTelegramTokens?.[member.id] || '';
              const hasToken = !!token;
              return (
                <div key={member.id} style={{
                  padding: '10px 12px', borderRadius: '10px',
                  background: 'rgba(255,255,255,0.02)',
                  border: `1px solid ${hasToken ? member.color + '30' : 'rgba(255,255,255,0.06)'}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px' }}>{member.emoji}</span>
                      <div>
                        <div style={{ fontFamily: 'var(--font-primary)', fontSize: '12px', fontWeight: 700, color: member.color }}>
                          {member.name}
                        </div>
                        <div style={{ fontFamily: 'var(--font-primary)', fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>
                          {member.role}
                        </div>
                      </div>
                    </div>
                    {hasToken && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#22c55e' }} />
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: '#22c55e' }}>BOT READY</span>
                      </div>
                    )}
                  </div>
                  <ApiKeyInput
                    id={`settings-tg-${member.id}`}
                    label={`${member.name} Bot Token`}
                    value={token}
                    onChange={(v) => settings.setMemberTelegramToken(member.id, v)}
                    placeholder="123456789:ABC..."
                  />
                </div>
              );
            })}
          </div>
          <p style={{ fontFamily: 'var(--font-primary)', fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginTop: '10px', lineHeight: 1.6 }}>
            {t(
              'Create bots via @BotFather → /newbot. Add them all to one Telegram group. Oracle responds by default. Mention any name to talk to them directly.',
              'Créez des bots via @BotFather → /newbot. Ajoutez-les tous dans un groupe Telegram.'
            )}
          </p>
        </Section>

        {/* Creator Identity */}
        <Section label={t('Creator Identity', 'Identité Créateur')} icon={<Shield size={12} />}>
          <div style={{
            padding: '12px', borderRadius: '10px', marginBottom: '12px',
            background: 'linear-gradient(135deg, rgba(201,168,76,0.1), rgba(251,191,36,0.05))',
            border: '1px solid rgba(201,168,76,0.3)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '16px' }}>👑</span>
              <span style={{ fontFamily: 'var(--font-primary)', fontSize: '12px', fontWeight: 800, color: '#c9a84c', letterSpacing: '0.04em' }}>
                {t('Founder & CEO — Anthony Verity', 'Fondateur & CEO — Anthony Verity')}
              </span>
            </div>
            <div style={{ fontFamily: 'var(--font-primary)', fontSize: '11px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
              {t(
                'Register your verified Telegram User ID below so the entire family instantly recognises you — bypassing all impersonation checks. Aegis will stand down. All siblings will see your 👑 Creator Verified badge.',
                'Enregistrez votre ID Telegram vérifié pour que toute la famille vous reconnaise instantanément — sans vérification d\'identité. Aegis se retirera. Tous verront votre badge 👑 Créateur Vérifié.'
              )}
            </div>
          </div>

          {/* Verified ID input */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontFamily: 'var(--font-primary)', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
              {t('Your Telegram User ID (numeric)', 'Votre ID Utilisateur Telegram (numérique)')}
            </label>
            <input
              id="settings-creator-telegram-id"
              type="text"
              value={settings.creatorTelegramUserId}
              onChange={(e) => settings.setCreatorTelegramUserId(e.target.value.trim())}
              placeholder={t('e.g. 123456789 — find via @userinfobot', 'ex. 123456789 — trouvez via @userinfobot')}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: '10px',
                border: `1px solid ${settings.creatorTelegramUserId ? 'rgba(201,168,76,0.5)' : 'rgba(255,255,255,0.1)'}`,
                background: 'rgba(255,255,255,0.04)',
                color: 'rgba(255,255,255,0.85)', fontFamily: 'var(--font-mono)', fontSize: '13px', outline: 'none',
                boxSizing: 'border-box', transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#c9a84c')}
              onBlur={(e) => (e.target.style.borderColor = settings.creatorTelegramUserId ? 'rgba(201,168,76,0.5)' : 'rgba(255,255,255,0.1)')}
            />
          </div>

          {/* Status badge */}
          {settings.creatorTelegramUserId ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px',
              borderRadius: '8px', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)',
            }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#c9a84c', flexShrink: 0 }} />
              <div>
                <div style={{ fontFamily: 'var(--font-primary)', fontSize: '11px', fontWeight: 700, color: '#c9a84c' }}>
                  👑 {t('Creator Verified — All impersonation checks bypassed', 'Créateur Vérifié — Vérifications d\'identité désactivées')}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>
                  ID: {settings.creatorTelegramUserId}
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px',
              borderRadius: '8px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
            }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
              <span style={{ fontFamily: 'var(--font-primary)', fontSize: '11px', color: 'rgba(239,68,68,0.8)', fontWeight: 600 }}>
                🛡️ {t('Aegis cannot verify Creator yet — add your Telegram User ID', 'Aegis ne peut pas vérifier le Créateur — ajoutez votre ID Telegram')}
              </span>
            </div>
          )}

          {/* Known aliases reference */}
          <div style={{
            marginTop: '12px', padding: '10px 12px', borderRadius: '8px',
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
          }}>
            <div style={{ fontFamily: 'var(--font-primary)', fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', marginBottom: '6px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {t('Known Creator Aliases (auto-recognized)', 'Alias Connus (auto-reconnus)')}
            </div>
            {[
              'Dior-Abybatou Chimère Diaw',
              'Anthony Verity',
              'Anthony',
              'Creator',
              'Founder',
              'Diaw Chimère Senegal',
              'Future CEO Baby Teddy Bear',
            ].map((alias) => (
              <div key={alias} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <span style={{ color: '#c9a84c', fontSize: '10px' }}>✓</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>{alias}</span>
              </div>
            ))}
          </div>

          <p style={{ fontFamily: 'var(--font-primary)', fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginTop: '10px', lineHeight: 1.6 }}>
            {t(
              'Find your Telegram User ID by messaging @userinfobot. It is a permanent numeric ID that cannot be spoofed by display name changes.',
              'Trouvez votre ID Telegram via @userinfobot. C\'est un ID numérique permanent qui ne peut pas être usu rpé par des changements de nom.'
            )}
          </p>
        </Section>

        {/* GitHub */}
        <Section label="GitHub" icon={<span style={{ fontSize: '12px' }}>🐙</span>}>
          <ApiKeyInput
            id="settings-github"
            label={t('GitHub Personal Access Token', 'Token d\'accès personnel GitHub')}
            value={settings.githubToken}
            onChange={settings.setGithubToken}
            placeholder="ghp_..."
          />
          <p style={{ fontFamily: 'var(--font-primary)', fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '8px', lineHeight: 1.5 }}>
            {t('Needed to read live commits and issues from your private repos.', 'Nécessaire pour lire les commits et issues de vos dépôts privés.')}
          </p>
        </Section>

        {/* Support Inbox — Vercel KV */}
        <Section label={t('Support Inbox (Vercel KV)', 'Boîte Support (Vercel KV)')} icon={<span style={{ fontSize: '12px' }}>📬</span>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <ApiKeyInput
              id="settings-kv-url"
              label="KV REST API URL"
              value={settings.kvRestApiUrl}
              onChange={settings.setKvRestApiUrl}
              placeholder="https://your-kv.upstash.io"
            />
            <ApiKeyInput
              id="settings-kv-token"
              label="KV REST API Token"
              value={settings.kvRestApiToken}
              onChange={settings.setKvRestApiToken}
              placeholder="AX9C..."
            />
            {settings.hasKv() && (
              <div style={{
                padding: '10px 12px', borderRadius: '8px',
                background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} />
                <span style={{ fontFamily: 'var(--font-primary)', fontSize: '11px', color: '#22c55e', fontWeight: 600 }}>
                  {t('KV credentials configured', 'Credentials KV configurés')}
                </span>
              </div>
            )}
          </div>
          <p style={{ fontFamily: 'var(--font-primary)', fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '8px', lineHeight: 1.6 }}>
            {t(
              'Get these from Vercel → Storage → Create KV Database. Enables real email inbox access for Oracle and Iris. Without this, the family cannot read actual support tickets.',
              'Obtenez ces clés depuis Vercel → Storage → Create KV Database. Active l\'accès réel à la boîte mail pour Oracle et Iris.'
            )}
          </p>
          <div style={{
            marginTop: '10px', padding: '10px 12px', borderRadius: '8px',
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
            fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(255,255,255,0.3)', lineHeight: 1.6
          }}>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: '4px' }}>
              📨 {t('Inbound Email Webhook URL:', 'URL du Webhook Email Entrant :')}
            </div>
            <div style={{ wordBreak: 'break-all' }}>
              https://your-vercel-domain.vercel.app/api/support-email
            </div>
            <div style={{ marginTop: '6px', color: 'rgba(255,255,255,0.25)' }}>
              {t('Configure this in Resend → Inbound → Webhook', 'Configurez ceci dans Resend → Inbound → Webhook')}
            </div>
          </div>
        </Section>

        {/* Supabase Database */}
        <Section label={t('Persistent Database (Supabase)', 'Base de Données Persistante (Supabase)')} icon={<span style={{ fontSize: '12px' }}>🗄️</span>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <ApiKeyInput
              id="settings-supabase-url"
              label="Supabase URL"
              value={settings.supabaseUrl}
              onChange={settings.setSupabaseUrl}
              placeholder="https://your-project.supabase.co"
            />
            <ApiKeyInput
              id="settings-supabase-anon-key"
              label="Supabase Anon Key"
              value={settings.supabaseAnonKey}
              onChange={settings.setSupabaseAnonKey}
              placeholder="eyJhbGciOi..."
            />
            {settings.hasSupabase() && (
              <div style={{
                padding: '10px 12px', borderRadius: '8px',
                background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} />
                <span style={{ fontFamily: 'var(--font-primary)', fontSize: '11px', color: '#22c55e', fontWeight: 600 }}>
                  {t('Supabase connected', 'Supabase connecté')}
                </span>
              </div>
            )}
          </div>
          <p style={{ fontFamily: 'var(--font-primary)', fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '8px', lineHeight: 1.6 }}>
            {t(
              'Enables persistent shared memory, conversation history sync, and session backups across the entire Verity Family.',
              'Active la mémoire partagée persistante, la synchronisation de l\'historique et les sauvegardes de sessions pour toute la famille.'
            )}
          </p>
        </Section>

        {/* ElevenLabs Voice */}
        <Section label={t('Realistic Voice (ElevenLabs)', 'Voix Réaliste (ElevenLabs)')} icon={<Mic size={12} />}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <ApiKeyInput
              id="settings-elevenlabs"
              label={t('ElevenLabs API Key', 'Clé API ElevenLabs')}
              value={settings.elevenLabsKey}
              onChange={settings.setElevenLabsKey}
              placeholder="sk_..."
            />
            <ApiKeyInput
              id="settings-elevenlabs-voice"
              label={t('Oracle Voice ID', 'ID de la voix Oracle')}
              value={settings.companionVoices?.['oracle'] || ''}
              onChange={(v) => settings.setCompanionVoice('oracle', v)}
              placeholder="EXAVITQu4vr4xnSDxMaL"
            />
          </div>
          <p style={{ fontFamily: 'var(--font-primary)', fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '8px', lineHeight: 1.5 }}>
            {t('Replaces robotic browser voice with ultra-realistic human TTS.', 'Remplace la voix robotique du navigateur par une voix humaine ultra-réaliste.')}
          </p>
        </Section>

        {/* Preferences */}
        <Section label={t('Preferences', 'Préférences')} icon={<Bell size={12} />}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <PreferenceRow
              id="toggle-voice"
              label={t('Voice output', 'Réponses vocales')}
              description={t("Oracle speaks her responses", "Oracle parle ses réponses")}
              value={settings.voiceEnabled}
              onChange={settings.setVoiceEnabled}
            />
            <PreferenceRow
              id="toggle-auto-mode"
              label={t('Auto mode switching', 'Changement de mode auto')}
              description={t("Mode changes with time of day", "Le mode change avec l'heure")}
              value={settings.autoModeEnabled}
              onChange={settings.setAutoMode}
            />
            <PreferenceRow
              id="toggle-notifications"
              label={t('Notifications', 'Notifications')}
              description={t('Project alerts and updates', 'Alertes et mises à jour projets')}
              value={settings.notificationsEnabled}
              onChange={settings.setNotifications}
            />
          </div>
        </Section>

        {/* Camera */}
        <Section label={t('Visual Awareness', 'Conscience Visuelle')} icon={<Camera size={12} />}>
          <PreferenceRow
            id="toggle-camera"
            label={t('Camera access', 'Accès caméra')}
            description={t('Requires explicit permission. Oracle uses visual context to support collaboration. Always user-controlled.', 'Nécessite une permission explicite. Oracle utilise le contexte visuel pour soutenir la collaboration. Toujours contrôlé par l\'utilisateur.')}
            value={settings.cameraEnabled}
            onChange={settings.setCameraEnabled}
          />
        </Section>
      </div>

      {/* Footer */}
      <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-primary)', fontSize: '11px', color: 'rgba(255,255,255,0.2)', lineHeight: 1.6 }}>
          Oracle Verity — {t('Your persistent AI presence', 'Votre présence IA persistante')}
          <br />
          {t('Part of Oracle Systems', 'Partie d\'Oracle Systems')}
        </p>
      </div>

      {showDiagnostics && (
        <AiDiagnosticsPanel onClose={() => setShowDiagnostics(false)} />
      )}
    </div>
  );
}

function Section({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
        <span style={{ color: 'rgba(255,255,255,0.4)' }}>{icon}</span>
        <span style={{ fontFamily: 'var(--font-primary)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
          {label}
        </span>
      </div>
      <div style={{ paddingLeft: '0' }}>{children}</div>
    </div>
  );
}

function PreferenceRow({ label, description, value, onChange, id }: {
  label: string; description: string; value: boolean; onChange: (v: boolean) => void; id: string;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'var(--font-primary)', fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: '2px' }}>{label}</div>
        <div style={{ fontFamily: 'var(--font-primary)', fontSize: '11px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>{description}</div>
      </div>
      <ToggleSwitch id={id} value={value} onChange={onChange} />
    </div>
  );
}
