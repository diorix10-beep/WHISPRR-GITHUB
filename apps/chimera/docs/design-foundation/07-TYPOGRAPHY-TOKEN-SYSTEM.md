# 🔤 07 — Typography Token System

Version 1.0

This specification defines the typography hierarchy and font family tokens across CHIMERA.

---

## 1. Font Family Architecture
- **Serif (`font-serif`)**: Storytelling titles, Chapter novel reader content, Lorebook titles, SHARDS Vault header.
- **Sans-Serif (`font-sans`)**: Navigation items, form inputs, buttons, status badges, system notifications.
- **Monospace (`font-mono`)**: Code snippets, system prompts, API keys, timestamp logs.

## 2. Scale & Hierarchy
| Token | Class | Size | Line Height | Usage |
|---|---|---|---|---|
| `display-xl` | `text-4xl sm:text-5xl font-serif font-extrabold` | 48px / 60px | 1.1 | Hero headers & main feature titles |
| `h1` | `text-2xl sm:text-3xl font-serif font-bold` | 30px / 36px | 1.2 | Page titles (1 per page) |
| `h2` | `text-xl sm:text-2xl font-serif font-bold` | 24px / 30px | 1.25 | Section titles & modal headers |
| `body-lg` | `text-base sm:text-lg` | 16px / 18px | 1.6 | Novel reading text & character bios |
| `body` | `text-xs sm:text-sm` | 14px / 16px | 1.5 | General UI text & chat bubbles |
| `caption` | `text-[10px] sm:text-xs font-bold uppercase tracking-wider` | 10px / 12px | 1.4 | Badges, timestamps, field labels |
