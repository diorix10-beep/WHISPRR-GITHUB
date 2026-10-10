/**
 * Roleplay text formatting: *actions* and _thoughts_ in italics, **bold**, ***both***. A message keeps its original characters
 * in the database; this only decides how they are shown. It returns plain spans (text plus flags), never HTML, so what a
 * message contains can never become markup.
 *
 * Deliberately small rules, so odd text stays odd text instead of being half-formatted:
 *  - a marker opens only when the next character is not a space, and closes only after a character that is not a space
 *    ("2 * 3 * 4" and "* item" are left as they are);
 *  - emphasis never crosses a blank line, so one stray asterisk cannot italicise the rest of a message;
 *  - an unmatched marker is shown as it is; a backslash before * or _ shows the character itself;
 *  - _single underscores_ only count at word edges, so snake_case_names are left alone.
 */

export interface Span {
  text: string;
  em?: boolean;
  strong?: boolean;
}

/** How far a closing marker may be from its opening one. Bounds the work on strange input. */
const WINDOW = 4_000;
const MAX_DEPTH = 3;
/**
 * The most characters looked at, in total, for one message when searching for closing markers. A real message uses a tiny
 * part of this; a message made of thousands of unmatched markers stops being formatted instead of freezing the page.
 */
const MAX_WORK = 300_000;

interface Budget {
  work: number;
}

const isSpace = (char: string | undefined) => char === undefined || /\s/.test(char);
const isWordChar = (char: string | undefined) => char !== undefined && /[\p{L}\p{N}]/u.test(char);

interface Hit {
  /** Where the formatted text ends, after the closing marker. */
  end: number;
  inner: string;
  em: boolean;
  strong: boolean;
}

/** How many times `char` repeats from `at`. */
function runLength(s: string, at: number, char: string): number {
  let n = 0;
  while (s[at + n] === char) n += 1;
  return n;
}

function match(s: string, i: number, run: number, budget: Budget): Hit | null {
  if (budget.work > MAX_WORK) return null;
  const char = s[i];
  let marker: number;
  if (char === '*') {
    if (run > 3) return null;
    marker = run;
  } else {
    // A single underscore, at the start of a word.
    if (run !== 1 || isWordChar(s[i - 1])) return null;
    marker = 1;
  }
  const first = s[i + marker];
  if (isSpace(first)) return null;

  const limit = Math.min(s.length, i + marker + WINDOW);
  const paragraph = s.indexOf('\n\n', i + marker);
  const stop = paragraph !== -1 && paragraph < limit ? paragraph : limit;

  let j = i + marker;
  while (j < stop) {
    const at = s.indexOf(char, j);
    if (at === -1 || at >= stop) {
      budget.work += stop - j;
      return null;
    }
    budget.work += at - j + 1;
    if (budget.work > MAX_WORK) return null;
    const closing = runLength(s, at, char);
    if (s[at - 1] === '\\') {
      j = at + closing;
      continue;
    }
    if (char === '*') {
      // Runs that belong to formatting inside (a **bold** inside *italics*, or an *italic* inside **bold**) are skipped.
      if (!isSpace(s[at - 1])) {
        if (closing === marker) return { end: at + marker, inner: s.slice(i + marker, at), em: marker !== 2, strong: marker >= 2 };
        // "**bold *it***": the last two stars close the bold, the one before closes the italics inside.
        if (marker === 2 && closing === 3) return { end: at + 3, inner: s.slice(i + 2, at + 1), em: false, strong: true };
        if (marker === 3 && closing > 3) return { end: at + 3, inner: s.slice(i + 3, at), em: true, strong: true };
      }
    } else if (!isSpace(s[at - 1]) && !isWordChar(s[at + 1]) && s[at + 1] !== '_') {
      return { end: at + 1, inner: s.slice(i + 1, at), em: true, strong: false };
    }
    j = at + closing;
  }
  return null;
}

function walk(s: string, flags: { em: boolean; strong: boolean }, depth: number, out: Span[], budget: Budget): void {
  let buffer = '';
  const flush = () => {
    if (buffer) out.push({ text: buffer, ...(flags.em ? { em: true } : {}), ...(flags.strong ? { strong: true } : {}) });
    buffer = '';
  };
  let i = 0;
  while (i < s.length) {
    const char = s[i];
    if (char === '\\' && (s[i + 1] === '*' || s[i + 1] === '_' || s[i + 1] === '\\')) {
      buffer += s[i + 1];
      i += 2;
      continue;
    }
    if (char === '*' || char === '_') {
      // A run of markers is looked at once, whatever happens to it.
      const run = runLength(s, i, char);
      const hit = depth < MAX_DEPTH ? match(s, i, run, budget) : null;
      if (hit && hit.inner.trim() !== '') {
        flush();
        walk(hit.inner, { em: flags.em || hit.em, strong: flags.strong || hit.strong }, depth + 1, out, budget);
        i = hit.end;
        continue;
      }
      buffer += char.repeat(run);
      i += run;
      continue;
    }
    buffer += char;
    i += 1;
  }
  flush();
}

