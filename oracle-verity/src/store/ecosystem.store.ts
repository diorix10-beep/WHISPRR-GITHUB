import { create } from 'zustand';
import { useSettingsStore } from './settings.store';
import { useTelegramStore } from './telegram.store';
import { fetchGithubContext } from '../core/github-api';

export interface TelegramMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  status: string;
  userEmail: string;
}

export interface EcosystemState {
  telegramMessages: TelegramMessage[];
  supportTickets: SupportTicket[];
  activeProjects: number;
  openIssuesCount: number;
  recentCommitsCount: number;
  lastSyncTime: string;
  isSyncing: boolean;

  fetchEcosystemData: () => Promise<void>;
}

export const useEcosystemStore = create<EcosystemState>((set) => ({
  telegramMessages: [],
  supportTickets: [],
  activeProjects: 3, // WHISPRR, Maison FX, Oracle
  openIssuesCount: 0,
  recentCommitsCount: 0,
  lastSyncTime: new Date().toISOString(),
  isSyncing: false,

  fetchEcosystemData: async () => {
    set({ isSyncing: true });
    try {
      // 1. Fetch Telegram
      let telegramData: TelegramMessage[] = [];
      try {
        const chats = useTelegramStore.getState().chats;
        telegramData = Object.values(chats)
          .flatMap(chat => chat.messages)
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()) // Newest first
          .map(m => ({
            id: m.id.toString(),
            sender: m.senderName,
            text: m.text,
            timestamp: m.timestamp.toISOString(),
          }))
          .slice(0, 5);
      } catch (e) {
        console.error('Failed to map telegram data for dashboard', e);
      }

      // 2. Fetch Support Tickets
      let supportData: SupportTicket[] = [];
      try {
        const stRes = await fetch('/api/support-email');
        if (stRes.ok) {
          const tickets = await stRes.json();
          if (Array.isArray(tickets)) {
            supportData = tickets.slice(0, 5);
          }
        }
      } catch (e) {
        console.error('Failed to fetch support data for dashboard', e);
      }

      // 3. Fetch GitHub Data (aggregate)
      const ghToken = useSettingsStore.getState().githubToken;
      let openIssues = 0;
      let recentCommits = 0;
      
      if (ghToken) {
        // Just checking a core repo as an example for the dashboard, e.g., whisprr-core
        // Ideally we map through all projects, but to avoid rate limits we'll do one or two
        try {
          const ghRes = await fetchGithubContext('whisprr/whisprr-core', ghToken);
          if (ghRes) {
            openIssues += ghRes.openIssuesCount;
            recentCommits += ghRes.commits.length;
          }
        } catch(e) {}
      }

      set({
        telegramMessages: telegramData,
        supportTickets: supportData,
        openIssuesCount: openIssues,
        recentCommitsCount: recentCommits,
        lastSyncTime: new Date().toISOString(),
      });

    } catch (e) {
      console.error('Ecosystem sync failed', e);
    } finally {
      set({ isSyncing: false });
    }
  }
}));
