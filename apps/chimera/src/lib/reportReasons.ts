/** Why a message can be reported, and the steps a report goes through. The ids are what the database accepts. Pure data: shared by the app and the server. */

export const REPORT_REASONS = [
  { id: 'child_safety', label: 'Sexual content involving someone under 18', hint: 'This is taken most seriously.' },
  { id: 'non_consensual', label: 'Non-consensual sexual content' },
  { id: 'harassment_or_hate', label: 'Harassment or hate' },
  { id: 'self_harm', label: 'Encourages self-harm or suicide' },
  { id: 'violence', label: 'Graphic violence or threats' },
  { id: 'illegal', label: 'Illegal activity' },
  { id: 'privacy', label: 'Shares private or personal information' },
  { id: 'rating_mismatch', label: 'Does not match the scene\'s rating', hint: 'For example adult content in a General scene.' },
  { id: 'spam', label: 'Spam or advertising' },
  { id: 'other', label: 'Something else' },
] as const;

export type ReportReasonId = (typeof REPORT_REASONS)[number]['id'];

export const REPORT_DETAILS_MAX = 1_000;

export function reasonLabel(id: string): string {
  return REPORT_REASONS.find((reason) => reason.id === id)?.label ?? 'Other';
}

export const REPORT_STATUSES = [
  { id: 'pending', label: 'Pending' },
  { id: 'under_review', label: 'Under review' },
  { id: 'resolved', label: 'Resolved' },
  { id: 'dismissed', label: 'Dismissed' },
  { id: 'escalated', label: 'Escalated' },
] as const;

export type ReportStatusId = (typeof REPORT_STATUSES)[number]['id'];

export function statusLabel(id: string): string {
  if (id === 'reviewed') return 'Under review';
  return REPORT_STATUSES.find((status) => status.id === id)?.label ?? id;
}
