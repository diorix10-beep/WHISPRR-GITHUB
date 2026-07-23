import { useState } from 'react';
import { X, Globe, Check, Sparkles } from 'lucide-react';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '../../services/translationEngine';
import { useToast } from '../../contexts/ToastContext';

interface LanguageSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLanguage: string;
  onSelectLanguage: (langCode: string) => void;
}

export function LanguageSelectorModal({
  isOpen,
  onClose,
  currentLanguage,
  onSelectLanguage
}: LanguageSelectorModalProps) {
  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleSelect = (lang: SupportedLanguage) => {
    onSelectLanguage(lang.code);
    showToast(`🌐 Roleplay Chat Translation set to ${lang.flag} ${lang.name}!`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md flex items-center justify-center p-4 font-sans animate-fade-in select-none">
      <div className="w-full max-w-md bg-white dark:bg-warm-900 rounded-3xl shadow-2xl border border-warm-200 dark:border-warm-800 overflow-hidden relative animate-scale-in">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
          >
            <X size={18} />
          </button>

          <div className="inline-flex p-3 rounded-2xl bg-white/20 backdrop-blur-md mb-2">
            <Globe size={32} className="text-white animate-spin-slow" />
          </div>

          <h3 className="font-serif text-2xl font-bold">Multilingual AI Translator</h3>
          <p className="text-xs text-blue-100 mt-1">Select target language for real-time AI roleplay translation</p>
        </div>

        {/* Language Grid */}
        <div className="p-6 space-y-3">
          <div className="grid grid-cols-2 gap-2.5">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = currentLanguage === lang.code;

              return (
                <button
                  key={lang.code}
                  onClick={() => handleSelect(lang)}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between font-bold text-xs ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-105'
                      : 'bg-warm-50 dark:bg-warm-850 text-warm-900 dark:text-white border-warm-200 dark:border-warm-800 hover:border-blue-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{lang.flag}</span>
                    <span>{lang.name}</span>
                  </div>

                  {isSelected && <Check size={16} />}
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
