import { useState, useRef, useCallback } from 'react';
import { Image as ImageIcon, UploadCloud, RefreshCw, Trash2, X, Check, Loader2 } from 'lucide-react';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface UniversalImagePickerProps {
  value: string | null;
  onChange: (url: string | null) => void;
  aspectRatio?: number;
  shape?: 'circle' | 'rectangle';
  label?: string;
  className?: string;
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', err => reject(err));
    image.crossOrigin = 'anonymous';
    image.src = url;
  });
}

async function getCroppedImg(imageSrc: string, pixelArea: Area): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = pixelArea.width;
  canvas.height = pixelArea.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No canvas context');

  ctx.drawImage(
    image,
    pixelArea.x,
    pixelArea.y,
    pixelArea.width,
    pixelArea.height,
    0,
    0,
    pixelArea.width,
    pixelArea.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas conversion failed'));
      },
      'image/jpeg',
      0.88
    );
  });
}

export function UniversalImagePicker({
  value,
  onChange,
  aspectRatio = 1,
  shape = 'circle',
  label = 'Image',
  className = ''
}: UniversalImagePickerProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPx: Area) => {
    setCroppedAreaPixels(croppedAreaPx);
  }, []);

  const handleFileProcess = (file: File) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a PNG, JPG, JPEG, or WEBP image.');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setError('Image must be under 8MB.');
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileProcess(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileProcess(file);
  };

  const handleSaveCrop = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    setIsUploading(true);
    setError(null);

    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const userId = user?.id || 'anonymous';
      const filePath = `${userId}/${Date.now()}.jpg`;

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
      onChange(publicUrl);
      setShowCropModal(false);
      setImageSrc(null);
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-xs font-bold text-warm-700 dark:text-warm-300">
          {label}
        </label>
      )}

      {/* Hidden Native File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload Zone / Active Preview */}
      {value ? (
        <div className="relative group bg-warm-100 dark:bg-warm-900 border border-warm-200 dark:border-warm-800 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`overflow-hidden border border-warm-300 dark:border-warm-700 shrink-0 ${
              shape === 'circle' ? 'w-14 h-14 rounded-full' : 'w-20 h-14 rounded-xl'
            }`}>
              <img src={value} alt="Preview" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="text-xs font-bold text-warm-900 dark:text-white block">Image Selected</span>
              <span className="text-[10px] text-green-500 font-medium">Uploaded & Managed Internally</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-warm-200 dark:bg-warm-800 hover:bg-warm-300 dark:hover:bg-warm-750 text-warm-900 dark:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1"
            >
              <RefreshCw size={13} /> Replace
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="p-1.5 text-warm-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
              title="Remove image"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
            isDragging
              ? 'border-red-500 bg-red-500/10 scale-[1.01]'
              : 'border-warm-300 dark:border-warm-750 hover:border-red-500/60 bg-warm-50/50 dark:bg-warm-900/40 hover:bg-warm-100/50 dark:hover:bg-warm-850/60'
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center">
            <ImageIcon size={24} />
          </div>
          <div>
            <h4 className="font-bold text-xs text-warm-900 dark:text-white">Click to Upload</h4>
            <p className="text-[11px] text-warm-500">or drag & drop an image here</p>
          </div>
          <span className="text-[10px] font-semibold text-warm-400 uppercase tracking-wider">
            PNG • JPG • JPEG • WEBP
          </span>
        </div>
      )}

      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

      {/* Cropper Modal */}
      {showCropModal && (
        <div className="fixed inset-0 z-[99999] bg-warm-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-warm-850 rounded-3xl border border-warm-200 dark:border-warm-750 shadow-2xl p-6 max-w-lg w-full flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-warm-100 dark:border-warm-800 pb-3">
              <h3 className="font-bold text-sm text-warm-900 dark:text-white">Crop & Reposition Image</h3>
              <button onClick={() => setShowCropModal(false)} className="text-warm-400 hover:text-warm-200">
                <X size={18} />
              </button>
            </div>

            <div className="relative w-full h-64 bg-black rounded-2xl overflow-hidden">
              <Cropper
                image={imageSrc!}
                crop={crop}
                zoom={zoom}
                aspect={aspectRatio}
                cropShape={shape === 'circle' ? 'round' : 'rect'}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-warm-600 dark:text-warm-400">Zoom</label>
              <input
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={zoom}
                onChange={e => setZoom(parseFloat(e.target.value))}
                className="w-full accent-red-500 cursor-pointer"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowCropModal(false)}
                className="px-4 py-2 text-xs font-semibold text-warm-500 hover:text-warm-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCrop}
                disabled={isUploading}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2"
              >
                {isUploading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <Check size={16} /> Save & Apply
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
