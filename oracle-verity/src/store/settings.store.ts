// ============================================================
// ORACLE VERITY — SETTINGS STORE (Zustand)
// ============================================================

import { create } from 'zustand';

interface SettingsState {
  groqKey: string;
  groqUrl: string;
  // Per-member Telegram tokens — one bot per family member
  memberTelegramTokens: Record<string, string>;
  telegramChatId: string;
  githubToken: string;
  elevenLabsKey: string;
  companionVoices: Record<string, string>;
  cameraEnabled: boolean;
  voiceEnabled: boolean;
  autoModeEnabled: boolean;
  notificationsEnabled: boolean;
  userName: string;
  kvRestApiUrl: string;
  kvRestApiToken: string;
  creatorTelegramUserId: string;
  supabaseUrl: string;
  supabaseAnonKey: string;

  setGroqKey: (k: string) => void;
  setGroqUrl: (u: string) => void;
  setMemberTelegramToken: (memberId: string, token: string) => void;
  setTelegramToken: (t: string) => void;
  setFamilyTelegramToken: (t: string) => void;
  setTelegramChatId: (id: string) => void;
  setGithubToken: (t: string) => void;
  setElevenLabsKey: (k: string) => void;
  setCompanionVoice: (companionId: string, voiceId: string) => void;
  setCameraEnabled: (v: boolean) => void;
  setVoiceEnabled: (v: boolean) => void;
  setAutoMode: (v: boolean) => void;
  setNotifications: (v: boolean) => void;
  setUserName: (n: string) => void;
  setKvRestApiUrl: (u: string) => void;
  setKvRestApiToken: (t: string) => void;
  setCreatorTelegramUserId: (id: string) => void;
  setSupabaseUrl: (u: string) => void;
  setSupabaseAnonKey: (k: string) => void;
  hasLLM: () => boolean;
  hasKv: () => boolean;
  hasSupabase: () => boolean;
  hasAnyTelegramToken: () => boolean;
  // Backward compat
  telegramToken: string;
  familyTelegramToken: string;
}

function loadSetting(key: string, fallback: string = ''): string {
  try { return localStorage.getItem(`oracle_${key}`) ?? fallback; } catch { return fallback; }
}
function loadBool(key: string, fallback: boolean = false): boolean {
  try {
    const v = localStorage.getItem(`oracle_${key}`);
    return v === null ? fallback : v === 'true';
  } catch { return fallback; }
}

function loadCompanionVoices(): Record<string, string> {
  try {
    const raw = localStorage.getItem('oracle_companion_voices');
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    oracle:  'EXAVITQu4vr4xnSDxMaL',
    athena:  'MF3mGyEYCl7XYWbV9V6O',
    atlas:   'pNInz6obpgDQGcFmaJcg',
    aegis:   'VR6AewLTigWG4xSOukaG',
    iris:    'ThT5KcBeYPX3keUQqHPh',
    whisprr: '21m00Tcm4TlvDq8ikWAM',
    anthony: 'TxGEqnHWrfWFTfGW9XjX',
  };
}

const FAMILY_MEMBER_IDS = ['iris', 'oracle', 'anthony', 'atlas', 'athena', 'aegis', 'whisprr'] as const;

