// ============================================================
// ORACLE VERITY — ACTIVITY ENGINE (Real-Time)
// Driven by actual system events instead of placeholders
// ============================================================

import { OracleMode } from './persona';

let currentActivity = 'No active tasks';
let currentMode: OracleMode = 'cofounder';
let currentLang: 'en' | 'fr' = 'en';

type ActivityListener = (activity: string, lang: 'en' | 'fr') => void;
const listeners: Set<ActivityListener> = new Set();
let resetTimer: ReturnType<typeof setTimeout> | null = null;

export function subscribeToActivity(listener: ActivityListener): () => void {
  listeners.add(listener);
  // Immediately emit current
  listener(currentActivity, currentLang);
  return () => listeners.delete(listener);
}

export function setActivityMode(mode: OracleMode, lang: 'en' | 'fr') {
  currentMode = mode;
  currentLang = lang;
  listeners.forEach(l => l(currentActivity, lang));
}

export function setRealActivity(activity: string) {
  currentActivity = activity;
  listeners.forEach(l => l(currentActivity, currentLang));

  // Reset to idle after 8 seconds
  if (resetTimer) clearTimeout(resetTimer);
  resetTimer = setTimeout(() => {
    currentActivity = currentLang === 'fr' ? 'Aucune tâche active' : 'No active tasks';
    listeners.forEach(l => l(currentActivity, currentLang));
  }, 8000);
}

export function startActivityEngine() {
  // In real-time mode, we don't need a polling loop.
  // We just wait for setRealActivity calls.
}

export function stopActivityEngine() {
  if (resetTimer) clearTimeout(resetTimer);
}
