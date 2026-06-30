// ============================================================
// ORACLE VERITY — TELEGRAM STORE (Zustand)
// ============================================================

import { create } from 'zustand';

export interface TelegramMessage {
  id: number;
  chatId: number;
  senderName: string;
  text: string;
  isOracle: boolean;
  timestamp: Date;
}

export interface TelegramChat {
  chatId: number;
  userName: string;
  messages: TelegramMessage[];
  unreadCount: number;
  lastUpdated: Date;
}

interface TelegramState {
  chats: Record<number, TelegramChat>;
  isPolling: boolean;
  
  setPolling: (status: boolean) => void;
  addMessage: (chatId: number, userName: string, message: TelegramMessage) => void;
  markChatRead: (chatId: number) => void;
}

function loadTelegramChats(): Record<number, TelegramChat> {
  try {
    const raw = localStorage.getItem('oracle_telegram_chats');
    if (raw) {
      const parsed = JSON.parse(raw);
      // Re-hydrate Date objects from ISO strings
      Object.keys(parsed).forEach(chatIdStr => {
        const chatId = Number(chatIdStr);
        const chat = parsed[chatId];
        if (chat) {
          chat.lastUpdated = new Date(chat.lastUpdated);
          chat.messages.forEach((msg: any) => {
            msg.timestamp = new Date(msg.timestamp);
          });
        }
      });
      return parsed;
    }
  } catch {}
  return {};
}

export const useTelegramStore = create<TelegramState>((set) => ({
  chats: loadTelegramChats(),
  isPolling: false,

  setPolling: (status) => set({ isPolling: status }),

  addMessage: (chatId, userName, message) => set((s) => {
    const chat = s.chats[chatId] || {
      chatId,
      userName,
      messages: [],
      unreadCount: 0,
      lastUpdated: new Date(0),
    };

    if (chat.messages.some((m: TelegramMessage) => m.id === message.id)) {
      return s;
    }

    const updatedChats = {
      ...s.chats,
      [chatId]: {
        ...chat,
        userName, // Update in case it changed
        messages: [...chat.messages, message],
        unreadCount: message.isOracle ? chat.unreadCount : chat.unreadCount + 1,
        lastUpdated: new Date()
      }
    };
    
    localStorage.setItem('oracle_telegram_chats', JSON.stringify(updatedChats));
    return { chats: updatedChats };
  }),

  markChatRead: (chatId) => set((s) => {
    const chat = s.chats[chatId];
    if (!chat) return s;
    const updatedChats = {
      ...s.chats,
      [chatId]: { ...chat, unreadCount: 0 }
    };
    localStorage.setItem('oracle_telegram_chats', JSON.stringify(updatedChats));
    return { chats: updatedChats };
  }),
}));
