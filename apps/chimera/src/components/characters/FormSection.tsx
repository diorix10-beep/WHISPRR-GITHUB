import { useId, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

interface Props {
  title: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}

/** A section that can be folded away. Its content stays mounted, so nothing typed is lost when it is closed. */
export function FormSection({ title, children, defaultOpen = true }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const bodyId = useId();
  return (
    <section className="rounded-[22px] border border-chimera-gold/20 bg-chimera-panel p-5 sm:p-6">
      <h2 className="m-0">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={() => setOpen((v) => !v)}
          className="flex min-h-[44px] w-full items-center justify-between gap-4 text-left font-serif text-2xl font-semibold text-chimera-gold"
        >
          <span>{title}</span>
          <ChevronDown size={22} aria-hidden="true" className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </h2>
      <div id={bodyId} hidden={!open} className="mt-4 space-y-6">{children}</div>
    </section>
  );
}
