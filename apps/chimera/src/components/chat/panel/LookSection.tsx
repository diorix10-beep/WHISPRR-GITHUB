import { RotateCcw } from 'lucide-react';
import { RichMessage } from '../RichMessage';
import { WallpaperLayer } from '../WallpaperLayer';
import { WallpaperSection } from './WallpaperSection';
import type { WallpaperState } from '../../../hooks/useWallpaper';
import { radioGroupKeys } from '../../../lib/radioKeys';
import { LOOK_OPTIONS, isDefaultLook, lookAttributes, type ChatLook, type LookKey } from '../../../lib/chatLook';

const GROUPS: Array<{ key: LookKey; title: string; help?: string }> = [
  { key: 'size', title: 'Text size' },
  { key: 'spacing', title: 'Spacing' },
  { key: 'align', title: 'Alignment' },
  { key: 'bubble', title: 'Bubbles' },
  { key: 'font', title: 'Typeface' },
  { key: 'narration', title: 'Narration', help: 'Actions written between asterisks, like *she smiles*.' },
  { key: 'dialogue', title: 'Dialogue', help: 'Words between quotation marks.' },
  { key: 'motion', title: 'Movement', help: 'For people who find animation tiring or dizzying. Only the look of the app changes, never what is said or saved.' },
];

const SAMPLE_YOU = 'I step closer. *My hand rests on the rail.* "Tell me the truth, Captain."';
const SAMPLE_THEM = '*Isolde turns from the window, the rain behind her.* "The truth is **never** simple," she says. "Sit down."';

/**
 * The way messages are drawn: size, spacing, alignment, bubbles, typeface, narration and dialogue. It changes only the
 * look: what a message says and what is stored never change. The choices are kept in this browser.
 */
export function LookSection({ look, saved, wallpaper, characterName, onChange, onReset }: {
  look: ChatLook;
  /** The chat background (see WallpaperSection). */
  wallpaper: WallpaperState;
  /** False when the browser would not keep the choices. */
  saved: boolean;
  characterName: string;
  onChange: (patch: Partial<ChatLook>) => void;
  onReset: () => void;
}) {
  return (
    <div className="space-y-5">
      <p className="text-sm text-chimera-mute">Make the chat easier or nicer to read. It changes how messages look on this device only; what they say, and what is saved, never change.</p>

      <div className="chat-look relative isolate overflow-hidden rounded-xl border border-chimera-gold/20 bg-chimera-bg p-3" aria-label="Preview" role="group" {...lookAttributes(look)}>
        {look.motion !== 'calm' && <WallpaperLayer setting={wallpaper.setting} imageUrl={wallpaper.imageUrl} />}
        <p className="mb-2 text-xs font-bold tracking-[0.12em] text-chimera-gold">PREVIEW</p>
        <div className="msg-list">
          <div className="msg-row flex items-start gap-1">
            <div className="msg-text msg-theirs whitespace-pre-wrap break-words border border-chimera-gold/20 bg-chimera-panel text-violet-50">
              <span className="mb-1 block text-xs font-bold tracking-[0.12em] text-chimera-gold">{characterName.toUpperCase()}</span>
              <RichMessage text={SAMPLE_THEM} />
            </div>
          </div>
          <div className="msg-row msg-row-mine flex flex-row-reverse items-start gap-1">
            <div className="msg-text msg-mine whitespace-pre-wrap break-words bg-chimera-gold/15 text-chimera-ink">
              <RichMessage text={SAMPLE_YOU} />
            </div>
          </div>
        </div>
      </div>

      {GROUPS.map((group) => (
        <fieldset key={group.key}>
          <legend className="text-sm font-bold">{group.title}</legend>
          {group.help && <p className="mt-0.5 text-xs text-chimera-mute">{group.help}</p>}
          <div role="radiogroup" aria-label={group.title} onKeyDown={radioGroupKeys} className="mt-2 flex flex-wrap gap-2">
            {LOOK_OPTIONS[group.key].map((option) => {
              const selected = look[group.key] === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  tabIndex={selected ? 0 : -1}
                  title={option.hint}
                  onClick={() => onChange({ [group.key]: option.id } as Partial<ChatLook>)}
                  className={`min-h-[44px] rounded-full border px-4 text-sm font-bold outline-none focus-visible:ring-2 focus-visible:ring-chimera-gold ${selected ? 'border-chimera-gold bg-chimera-gold text-[#1a1208]' : 'border-chimera-gold/35 hover:border-chimera-gold/70 hover:bg-chimera-gold/10'}`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          <p className="mt-1 text-xs text-chimera-mute">{LOOK_OPTIONS[group.key].find((o) => o.id === look[group.key])?.hint}</p>
        </fieldset>
      ))}

      <WallpaperSection wallpaper={wallpaper} />

      {!saved && <p role="note" className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">This browser would not keep your choices, so they last only until you close this page.</p>}
      <button type="button" onClick={onReset} disabled={isDefaultLook(look)} className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-chimera-gold/40 px-5 text-sm font-bold hover:bg-chimera-gold/10 disabled:opacity-50">
        <RotateCcw size={16} aria-hidden="true" /> Back to the defaults
      </button>
    </div>
  );
}
