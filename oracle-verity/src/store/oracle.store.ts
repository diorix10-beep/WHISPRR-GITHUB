// ============================================================
// ORACLE VERITY — ORACLE STORE (Zustand 5)
// ============================================================

import { create } from 'zustand';
import { OracleMode, ORACLE_MODES } from '../core/persona';
import { CompanionId } from './family.store';
import { getTimeOfDayMode } from '../core/language-detector';

export interface Message {
  id: string;
  role: 'user' | 'oracle';
  content: string;
  timestamp: Date;
  lang: 'en' | 'fr';
}

export interface OracleNotification {
  id: string;
  title: string;
  body: string;
  project?: string;
  category?: 'milestone_completed' | 'milestone_changed' | 'feature_added' | 'task_completed' | 'security_alert' | 'health_alert' | 'github_update' | 'deployment' | 'system_alert';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  type: 'info' | 'success' | 'warning' | 'alert';
  timestamp: Date;
  read: boolean;
}

function getAutoMode(): OracleMode {
  const tod = getTimeOfDayMode();
  if (tod === 'night') return 'night';
  if (tod === 'morning') return 'casual';
  return 'cofounder';
}

interface OracleState {
  // Identity
  mode: OracleMode;
  lang: 'en' | 'fr';
  isTransitioning: boolean;
  currentActivity: string;
  isThinking: boolean;
  isSpeaking: boolean;
  activeCompanionId: CompanionId;

  // Conversation
  messages: Message[];
  notifications: OracleNotification[];
  unreadCount: number;

  // UI
  showChat: boolean;
  showSettings: boolean;
  showProjects: boolean;
  showNotifications: boolean;
  showSupport: boolean;
  showTelegram: boolean;
  isInitialized: boolean;

  // Actions
  setMode: (mode: OracleMode) => void;
  setLang: (lang: 'en' | 'fr') => void;
  setActivity: (activity: string) => void;
  setThinking: (val: boolean) => void;
  setSpeaking: (val: boolean) => void;
  setActiveCompanion: (id: CompanionId) => void;
  addMessage: (msg: Omit<Message, 'id' | 'timestamp'>) => void;
  addNotification: (n: Omit<OracleNotification, 'id' | 'timestamp' | 'read'>) => void;
  markAllRead: () => void;
  toggleChat: () => void;
  toggleSettings: () => void;
  toggleProjects: () => void;
  toggleNotifications: () => void;
  toggleSupport: () => void;
  toggleTelegram: () => void;
  setInitialized: () => void;
}

export const useOracleStore = create<OracleState>((set, get) => ({
  mode: getAutoMode(),
  lang: 'en',
  isTransitioning: false,
  currentActivity: 'Initializing workspace...',
  isThinking: false,
  isSpeaking: false,
  activeCompanionId: 'oracle',

  messages: [],
  notifications: [
    {
      id: 'n1',
      title: 'WHISPRR Update',
      body: 'Q2 Beta milestone approaching — July 1st deadline.',
      project: 'WHISPRR',
      type: 'info',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      read: false,
    },
    {
      id: 'n2',
      title: 'Oracle Systems',
      body: 'Oracle Verity workspace initialized successfully.',
      project: 'Oracle Systems',
      type: 'success',
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      read: false,
    },
  ],
  unreadCount: 2,

  showChat: false,
  showSettings: false,
  showProjects: false,
  showNotifications: false,
  showSupport: false,
  showTelegram: false,
  isInitialized: false,

  setMode: (mode) => {
    set({ isTransitioning: true });
    setTimeout(() => {
      set({ mode, isTransitioning: false });
    }, 400);
  },

  setLang: (lang) => set({ lang }),

  setActivity: (currentActivity) => set({ currentActivity }),

  setThinking: (isThinking) => set({ isThinking }),

  setSpeaking: (isSpeaking) => set({ isSpeaking }),

  setActiveCompanion: (activeCompanionId) => set({ activeCompanionId }),

  addMessage: (msg) => {
    const message: Message = {
      ...msg,
      id: `msg-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
    };
    set((s) => ({ messages: [...s.messages, message] }));
  },

  addNotification: (n) => {
    const notif: OracleNotification = {
      ...n,
      id: `notif-${Date.now()}`,
      timestamp: new Date(),
      read: false,
    };
    set((s) => ({
      notifications: [notif, ...s.notifications],
      unreadCount: s.unreadCount + 1,
    }));
  },

  markAllRead: () => {
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },

  toggleChat: () => set((s) => ({
    showChat: !s.showChat,
    showSettings: false,
    showNotifications: false,
    showSupport: false,
  })),

  toggleSettings: () => set((s) => ({
    showSettings: !s.showSettings,
    showChat: false,
    showNotifications: false,
    showSupport: false,
  })),

  toggleProjects: () => set((s) => ({ showProjects: !s.showProjects })),

  toggleNotifications: () => set((s) => ({
    showNotifications: !s.showNotifications,
    showSettings: false,
    showChat: false,
    showSupport: false,
  })),

  toggleSupport: () => set((s) => ({
    showSupport: !s.showSupport,
    showChat: false,
    showSettings: false,
    showNotifications: false,
    showTelegram: false,
  })),

  toggleTelegram: () => set((s) => ({
    showTelegram: !s.showTelegram,
    showChat: false,
    showSettings: false,
    showNotifications: false,
    showSupport: false,
  })),

  setInitialized: () => set({ isInitialized: true }),
}));
