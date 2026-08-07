# 🧬 14 — Memory Token System

Version 1.0

This specification governs the Memory Nexus and long-term memory extraction across CHIMERA.

---

## 1. Memory Nexus Architecture
- **Rule 33 — Living Identities**: Characters are persistent identities with memories, relationships, and history.
- **Memory Types**:
  - `Core Fact`: Unchanging character rules, relationships, or world lore.
  - `Episodic`: Key events from past conversation turns.
  - `User Preference`: Persona details remembered from user interactions.

## 2. Automatic Memory Extraction
- `autoExtractMemoriesIfNeeded()` triggers every 5 turns.
- Visualizer Modal allows users to inspect, edit, or delete character memories.
