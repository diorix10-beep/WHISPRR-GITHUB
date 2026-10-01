import { useDialogFocus } from "../../hooks/useDialogFocus";
interface GiftShardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientName?: string;
  recipientType?: "character" | "author" | "creator";
}
export function GiftShardsModal({ isOpen, onClose }: GiftShardsModalProps) {
  const ref = useDialogFocus(isOpen, onClose);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shards-gifts-heading"
        className="bg-white dark:bg-warm-900 rounded-2xl p-6 max-w-md space-y-4"
      >
        <h2 id="shards-gifts-heading" className="text-xl">
          SHARDS gifts unavailable
        </h2>
        <p>
          CHIMERA currently defines SHARDS as non-transferable. Gifting requires
          an approved currency specification. No SHARDS have been spent.
        </p>
        <button className="btn-secondary" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