/** The spans to draw for a message. Neighbouring spans with the same formatting are joined. */
export function parseRoleplayText(text: string): Span[] {
  const out: Span[] = [];
  walk(text, { em: false, strong: false }, 0, out, { work: 0 });
  const merged: Span[] = [];
  for (const span of out) {
    const previous = merged[merged.length - 1];
    if (previous && !!previous.em === !!span.em && !!previous.strong === !!span.strong) previous.text += span.text;
    else merged.push({ ...span });
  }
  return merged;
}

/** The message without its formatting marks, for a one-line preview. */
export function plainText(text: string): string {
  return parseRoleplayText(text).map((span) => span.text).join('');
}

/** A stretch of plain text, and whether it is spoken (inside quotation marks). */
export interface DialoguePart {
  text: string;
  spoken: boolean;
}

/** A quotation longer than this is not treated as dialogue: it is more likely a stray mark than a line of speech. */
const MAX_QUOTE = 1_200;
/** The most characters looked at, in total, for one stretch of text: a message of thousands of unmatched marks stops being split instead of freezing the page. */
const MAX_QUOTE_WORK = 200_000;
const OPENERS = new Set(['"', '\u201C']);
const CLOSERS = new Set(['"', '\u201D']);

/**
 * Cuts a stretch of plain text into what is said aloud ("like this", with the quotation marks kept) and the rest, so dialogue can
 * be shown differently from narration. A quotation must close on the same line and within a reasonable length; a mark with no
 * partner stays ordinary text. One pass over the text, no backtracking: the work grows with the length, never faster.
 */
export function splitDialogue(text: string): DialoguePart[] {
  const parts: DialoguePart[] = [];
  let plainFrom = 0;
  let i = 0;
  let work = 0;
  while (i < text.length && work < MAX_QUOTE_WORK) {
    if (OPENERS.has(text[i])) {
      let end = -1;
      const limit = Math.min(text.length, i + 1 + MAX_QUOTE);
      for (let j = i + 1; j < limit; j += 1) {
        work += 1;
        if (text[j] === '\n') break;
        if (CLOSERS.has(text[j])) {
          end = j;
          break;
        }
      }
      // Empty quotation marks ("") say nothing: left alone.
      if (end > i + 1) {
        if (i > plainFrom) parts.push({ text: text.slice(plainFrom, i), spoken: false });
        parts.push({ text: text.slice(i, end + 1), spoken: true });
        plainFrom = end + 1;
        i = end + 1;
        continue;
      }
    }
    i += 1;
  }
  if (plainFrom < text.length) parts.push({ text: text.slice(plainFrom), spoken: false });
  return parts;
}

/** A formatted stretch of a message, and whether it is spoken (inside quotation marks, which may run across bold or italic parts). */
export interface MessageSpan extends Span {
  spoken?: boolean;
}

/**
 * The message as the screen draws it: the formatted spans of `parseRoleplayText`, each cut where speech starts or stops. Speech is
 * found in the text as it is read (so `"Sit down, **please**."` is one quotation although it crosses a bold word), then every
 * span is split at those boundaries. The characters are never changed: joining the spans gives the same text as before.
 */
export function parseMessage(text: string): MessageSpan[] {
  const spans = parseRoleplayText(text);
  const visible = spans.map((span) => span.text).join('');
  if (visible.indexOf('"') === -1 && visible.indexOf('\u201C') === -1) return spans;
  // Where speech runs, as [from, to) offsets in the visible text.
  const ranges: Array<[number, number]> = [];
  let at = 0;
  for (const part of splitDialogue(visible)) {
    if (part.spoken) ranges.push([at, at + part.text.length]);
    at += part.text.length;
  }
  if (ranges.length === 0) return spans;
  const out: MessageSpan[] = [];
  let offset = 0;
  let r = 0;
  for (const span of spans) {
    const end = offset + span.text.length;
    let cursor = offset;
    while (cursor < end) {
      while (r < ranges.length && ranges[r][1] <= cursor) r += 1;
      const range = ranges[r];
      const inside = range !== undefined && range[0] <= cursor;
      const stop = inside ? Math.min(end, range[1]) : Math.min(end, range ? range[0] : end);
      const piece: MessageSpan = { ...span, text: span.text.slice(cursor - offset, stop - offset) };
      if (inside) piece.spoken = true;
      out.push(piece);
      cursor = stop;
    }
    offset = end;
  }
  return out;
}
