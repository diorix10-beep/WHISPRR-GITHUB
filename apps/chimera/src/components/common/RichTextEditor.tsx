import React, { useRef, useState } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  Heading1, 
  Heading2, 
  List, 
  ListOrdered, 
  Quote, 
  Code, 
  Maximize2, 
  Minimize2,
  Trash2,
  Sparkles
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeightRows?: number;
  label?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start writing your character bio, backstory, or definitions...',
  minHeightRows = 8,
  label
}: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Helper to wrap selected text in markdown / formatting
  const applyFormatting = (prefix: string, suffix: string = prefix, defaultText: string = 'text') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end) || defaultText;
    const replacement = `${prefix}${selectedText}${suffix}`;

    const newValue = value.substring(0, start) + replacement + value.substring(end);
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 5);
  };

  // Helper to format lines (Headings, Lists, Quotes)
  const applyLineFormatting = (prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = value.indexOf('\n', start);
    const actualLineEnd = lineEnd === -1 ? value.length : lineEnd;
    const currentLine = value.substring(lineStart, actualLineEnd);

    const formattedLine = `${prefix} ${currentLine.replace(/^#+\s*|^[\*\-]\s*|^\d+\.\s*|^>\s*/, '')}`;
    const newValue = value.substring(0, lineStart) + formattedLine + value.substring(actualLineEnd);
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(lineStart + prefix.length + 1, lineStart + formattedLine.length);
    }, 5);
  };

  return (
    <div className={`space-y-2 font-sans transition-all duration-300 ${isExpanded ? 'fixed inset-4 z-50 bg-warm-900 border border-purple-500/40 rounded-3xl p-6 shadow-[0_0_80px_rgba(168,85,247,0.4)] flex flex-col' : ''}`}>
      
      {/* Label Header */}
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-extrabold text-warm-300 uppercase tracking-wider flex items-center gap-2">
            <Sparkles size={13} className="text-purple-400" />
            <span>{label}</span>
          </label>
          <span className="text-[10px] text-warm-500 font-mono">{value.length} characters</span>
        </div>
      )}

      {/* Editor Container */}
      <div className={`border border-warm-700/80 focus-within:border-purple-500/80 rounded-2xl overflow-hidden bg-warm-850/90 shadow-lg transition-all flex flex-col ${isExpanded ? 'flex-1' : ''}`}>
        
        {/* Compact Formatting Toolbar */}
        <div className="bg-warm-900/90 px-3 py-2 border-b border-warm-750 flex flex-wrap items-center justify-between gap-1 text-warm-300 text-xs select-none">
          
          <div className="flex items-center flex-wrap gap-1">
            
            {/* Bold */}
            <button
              type="button"
              onClick={() => applyFormatting('**', '**', 'bold text')}
              className="p-1.5 rounded-lg hover:bg-warm-800 text-warm-300 hover:text-white transition-colors"
              title="Bold (**text**)"
            >
              <Bold size={15} />
            </button>

            {/* Italic */}
            <button
              type="button"
              onClick={() => applyFormatting('*', '*', 'italic text')}
              className="p-1.5 rounded-lg hover:bg-warm-800 text-warm-300 hover:text-white transition-colors"
              title="Italic (*text*)"
            >
              <Italic size={15} />
            </button>

            {/* Underline */}
            <button
              type="button"
              onClick={() => applyFormatting('<u>', '</u>', 'underlined text')}
              className="p-1.5 rounded-lg hover:bg-warm-800 text-warm-300 hover:text-white transition-colors"
              title="Underline (<u>text</u>)"
            >
              <Underline size={15} />
            </button>

            <span className="w-px h-4 bg-warm-750 mx-1" />

            {/* Heading 1 */}
            <button
              type="button"
              onClick={() => applyLineFormatting('#')}
              className="p-1.5 rounded-lg hover:bg-warm-800 text-warm-300 hover:text-white transition-colors"
              title="Heading 1 (# Title)"
            >
              <Heading1 size={15} />
            </button>

            {/* Heading 2 */}
            <button
              type="button"
              onClick={() => applyLineFormatting('##')}
              className="p-1.5 rounded-lg hover:bg-warm-800 text-warm-300 hover:text-white transition-colors"
              title="Heading 2 (## Section)"
            >
              <Heading2 size={15} />
            </button>

            <span className="w-px h-4 bg-warm-750 mx-1" />

            {/* Bullet List */}
            <button
              type="button"
              onClick={() => applyLineFormatting('•')}
              className="p-1.5 rounded-lg hover:bg-warm-800 text-warm-300 hover:text-white transition-colors"
              title="Bullet List (• Item)"
            >
              <List size={15} />
            </button>

            {/* Numbered List */}
            <button
              type="button"
              onClick={() => applyLineFormatting('1.')}
              className="p-1.5 rounded-lg hover:bg-warm-800 text-warm-300 hover:text-white transition-colors"
              title="Numbered List (1. Item)"
            >
              <ListOrdered size={15} />
            </button>

            {/* Blockquote */}
            <button
              type="button"
              onClick={() => applyLineFormatting('>')}
              className="p-1.5 rounded-lg hover:bg-warm-800 text-warm-300 hover:text-white transition-colors"
              title="Quote (> Quote text)"
            >
              <Quote size={15} />
            </button>

            {/* Code */}
            <button
              type="button"
              onClick={() => applyFormatting('`', '`', 'code')}
              className="p-1.5 rounded-lg hover:bg-warm-800 text-warm-300 hover:text-white transition-colors"
              title="Inline Code (`code`)"
            >
              <Code size={15} />
            </button>

          </div>

          <div className="flex items-center gap-1">
            {/* Clear Text */}
            <button
              type="button"
              onClick={() => onChange('')}
              className="p-1.5 rounded-lg hover:bg-red-500/20 text-warm-400 hover:text-red-400 transition-colors"
              title="Clear Editor Content"
            >
              <Trash2 size={15} />
            </button>

            {/* Expand / Minimize Full-Screen Editor */}
            <button
              type="button"
              onClick={() => setIsExpanded(p => !p)}
              className="p-1.5 rounded-lg hover:bg-warm-800 text-purple-400 hover:text-purple-300 transition-colors"
              title={isExpanded ? "Collapse Editor" : "Expand Full Screen Workspace"}
            >
              {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>
          </div>

        </div>

        {/* Spacious Textarea Workspace */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={isExpanded ? 24 : minHeightRows}
          placeholder={placeholder}
          className={`w-full bg-transparent p-4 text-sm text-white placeholder:text-warm-500/70 focus:outline-none resize-y leading-relaxed font-sans ${isExpanded ? 'flex-1 h-full' : ''}`}
        />

      </div>
    </div>
  );
}