function loadMemberTelegramTokens(): Record<string, string> {
  const tokens: Record<string, string> = {};
  for (const id of FAMILY_MEMBER_IDS) {
    try { tokens[id] = localStorage.getItem(`oracle_member_tg_${id}`) ?? ''; }
    catch { tokens[id] = ''; }
  }
  // Migrate old single tokens
  const oldOracle = loadSetting('telegram_token');
  const oldFamily = loadSetting('family_telegram_token');
  if (oldOracle && !tokens['oracle']) tokens['oracle'] = oldOracle;
  if (oldFamily) {
    for (const id of FAMILY_MEMBER_IDS) {
      if (id !== 'oracle' && !tokens[id]) tokens[id] = oldFamily;
    }
  }
  return tokens;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  groqKey: loadSetting('groq_key'),
  groqUrl: loadSetting('groq_url', 'https://api.groq.com/openai/v1'),
  memberTelegramTokens: loadMemberTelegramTokens(),
  telegramChatId: loadSetting('telegram_chat_id'),
  githubToken: loadSetting('github_token'),
  elevenLabsKey: loadSetting('elevenlabs_key'),
  companionVoices: loadCompanionVoices(),
  cameraEnabled: loadBool('camera', false),
  voiceEnabled: loadBool('voice', true),
  autoModeEnabled: loadBool('auto_mode', true),
  notificationsEnabled: loadBool('notifications', true),
  userName: loadSetting('user_name', ''),
  kvRestApiUrl: loadSetting('kv_rest_api_url'),
  kvRestApiToken: loadSetting('kv_rest_api_token'),
  creatorTelegramUserId: loadSetting('creator_telegram_user_id'),
  supabaseUrl: loadSetting('supabase_url') || (import.meta.env.VITE_SUPABASE_URL ?? ''),
  supabaseAnonKey: loadSetting('supabase_anon_key') || (import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''),

  // Backward compat computed
  get telegramToken() { return get().memberTelegramTokens['oracle'] ?? ''; },
  get familyTelegramToken() { return Object.entries(get().memberTelegramTokens).find(([k, v]) => k !== 'oracle' && v)?.[1] ?? ''; },

  setGroqKey: (k) => { localStorage.setItem('oracle_groq_key', k); set({ groqKey: k }); },
  setGroqUrl: (u) => { localStorage.setItem('oracle_groq_url', u); set({ groqUrl: u }); },

  setMemberTelegramToken: (memberId, token) => {
    localStorage.setItem(`oracle_member_tg_${memberId}`, token);
    set((state) => ({ memberTelegramTokens: { ...state.memberTelegramTokens, [memberId]: token } }));
  },
  setTelegramToken: (t) => {
    // Backward compat — sets Oracle's token
    localStorage.setItem('oracle_member_tg_oracle', t);
    set((state) => ({ memberTelegramTokens: { ...state.memberTelegramTokens, oracle: t } }));
  },
  setFamilyTelegramToken: (_t) => {
    console.warn('setFamilyTelegramToken is deprecated. Use setMemberTelegramToken per family member.');
  },

  setTelegramChatId: (id) => { localStorage.setItem('oracle_telegram_chat_id', id); set({ telegramChatId: id }); },
  setGithubToken: (t) => { localStorage.setItem('oracle_github_token', t); set({ githubToken: t }); },
  setElevenLabsKey: (k) => { localStorage.setItem('oracle_elevenlabs_key', k); set({ elevenLabsKey: k }); },
  setCompanionVoice: (companionId, voiceId) => {
    set((state) => {
      const updated = { ...state.companionVoices, [companionId]: voiceId };
      localStorage.setItem('oracle_companion_voices', JSON.stringify(updated));
      return { companionVoices: updated };
    });
  },
  setCameraEnabled: (v) => { localStorage.setItem('oracle_camera', String(v)); set({ cameraEnabled: v }); },
  setVoiceEnabled: (v) => { localStorage.setItem('oracle_voice', String(v)); set({ voiceEnabled: v }); },
  setAutoMode: (v) => { localStorage.setItem('oracle_auto_mode', String(v)); set({ autoModeEnabled: v }); },
  setNotifications: (v) => { localStorage.setItem('oracle_notifications', String(v)); set({ notificationsEnabled: v }); },
  setUserName: (n) => { localStorage.setItem('oracle_user_name', n); set({ userName: n }); },
  setKvRestApiUrl: (u) => { localStorage.setItem('oracle_kv_rest_api_url', u); set({ kvRestApiUrl: u }); },
  setKvRestApiToken: (t) => { localStorage.setItem('oracle_kv_rest_api_token', t); set({ kvRestApiToken: t }); },
  setCreatorTelegramUserId: (id) => { localStorage.setItem('oracle_creator_telegram_user_id', id); set({ creatorTelegramUserId: id }); },
  setSupabaseUrl: (u) => { localStorage.setItem('oracle_supabase_url', u); set({ supabaseUrl: u }); },
  setSupabaseAnonKey: (k) => { localStorage.setItem('oracle_supabase_anon_key', k); set({ supabaseAnonKey: k }); },

  hasLLM: () => { const s = get(); return !!(s.groqKey && s.groqUrl); },
  hasKv: () => { const s = get(); return !!(s.kvRestApiUrl && s.kvRestApiToken); },
  hasSupabase: () => { const s = get(); return !!(s.supabaseUrl && s.supabaseAnonKey); },
  hasAnyTelegramToken: () => Object.values(get().memberTelegramTokens).some(t => !!t),
}));
