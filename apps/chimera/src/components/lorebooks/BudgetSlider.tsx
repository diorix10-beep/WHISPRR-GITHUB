import { MAX_REPLY_BUDGET, MIN_REPLY_BUDGET } from '../../lib/lorebooks';

interface Props {
  id: string;
  value: number;
  onChange: (value: number) => void;
}

/** How many characters of this lorebook may go with one reply, from 1,000 to 40,000. */
export function BudgetSlider({ id, value, onChange }: Props) {
  return (
    <div className="mt-2 flex items-center gap-4">
      <input
        id={`${id}-range`}
        type="range"
        min={MIN_REPLY_BUDGET}
        max={MAX_REPLY_BUDGET}
        step={1000}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-labelledby={id}
        className="h-11 min-w-0 flex-1 accent-[#e8c27a]"
      />
      <output aria-live="polite" className="min-w-[8ch] text-right font-serif text-xl font-semibold">{value.toLocaleString()}</output>
    </div>
  );
}
