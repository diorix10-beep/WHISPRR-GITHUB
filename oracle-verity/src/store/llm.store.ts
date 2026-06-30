import { create } from 'zustand';

export interface ModelData {
  id: string;
  owned_by: string;
  context_window?: number;
}

interface LlmState {
  availableModels: ModelData[];
  activeTextModel: string;
  activeVisionModel: string;
  companionModels: Record<string, string>; // companionId -> modelId
  lastRefreshTime: number | null;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  lastError: string | null;
  lastResponseMs: number | null;
  
  fetchModels: (apiKey: string, baseUrl?: string) => Promise<void>;
  setActiveTextModel: (modelId: string) => void;
  setActiveVisionModel: (modelId: string) => void;
  setCompanionModel: (companionId: string, modelId: string) => void;
  updateLatency: (ms: number) => void;
  setError: (err: string) => void;
}

// Load persisted settings from localStorage
function loadSetting(key: string, fallback: string = ''): string {
  try { return localStorage.getItem(`oracle_${key}`) ?? fallback; } catch { return fallback; }
}

function loadCompanionModels(): Record<string, string> {
  try {
    const raw = localStorage.getItem('oracle_companion_models');
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

export const useLlmStore = create<LlmState>((set, get) => ({
  availableModels: [],
  activeTextModel: loadSetting('active_text_model'),
  activeVisionModel: loadSetting('active_vision_model'),
  companionModels: loadCompanionModels(),
  lastRefreshTime: null,
  status: 'disconnected',
  lastError: null,
  lastResponseMs: null,

  fetchModels: async (apiKey: string, baseUrl = 'https://api.groq.com/openai/v1') => {
    if (!apiKey) return;

    set({ status: 'connecting', lastError: null });
    
    try {
      // Resolve CORS bypass proxy if running in browser and targeting raw groq endpoint
      let resolvedUrl = baseUrl;
      if (typeof window !== 'undefined' && !window.electronAPI && baseUrl.includes('api.groq.com')) {
        resolvedUrl = `${window.location.origin}/api-groq/openai/v1`;
      }

      const url = resolvedUrl.endsWith('/') ? `${resolvedUrl}models` : `${resolvedUrl}/models`;
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        let errorDetails = '';
        try {
          const errData = await res.json();
          errorDetails = errData?.error?.message || JSON.stringify(errData);
        } catch {
          errorDetails = res.statusText;
        }
        throw new Error(`Failed to fetch models (HTTP ${res.status}): ${errorDetails}`);
      }

      const data = await res.json();
      const models: ModelData[] = data.data || [];
      const modelIds = models.map(m => m.id);

      // Auto-fallback logic for text model: dynamically select the best available
      let bestText = get().activeTextModel;
      if (!bestText || !modelIds.includes(bestText)) {
        const llamas = modelIds.filter(id => id.includes('llama3') || id.includes('llama-3'));
        if (llamas.length > 0) {
          bestText = llamas.find(id => id.includes('70b') && id.includes('versatile')) || llamas.sort().reverse()[0];
        } else if (modelIds.length > 0) {
          bestText = modelIds[0];
        }
        if (bestText) {
          localStorage.setItem('oracle_active_text_model', bestText);
        }
      }

      // Auto-fallback logic for vision model
      let bestVision = get().activeVisionModel;
      if (!bestVision || !modelIds.includes(bestVision)) {
        const visionModels = modelIds.filter(id => id.includes('vision'));
        if (visionModels.length > 0) {
          bestVision = visionModels[0];
        } else {
          bestVision = bestText;
        }
        if (bestVision) {
          localStorage.setItem('oracle_active_vision_model', bestVision);
        }
      }

      set({
        availableModels: models,
        activeTextModel: bestText,
        activeVisionModel: bestVision,
        lastRefreshTime: Date.now(),
        status: 'connected',
        lastError: null
      });

    } catch (err: any) {
      let errorMsg = err.message || String(err);
      if (errorMsg === 'Failed to fetch') {
        errorMsg = 'Failed to fetch (CORS blocked in browser, or offline. Ensure local proxy/Vite is running)';
      }
      set({ status: 'error', lastError: errorMsg });
      console.error("LLM Store Error:", err);
    }
  },

  setActiveTextModel: (modelId: string) => {
    localStorage.setItem('oracle_active_text_model', modelId);
    set({ activeTextModel: modelId });
  },

  setActiveVisionModel: (modelId: string) => {
    localStorage.setItem('oracle_active_vision_model', modelId);
    set({ activeVisionModel: modelId });
  },

  setCompanionModel: (companionId: string, modelId: string) => {
    set((state) => {
      const updated = { ...state.companionModels, [companionId]: modelId };
      localStorage.setItem('oracle_companion_models', JSON.stringify(updated));
      return { companionModels: updated };
    });
  },

  updateLatency: (ms: number) => {
    set({ lastResponseMs: ms, status: 'connected', lastError: null });
  },

  setError: (err: string) => {
    set({ status: 'error', lastError: err });
  }
}));
