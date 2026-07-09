import { useState, useCallback, useRef } from 'react';
import { X, Check, Camera, Trash2, Loader2 } from 'lucide-react';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface PhotoUploadProps {
  isOpen: boolean;
  onClose: () => void;
  currentPhotoUrl: string | null;
  onPhotoUpdated: (url: string | null) => void;
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', error => reject(error));
    image.crossOrigin = 'anonymous';
    image.src = url;
  });
}

async function getCroppedImg(imageSrc: string, pixelArea: Area): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const size = Math.min(pixelArea.width, pixelArea.height);
  canvas.width = 512;
  canvas.height = 512;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No canvas context');

  ctx.drawImage(
    image,
    pixelArea.x,
    pixelArea.y,
    size,
    size,
    0,
    0,
    512,
    512,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob failed'));
      },
      'image/jpeg',
      0.85,
    );
  });
}

export function PhotoUpload({
  isOpen,
  onClose,
  currentPhotoUrl,
  onPhotoUpdated,
}: PhotoUploadProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPx: Area) => {
    setCroppedAreaPixels(croppedAreaPx);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a JPG, PNG, or WebP image');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB');
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!user || !imageSrc || !croppedAreaPixels) return;

    setIsUploading(true);
    setError(null);

    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const filePath = `${user.id}/${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, croppedBlob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);

      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({ user_id: user.id, photo_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      onPhotoUpdated(publicUrl);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload photo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!user || !currentPhotoUrl) return;

    setIsRemoving(true);
    setError(null);

    try {
      const { data: listData } = await supabase.storage
        .from('profile-photos')
        .list(user.id);

      if (listData && listData.length > 0) {
        const filesToRemove = listData.map(f => `${user.id}/${f.name}`);
        await supabase.storage.from('profile-photos').remove(filesToRemove);
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ photo_url: null })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      onPhotoUpdated(null);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove photo');
    } finally {
      setIsRemoving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-warm-800 rounded-3xl shadow-xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-warm-200 dark:border-warm-700">
          <h2 className="text-lg font-semibold text-warm-900 dark:text-warm-50">
            {imageSrc ? 'Crop Photo' : 'Profile Photo'}
          </h2>
          <button
            onClick={() => {
              setImageSrc(null);
              onClose();
            }}
            className="p-2 hover:bg-warm-100 dark:hover:bg-warm-700 rounded-full transition-colors"
          >
            <X size={20} className="text-warm-600 dark:text-warm-400" />
          </button>
        </div>

        {error && (
          <div className="mx-5 mt-4 p-3 bg-error-50 dark:bg-error-900/30 border border-error-200 dark:border-error-800 text-error-700 dark:text-error-300 rounded-xl text-sm">
            {error}
          </div>
        )}

        {imageSrc ? (
          /* Crop View */
          <div className="p-5">
            <div className="relative w-full h-64 bg-warm-900 rounded-2xl overflow-hidden mb-4">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="mb-5">
              <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-1">
                Zoom
              </label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={e => setZoom(Number(e.target.value))}
                className="w-full accent-primary-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setImageSrc(null)}
                disabled={isUploading}
                className="btn-ghost flex-1"
              >
                Back
              </button>
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    Apply
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Choose / Remove View */
          <div className="p-5 space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              <Camera size={18} />
              Choose Photo
            </button>
            {currentPhotoUrl && (
              <button
                onClick={handleRemove}
                disabled={isRemoving}
                className="w-full btn-ghost text-error-600 dark:text-error-400 flex items-center justify-center gap-2"
              >
                {isRemoving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Removing...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Remove Photo
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
