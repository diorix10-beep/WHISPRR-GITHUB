import React, { useState } from 'react';
import { X, Activity, Server, Cpu, Clock, AlertCircle, CheckCircle2, Copy, Sparkles, RefreshCw } from 'lucide-react';
import { useLlmStore } from '../../store/llm.store';
import { useSettingsStore } from '../../store/settings.store';

interface Props {
  onClose: () => void;
}

interface ModelMeta {
  provider: string;
  capabilities: string[];
  contextLength: number;
  recommendedUse: string;
  status: string;
}

const MODEL_METADATA_MAP: Record<string, ModelMeta> = {
  'llama-3.3-70b-versatile': {
    provider: 'Meta',
    capabilities: ['General Reasoning', 'Complex Logic', 'Deep Multilingual', 'Coding'],
    contextLength: 128000,
    status: 'High Performance',
    recommendedUse: 'Central intelligence. Ideal for Oracle (central reasoning) or Atlas (strategic roadmap planning).'
  },
  'llama-3.1-8b-instant': {
    provider: 'Meta',
    capabilities: ['Ultra-fast Response', 'Low Latency', 'General Chat'],
    contextLength: 131072,
    status: 'Lightweight & Swift',
    recommendedUse: 'Fast operations. Highly recommended for Whisprr (community interactions) or Iris (quick ops checks).'
  },
  'llama-3.2-11b-vision-preview': {
    provider: 'Meta',
    capabilities: ['Vision Processing', 'Image Recognition', 'Fast Text Responses'],
    contextLength: 128000,
    status: 'Multimodal Enabled',
    recommendedUse: 'Webcam feed operations. Set this as the active Vision model for instant context awareness.'
  },
  'llama-3.2-90b-vision-preview': {
    provider: 'Meta',
    capabilities: ['Advanced Vision Processing', 'Complex reasoning with images', 'Deep Analysis'],
    contextLength: 128000,
    status: 'High Performance Multimodal',
    recommendedUse: 'Webcam feed operations. Maximum visual accuracy and high resolution reasoning.'
  },
  'llama-3.2-3b-preview': {
    provider: 'Meta',
    capabilities: ['Fast Chat', 'Lightweight Logic'],
    contextLength: 128000,
    status: 'Preview Model',
    recommendedUse: 'Testing and low-cost development. Good for Whisprr or Iris.'
  },
  'llama-3.2-1b-preview': {
    provider: 'Meta',
    capabilities: ['Extremely Fast', 'Low resource usage'],
    contextLength: 128000,
    status: 'Preview Model',
    recommendedUse: 'Basic automated notifications or micro-responses.'
  },
  'llama-guard-3-8b': {
    provider: 'Meta',
    capabilities: ['Safety Moderation', 'Harm Prevention', 'Input Verification'],
    contextLength: 8192,
    status: 'Security Guardrails',
    recommendedUse: 'Safety & verification. Highly recommended for Aegis (impersonation bypass checks).'
  },
  'mixtral-8x7b-32768': {
    provider: 'Mistral AI',
    capabilities: ['Stable MoE (Mixture of Experts)', 'High Quality Text', 'Coding reasoning'],
    contextLength: 32768,
    status: 'Stable Agentic Core',
    recommendedUse: 'Alternative for Atlas (strategic analysis) or Athena (research gathering).'
  },
  'gemma2-9b-it': {
    provider: 'Google',
    capabilities: ['Precise text generation', 'High factual accuracy', 'General Knowledge'],
    contextLength: 8192,
    status: 'Stable Reasoning',
    recommendedUse: 'Recommended for Athena (researching documentation & synthesizing information).'
  }
};

