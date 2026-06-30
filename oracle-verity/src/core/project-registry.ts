// ============================================================
// ORACLE VERITY — PROJECT REGISTRY
// ============================================================

export type ProjectStatus = 'active' | 'paused' | 'planning' | 'completed';
export type ProjectHealth = 'excellent' | 'good' | 'attention' | 'blocked';

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
}

export interface Project {
  id: string;
  name: string;
  tagline: string;
  description: string;
  status: ProjectStatus;
  health: ProjectHealth;
  phase: string;
  milestones: Milestone[];
  rootPath?: string;
  repoUrl?: string;
  githubRepo?: string; // e.g. "owner/repo"
  tags: string[];
  lastActivity: string;
  progress: number; // 0-100
  color: string;
  icon: string;
  supportEmail?: string;
}

export const DEFAULT_PROJECTS: Project[] = [
  {
    id: 'whisprr',
    name: 'WHISPRR',
    tagline: 'Freedom to connect. Privacy by design.',
    description: 'A private, encrypted messaging platform built for real people, not algorithms. Security, freedom, privacy, and community.',
    status: 'active',
    health: 'good',
    phase: 'Q2 Beta',
    color: '#6366f1',
    icon: '🔒',
    tags: ['messaging', 'privacy', 'encryption', 'mobile'],
    progress: 42,
    lastActivity: 'API integration in progress',
    supportEmail: 'help@whisprr.xyz',
    githubRepo: 'whisprr/whisprr',
    rootPath: '/Users/diawchimeresenegal/Downloads/WHISPRR',
    milestones: [
      { id: 'w1', title: 'Q1 MVP', completed: true },
      { id: 'w2', title: 'Q2 Beta Launch', completed: false, dueDate: '2026-09-01' },
      { id: 'w3', title: 'Q3 Public Launch', completed: false, dueDate: '2026-12-01' },
      { id: 'w4', title: 'Q4 Scale', completed: false },
    ],
  },
  {
    id: 'maison-fx',
    name: 'Maison FX',
    tagline: 'Currency converter & financial utilities.',
    description: 'A currency conversion and financial utility platform designed for swift, real-time rates and an elegant user experience.',
    status: 'active',
    health: 'good',
    phase: 'Core Build',
    color: '#f472b6',
    icon: '💱',
    tags: ['finance', 'currency', 'utility', 'calculator'],
    progress: 28,
    lastActivity: 'Currency conversion API integration',
    githubRepo: 'diawchimeresenegal/MaisonFX',
    rootPath: '/Users/diawchimeresenegal/Downloads/ORACLE 10-23-30-206\u202fPM/MaisonFX',
    milestones: [
      { id: 'm1', title: 'Core Converter Engine', completed: true },
      { id: 'm2', title: 'Live API Integration', completed: false, dueDate: '2026-08-01' },
      { id: 'm3', title: 'UI Polish & Launch', completed: false, dueDate: '2026-10-01' },
    ],
  },
  {
    id: 'oracle-systems',
    name: 'Oracle Systems',
    tagline: 'Intelligent infrastructure for builders.',
    description: 'The AI infrastructure platform — including Oracle Verity herself. Building the future of intelligent AI presence and collaboration.',
    status: 'active',
    health: 'excellent',
    phase: 'Core Build',
    color: '#c9a84c',
    icon: '🔮',
    tags: ['AI', 'infrastructure', 'presence', 'collaboration'],
    progress: 65,
    lastActivity: 'Oracle Verity workspace — active build',
    rootPath: '/Users/diawchimeresenegal/Downloads/ORACLE/oracle-verity',
    milestones: [
      { id: 'o1', title: 'Oracle Verity v1', completed: false, dueDate: '2026-07-01' },
      { id: 'o2', title: 'Project Integration', completed: false },
      { id: 'o3', title: 'Voice & Vision', completed: false },
    ],
  },
];

export function getHealthColor(health: ProjectHealth): string {
  switch (health) {
    case 'excellent': return '#22c55e';
    case 'good': return '#a3e635';
    case 'attention': return '#f59e0b';
    case 'blocked': return '#ef4444';
  }
}

export function getHealthLabel(health: ProjectHealth, lang: 'en' | 'fr'): string {
  if (lang === 'fr') {
    switch (health) {
      case 'excellent': return 'Excellent';
      case 'good': return 'Bon';
      case 'attention': return 'Attention';
      case 'blocked': return 'Bloqué';
    }
  }
  switch (health) {
    case 'excellent': return 'Excellent';
    case 'good': return 'Good';
    case 'attention': return 'Needs Attention';
    case 'blocked': return 'Blocked';
  }
}

export function getStatusLabel(status: ProjectStatus, lang: 'en' | 'fr'): string {
  if (lang === 'fr') {
    switch (status) {
      case 'active': return 'Actif';
      case 'paused': return 'En pause';
      case 'planning': return 'Planification';
      case 'completed': return 'Terminé';
    }
  }
  switch (status) {
    case 'active': return 'Active';
    case 'paused': return 'Paused';
    case 'planning': return 'Planning';
    case 'completed': return 'Completed';
  }
}
