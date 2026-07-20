import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileText, CheckCircle, ChevronRight, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';

interface StoryImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  storyId: string;
  existingChapterCount: number;
  onImportComplete: () => void;
}

interface ParsedChapter {
  title: string;
  content: string;
  wordCount: number;
}

export default function StoryImporterModal({ 
  isOpen, 
  onClose, 
  storyId, 
  existingChapterCount,
  onImportComplete 
}: StoryImporterModalProps) {
  const { showToast } = useToast();
  
  const [step, setStep] = useState<1 | 2>(1);
  const [rawText, setRawText] = useState('');
  const [divider, setDivider] = useState('Chapter');
  const [parsedChapters, setParsedChapters] = useState<ParsedChapter[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/plain') {
      showToast('Please upload a .txt file. For other formats, copy and paste the text instead.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRawText(content);
      showToast(`Loaded file: ${file.name}`, 'success');
    };
    reader.onerror = () => {
      showToast('Error reading file', 'error');
    };
    reader.readAsText(file);
  };

  const parseText = () => {
    if (!rawText.trim()) {
      return showToast('Please paste or upload some text first.', 'error');
    }

    setIsParsing(true);
    
    try {
      const safeDivider = divider.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(?=^${safeDivider}\\s*\\d*|\\n${safeDivider}\\s*\\d*)`, 'gi');
      const chunks = rawText.split(regex).map(c => c.trim()).filter(c => c.length > 0);
      
      let newParsedChapters: ParsedChapter[] = [];
      
      if (chunks.length === 0 || chunks.length === 1) {
        newParsedChapters.push({
          title: `Imported Part 1`,
          content: rawText,
          wordCount: rawText.split(/\s+/).length
        });
      } else {
        chunks.forEach((chunk, index) => {
          const lines = chunk.split('\n');
          let title = `Imported Part ${index + 1}`;
          let content = chunk;

          if (lines[0] && lines[0].toLowerCase().includes(divider.toLowerCase())) {
            title = lines[0].trim();
          }

          newParsedChapters.push({
            title: title.substring(0, 100),
            content: content,
            wordCount: content.split(/\s+/).length
          });
        });
      }

      setParsedChapters(newParsedChapters);
      setStep(2);
    } catch (err) {
      console.error('Parsing error:', err);
      showToast('Failed to parse chapters. Try a different divider.', 'error');
    } finally {
      setIsParsing(false);
    }
  };

  const handleImport = async () => {
    if (parsedChapters.length === 0) return;
    setIsImporting(true);

    try {
      const payloads = parsedChapters.map((chap, index) => ({
        story_id: storyId,
        title: chap.title,
        content: chap.content,
        chapter_number: existingChapterCount + index + 1,
        status: 'draft'
      }));

      const { error } = await supabase
        .from('story_chapters')
        .insert(payloads);

      if (error) throw error;

      showToast(`Successfully imported ${parsedChapters.length} chapters!`, 'success');
      onImportComplete();
      handleClose();
    } catch (err: any) {
      console.error('Import error:', err);
      showToast(err.message || 'Failed to import chapters', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setRawText('');
    setParsedChapters([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-warm-900 border border-warm-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-warm-800 bg-warm-900">
          <div>
            <h2 className="font-serif text-2xl font-bold text-white flex items-center gap-2">
              <UploadCloud className="text-red-500" />
              Bulk Story Importer
            </h2>
            <p className="text-sm text-warm-400 mt-1">
              Import your entire manuscript and split it into draft chapters.
            </p>
          </div>
          <button 
            onClick={handleClose}
            className="p-2 text-warm-400 hover:text-white rounded-full hover:bg-warm-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 ? (
            <div className="space-y-6">
              <div className="bg-warm-800/50 p-4 rounded-xl border border-warm-750 flex items-start gap-3">
                <AlertCircle className="text-amber-500 flex-shrink-0 mt-0.5" size={20} />
                <div className="text-sm text-warm-300">
                  <p className="font-bold text-amber-500 mb-1">How this works</p>
                  Paste your entire story text below. We will use the "Chapter Divider" word you specify to automatically split your text into individual draft chapters.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-warm-800 hover:bg-warm-700 border border-warm-700 rounded-xl text-white font-bold transition-all"
                >
                  <FileText size={20} className="text-red-400" />
                  Upload .TXT File
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept=".txt" 
                  className="hidden" 
                />

                <div className="flex items-center gap-2 px-4 py-2 bg-warm-800 border border-warm-700 rounded-xl">
                  <span className="text-sm text-warm-400 font-bold whitespace-nowrap">Chapter Divider:</span>
                  <input 
                    type="text" 
                    value={divider}
                    onChange={(e) => setDivider(e.target.value)}
                    placeholder="e.g. Chapter"
                    className="bg-transparent border-none focus:outline-none text-white w-full font-mono text-sm"
                  />
                </div>
              </div>

              <div className="relative">
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Paste your story text here..."
                  className="w-full h-96 p-4 rounded-xl border border-warm-700 bg-warm-950 focus:outline-none focus:border-red-500 text-warm-100 text-sm font-mono resize-none leading-relaxed"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-green-400 bg-green-400/10 p-4 rounded-xl border border-green-400/20">
                <CheckCircle size={24} className="flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-lg">Parsed Successfully!</h3>
                  <p className="text-sm text-green-400/80">Found {parsedChapters.length} chapters. Please review them before importing.</p>
                </div>
              </div>

              <div className="space-y-3">
                {parsedChapters.map((chap, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-warm-800 border border-warm-750 rounded-xl hover:border-warm-600 transition-colors">
                    <div>
                      <h4 className="font-bold text-white mb-1">{chap.title}</h4>
                      <p className="text-xs text-warm-400">{chap.wordCount.toLocaleString()} words</p>
                    </div>
                    <div className="text-xs font-bold text-warm-500 uppercase tracking-wider">
                      Part {existingChapterCount + idx + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-warm-800 bg-warm-900 flex justify-between items-center">
          {step === 2 ? (
            <>
              <button
                onClick={() => setStep(1)}
                className="px-5 py-2.5 text-warm-400 hover:text-white font-bold transition-all"
                disabled={isImporting}
              >
                Back to Edit
              </button>
              <button
                onClick={handleImport}
                disabled={isImporting}
                className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg font-bold shadow-md transition-all"
              >
                {isImporting ? 'Importing...' : `Import ${parsedChapters.length} Chapters`}
              </button>
            </>
          ) : (
            <>
              <div className="text-xs text-warm-500">
                {rawText.length > 0 ? `${rawText.split(/\s+/).length.toLocaleString()} words loaded` : ''}
              </div>
              <button
                onClick={parseText}
                disabled={!rawText.trim() || isParsing}
                className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg font-bold shadow-md transition-all"
              >
                Preview Chapters
                <ChevronRight size={18} />
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
