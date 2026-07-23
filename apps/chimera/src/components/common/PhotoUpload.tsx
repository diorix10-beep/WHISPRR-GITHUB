import { X } from 'lucide-react';
import { UniversalImagePicker } from './UniversalImagePicker';

interface PhotoUploadProps {
  isOpen: boolean;
  onClose: () => void;
  currentPhotoUrl: string | null;
  onPhotoUpdated: (url: string | null) => void;
}

export function PhotoUpload({
  isOpen,
  onClose,
  currentPhotoUrl,
  onPhotoUpdated,
}: PhotoUploadProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 font-sans">
      <div className="bg-white dark:bg-warm-900 rounded-3xl p-6 max-w-sm w-full space-y-4 border border-warm-200 dark:border-warm-800 shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between">
          <h3 className="font-serif font-bold text-lg text-warm-900 dark:text-white">
            Upload Avatar (Rule 52)
          </h3>
          <button onClick={onClose} className="p-1 rounded-full text-warm-400 hover:text-warm-700 dark:hover:text-white">
            <X size={18} />
          </button>
        </div>

        <UniversalImagePicker
          value={currentPhotoUrl}
          onChange={(url) => {
            onPhotoUpdated(url);
            onClose();
          }}
          shape="circle"
          aspectRatio={1}
          label="Profile Avatar"
        />
      </div>
    </div>
  );
}