function getModelMetadata(modelId: string, apiContextWindow?: number): ModelMeta {
  const normalizedId = modelId.toLowerCase();
  
  if (MODEL_METADATA_MAP[normalizedId]) {
    return MODEL_METADATA_MAP[normalizedId];
  }
  
  // Partial search fallback
  for (const [key, meta] of Object.entries(MODEL_METADATA_MAP)) {
    if (normalizedId.includes(key) || key.includes(normalizedId)) {
      return meta;
    }
  }

  // Smart dynamic parser
  let provider = 'Unknown Provider';
  if (normalizedId.startsWith('llama') || normalizedId.includes('meta')) {
    provider = 'Meta';
  } else if (normalizedId.startsWith('gemma') || normalizedId.includes('google')) {
    provider = 'Google';
  } else if (normalizedId.startsWith('mixtral') || normalizedId.startsWith('mistral')) {
    provider = 'Mistral AI';
  } else if (normalizedId.startsWith('qwen') || normalizedId.includes('alibaba')) {
    provider = 'Alibaba Cloud';
  } else if (normalizedId.startsWith('claude') || normalizedId.includes('anthropic')) {
    provider = 'Anthropic';
  } else if (normalizedId.startsWith('gpt') || normalizedId.includes('openai')) {
    provider = 'OpenAI';
  } else if (normalizedId.includes('groq')) {
    provider = 'Groq';
  }

  const capabilities: string[] = ['Text Processing'];
  if (normalizedId.includes('vision') || normalizedId.includes('multimodal')) {
    capabilities.push('Vision Analysis', 'Image Recognition');
  }
  if (normalizedId.includes('guard') || normalizedId.includes('moderation') || normalizedId.includes('safe')) {
    capabilities.push('Safety Guardrails', 'Moderation');
  }
  if (normalizedId.includes('code') || normalizedId.includes('coder') || normalizedId.includes('program')) {
    capabilities.push('Code Synthesis', 'Reasoning');
  }
  if (normalizedId.includes('versatile') || normalizedId.includes('instruct') || normalizedId.includes('chat')) {
    capabilities.push('Conversational Logic');
  }
  if (normalizedId.includes('70b') || normalizedId.includes('90b') || normalizedId.includes('large')) {
    capabilities.push('Deep Reasoning');
  }

  const contextLength = apiContextWindow || (
    normalizedId.includes('128k') || normalizedId.includes('llama-3.3') || normalizedId.includes('llama-3.1') || normalizedId.includes('llama-3.2') || normalizedId.includes('qwen') ? 128000 :
    normalizedId.includes('32k') || normalizedId.includes('mixtral') ? 32768 :
    8192
  );

  let status = 'Discovered';
  if (normalizedId.includes('vision')) {
    status = 'Multimodal Enabled';
  } else if (normalizedId.includes('guard')) {
    status = 'Security Specialization';
  }

  let recommendedUse = 'General purpose model. Ready to be assigned to any companion.';
  if (normalizedId.includes('guard') || normalizedId.includes('shield')) {
    recommendedUse = 'Highly recommended for Aegis (Security & Impersonation Protection).';
  } else if (normalizedId.includes('coder')) {
    recommendedUse = 'Recommended for Atlas (Strategy & Analysis) or Iris (Infrastructure).';
  } else if (normalizedId.includes('70b') || normalizedId.includes('90b')) {
    recommendedUse = 'Central intelligence. Ideal for Oracle (central reasoning) or Atlas (strategic roadmap planning).';
  } else if (normalizedId.includes('8b-instant') || normalizedId.includes('3b') || normalizedId.includes('1b')) {
    recommendedUse = 'Fast operations. Ideal for Whisprr (community interactions) or Iris (quick ops checks).';
  }

  return {
    provider,
    capabilities,
    contextLength,
    status,
    recommendedUse
  };
}

const COMPANIONS = [
  { id: 'oracle', name: 'Oracle', emoji: '👑', color: '#c9a84c', role: 'Central Intelligence (Big Sister)' },
  { id: 'atlas', name: 'Atlas', emoji: '🧭', color: '#f59e0b', role: 'Strategy & Analysis (Little Brother)' },
  { id: 'aegis', name: 'Aegis', emoji: '🛡️', color: '#ef4444', role: 'Security & Protection (Little Brother)' },
  { id: 'athena', name: 'Athena', emoji: '🦉', color: '#22d3ee', role: 'Research & Knowledge (Little Sister)' },
  { id: 'iris', name: 'Iris', emoji: '👩‍💻', color: '#8b5cf6', role: 'Infrastructure & Operations (Mother)' },
  { id: 'whisprr', name: 'Whisprr', emoji: '💬', color: '#f472b6', role: 'Community & Connections (Youngest)' },
  { id: 'anthony', name: 'Anthony', emoji: '🧸', color: '#3b82f6', role: 'Founder clone (Little Brother)' },
];

