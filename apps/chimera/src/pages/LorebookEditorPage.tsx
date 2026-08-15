import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Save, Plus, Trash2, BookOpen, Download, Upload,
  ChevronDown, ChevronRight, GripVertical, Search, ToggleLeft, ToggleRight, Link2, Users, Globe2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import type { Lorebook, LorebookEntry } from '../types';

export default function LorebookEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lorebook, setLorebook] = useState<Lorebook | null>(null);
  const [entries, setEntries] = useState<LorebookEntry[]>([]);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [linkedCharacterIds, setLinkedCharacterIds] = useState<string[]>([]);
  const [linkedWorldIds, setLinkedWorldIds] = useState<string[]>([]);
  const [characters, setCharacters] = useState<Array<{ id: string; short_description: string | null }>>([]);
  const [worlds, setWorlds] = useState<Array<{ id: string; name: string }>>([]);
  const [linkSaving, setLinkSaving] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private' | 'unlisted'>('private');

  const fetchLorebook = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [lbRes, entriesRes] = await Promise.all([
        supabase.from('lorebooks').select('*').eq('id', id).single(),
        supabase.from('lorebook_entries').select('*').eq('lorebook_id', id).order('insertion_order'),
      ]);
      if (lbRes.error) throw lbRes.error;
      setLorebook(lbRes.data);
      setTitle(lbRes.data.title);
      setDescription(lbRes.data.description);
      setVisibility(lbRes.data.visibility);
      setEntries(entriesRes.data || []);

      // Check for local draft (Rules 25 & 26)
      const draftKey = `chimera_lorebook_draft_${id}`;
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          if (parsed.title) setTitle(parsed.title);
          if (parsed.description) setDescription(parsed.description);
          if (parsed.visibility) setVisibility(parsed.visibility);
          showToast('Restored unsaved lorebook draft', 'info');
        } catch (e) {
          console.error('Failed to parse lorebook draft:', e);
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Error loading lorebook', 'error');
      navigate('/lorebooks');
    } finally {
      setLoading(false);
    }
  }, [id, showToast, navigate]);

  useEffect(() => { fetchLorebook(); }, [fetchLorebook]);

  useEffect(() => {
    if (!id || !profile?.user_id) return;
    const loadLinkTargets = async () => {
      const [charactersResult, worldsResult, characterLinksResult, worldLinksResult] = await Promise.all([
        supabase.from('ai_characters').select('id, short_description').eq('creator_id', profile.user_id).order('created_at', { ascending: false }),
        supabase.from('worlds').select('id, name').eq('user_id', profile.user_id).order('updated_at', { ascending: false }),
        supabase.from('lorebook_characters').select('character_id').eq('lorebook_id', id),
        supabase.from('lorebook_worlds').select('world_id').eq('lorebook_id', id),
      ]);
      const error = charactersResult.error || worldsResult.error || characterLinksResult.error || worldLinksResult.error;
      if (error) {
        console.error('Could not load lorebook links:', error);
        showToast('Could not load linked worlds and characters', 'error');
        return;
      }
      setCharacters(charactersResult.data || []);
      setWorlds(worldsResult.data || []);
      setLinkedCharacterIds((characterLinksResult.data || []).map((link) => link.character_id));
      setLinkedWorldIds((worldLinksResult.data || []).map((link) => link.world_id));
    };
    void loadLinkTargets();
  }, [id, profile?.user_id, showToast]);

  // Auto-save draft protection (Rules 25 & 26)
  useEffect(() => {
    if (!id || loading) return;
    const draftKey = `chimera_lorebook_draft_${id}`;
    const timer = setTimeout(() => {
      localStorage.setItem(draftKey, JSON.stringify({
        title, description, visibility, savedAt: Date.now()
      }));
    }, 500);
    return () => clearTimeout(timer);
  }, [id, loading, title, description, visibility]);

  const handleSave = async () => {
    if (!id) return;
    try {
      setSaving(true);
      const { error } = await supabase.from('lorebooks').update({ title, description, visibility }).eq('id', id);
      if (error) throw error;
      localStorage.removeItem(`chimera_lorebook_draft_${id}`);
      showToast('Lorebook saved!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error saving', 'error');
    } finally {
      setSaving(false);
    }
  };

  const addEntry = async () => {
    if (!id) return;
    const { data, error } = await supabase.from('lorebook_entries').insert({
      lorebook_id: id,
      title: 'New Entry',
      insertion_order: entries.length,
    }).select().single();
    if (error) { showToast('Error adding entry', 'error'); return; }
    setEntries([...entries, data]);
    setExpandedEntry(data.id);
  };

  const updateEntry = async (entryId: string, updates: Partial<LorebookEntry>) => {
    const { error } = await supabase.from('lorebook_entries').update(updates).eq('id', entryId);
    if (error) { showToast('Error updating entry', 'error'); return; }
    setEntries(entries.map(e => e.id === entryId ? { ...e, ...updates } : e));
  };

  const deleteEntry = async (entryId: string) => {
    const { error } = await supabase.from('lorebook_entries').delete().eq('id', entryId);
    if (error) { showToast('Error deleting entry', 'error'); return; }
    setEntries(entries.filter(e => e.id !== entryId));
    if (expandedEntry === entryId) setExpandedEntry(null);
  };

  const toggleEntryEnabled = async (entryId: string, enabled: boolean) => {
    await updateEntry(entryId, { enabled });
  };

  const toggleCharacterLink = async (characterId: string) => {
    if (!id) return;
    const linked = linkedCharacterIds.includes(characterId);
    setLinkSaving(`character:${characterId}`);
    const { error } = linked
      ? await supabase.from('lorebook_characters').delete().eq('lorebook_id', id).eq('character_id', characterId)
      : await supabase.from('lorebook_characters').insert({ lorebook_id: id, character_id: characterId });
    setLinkSaving(null);
    if (error) { showToast(error.message || 'Could not update character link', 'error'); return; }
    setLinkedCharacterIds((previous) => linked ? previous.filter((value) => value !== characterId) : [...previous, characterId]);
  };

  const toggleWorldLink = async (worldId: string) => {
    if (!id) return;
    const linked = linkedWorldIds.includes(worldId);
    setLinkSaving(`world:${worldId}`);
    const { error } = linked
      ? await supabase.from('lorebook_worlds').delete().eq('lorebook_id', id).eq('world_id', worldId)
      : await supabase.from('lorebook_worlds').insert({ lorebook_id: id, world_id: worldId });
    setLinkSaving(null);
    if (error) { showToast(error.message || 'Could not update world link', 'error'); return; }
    setLinkedWorldIds((previous) => linked ? previous.filter((value) => value !== worldId) : [...previous, worldId]);
  };

  const handleExport = () => {
    const exportData = { lorebook: { title, description, visibility }, entries };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'lorebook'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported!', 'success');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (data.entries && Array.isArray(data.entries)) {
        for (const entry of data.entries) {
          await supabase.from('lorebook_entries').insert({
            lorebook_id: id,
            title: entry.title || 'Imported Entry',
            content: entry.content || '',
            keywords: entry.keywords || [],
            priority: entry.priority || 0,
            enabled: entry.enabled ?? true,
            insertion_order: entries.length,
          });
        }
        showToast(`Imported ${data.entries.length} entries!`, 'success');
        fetchLorebook();
      }
    } catch {
      showToast('Invalid file format', 'error');
    }
    e.target.value = '';
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-warm-200 dark:bg-warm-700 rounded-lg" />
          <div className="h-64 bg-warm-100 dark:bg-warm-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/lorebooks')} className="p-2 rounded-xl hover:bg-warm-100 dark:hover:bg-warm-800 transition">
          <ArrowLeft size={20} className="text-warm-500" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-serif font-bold text-warm-900 dark:text-warm-50">{title || 'Untitled Lorebook'}</h1>
          <p className="text-xs text-warm-400 mt-0.5">{entries.length} entries</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-warm-600 dark:text-warm-400 bg-warm-100 dark:bg-warm-800 hover:bg-warm-200 dark:hover:bg-warm-750 transition">
            <Download size={12} /> Export
          </button>
          <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-warm-600 dark:text-warm-400 bg-warm-100 dark:bg-warm-800 hover:bg-warm-200 dark:hover:bg-warm-750 transition cursor-pointer">
            <Upload size={12} /> Import
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 disabled:opacity-50 shadow-sm transition-all"
          >
            <Save size={14} />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Lorebook Metadata */}
      <div className="bg-white dark:bg-warm-800 rounded-2xl border border-warm-200 dark:border-warm-750 p-5 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-warm-600 dark:text-warm-400 mb-1.5 uppercase tracking-wider">Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-warm-50 dark:bg-warm-850 border border-warm-200 dark:border-warm-700 text-sm text-warm-900 dark:text-warm-50 focus:outline-none focus:ring-2 focus:ring-red-500/30" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-warm-600 dark:text-warm-400 mb-1.5 uppercase tracking-wider">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full px-4 py-3 rounded-xl bg-warm-50 dark:bg-warm-850 border border-warm-200 dark:border-warm-700 text-sm text-warm-900 dark:text-warm-50 focus:outline-none focus:ring-2 focus:ring-red-500/30 resize-none" placeholder="What is this lorebook about?" />
        </div>
      </div>

      {/* Runtime scope: these links decide which roleplay characters and worlds
          may retrieve this book. They are saved immediately, separately from
          the text draft above. */}
      <section className="bg-white dark:bg-warm-800 rounded-2xl border border-warm-200 dark:border-warm-750 p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-300"><Link2 size={18} /></div>
          <div>
            <h2 className="text-sm font-semibold text-warm-900 dark:text-warm-50">Where this lore lives</h2>
            <p className="mt-1 text-xs leading-relaxed text-warm-500">Link this book to a roleplay character, a world, or both. CHIMERA retrieves relevant entries only in those linked roleplays.</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-warm-200 dark:border-warm-700 p-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-warm-600 dark:text-warm-300"><Users size={14} />Characters</p>
            {characters.length === 0 ? <p className="text-xs text-warm-400">Create a character first, then return to connect its lore.</p> : (
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">{characters.map((character) => {
                const linked = linkedCharacterIds.includes(character.id);
                return <label key={character.id} className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-2 hover:bg-warm-50 dark:hover:bg-warm-850">
                  <span className="min-w-0 truncate text-xs text-warm-700 dark:text-warm-200">{character.short_description || `Character ${character.id.slice(0, 8)}`}</span>
                  <input type="checkbox" checked={linked} disabled={linkSaving === `character:${character.id}`} onChange={() => toggleCharacterLink(character.id)} className="h-4 w-4 accent-amber-500" />
                </label>;
              })}</div>
            )}
          </div>
          <div className="rounded-xl border border-warm-200 dark:border-warm-700 p-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-warm-600 dark:text-warm-300"><Globe2 size={14} />Worlds</p>
            {worlds.length === 0 ? <p className="text-xs text-warm-400">Create a world first, then return to connect its shared lore.</p> : (
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">{worlds.map((world) => {
                const linked = linkedWorldIds.includes(world.id);
                return <label key={world.id} className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-2 hover:bg-warm-50 dark:hover:bg-warm-850">
                  <span className="min-w-0 truncate text-xs text-warm-700 dark:text-warm-200">{world.name}</span>
                  <input type="checkbox" checked={linked} disabled={linkSaving === `world:${world.id}`} onChange={() => toggleWorldLink(world.id)} className="h-4 w-4 accent-amber-500" />
                </label>;
              })}</div>
            )}
          </div>
        </div>
      </section>

      {/* Entries */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-warm-700 dark:text-warm-300">Entries</h2>
          <button onClick={addEntry} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition">
            <Plus size={14} /> Add Entry
          </button>
        </div>

        {entries.length === 0 ? (
          <div className="text-center py-12 bg-warm-50 dark:bg-warm-850 rounded-xl border border-warm-200 dark:border-warm-700">
            <BookOpen size={24} className="mx-auto text-warm-300 mb-3" />
            <p className="text-sm text-warm-400">No entries yet. Add your first knowledge entry!</p>
          </div>
        ) : (
          entries.map(entry => (
            <div key={entry.id} className="bg-white dark:bg-warm-800 rounded-xl border border-warm-200 dark:border-warm-750 overflow-hidden">
              {/* Entry header */}
              <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-warm-50 dark:hover:bg-warm-850 transition"
                onClick={() => setExpandedEntry(expandedEntry === entry.id ? null : entry.id)}
              >
                {expandedEntry === entry.id ? <ChevronDown size={14} className="text-warm-400" /> : <ChevronRight size={14} className="text-warm-400" />}
                <span className="flex-1 text-sm font-medium text-warm-900 dark:text-warm-50 truncate">{entry.title || 'Untitled'}</span>
                <div className="flex items-center gap-2">
                  {entry.keywords.length > 0 && (
                    <span className="text-[10px] text-warm-400 bg-warm-100 dark:bg-warm-750 px-2 py-0.5 rounded-full">
                      {entry.keywords.length} keywords
                    </span>
                  )}
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${entry.enabled ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-warm-100 dark:bg-warm-750 text-warm-400'}`}>
                    {entry.enabled ? 'Active' : 'Disabled'}
                  </span>
                  <span className="text-[10px] text-warm-400">P{entry.priority}</span>
                </div>
              </div>

              {/* Expanded content */}
              {expandedEntry === entry.id && (
                <div className="px-4 pb-4 space-y-3 border-t border-warm-100 dark:border-warm-750 pt-3">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-[10px] font-semibold text-warm-500 mb-1 uppercase">Title</label>
                      <input
                        value={entry.title}
                        onChange={e => updateEntry(entry.id, { title: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-warm-50 dark:bg-warm-850 border border-warm-200 dark:border-warm-700 text-sm text-warm-900 dark:text-warm-50 focus:outline-none focus:ring-2 focus:ring-red-500/30"
                      />
                    </div>
                    <div className="w-20">
                      <label className="block text-[10px] font-semibold text-warm-500 mb-1 uppercase">Priority</label>
                      <input
                        type="number"
                        value={entry.priority}
                        onChange={e => updateEntry(entry.id, { priority: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 rounded-lg bg-warm-50 dark:bg-warm-850 border border-warm-200 dark:border-warm-700 text-sm text-warm-900 dark:text-warm-50 focus:outline-none text-center"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-warm-500 mb-1 uppercase">Keywords (comma-separated)</label>
                    <input
                      value={entry.keywords.join(', ')}
                      onChange={e => updateEntry(entry.id, { keywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean) })}
                      className="w-full px-3 py-2 rounded-lg bg-warm-50 dark:bg-warm-850 border border-warm-200 dark:border-warm-700 text-sm text-warm-900 dark:text-warm-50 focus:outline-none focus:ring-2 focus:ring-red-500/30"
                      placeholder="magic, spells, arcane..."
                    />
                    <p className="text-[10px] text-warm-400 mt-1">These keywords trigger this entry in AI conversations.</p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-warm-500 mb-1 uppercase">Content</label>
                    <textarea
                      value={entry.content}
                      onChange={e => updateEntry(entry.id, { content: e.target.value })}
                      rows={5}
                      className="w-full px-3 py-2 rounded-lg bg-warm-50 dark:bg-warm-850 border border-warm-200 dark:border-warm-700 text-sm text-warm-900 dark:text-warm-50 focus:outline-none focus:ring-2 focus:ring-red-500/30 resize-none font-mono text-xs leading-relaxed"
                      placeholder="Write the knowledge entry content..."
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => toggleEntryEnabled(entry.id, !entry.enabled)}
                      className={`flex items-center gap-2 text-xs font-medium ${entry.enabled ? 'text-green-600' : 'text-warm-400'}`}
                    >
                      {entry.enabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                      {entry.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                    <label className="flex items-center gap-2 text-xs font-medium text-warm-600 dark:text-warm-300">
                      <input
                        type="checkbox"
                        checked={Boolean(entry.is_constant)}
                        onChange={e => updateEntry(entry.id, { is_constant: e.target.checked })}
                        className="h-4 w-4 accent-amber-500"
                      />
                      Always hold in linked roleplay
                    </label>
                    <button
                      onClick={() => deleteEntry(entry.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                    >
                      <Trash2 size={12} /> Delete Entry
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
