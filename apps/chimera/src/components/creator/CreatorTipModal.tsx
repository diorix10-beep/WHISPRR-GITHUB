import { useDialogFocus } from "../../hooks/useDialogFocus";
interface CreatorTipModalProps {
  isOpen: boolean;
  onClose: () => void;
  creatorName: string;
  creatorAvatarUrl?: string;
  characterOrStoryName?: string;
}
export function CreatorTipModal({ isOpen, onClose }: CreatorTipModalProps) {
  const ref = useDialogFocus(isOpen, onClose);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="creator-tips-heading"
        className="bg-white dark:bg-warm-900 rounded-2xl p-6 max-w-md space-y-4"
      >
        <h2 id="creator-tips-heading" className="text-xl">
          Creator tips unavailable
        </h2>
        <p>
          Creator transfers are not enabled in CHIMERA’s current SHARDS economy.
          No charge or creator payout is made. A founder-approved specification
          is required before purchases can support this action.
        </p>
        <button className="btn-secondary" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
