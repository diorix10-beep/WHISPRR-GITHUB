import { useState } from 'react';

const GRADIENTS = [
  'from-violet-700 to-chimera-rose',
  'from-sky-700 to-violet-700',
  'from-amber-700 to-chimera-gold',
  'from-orange-700 to-chimera-gold',
  'from-indigo-900 to-chimera-blue',
  'from-teal-700 to-chimera-rose',
];

interface Props {
  url?: string | null;
  name: string;
  /** Tailwind size classes, for example "h-12 w-12". */
  size?: string;
  /** Tailwind text size for the initial shown when there is no picture. */
  initialSize?: string;
  gradient?: number;
  rounded?: string;
}

/** The character's picture, or their first letter on a colour when there is none or it cannot be loaded. */
export function CharacterAvatar({ url, name, size = 'h-12 w-12', initialSize = 'text-xl', gradient = 0, rounded = 'rounded-full' }: Props) {
  const [failed, setFailed] = useState(false);
  if (url && !failed) {
    return <img src={url} alt="" loading="lazy" onError={() => setFailed(true)} className={`${size} ${rounded} shrink-0 object-cover`} />;
  }
  return (
    <span className={`grid ${size} ${rounded} shrink-0 place-items-center bg-gradient-to-br ${GRADIENTS[gradient % GRADIENTS.length]} font-serif ${initialSize} text-white`} aria-hidden="true">
      {(name || '?').slice(0, 1).toUpperCase()}
    </span>
  );
}
