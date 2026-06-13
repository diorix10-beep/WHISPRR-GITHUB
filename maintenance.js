// src/maintenance.js
// ─────────────────────────────────────────
// WHISPRR Maintenance Configuration
// Flip `enabled` to true to activate full maintenance mode.
// Flip `signupsDisabled` independently to quietly close sign-ups
// without showing the full maintenance banner.
// ─────────────────────────────────────────
export const MAINTENANCE = {
  enabled: true,            // true = show banner to ALL users
  signupsDisabled: true,    // true = block new sign-ups (existing users can still log in)
  message: "WHISPRR is currently undergoing maintenance. We'll be back shortly ✨",
  signupMessage: "New sign-ups are paused while we prepare something better. Check back soon 🌙",
};