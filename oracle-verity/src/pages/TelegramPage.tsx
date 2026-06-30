import React from 'react';
import { TelegramPane } from '../components/communication/TelegramPane';
import { useOracleStore } from '../store/oracle.store';
import { ORACLE_MODES } from '../core/persona';

export function TelegramPage() {
  const { mode, lang } = useOracleStore();
  const accentColor = ORACLE_MODES[mode].accentColor;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <TelegramPane lang={lang} accentColor={accentColor} onClose={() => {}} />
    </div>
  );
}
