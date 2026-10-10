import { parseRoleplayText } from '../../lib/richText';

/**
 * A message as the player reads it: actions in italics, bold where asked, line breaks kept (the container keeps
 * `whitespace-pre-wrap`). Built from React elements only, so nothing in a message can turn into markup.
 */
export function RichMessage({ text }: { text: string }) {
  return (
    <>
      {parseRoleplayText(text).map((span, index) => {
        if (span.em && span.strong) return <strong key={index}><em>{span.text}</em></strong>;
        if (span.strong) return <strong key={index}>{span.text}</strong>;
        if (span.em) return <em key={index}>{span.text}</em>;
        return span.text;
      })}
    </>
  );
}
