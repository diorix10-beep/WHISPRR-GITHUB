/**
 * The legal documents are written as plain data so they can be read, reviewed and edited without touching the page code.
 *
 * Inline markup inside any string:
 *   **bold**                      bold text
 *   [text](/path)                 a link (internal paths start with "/")
 *   {{TODO:KEY}}                  information we do not have yet; KEY must exist in PLACEHOLDERS (src/legal/placeholders.ts)
 *   {{CONFIRM:short reason}}      a drafted choice the owner must approve, shown as a visible flag
 */
export type Block = string | { list: string[] } | { note: string } | { table: { head: string[]; rows: string[][] } };

export interface LegalSection {
  id: string;
  title: string;
  blocks: Block[];
}

export interface LegalDocument {
  title: string;
  /** Shown above the table of contents. */
  summary: string[];
  sections: LegalSection[];
}
