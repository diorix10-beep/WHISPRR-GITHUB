import { THEMES, type ThemeId } from '../../lib/lorebooks';

interface Props {
  value: ThemeId;
  onChange: (value: ThemeId) => void;
  name: string;
}

/** The colours a lorebook can have, as round swatches. */
export function ThemePicker({ value, onChange, name }: Props) {
  return (
    <fieldset>
      <legend className="font-bold">Theme</legend>
      <div className="mt-2 flex flex-wrap gap-3">
        {THEMES.map((theme) => (
          <label key={theme.id} className="flex w-[68px] cursor-pointer flex-col items-center gap-1 text-center text-xs text-chimera-mute">
            <input type="radio" name={name} value={theme.id} checked={value === theme.id} onChange={() => onChange(theme.id)} className="peer sr-only" />
            <span
              aria-hidden="true"
              className="block h-11 w-11 rounded-full ring-2 ring-transparent ring-offset-2 ring-offset-[#12101c] transition peer-checked:ring-chimera-gold peer-focus-visible:ring-white"
              style={{ background: `linear-gradient(135deg, ${theme.from}, ${theme.to})` }}
            />
            <span className={value === theme.id ? 'font-bold text-chimera-ink' : ''}>{theme.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
