import { PLACEHOLDERS, type PlaceholderKey } from './placeholders';

export type Segment =
  | { kind: 'text'; text: string }
  | { kind: 'bold'; text: string }
  | { kind: 'link'; text: string; href: string }
  | { kind: 'todo'; key: string; label: string }
  | { kind: 'filled'; key: string; value: string }
  | { kind: 'confirm'; text: string };

const TOKEN = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)|\{\{TODO:([A-Z0-9_]+)\}\}|\{\{CONFIRM:([^}]+)\}\}/g;

/** Splits a string with the inline markup described in types.ts into segments. Unknown TODO keys are kept visible, never dropped. */
export function parseInline(input: string): Segment[] {
  const segments: Segment[] = [];
  let last = 0;
  for (const match of input.matchAll(TOKEN)) {
    if (match.index > last) segments.push({ kind: 'text', text: input.slice(last, match.index) });
    const [, bold, linkText, href, todo, confirm] = match;
    if (bold !== undefined) segments.push({ kind: 'bold', text: bold });
    else if (linkText !== undefined) segments.push({ kind: 'link', text: linkText, href });
    else if (todo !== undefined) {
      const entry = PLACEHOLDERS[todo as PlaceholderKey];
      if (entry?.value) segments.push({ kind: 'filled', key: todo, value: entry.value });
      else segments.push({ kind: 'todo', key: todo, label: entry?.label ?? todo });
    } else if (confirm !== undefined) segments.push({ kind: 'confirm', text: confirm.trim() });
    last = match.index + match[0].length;
  }
  if (last < input.length) segments.push({ kind: 'text', text: input.slice(last) });
  return segments;
}

/** Every TODO key used in a string, in order, duplicates included. */
export function todoKeys(input: string): string[] {
  return Array.from(input.matchAll(/\{\{TODO:([A-Z0-9_]+)\}\}/g), (m) => m[1]);
}

/** Every CONFIRM flag used in a string. */
export function confirmFlags(input: string): string[] {
  return Array.from(input.matchAll(/\{\{CONFIRM:([^}]+)\}\}/g), (m) => m[1].trim());
}
