import { Fragment, type ReactNode } from 'react';
import { parseMessage } from '../../lib/richText';

/**
 * A message as the player reads it: actions in italics, bold where asked, line breaks kept (the container keeps
 * `whitespace-pre-wrap`). Words said aloud (in quotation marks) are marked so the player can have them shown differently
 * (see "Look" in the chat panel); nothing changes by default. Built from React elements only, so nothing in a message can
 * turn into markup.
 */
export function RichMessage({ text }: { text: string }) {
  return (
    <>
      {parseMessage(text).map((span, index) => {
        let node: ReactNode = span.spoken ? <span className="rp-dialogue">{span.text}</span> : span.text;
        if (span.em) node = <em>{node}</em>;
        if (span.strong) node = <strong>{node}</strong>;
        return <Fragment key={index}>{node}</Fragment>;
      })}
    </>
  );
}
