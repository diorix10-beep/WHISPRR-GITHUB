import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { parseInline } from '../../legal/richText';

/** Renders a string with the inline markup described in src/legal/types.ts. */
export function Rich({ text }: { text: string }) {
  return (
    <>
      {parseInline(text).map((segment, index) => {
        switch (segment.kind) {
          case 'text':
            return <Fragment key={index}>{segment.text}</Fragment>;
          case 'filled':
            return <Fragment key={index}>{segment.value}</Fragment>;
          case 'bold':
            return <strong key={index} className="font-bold text-chimera-ink">{segment.text}</strong>;
          case 'link':
            return segment.href.startsWith('/')
              ? <Link key={index} to={segment.href} className="underline hover:text-chimera-gold">{segment.text}</Link>
              : <a key={index} href={segment.href} rel="noopener noreferrer" className="underline hover:text-chimera-gold">{segment.text}</a>;
          case 'todo':
            return (
              <mark key={index} data-legal="todo" className="rounded border border-amber-300/70 bg-amber-300/15 px-1.5 py-0.5 text-[0.92em] font-semibold text-amber-100">
                TODO: {segment.label}
              </mark>
            );
          case 'confirm':
            return (
              <mark key={index} data-legal="confirm" className="ml-1 rounded border border-sky-300/70 bg-sky-300/15 px-1.5 py-0.5 text-[0.85em] font-semibold text-sky-100">
                To confirm: {segment.text}
              </mark>
            );
        }
      })}
    </>
  );
}
