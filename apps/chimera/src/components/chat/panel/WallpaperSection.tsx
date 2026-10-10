import { useRef } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import { MAX_DIM, PRESETS, effectiveDim, minimumDim, parseHex, peakOf } from '../../../lib/wallpaper';
import { radioGroupKeys } from '../../../lib/radioKeys';
import type { WallpaperState } from '../../../hooks/useWallpaper';

const percent = (value: number) => `${Math.round(value * 100)}%`;

/**
 * The background of the chat: ready-made ones, a colour of your own, or a picture that stays on this device. Whatever is chosen,
 * a dark layer keeps the text readable (the least it can be is shown, and the player can only dim more).
 */
export function WallpaperSection({ wallpaper }: { wallpaper: WallpaperState }) {
  const { setting, saved, busy, problem, setPreset, setColor, setImage, setDim, clear } = wallpaper;
  const file = useRef<HTMLInputElement>(null);
  const { choice } = setting;
  const peak = peakOf(choice);
  const least = peak ? minimumDim(peak) : 0;
  const shown = effectiveDim(setting);
  const colorValue = choice.kind === 'color' ? choice.color : '#1c1030';
  const none = choice.kind === 'none';

  return (
    <section aria-labelledby="wallpaper-title" className="space-y-4 border-t border-chimera-gold/15 pt-5">
      <div>
        <h3 id="wallpaper-title" className="font-serif text-lg font-semibold text-chimera-gold">Background</h3>
        <p className="mt-1 text-sm text-chimera-mute">What is behind the messages. It changes only how your chats look on this device.</p>
      </div>

      <div role="radiogroup" aria-label="Background" onKeyDown={radioGroupKeys} className="grid grid-cols-3 gap-2">
        <button
          type="button"
          role="radio"
          aria-checked={none}
          tabIndex={none ? 0 : -1}
          onClick={clear}
          className={`min-h-[64px] rounded-xl border p-2 text-xs font-bold outline-none focus-visible:ring-2 focus-visible:ring-chimera-gold ${none ? 'border-chimera-gold bg-chimera-gold/10' : 'border-chimera-gold/30 hover:border-chimera-gold/70'}`}
        >
          <span className="block h-6 rounded-md border border-chimera-gold/20 bg-chimera-bg" aria-hidden="true" />
          <span className="mt-1 block">Default</span>
        </button>
        {PRESETS.map((preset) => {
          const selected = choice.kind === 'preset' && choice.id === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => setPreset(preset.id)}
              className={`min-h-[64px] rounded-xl border p-2 text-xs font-bold outline-none focus-visible:ring-2 focus-visible:ring-chimera-gold ${selected ? 'border-chimera-gold bg-chimera-gold/10' : 'border-chimera-gold/30 hover:border-chimera-gold/70'}`}
            >
              <span className="block h-6 rounded-md border border-white/10" style={{ background: preset.css }} aria-hidden="true" />
              <span className="mt-1 block">{preset.label}</span>
            </button>
          );
        })}
      </div>

      <div>
        <label htmlFor="wallpaper-color" className="block text-sm font-bold">A colour of your own</label>
        <div className="mt-2 flex items-center gap-3">
          <input
            id="wallpaper-color"
            type="color"
            value={colorValue}
            onChange={(event) => parseHex(event.target.value) && setColor(event.target.value)}
            className="h-11 w-16 cursor-pointer rounded-lg border border-chimera-gold/30 bg-transparent p-1"
          />
          <p className="text-xs text-chimera-mute">A light colour is darkened automatically so the text stays readable.</p>
        </div>
      </div>

      <div>
        <p className="text-sm font-bold">A picture of your own</p>
        <p className="mt-1 text-xs text-chimera-mute">JPG, PNG or WebP, up to 8 MB. It stays on this device: it is not uploaded and nobody else can see it. It is made smaller and its camera details (place, date, device) are removed.</p>
        <input
          ref={file}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          aria-label="Choose a picture"
          className="sr-only"
          onChange={(event) => {
            const chosen = event.target.files?.[0];
            event.target.value = '';
            if (chosen) void setImage(chosen);
          }}
        />
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" onClick={() => file.current?.click()} disabled={busy} className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-chimera-gold/40 px-5 text-sm font-bold hover:bg-chimera-gold/10 disabled:opacity-50">
            <ImagePlus size={16} aria-hidden="true" /> {busy ? 'Preparing…' : choice.kind === 'image' ? 'Choose another picture' : 'Choose a picture'}
          </button>
          {choice.kind === 'image' && (
            <button type="button" onClick={clear} className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-chimera-rose/40 px-5 text-sm font-bold text-chimera-rose hover:bg-chimera-rose/10">
              <Trash2 size={16} aria-hidden="true" /> Remove the picture
            </button>
          )}
        </div>
        {problem && <p role="alert" className="mt-2 text-sm text-chimera-rose">{problem}</p>}
      </div>

      {!none && <DimControl least={least} shown={shown} onChange={setDim} />}
      {!none && choice.kind !== 'image' && (
        <button type="button" onClick={clear} className="inline-flex min-h-[44px] items-center rounded-full border border-chimera-gold/40 px-5 text-sm font-bold hover:bg-chimera-gold/10">Back to the default background</button>
      )}
      {!saved && <p role="note" className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">This browser would not keep your background, so it lasts only until you close this page.</p>}
    </section>
  );
}

function DimControl({ least, shown, onChange }: { least: number; shown: number; onChange: (value: number) => void }) {
  return (
    <div>
      <label htmlFor="wallpaper-dim" className="block text-sm font-bold">Dim the background: {percent(shown)}</label>
      <input
        id="wallpaper-dim"
        type="range"
        min={Math.round(least * 100)}
        max={Math.round(MAX_DIM * 100)}
        step={1}
        value={Math.round(shown * 100)}
        onChange={(event) => onChange(Number(event.target.value) / 100)}
        className="mt-2 h-11 w-full accent-[#e8c27a]"
      />
      <p className="mt-1 text-xs text-chimera-mute">
        {least > 0 ? `This background is bright, so it is dimmed by at least ${percent(least)} to keep the text readable.` : 'You can dim it more if you like. The text is readable at any setting.'}
      </p>
    </div>
  );
}
