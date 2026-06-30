import React from 'react';
import { SupportDashboard } from '../components/workspace/SupportDashboard';
import { useOracleStore } from '../store/oracle.store';
import { ORACLE_MODES } from '../core/persona';

export function SupportPage() {
  const { mode, lang } = useOracleStore();
  const accentColor = ORACLE_MODES[mode].accentColor;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* 
        We pass a dummy onClose because it's no longer an overlay. 
        We could refactor SupportDashboard to not need it later, but this works for the transition.
      */}
      <SupportDashboard lang={lang} accentColor={accentColor} onClose={() => {}} />
    </div>
  );
}
