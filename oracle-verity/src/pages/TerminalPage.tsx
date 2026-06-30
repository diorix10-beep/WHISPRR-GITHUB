import React, { useState, useEffect, useRef } from 'react';
import { useOracleStore } from '../store/oracle.store';
import { ORACLE_MODES } from '../core/persona';
import { Terminal as TerminalIcon } from 'lucide-react';

interface TerminalLine {
  id: number;
  type: 'input' | 'output' | 'system';
  text: string;
}

const BOOT_SEQUENCE = [
  'Initializing Neural Engine... [OK]',
  'Loading Oracle Directives... [OK]',
  'Establishing secure connection... [OK]',
  'Welcome to the Oracle Terminal.',
  'Type "help" for a list of available commands.'
];

export function TerminalPage() {
  const { mode } = useOracleStore();
  const accentColor = ORACLE_MODES[mode].accentColor;
  
  const [history, setHistory] = useState<TerminalLine[]>([]);
  const [input, setInput] = useState('');
  const [isBooting, setIsBooting] = useState(true);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  // Keep focus on input
  useEffect(() => {
    const handleClick = () => inputRef.current?.focus();
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  // Boot sequence
  useEffect(() => {
    let delay = 0;
    BOOT_SEQUENCE.forEach((line, i) => {
      delay += Math.random() * 300 + 200; // 200-500ms
      setTimeout(() => {
        setHistory(prev => [...prev, { id: Date.now() + i, type: 'system', text: line }]);
        if (i === BOOT_SEQUENCE.length - 1) {
          setIsBooting(false);
          inputRef.current?.focus();
        }
      }, delay);
    });
  }, []);

  const handleCommand = (cmd: string) => {
    const trimmed = cmd.trim().toLowerCase();
    
    // Add user input to history
    setHistory(prev => [...prev, { id: Date.now(), type: 'input', text: trimmed }]);
    setInput('');

    if (trimmed === 'clear') {
      setHistory([]);
      return;
    }

    let output = '';
    switch (trimmed) {
      case 'help':
        output = `Available commands:
  whoami          Display identity & mission
  projects        List connected ecosystems
  contact         Display secure communication channels
  oracle status   Check core system integrity
  clear           Clear terminal output`;
        break;
      case 'whoami':
        output = `Identity: Core Developer / Creator
Mission: "Freedom to Connect. Privacy by Design."
Focus: Cryptography, Systems Architecture, and Autonomous Agents.`;
        break;
      case 'projects':
        output = `CONNECTED ECOSYSTEMS:
1. WHISPRR - Privacy-focused social communication platform.
2. Maison FX - Currency converter & financial utility.
3. Oracle Systems - Infrastructure & Intelligence layer.`;
        break;
      case 'contact':
        output = `SECURE CHANNELS:
Support: help@whisprr.xyz
System:  Oracle Verity Mainframe`;
        break;
      case 'oracle status':
        output = `ORACLE VERITY - CORE SYSTEMS
Neural Engine:   [ONLINE]
Voice Synthesis: [ONLINE]
Vision Cortex:   [READY]
Directives:      [SECURED]`;
        break;
      case 'clocktower':
        output = `[ OVERWATCH MODE ENGAGED ]
"I've got eyes on the network, Operative. 
Routing all Gotham traffic through the mainframe now.
You do the heavy lifting, I'll keep the skies clear."`;
        break;
      case 'batcomputer':
        output = `ACCESS DENIED: Wayne Enterprises biometric signature required.
...
Wait. Override accepted. Welcome back to the cave.`;
        break;
      case '':
        return; // Do nothing on empty enter
      default:
        output = `Command not found: ${trimmed}. Type "help" for a list of commands.`;
    }

    // Add output to history
    setTimeout(() => {
      setHistory(prev => [...prev, { id: Date.now() + 1, type: 'output', text: output }]);
    }, 150);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <TerminalIcon color={accentColor} size={24} />
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'white', margin: 0 }}>
          Oracle Terminal
        </h2>
      </div>

      {/* Terminal Window */}
      <div style={{ 
        flex: 1, 
        background: 'rgba(5, 5, 10, 0.9)', 
        border: `1px solid ${accentColor}40`, 
        borderRadius: '12px', 
        padding: '24px',
        fontFamily: 'var(--font-mono)',
        fontSize: '14px',
        color: '#a3e635', // Hacker green
        overflowY: 'auto',
        boxShadow: `0 0 30px ${accentColor}10 inset`,
        display: 'flex',
        flexDirection: 'column'
      }}>
        
        {/* History */}
        {history.map((line) => (
          <div key={line.id} style={{ marginBottom: '8px', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
            {line.type === 'input' && (
              <span style={{ color: accentColor }}>guest@oracle-os:~$ </span>
            )}
            <span style={{ 
              color: line.type === 'system' ? 'rgba(255,255,255,0.7)' : 
                     line.type === 'input' ? 'white' : '#a3e635' 
            }}>
              {line.text}
            </span>
          </div>
        ))}

        {/* Current Input */}
        {!isBooting && (
          <div style={{ display: 'flex', alignItems: 'center', marginTop: '4px' }}>
            <span style={{ color: accentColor, marginRight: '8px' }}>guest@oracle-os:~$</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCommand(input);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'white',
                fontFamily: 'var(--font-mono)',
                fontSize: '14px',
                flex: 1,
                outline: 'none'
              }}
              spellCheck="false"
              autoComplete="off"
              autoFocus
            />
          </div>
        )}

        <div ref={endOfMessagesRef} />
      </div>
    </div>
  );
}
