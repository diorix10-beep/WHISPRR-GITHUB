# 💎 CHIMERA Design Token System Specification

## Token Taxonomy Architecture

1. **Option Tokens**: Raw primitive values (e.g. `--color-blue-500: #3B82F6`).
2. **Semantic System Tokens**: Contextual aliases mapped per theme (e.g. `--surface-bg`, `--card-bg`, `--primary-bg`).
3. **Component Tokens**: Bindings for specific component primitives (e.g. `--btn-primary-bg`, `--dialog-overlay-bg`).

---

## Token Reference Table

| Category | Token Alias | Light Value | Dark Value |
| :--- | :--- | :--- | :--- |
| **Background** | `--bg-app` | `#FAFAF8` | `#151412` |
| **Foreground** | `--fg-app` | `#151412` | `#FAFAF8` |
| **Surface** | `--surface-bg` | `#FFFFFF` | `#1E1B17` |
| **Card** | `--card-bg` | `#F5F4F0` | `#282520` |
| **Card Border** | `--card-border` | `rgba(0,0,0,0.08)` | `rgba(255,255,255,0.08)` |
| **Primary** | `--primary-bg` | `#C96059` | `#C96059` |
| **Roleplay Accent** | `--rp-accent-bg` | `#EF4444` | `#EF4444` |
| **Story Accent** | `--story-accent-bg` | `#8B5CF6` | `#8B5CF6` |
| **Muted** | `--muted-fg` | `#706B62` | `#8F8A80` |
