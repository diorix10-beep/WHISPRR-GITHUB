# 🎨 06 — Color Token System

Version 1.0

This specification defines the semantic color architecture across CHIMERA.

---

## 1. Core Principles
- **No Raw Hex Values in Components**: Never hardcode `#FFFFFF`, `#000000`, or arbitrary hex values in component inline styles or classes.
- **Mode Identity Separation**:
  - **Roleplay Mode Accent**: Red (`--rp-accent-bg`, `bg-red-600`, `text-red-400`, `border-red-500/30`)
  - **Storytelling Mode Accent**: Purple (`--story-accent-bg`, `bg-purple-600`, `text-purple-400`, `border-purple-500/30`)
- **SHARDS Currency Identity**: Cyan & Sapphire (`bg-cyan-500`, `text-cyan-300`, `shadow-[0_0_15px_rgba(6,182,212,0.35)]`)

## 2. Semantic Token Mapping
| Semantic Token | Purpose | Dark Value | Light Value |
|---|---|---|---|
| `--bg-app` | Main application backdrop | `#09090B` (warm-950) | `#FAFAFA` (warm-50) |
| `--surface-bg` | Cards, modals, drawers | `#121215` (warm-900) | `#FFFFFF` (white) |
| `--surface-border` | Subtle container borders | `rgba(255,255,255,0.08)` | `rgba(0,0,0,0.08)` |
| `--text-primary` | Main titles & body text | `#F4F4F5` (warm-100) | `#18181B` (warm-900) |
| `--text-muted` | Captions & secondary info | `#A1A1AA` (warm-400) | `#71717A` (warm-500) |
