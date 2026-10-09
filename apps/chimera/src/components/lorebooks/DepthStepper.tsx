import { Minus, Plus } from 'lucide-react';
import { MAX_SCAN_DEPTH } from '../../lib/lorebooks';

interface Props {
  id: string;
  value: number;
  onChange: (value: number) => void;
}

/** A number from 1 to 10 with minus and plus buttons. */
export function DepthStepper({ id, value, onChange }: Props) {
  const set = (next: number) => onChange(Math.min(MAX_SCAN_DEPTH, Math.max(1, next)));
  const button = 'grid h-11 w-11 place-items-center rounded-xl border border-chimera-gold/30 hover:bg-chimera-gold/10 disabled:cursor-not-allowed disabled:opacity-40';
  return (
    <div className="mt-2 flex items-center gap-4" role="group" aria-labelledby={id}>
      <button type="button" className={button} onClick={() => set(value - 1)} disabled={value <= 1} aria-label="One message fewer"><Minus size={18} aria-hidden="true" /></button>
      <output aria-live="polite" className="min-w-[2ch] text-center font-serif text-2xl font-semibold">{value}</output>
      <button type="button" className={button} onClick={() => set(value + 1)} disabled={value >= MAX_SCAN_DEPTH} aria-label="One message more"><Plus size={18} aria-hidden="true" /></button>
    </div>
  );
}
