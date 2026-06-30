import React from 'react';
import { ProjectPanel } from '../components/projects/ProjectPanel';
import { useOracleStore } from '../store/oracle.store';
import { ORACLE_MODES } from '../core/persona';

export function ProjectsPage() {
  const { mode, lang } = useOracleStore();
  const accentColor = ORACLE_MODES[mode].accentColor;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'white', margin: 0 }}>
        {lang === 'fr' ? 'Projets Connectés' : 'Connected Projects'}
      </h2>
      <p style={{ fontFamily: 'var(--font-primary)', color: 'rgba(255,255,255,0.6)', marginTop: '-12px' }}>
        WHISPRR, MaisonFX, and Oracle Systems.
      </p>
      
      <div style={{ flex: 1, background: 'rgba(0,0,0,0.15)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
        <ProjectPanel lang={lang} accentColor={accentColor} />
      </div>
    </div>
  );
}
