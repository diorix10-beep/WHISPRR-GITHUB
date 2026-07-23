import { useState } from 'react';
import { X, Upload, FileText, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { parseCharacterCardFile, ImportedCharacterData } from '../../services/characterImporter';
import { useToast } from '../../contexts/ToastContext';

interface UniversalCharacterImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (data: ImportedCharacterData) => void;
}

export function UniversalCharacterImporterModal({
  isOpen,
  onClose,
  onImportSuccess
}: UniversalCharacterImporterModalProps) {
  const { showToast } = useToast();
  const [isParsing, setIsParsing] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = async (file: File) => {
    try {
      setIsParsing(true);
      const importedData = await parseCharacterCardFile(file);
      setIsParsing(false);
      showToast(`📥 Successfully imported character "${importedData.name}"!`, 'success');
      onImportSuccess(importedData);
      onClose();
    } catch (err: any) {
      console.error('Error importing character card:', err);
      setIsParsing(false);
      showToast('Failed to parse character card file.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4 font-sans animate-fade-in select-none">
      <div className="w-full max-w-lg bg-white dark:bg-warm-900 rounded-3xl shadow-2xl border border-warm-200 dark:border-warm-800 overflow-hidden relative animate-scale-in">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-700 via-pink-600 to-red-600 p-6 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
          >
            <X size={18} />
          </button>

          <div className="inline-flex p-3 rounded-2xl bg-white/20 backdrop-blur-md mb-2">
            <Upload size={32} className="text-white animate-bounce" />
          </div>

          <h3 className="font-serif text-2xl font-bold">Universal Character Card Importer</h3>
          <p className="text-xs text-purple-100 mt-1">Import PNG or JSON cards from Character.AI, Janitor AI, or SillyTavern</p>
        </div>

        {/* Dropzone */}
        <div className="p-6 space-y-4">
          <label className="border-2 border-dashed border-purple-500/40 hover:border-purple-500 bg-purple-50/30 dark:bg-purple-950/20 p-8 rounded-3xl flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:scale-[1.01]">
            <input
              type="file"
              accept=".json,.png,.charm,.card"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
              className="hidden"
            />

            {isParsing ? (
              <div className="space-y-2">
                <Loader2 size={36} className="animate-spin text-purple-500 mx-auto" />
                <p className="text-xs font-bold text-warm-900 dark:text-white">Parsing Character Card Metadata...</p>
              </div>
            ) : (
              <>
                <FileText size={40} className="text-purple-500 mb-2" />
                <h4 className="font-bold text-sm text-warm-900 dark:text-white mb-1">Click to Upload or Drag &amp; Drop Card</h4>
                <p className="text-xs text-warm-500">Supports `.json`, `.png` character cards with embedded metadata.</p>
              </>
            )}
          </label>
        </div>

      </div>
    </div>
  );
}
