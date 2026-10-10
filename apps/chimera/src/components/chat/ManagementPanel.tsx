import { useEffect, type KeyboardEvent, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { Overlay } from './MessageMenu';

export interface PanelTab {
  id: string;
  label: string;
  icon: ReactNode;
  /** A small count on the tab, for example suggestions waiting to be reviewed. */
  badge?: number;
}

interface Props {
  /** True on a wide screen: the panel sits next to the chat. Otherwise it is a sheet over it. */
  desktop: boolean;
  title: string;
  subtitle?: string;
  tabs: PanelTab[];
  active: string;
  onTab: (id: string) => void;
  onClose: () => void;
  /** On a computer, put the keyboard focus on the chosen tab when the panel appears (it was just opened by the player). */
  focusOnOpen?: boolean;
  children: ReactNode;
}

const tabId = (id: string) => `panel-tab-${id}`;
export const PANEL_BODY_ID = 'panel-body';

function Tabs({ tabs, active, onTab }: Pick<Props, 'tabs' | 'active' | 'onTab'>) {
  // Left and right move between the tabs, as in any tab list; the chosen tab is the one in the tab order.
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = tabs.findIndex((tab) => tab.id === active);
    let next = -1;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    if (next < 0) return;
    event.preventDefault();
    onTab(tabs[next].id);
    document.getElementById(tabId(tabs[next].id))?.focus();
  };
  return (
    <div role="tablist" aria-label="Chat management" onKeyDown={onKeyDown} className="flex gap-1 overflow-x-auto px-3 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {tabs.map((tab) => {
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            id={tabId(tab.id)}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={PANEL_BODY_ID}
            tabIndex={selected ? 0 : -1}
            onClick={() => onTab(tab.id)}
            className={`inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-bold outline-none focus-visible:ring-2 focus-visible:ring-chimera-gold ${selected ? 'border-chimera-gold bg-chimera-gold text-[#1a1208]' : 'border-chimera-gold/30 text-chimera-ink hover:bg-chimera-gold/10'}`}
          >
            <span aria-hidden="true">{tab.icon}</span>
            {tab.label}
            {!!tab.badge && tab.badge > 0 && (
              <span className={`grid h-5 min-w-[20px] place-items-center rounded-full px-1 text-xs ${selected ? 'bg-[#1a1208] text-chimera-gold' : 'bg-chimera-gold text-[#1a1208]'}`} aria-label={`${tab.badge} waiting`}>{tab.badge}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function Head({ title, subtitle, onClose }: Pick<Props, 'title' | 'subtitle'> & { onClose: () => void }) {
  return (
    <div className="flex items-start gap-3 px-4 pb-3 pt-2">
      <div className="min-w-0 flex-1">
        <h2 className="truncate font-serif text-xl font-semibold text-chimera-gold">{title}</h2>
        {subtitle && <p className="truncate text-xs text-chimera-mute">{subtitle}</p>}
      </div>
      <button type="button" onClick={onClose} aria-label="Close the chat panel" className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-chimera-gold/30 hover:bg-chimera-gold/10">
        <X size={18} aria-hidden="true" />
      </button>
    </div>
  );
}

/**
 * The tools for one chat in one place. On a computer it is a column next to the chat, which Escape or the close button
 * folds away; on a phone or tablet it is a bottom sheet over the chat (focus kept inside, Escape and a tap outside close it).
 * Both show the same tabs; what each tab holds is given as `children`.
 */
export function ManagementPanel({ desktop, title, subtitle, tabs, active, onTab, onClose, focusOnOpen, children }: Props) {
  // On a phone the sheet takes the focus itself; next to the chat the player would otherwise have to tab through the whole chat to reach it.
  useEffect(() => {
    if (desktop && focusOnOpen) document.getElementById(tabId(active))?.focus();
    // Only when the panel appears.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const body = (
    <div role="tabpanel" id={PANEL_BODY_ID} aria-labelledby={tabId(active)} tabIndex={0} className="space-y-5 px-4 pb-4 pt-2 outline-none">
      {children}
    </div>
  );
  if (desktop) {
    return (
      <aside
        id="scene-panel"
        aria-label="Chat management"
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            onClose();
          }
        }}
        className="sticky top-4 flex max-h-[calc(100dvh-2rem)] w-[24rem] shrink-0 animate-slide-in flex-col self-start overflow-hidden rounded-2xl border border-chimera-gold/25 bg-chimera-panel pt-3"
      >
        <Head title={title} subtitle={subtitle} onClose={onClose} />
        <Tabs tabs={tabs} active={active} onTab={onTab} />
        <div className="min-h-0 flex-1 overflow-y-auto border-t border-chimera-gold/15">{body}</div>
      </aside>
    );
  }
  return (
    <Overlay label="Chat management" role="dialog" anchor={null} onClose={onClose}>
      {(close) => (
        <div id="scene-panel">
          <div className="sticky top-0 z-10 -mx-3 -mt-2 bg-chimera-panel pt-2">
            <Head title={title} subtitle={subtitle} onClose={() => close()} />
            <Tabs tabs={tabs} active={active} onTab={onTab} />
          </div>
          {body}
        </div>
      )}
    </Overlay>
  );
}
