import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Network, Activity, ExternalLink, MessageSquare } from 'lucide-react';
import { CompanionId } from '../../store/family.store';
import { useOracleStore } from '../../store/oracle.store';
import { FAMILY_ROSTER } from '../../core/family-roster';

interface Props {
  accentColor: string;
}

export function OracleFamilyTree({ accentColor }: Props) {
  const store = useOracleStore();
  const navigate = useNavigate();
  const [activeTasks, setActiveTasks] = useState<Record<string, number>>({});

  useEffect(() => {
    const initialTasks: Record<string, number> = {};
    FAMILY_ROSTER.forEach(m => {
      initialTasks[m.id] = Math.floor(Math.random() * m.activities.length);
    });
    setActiveTasks(initialTasks);

    const interval = setInterval(() => {
      setActiveTasks(prev => {
        const next = { ...prev };
        const numToChange = Math.random() > 0.5 ? 2 : 1;
        for (let i = 0; i < numToChange; i++) {
          const randomMember = FAMILY_ROSTER[Math.floor(Math.random() * FAMILY_ROSTER.length)];
          next[randomMember.id] = Math.floor(Math.random() * randomMember.activities.length);
        }
        return next;
      });
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const handleChatClick = (id: CompanionId) => {
    store.setActiveCompanion(id);
    if (id === 'oracle') {
      navigate('/');
      if (!store.showChat) store.toggleChat();
    } else {
      if (store.showChat) store.toggleChat();
      navigate(`/workspace/${id}`);
    }
  };

  return (
    <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Network size={16} color={accentColor} />
          <span style={{ fontFamily: 'var(--font-primary)', fontSize: '13px', fontWeight: 700, letterSpacing: '0.05em', color: 'rgba(255,255,255,0.9)' }}>
            THE VERITY FAMILY
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#22c55e', letterSpacing: '0.1em' }}>LIVE SIMULATION</span>
        </div>
      </div>

      <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {FAMILY_ROSTER.map(member => (
          <div
            key={member.id}
            style={{
              background: store.activeCompanionId === member.id ? `${member.color}10` : 'rgba(255,255,255,0.02)',
              border: store.activeCompanionId === member.id ? `1px solid ${member.color}50` : `1px solid ${member.color}20`,
              borderRadius: '12px',
              padding: '16px',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: store.activeCompanionId === member.id ? `0 0 30px ${member.color}20` : `0 4px 20px ${member.color}05`
            }}
          >
            {/* Radial corner glow */}
            <div style={{ position: 'absolute', top: 0, right: 0, width: '80px', height: '80px', background: `radial-gradient(circle at top right, ${member.color}15 0%, transparent 70%)`, pointerEvents: 'none' }} />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', border: `1px solid ${member.color}40`, flexShrink: 0, overflow: 'hidden' }}>
                <img
                  src={member.avatar}
                  alt={member.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => { (e.target as HTMLImageElement).style.fontSize = '20px'; (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 700, color: 'rgba(255,255,255,0.95)' }}>
                    {member.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Activity size={10} color={member.color} />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: member.color, textTransform: 'uppercase' }}>Active</span>
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: member.color, marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {member.role}
                </div>
              </div>
            </div>

            {/* Description */}
            <div style={{ fontFamily: 'var(--font-primary)', fontSize: '12px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, marginBottom: '12px' }}>
              {member.description}
            </div>

            {/* Live Activity */}
            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '6px', padding: '7px 10px', border: `1px solid ${member.color}10`, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: member.color, boxShadow: `0 0 8px ${member.color}`, animation: 'pulse 1.5s infinite', flexShrink: 0 }} />
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {member.activities[activeTasks[member.id] || 0]}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => handleChatClick(member.id)}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  padding: '8px', borderRadius: '8px', border: `1px solid ${member.color}30`,
                  background: `${member.color}12`, color: member.color,
                  fontFamily: 'var(--font-primary)', fontSize: '11px', fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = `${member.color}25`; }}
                onMouseLeave={e => { e.currentTarget.style.background = `${member.color}12`; }}
              >
                <MessageSquare size={12} /> Chat
              </button>
              <button
                onClick={() => navigate(`/family/${member.id}`)}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  padding: '8px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.5)',
                  fontFamily: 'var(--font-primary)', fontSize: '11px', fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'white'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
              >
                <ExternalLink size={12} /> Profile
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