export function AiDiagnosticsPanel({ onClose }: Props) {
  const llmStore = useLlmStore();
  const settings = useSettingsStore();

  const [selectedModelId, setSelectedModelId] = useState<string>(
    llmStore.activeTextModel || (llmStore.availableModels[0]?.id || '')
  );
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToastMessage = (msg: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    showToastMessage('Refreshing discovered models...', 'info');
    try {
      await llmStore.fetchModels(settings.groqKey, settings.groqUrl);
      showToastMessage('Model list updated successfully.', 'success');
      if (!selectedModelId && llmStore.availableModels.length > 0) {
        setSelectedModelId(llmStore.availableModels[0].id);
      }
    } catch (e: any) {
      showToastMessage(e.message || 'Failed to refresh models.', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const [testingModelId, setTestingModelId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{
    latency: number;
    response: string;
    success: boolean;
  } | null>(null);

  const handleTestModel = async (modelId: string) => {
    if (testingModelId) return;
    setTestingModelId(modelId);
    setTestResult(null);
    const startTime = Date.now();
    try {
      let resolvedUrl = settings.groqUrl;
      if (typeof window !== 'undefined' && !window.electronAPI && resolvedUrl.includes('api.groq.com')) {
        resolvedUrl = `${window.location.origin}/api-groq/openai/v1`;
      }
      const url = resolvedUrl.endsWith('/chat/completions')
        ? resolvedUrl
        : `${resolvedUrl.replace(/\/$/, '')}/chat/completions`;

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${settings.groqKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: modelId,
          messages: [{ role: 'user', content: 'Say "Connection successful" in 2 words.' }],
          max_tokens: 10,
          temperature: 0.1
        })
      });

      const latency = Date.now() - startTime;

      if (!res.ok) {
        let errDetails = '';
        try {
          const errData = await res.json();
          errDetails = errData?.error?.message || JSON.stringify(errData);
        } catch {
          errDetails = res.statusText;
        }
        throw new Error(`HTTP ${res.status}: ${errDetails}`);
      }

      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content?.trim() || 'No response content';
      
      setTestResult({
        latency,
        response: text,
        success: true
      });
      showToastMessage(`Test successful (${latency}ms)`);
      
    } catch (e: any) {
      setTestResult({
        latency: Date.now() - startTime,
        response: e.message || String(e),
        success: false
      });
      showToastMessage('Test failed.', 'error');
    } finally {
      setTestingModelId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToastMessage('Copied model ID to clipboard', 'info');
  };

  const getStatusColor = () => {
    switch (llmStore.status) {
      case 'connected': return '#22c55e';
      case 'connecting': return '#eab308';
      case 'error': return '#ef4444';
      default: return 'rgba(255,255,255,0.2)';
    }
  };

  const getStatusText = () => {
    switch (llmStore.status) {
      case 'connected': return 'Online & Connected';
      case 'connecting': return 'Pinging Provider...';
      case 'error': return 'Connection Error';
      default: return 'Disconnected';
    }
  };

  const selectedModel = llmStore.availableModels.find(m => m.id === selectedModelId);
  const selectedMeta = selectedModel ? getModelMetadata(selectedModel.id, selectedModel.context_window) : null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: 'min(850px, 95vw)',
        zIndex: 105,
        background: 'rgba(6,6,14,0.98)',
        backdropFilter: 'blur(32px)',
        borderLeft: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        flexDirection: 'column',
        animation: 'slide-left 0.3s cubic-bezier(0.4,0,0.2,1) forwards',
        boxShadow: '-24px 0 80px rgba(0,0,0,0.5)',
        color: '#fff',
      }}
    >
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spin-icon {
          animation: spin 1.2s linear infinite;
        }
      `}</style>

      {/* Toast Alert */}
      {toast && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '10px 20px',
          borderRadius: '8px',
          background: toast.type === 'success' ? '#16a34a' : toast.type === 'error' ? '#dc2626' : '#2563eb',
          color: '#fff',
          fontSize: '13px',
          fontWeight: 600,
          zIndex: 120,
          boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          {toast.type === 'success' && <CheckCircle2 size={15} />}
          {toast.type === 'error' && <AlertCircle size={15} />}
          {toast.message}
        </div>
      )}

      {/* Panel Header */}
      <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-primary)', fontSize: '16px', fontWeight: 800, color: 'rgba(255,255,255,0.95)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={16} color="var(--accent)" /> AI Diagnostics Center
          </div>
          <div style={{ fontFamily: 'var(--font-primary)', fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
            Manage model allocations & check engine connection routing
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'flex' }}>
          <X size={20} />
        </button>
      </div>

      {/* Split Columns Container */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Left Side: Diagnostics Status & Model List */}
        <div style={{ 
          width: '380px', 
          borderRight: '1px solid rgba(255,255,255,0.06)', 
          display: 'flex', 
          flexDirection: 'column',
          overflowY: 'auto',
          padding: '20px',
        }}>
          {/* Status Box */}
          <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ position: 'relative', width: '10px', height: '10px' }}>
                  <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: getStatusColor(), opacity: 0.2, animation: llmStore.status === 'connected' ? 'pulse 2s infinite' : 'none' }} />
                  <div style={{ position: 'absolute', inset: '2px', borderRadius: '50%', background: getStatusColor() }} />
                </div>
                <div style={{ fontFamily: 'var(--font-primary)', fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.95)' }}>
                  {getStatusText()}
                </div>
              </div>
              
              <button 
                onClick={handleRefresh}
                disabled={isRefreshing}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent)',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <RefreshCw size={11} className={isRefreshing ? 'spin-icon' : ''} />
                Refresh
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <StatBox icon={<Server size={12} />} label="Provider" value="Groq" />
              <StatBox 
                icon={<Clock size={12} />} 
                label="Latency" 
                value={llmStore.lastResponseMs ? `${llmStore.lastResponseMs}ms` : '--'} 
              />
            </div>
          </div>

          {/* Connection Error Message */}
          {llmStore.lastError && (
            <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', marginBottom: '16px', display: 'flex', gap: '8px' }}>
              <AlertCircle size={14} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontFamily: 'var(--font-primary)', fontSize: '11px', color: '#fca5a5', lineHeight: 1.4 }}>
                {llmStore.lastError}
              </div>
            </div>
          )}

          {/* Available Models Title */}
          <SectionTitle>Discovered Models ({llmStore.availableModels.length})</SectionTitle>

          {/* Discovered Models List */}
          {llmStore.availableModels.length === 0 ? (
            <div style={{ 
              fontFamily: 'var(--font-primary)', 
              fontSize: '12px', 
              color: 'rgba(255,255,255,0.3)', 
              padding: '24px 12px', 
              textAlign: 'center', 
              background: 'rgba(255,255,255,0.02)', 
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.04)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div>No models fetched yet from Groq.</div>
              {settings.groqKey ? (
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    background: 'var(--accent)',
                    color: '#000',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '11px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <RefreshCw size={12} className={isRefreshing ? 'spin-icon' : ''} />
                  Fetch Models
                </button>
              ) : (
                <div style={{ fontSize: '11px', color: '#ef4444' }}>
                  Please enter a valid Groq API key in Settings first.
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {llmStore.availableModels.map(m => {
                const isSelected = m.id === selectedModelId;
                const isGlobalText = llmStore.activeTextModel === m.id;
                const isGlobalVision = llmStore.activeVisionModel === m.id;
                const assignedCount = Object.values(llmStore.companionModels).filter(id => id === m.id).length;

                return (
                  <div 
                    key={m.id} 
                    onClick={() => {
                      setSelectedModelId(m.id);
                      llmStore.setActiveTextModel(m.id);
                      showToastMessage(`Connected to ${m.id}`);
                    }}
                    style={{ 
                      padding: '12px', 
                      borderRadius: '8px', 
                      background: isGlobalText 
                        ? 'rgba(34,197,94,0.05)' 
                        : isSelected 
                          ? 'rgba(255,255,255,0.06)' 
                          : 'rgba(255,255,255,0.02)', 
                      border: isGlobalText 
                        ? '1px solid #22c55e' 
                        : isSelected 
                          ? '1px solid var(--accent)' 
                          : '1px solid rgba(255,255,255,0.05)', 
                      boxShadow: isGlobalText 
                        ? '0 0 12px rgba(34,197,94,0.12)' 
                        : 'none',
                      cursor: 'pointer',
                      display: 'flex', 
                      flexDirection: 'column',
                      gap: '6px',
                      transition: 'all 0.15s ease-in-out',
                    }}
                    onMouseEnter={(e) => {
                      if (!isGlobalText && !isSelected) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isGlobalText && !isSelected) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div style={{ 
                        fontFamily: 'var(--font-mono)', 
                        fontSize: '12px', 
                        fontWeight: isSelected ? 700 : 500,
                        color: isSelected ? 'var(--accent)' : 'rgba(255,255,255,0.85)',
                        wordBreak: 'break-all',
                      }}>
                        {m.id}
                      </div>
                      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                        {isGlobalText && (
                          <span style={{ fontSize: '9px', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.4)', color: '#4ade80', padding: '1px 4px', borderRadius: '4px', fontWeight: 700 }}>
                            TEXT
                          </span>
                        )}
                        {isGlobalVision && (
                          <span style={{ fontSize: '9px', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.4)', color: '#c084fc', padding: '1px 4px', borderRadius: '4px', fontWeight: 700 }}>
                            VIS
                          </span>
                        )}
                        {assignedCount > 0 && (
                          <span style={{ fontSize: '9px', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', color: '#fbbf24', padding: '1px 4px', borderRadius: '4px', fontWeight: 700 }}>
                            {assignedCount} FAM
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'var(--font-primary)', fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>
                        Owner: {m.owned_by}
                      </span>
                      {m.context_window && (
                        <span style={{ fontFamily: 'var(--font-primary)', fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>
                          Ctx: {m.context_window.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Selected Model details & companion assignments */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto',
          padding: '20px',
          background: 'rgba(255,255,255,0.005)',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {selectedModel && selectedMeta ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Detailed Model Stats */}
              <div>
                <div style={{ 
                  fontFamily: 'var(--font-primary)', 
                  fontSize: '11px', 
                  fontWeight: 700, 
                  color: 'var(--accent)', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.08em',
                  marginBottom: '6px',
                }}>
                  {selectedMeta.provider} Engine Specification
                </div>
                <h2 style={{ 
                  margin: 0, 
                  fontFamily: 'var(--font-mono)', 
                  fontSize: '20px', 
                  fontWeight: 800, 
                  color: '#fff',
                  wordBreak: 'break-all',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  {selectedModel.id}
                  <button 
                    onClick={() => copyToClipboard(selectedModel.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'rgba(255,255,255,0.4)',
                      display: 'flex',
                      padding: '4px',
                      borderRadius: '4px',
                      transition: 'background 0.2s',
                    }}
                    title="Copy Model ID"
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                  >
                    <Copy size={13} />
                  </button>
                </h2>
                
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '11px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    padding: '3px 8px',
                    borderRadius: '12px',
                    color: 'rgba(255,255,255,0.7)',
                    fontWeight: 500,
                  }}>
                    Context Length: {selectedMeta.contextLength.toLocaleString()} tokens
                  </span>
                  <span style={{
                    fontSize: '11px',
                    background: selectedMeta.status.includes('High') ? 'rgba(34,197,94,0.08)' : 'rgba(59,130,246,0.08)',
                    border: selectedMeta.status.includes('High') ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(59,130,246,0.2)',
                    padding: '3px 8px',
                    borderRadius: '12px',
                    color: selectedMeta.status.includes('High') ? '#4ade80' : '#60a5fa',
                    fontWeight: 500,
                  }}>
                    {selectedMeta.status}
                  </span>
                </div>
              </div>

              {/* Recommended Use Case */}
              <div style={{
                padding: '16px',
                borderRadius: '10px',
                background: 'rgba(196,168,76,0.03)',
                border: '1px solid rgba(196,168,76,0.1)',
                display: 'flex',
                gap: '12px',
              }}>
                <Sparkles size={18} color="var(--accent)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontFamily: 'var(--font-primary)', fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginBottom: '4px' }}>
                    Recommended Deployment
                  </div>
                  <div style={{ fontFamily: 'var(--font-primary)', fontSize: '12px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>
                    {selectedMeta.recommendedUse}
                  </div>
                </div>
              </div>

              {/* Capabilities */}
              <div>
                <SectionTitle>Engine Capabilities</SectionTitle>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {selectedMeta.capabilities.map((cap, i) => (
                    <span key={i} style={{
                      fontFamily: 'var(--font-primary)',
                      fontSize: '11px',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      color: 'rgba(255,255,255,0.85)',
                    }}>
                      {cap}
                    </span>
                  ))}
                </div>
              </div>

              {/* Global Config Settings */}
              <div>
                <SectionTitle>Global Configuration Settings</SectionTitle>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {(() => {
                      const isGlobalText = llmStore.activeTextModel === selectedModel.id;
                      return (
                        <button 
                          onClick={() => {
                            llmStore.setActiveTextModel(selectedModel.id);
                            showToastMessage(`Global Text Model set to ${selectedModel.id}`);
                          }}
                          style={{
                            flex: 1,
                            padding: '10px 14px',
                            borderRadius: '8px',
                            background: isGlobalText ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.05)',
                            border: isGlobalText ? '1px solid #22c55e' : '1px solid rgba(255,255,255,0.1)',
                            color: isGlobalText ? '#4ade80' : '#fff',
                            cursor: 'pointer',
                            fontFamily: 'var(--font-primary)',
                            fontSize: '12px',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            transition: 'all 0.15s',
                          }}
                        >
                          {isGlobalText && <CheckCircle2 size={13} />}
                          {isGlobalText ? 'Active Model (Global)' : 'Set Active Model'}
                        </button>
                      );
                    })()}

                    <button 
                      onClick={() => handleTestModel(selectedModel.id)}
                      disabled={!!testingModelId || !settings.groqKey}
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: testingModelId === selectedModel.id ? 'rgba(234,179,8,0.12)' : 'rgba(255,255,255,0.05)',
                        border: testingModelId === selectedModel.id ? '1px solid #eab308' : '1px solid rgba(255,255,255,0.1)',
                        color: testingModelId === selectedModel.id ? '#facc15' : settings.groqKey ? '#fff' : 'rgba(255,255,255,0.3)',
                        cursor: settings.groqKey && !testingModelId ? 'pointer' : 'not-allowed',
                        fontFamily: 'var(--font-primary)',
                        fontSize: '12px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.15s',
                      }}
                    >
                      {testingModelId === selectedModel.id ? (
                        <RefreshCw size={13} className="spin-icon" />
                      ) : (
                        <Activity size={13} />
                      )}
                      {testingModelId === selectedModel.id ? 'Testing...' : 'Test Model'}
                    </button>
                  </div>

                  {(() => {
                    const isGlobalVision = llmStore.activeVisionModel === selectedModel.id;
                    const supportsVision = selectedModel.id.toLowerCase().includes('vision') || selectedModel.id.toLowerCase().includes('multimodal');
                    return (
                      <button 
                        onClick={() => {
                          llmStore.setActiveVisionModel(selectedModel.id);
                          showToastMessage(`Global Vision Model set to ${selectedModel.id}`);
                        }}
                        disabled={!supportsVision}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          background: isGlobalVision ? 'rgba(139,92,246,0.12)' : supportsVision ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.01)',
                          border: isGlobalVision ? '1px solid #a78bfa' : '1px solid rgba(255,255,255,0.1)',
                          color: isGlobalVision ? '#c084fc' : supportsVision ? '#fff' : 'rgba(255,255,255,0.2)',
                          cursor: supportsVision ? 'pointer' : 'not-allowed',
                          fontFamily: 'var(--font-primary)',
                          fontSize: '12px',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          transition: 'all 0.15s',
                        }}
                      >
                        {isGlobalVision && <CheckCircle2 size={13} />}
                        {isGlobalVision ? 'Active Vision Model' : supportsVision ? 'Set as Active Vision Model' : 'Vision Not Supported'}
                      </button>
                    );
                  })()}
                </div>

                {/* Test Results Output */}
                {testResult && (
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    background: 'rgba(0,0,0,0.4)',
                    border: `1px solid ${testResult.success ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                    marginTop: '10px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ fontFamily: 'var(--font-primary)', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>
                        Diagnostic Test Output
                      </div>
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: '10px',
                        color: testResult.success ? '#4ade80' : '#f87171'
                      }}>
                        {testResult.success ? `SUCCESS (${testResult.latency}ms)` : `FAILED (${testResult.latency}ms)`}
                      </span>
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-mono)', fontSize: '12px',
                      color: testResult.success ? '#e2e8f0' : '#fca5a5',
                      lineHeight: 1.5,
                      background: 'rgba(0,0,0,0.25)',
                      padding: '8px 10px',
                      borderRadius: '4px',
                      border: '1px solid rgba(255,255,255,0.03)',
                      wordBreak: 'break-all',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {testResult.response}
                    </div>
                  </div>
                )}
              </div>

              {/* Family Assignments */}
              <div>
                <SectionTitle>Verity Family Model Assignments</SectionTitle>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {COMPANIONS.map(c => {
                    const currentAssigned = llmStore.companionModels[c.id];
                    const isCurrentlyThis = currentAssigned === selectedModel.id;

                    return (
                      <div 
                        key={c.id} 
                        style={{ 
                          padding: '12px 14px', 
                          borderRadius: '10px', 
                          background: 'rgba(255,255,255,0.02)', 
                          border: isCurrentlyThis ? `1px solid ${c.color}` : '1px solid rgba(255,255,255,0.05)',
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          transition: 'border 0.2s',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ 
                            width: '32px', 
                            height: '32px', 
                            borderRadius: '50%', 
                            background: `${c.color}18`, 
                            border: `1px solid ${c.color}`, 
                            display: 'flex', 
                            justifyContent: 'center', 
                            alignItems: 'center',
                            fontSize: '16px'
                          }}>
                            {c.emoji}
                          </div>
                          <div>
                            <div style={{ fontFamily: 'var(--font-primary)', fontSize: '13px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {c.name}
                              {isCurrentlyThis && (
                                <span style={{ 
                                  fontSize: '9px', 
                                  background: c.color, 
                                  color: '#0e0e1a', 
                                  padding: '1px 5px', 
                                  borderRadius: '4px',
                                  fontWeight: 800,
                                  textTransform: 'uppercase'
                                }}>
                                  Assigned
                                </span>
                              )}
                            </div>
                            <div style={{ fontFamily: 'var(--font-primary)', fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '1px' }}>
                              {c.role}
                            </div>
                            <div style={{ 
                              fontFamily: 'var(--font-mono)', 
                              fontSize: '10px', 
                              color: currentAssigned ? c.color : 'rgba(255,255,255,0.3)',
                              marginTop: '3px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '220px'
                            }} title={currentAssigned || 'Global Default'}>
                              Route: {currentAssigned || 'Global Default'}
                            </div>
                          </div>
                        </div>

                        <div>
                          {isCurrentlyThis ? (
                            <button
                              onClick={() => {
                                llmStore.setCompanionModel(c.id, '');
                                showToastMessage(`Reset ${c.name} routing to global default`);
                              }}
                              style={{
                                background: 'rgba(239,68,68,0.08)',
                                border: '1px solid rgba(239,68,68,0.2)',
                                color: '#f87171',
                                fontSize: '11px',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: 600,
                                transition: 'all 0.15s',
                              }}
                            >
                              Reset
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                llmStore.setCompanionModel(c.id, selectedModel.id);
                                showToastMessage(`Routed ${c.name} to ${selectedModel.id}`);
                              }}
                              style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: '#fff',
                                fontSize: '11px',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: 600,
                                transition: 'all 0.15s',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
                                e.currentTarget.style.borderColor = c.color;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                              }}
                            >
                              Assign
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          ) : (
            <div style={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'center', 
              alignItems: 'center',
              color: 'rgba(255,255,255,0.25)',
              padding: '40px',
              textAlign: 'center',
            }}>
              <Cpu size={48} style={{ marginBottom: '16px', opacity: 0.2 }} />
              <div style={{ fontSize: '14px', fontWeight: 600 }}>No Engine Selected</div>
              <div style={{ fontSize: '12px', marginTop: '6px', maxWidth: '280px', lineHeight: 1.4 }}>
                Select an LLM model from the discovered list on the left to configure capabilities and routing assignments.
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: 'var(--font-primary)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: '10px' }}>
      {children}
    </div>
  );
}

function StatBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.02)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>
        {icon}
        <span style={{ fontFamily: 'var(--font-primary)', fontSize: '10px', fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ fontFamily: 'var(--font-primary)', fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>
        {value}
      </div>
    </div>
  );
}
