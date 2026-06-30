import React from 'react';
import { useMemoryStore } from '../../store/memory.store';
import { Brain, FileText, Target, MapPin } from 'lucide-react';

export function OracleMemoryPanel({ accentColor }: { accentColor: string }) {
  const { memories } = useMemoryStore();

  const getIcon = (type: string) => {
    switch (type) {
      case 'project': return <FileText size={12} />;
      case 'decision': return <Brain size={12} />;
      case 'milestone': return <Target size={12} />;
      case 'update': return <MapPin size={12} />;
      default: return <FileText size={12} />;
    }
  };

  return (
    <div style={{
      borderRadius: '16px', background: 'rgba(0,0,0,0.5)', 
      border: `1px solid ${accentColor}20`, padding: '16px',
      display: 'flex', flexDirection: 'column', gap: '16px',
      maxHeight: '300px', overflowY: 'auto'
    }}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Brain size={16} color={accentColor} /> Long-Term Memory
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {memories.length === 0 ? (
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Memory banks empty.</div>
        ) : (
          memories.map(m => (
            <div key={m.id} style={{ 
              display: 'flex', gap: '10px', padding: '10px', 
              background: 'rgba(255,255,255,0.02)', borderRadius: '8px',
              borderLeft: `2px solid ${accentColor}50`
            }}>
              <div style={{ color: accentColor, marginTop: '2px' }}>{getIcon(m.type)}</div>
              <div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.9)', lineHeight: 1.4 }}>{m.content}</div>
                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', marginTop: '4px', textTransform: 'uppercase' }}>
                  {m.type} • {new Date(m.timestamp).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
