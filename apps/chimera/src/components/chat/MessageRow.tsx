import { useState, type ReactNode } from 'react';
import { MoreHorizontal, Pin, ThumbsDown, ThumbsUp } from 'lucide-react';
import { useLongPress, type PressPoint } from '../../hooks/useLongPress';
import { RichMessage } from './RichMessage';

interface EditState {
  text: string;
  saving: boolean;
  maxLength: number;
  /** Shown under the box, for example that later messages are not rewritten. */
  note?: string;
  problem?: string | null;
}

/** One message of a scene: its bubble, the button that opens its menu, and the editor when it is being edited. */
export function MessageRow({ id, mine, speaker, content, pinned, feedback, edit, onOpenMenu, onEditChange, onEditSave, onEditCancel }: {
  id: string;
  mine: boolean;
  /** The character's name, shown above their messages. */
  speaker: string | null;
  content: string;
  pinned: boolean;
  /** The member's own like (1) or dislike (-1) of a character's message. */
  feedback?: 1 | -1 | null;
  edit: EditState | null;
  onOpenMenu: (point: PressPoint, trigger: HTMLElement | null) => void;
  onEditChange: (text: string) => void;
  onEditSave: () => void;
  onEditCancel: () => void;
}) {
  const [bubble, setBubble] = useState<HTMLDivElement | null>(null);
  const press = useLongPress((point) => onOpenMenu(point, bubble));
  const tone = mine ? 'msg-mine bg-chimera-gold/15 text-chimera-ink' : 'msg-theirs border border-chimera-gold/20 bg-chimera-panel text-violet-50';
  const label = speaker ? `${speaker} says` : 'You say';

  let body: ReactNode;
  if (edit) {
    const over = edit.text.length > edit.maxLength;
    body = (
      <div>
        <label htmlFor={`edit-${id}`} className="sr-only">Edit message</label>
        <textarea
          id={`edit-${id}`}
          value={edit.text}
          onChange={(event) => onEditChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              onEditCancel();
            } else if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              onEditSave();
            }
          }}
          rows={Math.min(14, Math.max(3, edit.text.split('\n').length + 1))}
          disabled={edit.saving}
          autoFocus
          className="w-full resize-y rounded-xl border border-chimera-gold/40 bg-chimera-bg p-3 text-[16px] leading-relaxed text-chimera-ink outline-none focus:border-chimera-gold"
        />
        {edit.note && <p className="mt-1 text-xs text-chimera-mute">{edit.note}</p>}
        {over && <p role="alert" className="mt-1 text-xs text-amber-200">This is longer than messages can be ({edit.maxLength.toLocaleString()} characters).</p>}
        {edit.problem && <p role="alert" className="mt-1 text-xs text-chimera-rose">{edit.problem}</p>}
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" onClick={onEditSave} disabled={edit.saving || over || !edit.text.trim()} className="min-h-[44px] rounded-full bg-chimera-gold px-5 text-sm font-bold text-[#1a1208] hover:brightness-110 disabled:opacity-50">{edit.saving ? 'Saving…' : 'Save'}</button>
          <button type="button" onClick={onEditCancel} disabled={edit.saving} className="min-h-[44px] rounded-full border border-chimera-gold/40 px-5 text-sm font-bold hover:bg-chimera-gold/10 disabled:opacity-50">Cancel</button>
        </div>
      </div>
    );
  } else {
    body = <RichMessage text={content} />;
  }

  return (
    <div id={`msg-${id}`} className={`msg-row group flex items-start gap-1 ${mine ? 'msg-row-mine flex-row-reverse' : ''}`}>
      <div
        ref={setBubble}
        data-message-id={id}
        {...(edit ? {} : press)}
        aria-label={edit ? undefined : label}
        className={`${edit ? 'w-full' : 'msg-bubble max-w-[calc(100%-2.75rem)]'} msg-text whitespace-pre-wrap break-words ${tone} ${pinned ? 'ring-1 ring-chimera-gold/70' : ''}`}
      >
        {!mine && (
          <span className="mb-1 flex items-center gap-1 text-xs font-bold tracking-[0.12em] text-chimera-gold">
            {(speaker ?? '').toUpperCase()}
            {pinned && <Pin size={12} aria-label="Pinned" className="fill-current" />}
            {feedback === 1 && <ThumbsUp size={12} aria-label="You liked this response" className="fill-current" />}
            {feedback === -1 && <ThumbsDown size={12} aria-label="You disliked this response" className="fill-current" />}
          </span>
        )}
        {mine && pinned && <Pin size={12} aria-label="Pinned" className="mb-1 ml-auto fill-current text-chimera-gold" />}
        {body}
      </div>
      {!edit && (
        <button
          type="button"
          aria-haspopup="menu"
          aria-label={`Actions for the message from ${speaker ?? 'you'}`}
          onClick={(event) => {
            const box = event.currentTarget.getBoundingClientRect();
            onOpenMenu({ x: mine ? box.left - 288 : box.left, y: box.bottom + 4 }, event.currentTarget);
          }}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-chimera-mute/70 hover:bg-chimera-gold/10 hover:text-chimera-gold focus-visible:ring-2 focus-visible:ring-chimera-gold"
        >
          <MoreHorizontal size={18} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
