# 🌐 12 — Localization Token System

Version 1.0

This specification defines the i18n token architecture across CHIMERA.

---

## 1. Rules
- **Rule 58 — Universal i18n**: No hardcoded user-facing strings in React components.
- **Zero-Reload Switching**: Component re-rendering occurs instantaneously without page reloads.
- **Modular Locale Files**: Locales reside in `src/locales/{code}.json`. Adding a language requires ONLY adding one JSON file.
- **RTL Support**: Setting Arabic (`ar`) automatically triggers `document.documentElement.dir = 'rtl'`.

## 2. Namespace Convention
- `common.*` (create, save, publish, cancel, search, delete, loading)
- `navigation.*` (discover, characters, chats, personas, studio, stories, worlds, lorebooks, writer)
- `character.*` (create_character, biography, greeting, personality, scenario, voice_config)
- `story.*` (novel_reader, chapters, step_inside_scene, ai_cowriter)
- `roleplay.*` (active_speaker, speak_next, add_character, listen_voice)
- `shards.*` (shard_vault, creative_energy, daily_reserve, referral_system)
- `settings.*` (theme, language, account, privacy)
- `errors.*` (network, publish_failed, character_not_found, unauthorized)
