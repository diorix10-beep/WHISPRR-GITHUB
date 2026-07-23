import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Save, Map, MapPin, Shield, Clock,
  Plus, Trash2, ChevronDown, ChevronRight, GripVertical,
  Users, BookOpen, Globe, Lock, Eye, Settings
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import type { World, WorldLocation, WorldFaction, WorldTimelineEvent } from '../types';
import { WorldCanvasTab } from '../components/world/WorldCanvasTab';
import { UniversalImagePicker } from '../components/common/UniversalImagePicker';

type TabId = 'overview' | 'canvas' | 'locations' | 'factions' | 'timeline' | 'characters' | 'lorebooks' | 'settings';

const TABS: { id: TabId; label: string; icon: typeof Map }[] = [
  { id: 'overview', label: 'Overview', icon: Map },
  { id: 'canvas', label: 'Visual Map Canvas', icon: Globe },
  { id: 'locations', label: 'Locations', icon: MapPin },
  { id: 'factions', label: 'Factions', icon: Shield },
  { id: 'timeline', label: 'Timeline', icon: Clock },
  { id: 'characters', label: 'Characters', icon: Users },
  { id: 'lorebooks', label: 'Lorebooks', icon: BookOpen },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function WorldBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // World data
  const [world, setWorld] = useState<World | null>(null);
  const [locations, setLocations] = useState<WorldLocation[]>([]);
  const [factions, setFactions] = useState<WorldFaction[]>([]);
  const [timeline, setTimeline] = useState<WorldTimelineEvent[]>([]);
  const [linkedCharacters, setLinkedCharacters] = useState<any[]>([]);
  const [linkedLorebooks, setLinkedLorebooks] = useState<any[]>([]);

  // Form state for overview
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [scenario, setScenario] = useState('');
  const [tags, setTags] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private' | 'unlisted'>('private');
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  const fetchWorld = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const { data, error } = await supabase.from('worlds').select('*').eq('id', id).single();
      if (error) throw error;
      setWorld(data);
      setName(data.name);
      setDescription(data.description);
      setScenario(data.scenario);
      setTags((data.tags || []).join(', '));
      setCoverUrl(data.cover_url || null);

      // Check for local draft (Rules 25 & 26)
      const draftKey = `chimera_world_draft_${id}`;
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          if (parsed.name) setName(parsed.name);
          if (parsed.description) setDescription(parsed.description);
          if (parsed.scenario) setScenario(parsed.scenario);
          if (parsed.tags !== undefined) setTags(parsed.tags);
          if (parsed.visibility) setVisibility(parsed.visibility);
          if (parsed.coverUrl !== undefined) setCoverUrl(parsed.coverUrl);
          showToast('Restored unsaved local draft', 'info');
        } catch (e) {
          console.error('Failed to parse draft:', e);
        }
      }

      // Fetch sub-data in parallel
      const [locRes, facRes, tlRes, charRes, loreRes] = await Promise.all([
        supabase.from('world_locations').select('*').eq('world_id', id).order('sort_order'),
        supabase.from('world_factions').select('*').eq('world_id', id).order('created_at'),
        supabase.from('world_timeline_events').select('*').eq('world_id', id).order('sort_order'),
        supabase.from('world_characters').select('*, character:ai_characters(id, bot_profile:profiles!ai_characters_user_id_fkey(display_name, avatar_emoji, photo_url))').eq('world_id', id),
        supabase.from('lorebook_worlds').select('*, lorebook:lorebooks(id, title, entry_count)').eq('world_id', id),
      ]);

      setLocations(locRes.data || []);
      setFactions(facRes.data || []);
      setTimeline(tlRes.data || []);
      setLinkedCharacters(charRes.data || []);
      setLinkedLorebooks(loreRes.data || []);
    } catch (err: any) {
      showToast(err.message || 'Error loading world', 'error');
      navigate('/worlds');
    } finally {
      setLoading(false);
    }
  }, [id, showToast, navigate]);

  useEffect(() => { fetchWorld(); }, [fetchWorld]);

  // Auto-save draft protection (Rules 25 & 26)
  useEffect(() => {
    if (!id || loading) return;
    const draftKey = `chimera_world_draft_${id}`;
    const timer = setTimeout(() => {
      localStorage.setItem(draftKey, JSON.stringify({
        name, description, scenario, tags, visibility, coverUrl, savedAt: Date.now()
      }));
    }, 500);
    return () => clearTimeout(timer);
  }, [id, loading, name, description, scenario, tags, visibility, coverUrl]);

  const handleSaveOverview = async () => {
    if (!id) return;
    try {
      setSaving(true);
      const { error } = await supabase.from('worlds').update({
        name, description, scenario, visibility, cover_url: coverUrl,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      }).eq('id', id);
      if (error) throw error;
      localStorage.removeItem(`chimera_world_draft_${id}`);
      showToast('World saved!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error saving', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Location CRUD
  const addLocation = async () => {
    if (!id) return;
    const { data, error } = await supabase.from('world_locations').insert({
      world_id: id, name: 'New Location', sort_order: locations.length,
    }).select().single();
    if (error) { showToast('Error', 'error'); return; }
    setLocations([...locations, data]);
  };

  const updateLocation = async (locId: string, updates: Partial<WorldLocation>) => {
    const { error } = await supabase.from('world_locations').update(updates).eq('id', locId);
    if (error) { showToast('Error', 'error'); return; }
    setLocations(locations.map(l => l.id === locId ? { ...l, ...updates } : l));
  };

  const deleteLocation = async (locId: string) => {
    const { error } = await supabase.from('world_locations').delete().eq('id', locId);
    if (error) { showToast('Error', 'error'); return; }
    setLocations(locations.filter(l => l.id !== locId));
  };

  // Faction CRUD
  const addFaction = async () => {
    if (!id) return;
    const { data, error } = await supabase.from('world_factions').insert({
      world_id: id, name: 'New Faction',
    }).select().single();
    if (error) { showToast('Error', 'error'); return; }
    setFactions([...factions, data]);
  };

  const updateFaction = async (fId: string, updates: Partial<WorldFaction>) => {
    const { error } = await supabase.from('world_factions').update(updates).eq('id', fId);
    if (error) { showToast('Error', 'error'); return; }
    setFactions(factions.map(f => f.id === fId ? { ...f, ...updates } : f));
  };

  const deleteFaction = async (fId: string) => {
    const { error } = await supabase.from('world_factions').delete().eq('id', fId);
    if (error) { showToast('Error', 'error'); return; }
    setFactions(factions.filter(f => f.id !== fId));
  };

  // Timeline CRUD
  const addTimelineEvent = async () => {
    if (!id) return;
    const { data, error } = await supabase.from('world_timeline_events').insert({
      world_id: id, title: 'New Event', sort_order: timeline.length,
    }).select().single();
    if (error) { showToast('Error', 'error'); return; }
    setTimeline([...timeline, data]);
  };

  const updateTimelineEvent = async (eId: string, updates: Partial<WorldTimelineEvent>) => {
    // world_timeline_events has no updated_at, so we just update the fields directly
    const { error } = await supabase.from('world_timeline_events').update(updates).eq('id', eId);
    if (error) { showToast('Error', 'error'); return; }
    setTimeline(timeline.map(e => e.id === eId ? { ...e, ...updates } : e));
  };

  const deleteTimelineEvent = async (eId: string) => {
    const { error } = await supabase.from('world_timeline_events').delete().eq('id', eId);
    if (error) { showToast('Error', 'error'); return; }
    setTimeline(timeline.filter(e => e.id !== eId));
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-warm-200 dark:bg-warm-700 rounded-lg" />
          <div className="h-64 bg-warm-100 dark:bg-warm-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!world) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/worlds')} className="p-2 rounded-xl hover:bg-warm-100 dark:hover:bg-warm-800 transition">
          <ArrowLeft size={20} className="text-warm-500" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-serif font-bold text-warm-900 dark:text-warm-50">{world.name}</h1>
          <p className="text-xs text-warm-400 mt-0.5">World Builder</p>
        </div>
        <button
          onClick={handleSaveOverview}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 disabled:opacity-50 shadow-md shadow-purple-600/20 transition-all"
        >
          <Save size={14} />
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-warm-800 text-purple-600 dark:text-purple-400 shadow-sm border border-purple-200 dark:border-purple-800/40 font-bold'
                  : 'text-warm-500 hover:text-warm-700 dark:hover:text-warm-300 hover:bg-warm-50 dark:hover:bg-warm-850'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-warm-800 rounded-2xl border border-warm-200 dark:border-warm-750 p-6">
        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-warm-600 dark:text-warm-400 mb-1.5 uppercase tracking-wider">World Cover Image (Rule 52)</label>
              <UniversalImagePicker
                value={coverUrl}
                onChange={setCoverUrl}
                shape="rectangle"
                aspectRatio={16 / 9}
                label="World Banner / Cover Image"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-warm-600 dark:text-warm-400 mb-1.5 uppercase tracking-wider">World Name</label>
              <input value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-warm-50 dark:bg-warm-850 border border-warm-200 dark:border-warm-700 text-sm text-warm-900 dark:text-warm-50 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-warm-600 dark:text-warm-400 mb-1.5 uppercase tracking-wider">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} className="w-full px-4 py-3 rounded-xl bg-warm-50 dark:bg-warm-850 border border-warm-200 dark:border-warm-700 text-sm text-warm-900 dark:text-warm-50 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 resize-none" placeholder="Describe your world..." />
            </div>
            <div>
              <label className="block text-xs font-semibold text-warm-600 dark:text-warm-400 mb-1.5 uppercase tracking-wider">Scenario / Setting</label>
              <textarea value={scenario} onChange={e => setScenario(e.target.value)} rows={3} className="w-full px-4 py-3 rounded-xl bg-warm-50 dark:bg-warm-850 border border-warm-200 dark:border-warm-700 text-sm text-warm-900 dark:text-warm-50 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 resize-none" placeholder="Set the stage — what era, what rules, what atmosphere?" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-warm-600 dark:text-warm-400 mb-1.5 uppercase tracking-wider">Tags</label>
              <input value={tags} onChange={e => setTags(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-warm-50 dark:bg-warm-850 border border-warm-200 dark:border-warm-700 text-sm text-warm-900 dark:text-warm-50 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500" placeholder="fantasy, medieval, dragons, magic..." />
              <p className="text-[10px] text-warm-400 mt-1">Separate with commas</p>
            </div>
          </div>
        )}

        {/* VISUAL MAP CANVAS */}
        {activeTab === 'canvas' && (
          <WorldCanvasTab worldId={id || ''} locations={locations} factions={factions} />
        )}

        {/* LOCATIONS */}
        {activeTab === 'locations' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-warm-500">Define the places that exist in your world.</p>
              <button onClick={addLocation} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition">
                <Plus size={14} /> Add Location
              </button>
            </div>
            {locations.length === 0 ? (
              <div className="text-center py-12 text-warm-400 text-sm">No locations yet. Add your first one!</div>
            ) : (
              <div className="space-y-3">
                {locations.map(loc => (
                  <div key={loc.id} className="flex gap-3 p-4 rounded-xl bg-warm-50 dark:bg-warm-850 border border-warm-200 dark:border-warm-700">
                    <div className="flex-1 space-y-2">
                      <input
                        value={loc.name}
                        onChange={e => updateLocation(loc.id, { name: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-warm-800 border border-warm-200 dark:border-warm-700 text-sm font-medium text-warm-900 dark:text-warm-50 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
                        placeholder="Location name..."
                      />
                      <textarea
                        value={loc.description}
                        onChange={e => updateLocation(loc.id, { description: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-warm-800 border border-warm-200 dark:border-warm-700 text-xs text-warm-600 dark:text-warm-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 resize-none"
                        placeholder="Describe this location..."
                      />
                    </div>
                    <button onClick={() => deleteLocation(loc.id)} className="p-2 rounded-lg text-warm-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 self-start transition">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* FACTIONS */}
        {activeTab === 'factions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-warm-500">Organizations, groups, governments, and powers.</p>
              <button onClick={addFaction} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition">
                <Plus size={14} /> Add Faction
              </button>
            </div>
            {factions.length === 0 ? (
              <div className="text-center py-12 text-warm-400 text-sm">No factions yet. Create organizations and groups!</div>
            ) : (
              <div className="space-y-3">
                {factions.map(fac => (
                  <div key={fac.id} className="flex gap-3 p-4 rounded-xl bg-warm-50 dark:bg-warm-850 border border-warm-200 dark:border-warm-700">
                    <div className="flex-1 space-y-2">
                      <input
                        value={fac.name}
                        onChange={e => updateFaction(fac.id, { name: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-warm-800 border border-warm-200 dark:border-warm-700 text-sm font-medium text-warm-900 dark:text-warm-50 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
                        placeholder="Faction name..."
                      />
                      <div className="flex gap-2">
                        <select
                          value={fac.type}
                          onChange={e => updateFaction(fac.id, { type: e.target.value })}
                          className="px-3 py-2 rounded-lg bg-white dark:bg-warm-800 border border-warm-200 dark:border-warm-700 text-xs text-warm-600 dark:text-warm-400 focus:outline-none"
                        >
                          {['organization', 'government', 'guild', 'clan', 'military', 'religious', 'criminal', 'other'].map(t => (
                            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                          ))}
                        </select>
                      </div>
                      <textarea
                        value={fac.description}
                        onChange={e => updateFaction(fac.id, { description: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-warm-800 border border-warm-200 dark:border-warm-700 text-xs text-warm-600 dark:text-warm-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 resize-none"
                        placeholder="Describe this faction..."
                      />
                    </div>
                    <button onClick={() => deleteFaction(fac.id)} className="p-2 rounded-lg text-warm-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 self-start transition">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TIMELINE */}
        {activeTab === 'timeline' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-warm-500">Chronological events that shaped your world.</p>
              <button onClick={addTimelineEvent} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition">
                <Plus size={14} /> Add Event
              </button>
            </div>
            {timeline.length === 0 ? (
              <div className="text-center py-12 text-warm-400 text-sm">No events yet. Build your world's history!</div>
            ) : (
              <div className="relative pl-6 space-y-4">
                <div className="absolute left-[11px] top-2 bottom-2 w-px bg-warm-200 dark:bg-warm-700" />
                {timeline.map(ev => (
                  <div key={ev.id} className="relative flex gap-3">
                    <div className="absolute left-[-17px] top-4 w-3 h-3 rounded-full bg-purple-500 border-2 border-white dark:border-warm-800" />
                    <div className="flex-1 p-4 rounded-xl bg-warm-50 dark:bg-warm-850 border border-warm-200 dark:border-warm-700 space-y-2">
                      <div className="flex gap-2">
                        <input
                          value={ev.date_label || ''}
                          onChange={e => updateTimelineEvent(ev.id, { date_label: e.target.value })}
                          className="w-32 px-3 py-2 rounded-lg bg-white dark:bg-warm-800 border border-warm-200 dark:border-warm-700 text-xs font-mono text-warm-600 dark:text-warm-400 focus:outline-none"
                          placeholder="Year/Date..."
                        />
                        <input
                          value={ev.title}
                          onChange={e => updateTimelineEvent(ev.id, { title: e.target.value })}
                          className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-warm-800 border border-warm-200 dark:border-warm-700 text-sm font-medium text-warm-900 dark:text-warm-50 focus:outline-none"
                          placeholder="Event title..."
                        />
                      </div>
                      <textarea
                        value={ev.description}
                        onChange={e => updateTimelineEvent(ev.id, { description: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-warm-800 border border-warm-200 dark:border-warm-700 text-xs text-warm-600 dark:text-warm-400 focus:outline-none resize-none"
                        placeholder="What happened?"
                      />
                    </div>
                    <button onClick={() => deleteTimelineEvent(ev.id)} className="p-2 rounded-lg text-warm-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 self-start transition">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CHARACTERS */}
        {activeTab === 'characters' && (
          <div className="space-y-4">
            <p className="text-sm text-warm-500">Characters inhabiting this world. Link existing characters from your library.</p>
            {linkedCharacters.length === 0 ? (
              <div className="text-center py-12 text-warm-400 text-sm">No characters linked to this world yet.</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {linkedCharacters.map((wc: any) => (
                  <div key={wc.id} className="flex items-center gap-3 p-3 rounded-xl bg-warm-50 dark:bg-warm-850 border border-warm-200 dark:border-warm-700">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-lg flex-shrink-0">
                      {wc.character?.bot_profile?.photo_url ? (
                        <img src={wc.character.bot_profile.photo_url} alt="" className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        wc.character?.bot_profile?.avatar_emoji || '🎭'
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-warm-900 dark:text-warm-50 truncate">{wc.character?.bot_profile?.display_name || 'Unknown'}</p>
                      <p className="text-[10px] text-warm-400">{wc.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* LOREBOOKS */}
        {activeTab === 'lorebooks' && (
          <div className="space-y-4">
            <p className="text-sm text-warm-500">Knowledge books linked to this world for AI context injection.</p>
            {linkedLorebooks.length === 0 ? (
              <div className="text-center py-12 text-warm-400 text-sm">No lorebooks linked. Create one from the Lorebooks page.</div>
            ) : (
              <div className="space-y-2">
                {linkedLorebooks.map((ll: any) => (
                  <div key={ll.id} className="flex items-center gap-3 p-4 rounded-xl bg-warm-50 dark:bg-warm-850 border border-warm-200 dark:border-warm-700 cursor-pointer hover:border-purple-400 transition" onClick={() => navigate(`/lorebooks/${ll.lorebook?.id}`)}>
                    <BookOpen size={16} className="text-purple-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-warm-900 dark:text-warm-50 truncate">{ll.lorebook?.title || 'Untitled'}</p>
                      <p className="text-[10px] text-warm-400">{ll.lorebook?.entry_count || 0} entries</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SETTINGS */}
        {activeTab === 'settings' && (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-warm-600 dark:text-warm-400 mb-1.5 uppercase tracking-wider">Visibility</label>
              <div className="flex gap-2">
                {(['private', 'unlisted', 'public'] as const).map(v => (
                  <button
                    key={v}
                    onClick={() => setVisibility(v)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      visibility === v
                        ? 'bg-purple-600 text-white shadow-sm font-bold'
                        : 'bg-warm-100 dark:bg-warm-750 text-warm-600 dark:text-warm-400 hover:bg-warm-200'
                    }`}
                  >
                    {v === 'public' && <Globe size={12} />}
                    {v === 'unlisted' && <Eye size={12} />}
                    {v === 'private' && <Lock size={12} />}
                    {v.charAt(0).toUpperCase() + v.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
