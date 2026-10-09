import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collectMarkers } from '../../legal/markers';
import { LEGAL_DRAFT_LABEL } from '../../legal/meta';
import type { Block, LegalDocument } from '../../legal/types';
import { Rich } from './Rich';

interface Props {
  doc: LegalDocument;
  other: { to: string; label: string };
}

function BlockView({ block }: { block: Block }) {
  if (typeof block === 'string') return <p className="leading-relaxed"><Rich text={block} /></p>;
  if ('list' in block) {
    return (
      <ul className="list-disc space-y-2 pl-6 leading-relaxed marker:text-chimera-gold">
        {block.list.map((item, i) => <li key={i}><Rich text={item} /></li>)}
      </ul>
    );
  }
  if ('note' in block) {
    return <p role="note" className="rounded-xl border border-chimera-gold/30 bg-chimera-gold/5 px-4 py-3 text-[15px] leading-relaxed"><Rich text={block.note} /></p>;
  }
  // Rows are shown as cards, so they read well on a phone: the first column is the title, the others are labelled lines.
  const [, ...labels] = block.table.head;
  return (
    <ul className="space-y-3">
      {block.table.rows.map((row, i) => (
        <li key={i} className="rounded-xl border border-chimera-gold/20 bg-chimera-bg p-4">
          <p className="font-bold text-chimera-ink"><Rich text={row[0]} /></p>
          <dl className="mt-2 space-y-2 text-[15px] leading-relaxed">
            {labels.map((label, j) => (
              <div key={label}>
                <dt className="text-xs font-bold uppercase tracking-[0.12em] text-chimera-mute">{label}</dt>
                <dd><Rich text={row[j + 1] ?? ''} /></dd>
              </div>
            ))}
          </dl>
        </li>
      ))}
    </ul>
  );
}

/** A legal document with a visible draft notice, a table of contents, and every missing detail clearly marked. */
export function LegalDocumentView({ doc, other }: Props) {
  const markers = collectMarkers(doc);
  useEffect(() => {
    const previous = document.title;
    document.title = `${doc.title} (draft) — CHIMERA`;
    return () => {
      document.title = previous;
    };
  }, [doc.title]);

  return (
    <div className="mx-auto max-w-3xl px-5 pb-12 pt-10 sm:px-8">
      <div role="note" className="rounded-2xl border border-amber-300/50 bg-amber-300/10 px-5 py-4 text-[15px] leading-relaxed text-amber-50">
        <p className="font-bold tracking-[0.14em]">DRAFT, NOT YET IN FORCE</p>
        <p className="mt-1">
          This text is a working draft for legal review. It is <strong>not legal advice</strong> and has <strong>not been reviewed by a lawyer</strong>, and nobody should treat it as guaranteed to comply with the law of any country.
          Details we do not have yet are marked <mark className="rounded border border-amber-300/70 bg-amber-300/15 px-1 font-semibold text-amber-100">TODO</mark>, and
          choices that still need approval are marked <mark className="rounded border border-sky-300/70 bg-sky-300/15 px-1 font-semibold text-sky-100">To confirm</mark>.
          ({markers.openTodoKeys.length} details and {markers.confirmCount} choices are open.)
        </p>
      </div>

      <p className="mb-3 mt-8 text-sm font-bold tracking-[0.26em] text-chimera-gold">{LEGAL_DRAFT_LABEL.toUpperCase()}</p>
      <h1 className="font-serif text-4xl font-semibold sm:text-5xl">{doc.title}</h1>
      <p className="mt-3 text-chimera-mute">Effective date: <Rich text="{{TODO:EFFECTIVE_DATE}}" />. See also the <Link to={other.to} className="underline hover:text-chimera-gold">{other.label}</Link>.</p>

      <div className="mt-6 space-y-3 rounded-2xl border border-chimera-gold/25 bg-chimera-panel p-5 leading-relaxed text-violet-100/90">
        {doc.summary.map((paragraph, i) => <p key={i}><Rich text={paragraph} /></p>)}
      </div>

      <nav aria-label={`${doc.title}: contents`} className="mt-8 rounded-2xl border border-chimera-gold/20 p-5">
        <h2 className="font-serif text-xl font-semibold text-chimera-gold">Contents</h2>
        <ol className="mt-3 columns-1 gap-8 space-y-1 text-[15px] sm:columns-2">
          {doc.sections.map((section) => (
            <li key={section.id}><a href={`#${section.id}`} className="underline-offset-2 hover:text-chimera-gold hover:underline">{section.title}</a></li>
          ))}
        </ol>
      </nav>

      <div className="mt-8 space-y-10">
        {doc.sections.map((section) => (
          <section key={section.id} aria-labelledby={section.id} className="scroll-mt-6">
            <h2 id={section.id} className="font-serif text-2xl font-semibold text-chimera-ink">{section.title}</h2>
            <div className="mt-3 space-y-4 text-violet-100/90">
              {section.blocks.map((block, i) => <BlockView key={i} block={block} />)}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-12 border-t border-chimera-gold/15 pt-6 text-sm text-chimera-mute">
        Draft prepared for legal review. It describes CHIMERA as it works at the date above and will change as the product does.{' '}
        <a href="#top" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0 }); }} className="underline hover:text-chimera-gold">Back to top</a>
      </p>
    </div>
  );
}
