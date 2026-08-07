# ⚡ 10 — Animation Token System

Version 1.0

This specification defines micro-interactions and motion curves across CHIMERA.

---

## 1. Motion Rules
- **Rule 42 — Motion Has Purpose**: Animations must communicate state changes (e.g. active speaker indicator, modal entrance, button tap feedback). Never animate purely for distraction.

## 2. Standard Transition Tokens
- **Interactive Button Tap**: `transition-all hover:scale-105 active:scale-95 duration-200`
- **Modal Entrance**: `animate-in fade-in zoom-in-95 duration-200`
- **Active Speaker Glow**: `animate-pulse text-purple-400`
- **Pioneer Badge Spin / Glow**: `animate-spin-slow`, `shadow-[0_0_15px_rgba(168,85,247,0.5)]`
