import { confirmFlags, todoKeys } from './richText';
import { PLACEHOLDERS } from './placeholders';
import type { Block, LegalDocument } from './types';

/** Every string a document contains, in reading order. */
export function allStrings(doc: LegalDocument): string[] {
  const out: string[] = [...doc.summary];
  const fromBlock = (block: Block) => {
    if (typeof block === 'string') out.push(block);
    else if ('list' in block) out.push(...block.list);
    else if ('note' in block) out.push(block.note);
    else {
      out.push(...block.table.head);
      block.table.rows.forEach((row) => out.push(...row));
    }
  };
  for (const section of doc.sections) {
    out.push(section.title);
    section.blocks.forEach(fromBlock);
  }
  return out;
}

export interface Markers {
  /** Distinct TODO keys that still have no value. */
  openTodoKeys: string[];
  /** Distinct TODO keys used, filled or not. */
  usedTodoKeys: string[];
  /** Number of CONFIRM flags. */
  confirmCount: number;
}

export function collectMarkers(doc: LegalDocument): Markers {
  const strings = allStrings(doc);
  // The effective date is printed at the top of every document by the page itself.
  const used = Array.from(new Set([...strings.flatMap(todoKeys), 'EFFECTIVE_DATE']));
  const open = used.filter((key) => !(PLACEHOLDERS as Record<string, { value: string | null }>)[key]?.value);
  return { openTodoKeys: open, usedTodoKeys: used, confirmCount: strings.flatMap(confirmFlags).length };
}
