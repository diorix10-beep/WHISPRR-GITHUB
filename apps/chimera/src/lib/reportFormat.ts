/** How a report's status and age are shown to moderators. */
export const STATUS_STYLE: Record<string, string> = {
  pending: 'border-amber-400/50 text-amber-200',
  reviewed: 'border-sky-400/50 text-sky-200',
  under_review: 'border-sky-400/50 text-sky-200',
  escalated: 'border-chimera-rose/60 text-rose-200',
  resolved: 'border-chimera-mint/50 text-chimera-mint',
  dismissed: 'border-white/25 text-chimera-mute',
};

export function ago(iso: string): string {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)} h ago`;
  return `${Math.floor(seconds / 86_400)} d ago`;
}

