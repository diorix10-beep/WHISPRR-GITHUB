import { useState } from 'react';
import {
  X, BookOpen, Search, Plus, Upload, CheckCircle2, Sparkles, Filter,
  Eye, EyeOff, Tag, Sliders, FileJson, ArrowRight
} from 'lucide-react';
import type { LorebookEntry } from '../../types';
import { parseJanitorLorebookJson } from '../../services/lorebookEngine';

interface LorebookDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  entries: LorebookEntry[];
  matchedKeywordsMap: Record<string, string[]>;
  onToggleForceActive: (entryId: string, forceActive: boolean | undefined) => void;
  onAddEntry: (newEntry: { title: string; keywords: string[]; content: string }) => Promise<void>;
  onImportJson: (jsonString: string) => Promise<void>;
  scanDepth: number;
  onChangeScanDepth: (depth: number) => void;
}

export function LorebookDrawer({
  isOpen,
  onClose,
  entries,
  matchedKeywordsMap,
  onToggleForceActive,
  onAddEntry,
  onImportJson,
  scanDepth,
  onChangeScanDepth,
}: LorebookDrawerProps) {
  const [activeTab, setActiveTab] = useState<'triggered' | 'all' | 'add' | 'import'>('triggered');
  const [searchQuery, setSearchQuery] = useState('');

  // Add Form state
  const [newTitle, setNewTitle] = useState('');
  const [newKeywords, setNewKeywords] = useState('');
  const [newContent, setNewContent] = useState('');
  const [adding, setAdding] = useState(false);

  // Import State
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const triggeredEntries = entries.filter((e) => matchedKeywordsMap[e.id] !== undefined);

  const filteredEntries = entries.filter(
    (e) =>
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.keywords.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase())) ||
      e.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    try {
      setAdding(true);
      const kwList = newKeywords
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);
      await onAddEntry({
        title: newTitle.trim(),
        keywords: kwList,
        content: newContent.trim(),
      });
      setNewTitle('');
      setNewKeywords('');
      setNewContent('');
      setActiveTab('triggered');
    } catch (err: any) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImportStatus('Reading file...');
      const text = await file.text();
      await onImportJson(text);
      setImportStatus('Successfully imported Lorebook!');
      setTimeout(() => setImportStatus(null), 3000);
      setActiveTab('triggered');
    } catch (err: any) {
      setImportStatus(err.message || 'Import failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end transition-opacity animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-warm-900 h-full flex flex-col shadow-2xl border-l border-warm-200 dark:border-warm-800 animate-slide-left">
        
        {/* Header */}
        <div className="p-4 border-b border-warm-200 dark:border-warm-800 flex items-center justify-between bg-warm-50/50 dark:bg-warm-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <BookOpen size={20} />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg text-warm-900 dark:text-warm-50 flex items-center gap-2">
                Lorebook Inspector
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-sans font-bold">
                  Janitor AI
                </span>
              </h2>
              <p className="text-xs text-warm-500">Auto-triggered world lore & context</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-warm-200 dark:hover:bg-warm-800 text-warm-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-warm-200 dark:border-warm-800 px-3 bg-warm-100/50 dark:bg-warm-900/50 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('triggered')}
            className={`flex items-center gap-1.5 py-3 px-3 border-b-2 transition-colors ${
              activeTab === 'triggered'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400 font-bold'
                : 'border-transparent text-warm-500 hover:text-warm-900 dark:hover:text-warm-200'
            }`}
          >
            <Sparkles size={14} />
            <span>Triggered ({triggeredEntries.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-1.5 py-3 px-3 border-b-2 transition-colors ${
              activeTab === 'all'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400 font-bold'
                : 'border-transparent text-warm-500 hover:text-warm-900 dark:hover:text-warm-200'
            }`}
          >
            <Filter size={14} />
            <span>All ({entries.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`flex items-center gap-1.5 py-3 px-3 border-b-2 transition-colors ${
              activeTab === 'add'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400 font-bold'
                : 'border-transparent text-warm-500 hover:text-warm-900 dark:hover:text-warm-200'
            }`}
          >
            <Plus size={14} />
            <span>Quick Add</span>
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex items-center gap-1.5 py-3 px-3 border-b-2 transition-colors ${
              activeTab === 'import'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400 font-bold'
                : 'border-transparent text-warm-500 hover:text-warm-900 dark:hover:text-warm-200'
            }`}
          >
            <Upload size={14} />
            <span>Import</span>
          </button>
        </div>

        {/* Scan Settings Bar */}
        <div className="px-4 py-2 bg-purple-500/5 dark:bg-purple-950/30 border-b border-purple-500/10 flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-warm-600 dark:text-warm-400 font-medium">
            <Sliders size={14} className="text-purple-500" />
            Scan Depth: <strong>Last {scanDepth} messages</strong>
          </span>
          <input
            type="range"
            min="3"
            max="25"
            value={scanDepth}
            onChange={(e) => onChangeScanDepth(Number(e.target.value))}
            className="w-24 accent-purple-600"
          />
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* TAB 1: TRIGGERED ENTRIES */}
          {activeTab === 'triggered' && (
            <div>
              {triggeredEntries.length === 0 ? (
                <div className="text-center py-12 px-4 text-warm-400 space-y-3">
                  <BookOpen size={40} className="mx-auto opacity-30" />
                  <p className="font-serif italic text-base">No lore entries triggered for this turn yet.</p>
                  <p className="text-xs text-warm-500">
                    Mention keywords like characters, locations, or items in chat to automatically activate lore!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {triggeredEntries.map((entry) => {
                    const matchedKws = matchedKeywordsMap[entry.id] || [];
                    const isForced = entry.force_active === true;
                    return (
                      <div
                        key={entry.id}
                        className="p-3.5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/70 dark:border-purple-800/50 space-y-2 transition-all hover:border-purple-400"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-sm text-warm-900 dark:text-warm-100 flex items-center gap-1.5">
                            {entry.title}
                            {isForced && (
                              <span className="text-[10px] bg-purple-500 text-white font-bold px-1.5 py-0.2 rounded">
                                Pinned
                              </span>
                            )}
                          </h3>

                          {/* Force Toggle Buttons */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() =>
                                onToggleForceActive(
                                  entry.id,
                                  entry.force_active === true ? undefined : true
                                )
                              }
                              className={`p-1.5 rounded-lg text-xs transition-colors ${
                                entry.force_active === true
                                  ? 'bg-purple-600 text-white'
                                  : 'hover:bg-purple-100 dark:hover:bg-purple-900/40 text-warm-500'
                              }`}
                              title="Force Always Active"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={() =>
                                onToggleForceActive(
                                  entry.id,
                                  entry.force_active === false ? undefined : false
                                )
                              }
                              className={`p-1.5 rounded-lg text-xs transition-colors ${
                                entry.force_active === false
                                  ? 'bg-red-600 text-white'
                                  : 'hover:bg-red-100 dark:hover:bg-red-900/40 text-warm-500'
                              }`}
                              title="Force Disable"
                            >
                              <EyeOff size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Matched Keywords Badges */}
                        <div className="flex flex-wrap gap-1 items-center">
                          <span className="text-[10px] text-warm-400 font-semibold uppercase">Matched:</span>
                          {matchedKws.map((kw, i) => (
                            <span
                              key={i}
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-600 text-white flex items-center gap-1"
                            >
                              <Tag size={10} />
                              {kw}
                            </span>
                          ))}
                        </div>

                        <p className="text-xs text-warm-600 dark:text-warm-300 line-clamp-3 bg-white/60 dark:bg-warm-900/60 p-2 rounded-xl border border-warm-200/50 dark:border-warm-800/50 italic">
                          "{entry.content}"
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ALL ENTRIES */}
          {activeTab === 'all' && (
            <div className="space-y-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-warm-400" />
                <input
                  type="text"
                  placeholder="Search entries or keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-warm-200 dark:border-warm-800 bg-warm-50 dark:bg-warm-950 text-xs text-warm-900 dark:text-warm-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              {filteredEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-3 rounded-xl border border-warm-200 dark:border-warm-800 bg-white dark:bg-warm-950/60 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-warm-900 dark:text-warm-100">
                      {entry.title}
                    </h4>
                    <button
                      onClick={() =>
                        onToggleForceActive(
                          entry.id,
                          entry.force_active === true ? undefined : true
                        )
                      }
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-lg transition-colors ${
                        entry.force_active === true
                          ? 'bg-purple-600 text-white'
                          : 'bg-warm-100 dark:bg-warm-800 text-warm-600 dark:text-warm-300'
                      }`}
                    >
                      {entry.force_active === true ? 'Pinned' : 'Pin Entry'}
                    </button>
                  </div>
                  {entry.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {entry.keywords.map((k, i) => (
                        <span
                          key={i}
                          className="text-[9px] px-1.5 py-0.3 rounded bg-warm-100 dark:bg-warm-800 text-warm-600 dark:text-warm-400 font-mono"
                        >
                          {k}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: QUICK ADD ENTRY */}
          {activeTab === 'add' && (
            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-warm-700 dark:text-warm-300 mb-1">
                  Entry Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Excalibur, Shadow Realm"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-warm-200 dark:border-warm-800 bg-warm-50 dark:bg-warm-950 text-xs focus:ring-1 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-warm-700 dark:text-warm-300 mb-1">
                  Keywords / Triggers (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Excalibur, Holy Sword, Arthur's Blade"
                  value={newKeywords}
                  onChange={(e) => setNewKeywords(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-warm-200 dark:border-warm-800 bg-warm-50 dark:bg-warm-950 text-xs focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-warm-700 dark:text-warm-300 mb-1">
                  Lore Context Content *
                </label>
                <textarea
                  rows={4}
                  placeholder="Write the lore description for the AI to understand..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-warm-200 dark:border-warm-800 bg-warm-50 dark:bg-warm-950 text-xs focus:ring-1 focus:ring-purple-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={adding}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                {adding ? 'Saving Entry...' : 'Save & Add Lore Entry'}
                <ArrowRight size={14} />
              </button>
            </form>
          )}

          {/* TAB 4: IMPORT JANITOR AI / SILLYTAVERN JSON */}
          {activeTab === 'import' && (
            <div className="space-y-4 text-center py-6">
              <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/50 space-y-2">
                <FileJson size={36} className="mx-auto text-purple-600 dark:text-purple-400" />
                <h3 className="font-bold text-sm text-warm-900 dark:text-warm-100">
                  Janitor AI / SillyTavern JSON Importer
                </h3>
                <p className="text-xs text-warm-500">
                  Upload any exported `.json` Lorebook file from Janitor AI or SillyTavern to instantly import all entries!
                </p>
              </div>

              <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs cursor-pointer transition-colors shadow-md">
                <Upload size={16} />
                <span>Select JSON File</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {importStatus && (
                <div className="p-3 rounded-xl bg-warm-100 dark:bg-warm-800 text-xs font-semibold text-warm-800 dark:text-warm-200">
                  {importStatus}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
