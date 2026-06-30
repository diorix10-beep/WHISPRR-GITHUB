import React from 'react';
import { useEcosystemStore } from '../../store/ecosystem.store';
import { Activity, GitCommit, AlertCircle, LifeBuoy } from 'lucide-react';

export function ProjectAnalytics({ accentColor }: { accentColor: string }) {
  const { activeProjects, openIssuesCount, recentCommitsCount, supportTickets } = useEcosystemStore();

  const stats = [
    { label: 'Active Projects', value: activeProjects, icon: <Activity size={14} /> },
    { label: 'Recent Commits', value: recentCommitsCount, icon: <GitCommit size={14} /> },
    { label: 'Open Issues', value: openIssuesCount, icon: <AlertCircle size={14} /> },
    { label: 'Support Tickets', value: supportTickets.length, icon: <LifeBuoy size={14} /> },
  ];

  return (
    <div style={{
      borderRadius: '16px', background: 'rgba(0,0,0,0.5)', 
      border: `1px solid ${accentColor}20`, padding: '16px',
      display: 'flex', flexDirection: 'column', gap: '16px'
    }}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: 'white', margin: 0 }}>
        Ecosystem Analytics
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
        {stats.map((s, i) => (
          <div key={i} style={{ 
            background: 'rgba(255,255,255,0.03)', padding: '12px', 
            borderRadius: '10px', border: `1px solid ${accentColor}15`,
            display: 'flex', flexDirection: 'column', gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.5)', fontSize: '11px', textTransform: 'uppercase' }}>
              {s.icon} {s.label}
            </div>
            <div style={{ fontSize: '24px', fontWeight: 600, color: 'white', fontFamily: 'var(--font-mono)' }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
