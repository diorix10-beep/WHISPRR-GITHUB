import { MessageCircle, Phone, Smartphone } from 'lucide-react';
import type { DeviceActivityApp, DeviceActivityMessage } from '../../lib/deviceActivity';

interface DeviceActivityCardProps {
  messages: DeviceActivityMessage[];
  appStyle: DeviceActivityApp;
  onOpen: () => void;
}

export function DeviceActivityCard({ messages, appStyle, onOpen }: DeviceActivityCardProps) {
  const visibleMessages = messages.filter((message) => !message.deleted);
  if (visibleMessages.length === 0) return null;

  const previewMessages = visibleMessages.slice(0, 3);
  const isWhatsapp = appStyle === 'whatsapp';

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`my-4 w-full max-w-xl overflow-hidden rounded-3xl border text-left shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl ${
        isWhatsapp
          ? 'border-emerald-500/25 bg-gradient-to-br from-emerald-950 via-[#10251f] to-warm-950'
          : 'border-blue-500/25 bg-gradient-to-br from-blue-950 via-slate-950 to-warm-950'
      }`}
    >
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
            isWhatsapp ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white'
          }`}>
            <Smartphone size={20} />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Device activity</p>
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/45">
              {isWhatsapp ? 'WhatsApp' : 'iMessage'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-white/80">
          <MessageCircle size={13} />
          {visibleMessages.length}
        </div>
      </div>

      <div className="space-y-3 px-4 py-4">
        {previewMessages.map((message) => (
          <div key={message.id} className="flex gap-3">
            <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
              isWhatsapp ? 'bg-emerald-500/20 text-emerald-200' : 'bg-blue-500/20 text-blue-200'
            }`}>
              <Phone size={15} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-white/45">
                {message.time} · {message.contact}
              </p>
              <p className="mt-0.5 line-clamp-2 text-sm leading-relaxed text-white">
                {message.body}
              </p>
            </div>
          </div>
        ))}

        {visibleMessages.length > previewMessages.length && (
          <p className="pl-11 text-xs font-semibold text-white/45">
            +{visibleMessages.length - previewMessages.length} more phone update{visibleMessages.length - previewMessages.length === 1 ? '' : 's'}
          </p>
        )}
      </div>
    </button>
  );
}

interface DeviceSceneEventCardProps {
  title: string;
  body: string;
  detail?: string;
}

export function DeviceSceneEventCard({ title, body, detail }: DeviceSceneEventCardProps) {
  return (
    <div className="my-3 flex justify-center">
      <div className="max-w-md rounded-3xl border border-blue-500/20 bg-blue-950/20 px-4 py-3 text-center shadow-sm backdrop-blur">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-400">Phone event</p>
        <p className="mt-1 text-sm font-semibold text-warm-800 dark:text-warm-100">{title}</p>
        {detail && <p className="mt-1 line-clamp-1 text-xs text-warm-500">↳ {detail}</p>}
        <p className="mt-2 text-sm italic text-warm-700 dark:text-warm-200">“{body}”</p>
      </div>
    </div>
  );
}
