# 🧠 13 — Model Token System

Version 1.0

This specification governs AI model configurations, parameters, and providers across CHIMERA.

---

## 1. Provider & Model Routing
- **Supported Providers**: OpenAI, Anthropic, Google Gemini, OpenRouter, Local Transformers.
- **Model Presets**:
  - `roleplay_default`: High emotional intelligence & immersive narrative pacing.
  - `story_default`: Long-form prose, chapter continuity, CYOA branch generation.
  - `quick_chat`: Fast latency response for quick character interactions.

## 2. Parameter Control Limits
- **Temperature**: `0.2` (precise facts) – `1.2` (creative storytelling).
- **Context Window**: Progressive sliding window with Memory Nexus state injection.
- **Safety Fallback**: System prompt compilation strips dangerous prompts via `lib/safetyGuard.ts`.
