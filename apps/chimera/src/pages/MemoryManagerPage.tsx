import { useState, useEffect } from 'react';
import { Brain, Plus, Search, Filter, Trash2, Edit2, Loader2, Sparkles, BookOpen, Heart, Clock, FileText, Settings, X, Save } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import type { CharacterMemory, MemoryType } from '../types';

interface AiCharacter {
  id: string;
  creator_id: string;
  name: string;
  avatar_url: string | null;
  tagline: string;
}

export default function MemoryManagerPage() {
  const { user } = useAuth();
  const [characters, setCharacters] = useState<AiCharacter[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<AiCharacter | null>(null);
  
  const [memories, setMemories] = useState<CharacterMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMemories, setLoadingMemories] = useState(false);
  
  const [activeTab, setActiveTab] = useState<MemoryType>('long_term');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState<CharacterMemory | null>(null);
  const [newMemoryForm, setNewMemoryForm] = useState({
    content: '',
    memory_type: 'long_term' as MemoryType,
    importance: 5,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCharacters();
    }
  }, [user]);

  useEffect(() => {
    if (selectedCharacter) {
      fetchMemories(selectedCharacter.id);
    }
  }, [selectedCharacter]);

  const fetchCharacters = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_characters')
        .select('id, creator_id, name, avatar_url, tagline')
        .eq('creator_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCharacters(data || []);
      if (data && data.length > 0) {
        setSelectedCharacter(data[0]);
      }
    } catch (err) {
      console.error('Error fetching characters:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMemories = async (characterId: string) => {
    setLoadingMemories(true);
    try {
      const { data, error } = await supabase
        .from('character_memories')
        .select('*')
        .eq('character_id', characterId)
        .eq('user_id', user!.id)
        .order('importance', { ascending: false });

      if (error) throw error;
      setMemories(data || []);
    } catch (err) {
      console.error('Error fetching memories:', err);
    } finally {
      setLoadingMemories(false);
    }
  };

  const filteredMemories = memories.filter(
    (m) => m.memory_type === activeTab && m.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSaveMemory = async () => {
    if (!selectedCharacter || !newMemoryForm.content.trim()) return;
    setIsSaving(true);
    try {
      if (editingMemory) {
        const { error } = await supabase
          .from('character_memories')
          .update({
            content: newMemoryForm.content,
            memory_type: newMemoryForm.memory_type,
            importance: newMemoryForm.importance,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingMemory.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('character_memories')
          .insert({
            character_id: selectedCharacter.id,
            user_id: user!.id,
            content: newMemoryForm.content,
            memory_type: newMemoryForm.memory_type,
            importance: newMemoryForm.importance
          });
        if (error) throw error;
      }
      
      await fetchMemories(selectedCharacter.id);
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving memory:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this memory?')) return;
    try {
      const { error } = await supabase
        .from('character_memories')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setMemories(memories.filter((m) => m.id !== id));
    } catch (err) {
      console.error('Error deleting memory:', err);
    }
  };

  const openModal = (memory?: CharacterMemory) => {
    if (memory) {
      setEditingMemory(memory);
      setNewMemoryForm({
        content: memory.content,
        memory_type: memory.memory_type,
        importance: memory.importance,
      });
    } else {
      setEditingMemory(null);
      setNewMemoryForm({
        content: '',
        memory_type: activeTab,
        importance: 5,
      });
    }
    setIsModalOpen(true);
  };

  const tabs = [
    { id: 'long_term', label: 'Long Term', icon: BookOpen },
    { id: 'short_term', label: 'Short Term', icon: Clock },
    { id: 'personality', label: 'Personality', icon: Sparkles },
    { id: 'relationship', label: 'Relationships', icon: Heart },
    { id: 'lore', label: 'Lore', icon: FileText },
  ] as const;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090B] flex flex-col pt-16">
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#E84C3D]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090B] flex flex-col pt-16">
      
      {/* Header */}
      <div className="bg-[#121214] border-b border-white/5 sticky top-16 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E84C3D]/10 flex items-center justify-center">
                <Brain className="w-5 h-5 text-[#E84C3D]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Memory Manager</h1>
                <p className="text-sm text-white/50">Configure persistent context for your AI characters</p>
              </div>
            </div>
            {selectedCharacter && (
              <button 
                onClick={() => openModal()}
                className="bg-[#E84C3D] hover:bg-[#D64536] text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 w-full sm:w-auto justify-center"
              >
                <Plus size={16} />
                Inject Memory
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar - Character List */}
        <div className="w-full lg:w-72 shrink-0 flex flex-col gap-4">
          <div className="bg-[#121214] rounded-2xl border border-white/5 overflow-hidden">
            <div className="p-4 border-b border-white/5">
              <h2 className="font-semibold text-white">Your Characters</h2>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              {characters.length === 0 ? (
                <div className="p-8 text-center text-white/50">
                  <p className="text-sm">No characters found.</p>
                  <Link to="/characters/new" className="text-[#E84C3D] text-sm hover:underline mt-2 block">
                    Create your first character
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {characters.map(char => (
                    <button
                      key={char.id}
                      onClick={() => setSelectedCharacter(char)}
                      className={`w-full text-left p-4 flex items-center gap-3 transition-colors ${
                        selectedCharacter?.id === char.id ? 'bg-[#E84C3D]/10' : 'hover:bg-white/5'
                      }`}
                    >
                      {char.avatar_url ? (
                        <img src={char.avatar_url} alt={char.name} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/50">
                          {char.name[0]}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-medium truncate ${selectedCharacter?.id === char.id ? 'text-[#E84C3D]' : 'text-white'}`}>
                          {char.name}
                        </h3>
                        <p className="text-xs text-white/40 truncate">{char.tagline}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {!selectedCharacter ? (
            <div className="flex-1 flex flex-col items-center justify-center bg-[#121214] rounded-2xl border border-white/5 p-8 text-center">
              <Brain className="w-12 h-12 text-white/20 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Select a Character</h3>
              <p className="text-white/50 max-w-sm">
                Choose an AI character from the sidebar to view and manage their persistent memories.
              </p>
            </div>
          ) : (
            <div className="bg-[#121214] rounded-2xl border border-white/5 flex flex-col h-full overflow-hidden">
              {/* Tabs */}
              <div className="flex overflow-x-auto hide-scrollbar border-b border-white/5">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${
                      activeTab === tab.id 
                        ? 'border-[#E84C3D] text-[#E84C3D]' 
                        : 'border-transparent text-white/50 hover:text-white/80'
                    }`}
                  >
                    <tab.icon size={16} />
                    {tab.label}
                    <span className="bg-white/5 text-white/50 px-2 py-0.5 rounded-full text-xs ml-2">
                      {memories.filter(m => m.memory_type === tab.id).length}
                    </span>
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="p-4 border-b border-white/5">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    placeholder="Search memories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#E84C3D] transition-colors"
                  />
                </div>
              </div>

              {/* Memory List */}
              <div className="flex-1 overflow-y-auto p-4 bg-[#09090B]/50">
                {loadingMemories ? (
                  <div className="flex items-center justify-center h-40">
                    <Loader2 className="w-6 h-6 animate-spin text-[#E84C3D]" />
                  </div>
                ) : filteredMemories.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-white/50 mb-4">No {tabs.find(t => t.id === activeTab)?.label.toLowerCase()} memories found.</p>
                    <button onClick={() => openModal()} className="text-[#E84C3D] text-sm font-medium hover:underline">
                      Inject a new memory
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {filteredMemories.map(memory => (
                      <div key={memory.id} className="bg-[#121214] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors group">
                        <div className="flex justify-between items-start mb-3">
                          <span className={`text-xs px-2 py-1 rounded-md font-medium ${
                            memory.importance >= 8 ? 'bg-red-500/10 text-red-400' :
                            memory.importance >= 5 ? 'bg-yellow-500/10 text-yellow-400' :
                            'bg-blue-500/10 text-blue-400'
                          }`}>
                            Importance: {memory.importance}/10
                          </span>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openModal(memory)} className="p-1.5 text-white/40 hover:text-white rounded-lg hover:bg-white/10">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => handleDeleteMemory(memory.id)} className="p-1.5 text-white/40 hover:text-red-400 rounded-lg hover:bg-red-500/10">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap">
                          {memory.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Memory Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#121214] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-lg font-bold text-white">
                {editingMemory ? 'Edit Memory' : 'Inject New Memory'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white/50 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4 flex-1 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Memory Type</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setNewMemoryForm({ ...newMemoryForm, memory_type: tab.id })}
                      className={`text-xs py-2 px-3 rounded-lg border flex items-center justify-center gap-1.5 transition-colors ${
                        newMemoryForm.memory_type === tab.id 
                        ? 'border-[#E84C3D] bg-[#E84C3D]/10 text-[#E84C3D]' 
                        : 'border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <tab.icon size={12} />
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">
                  Importance Level ({newMemoryForm.importance}/10)
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={newMemoryForm.importance}
                  onChange={(e) => setNewMemoryForm({ ...newMemoryForm, importance: parseInt(e.target.value) })}
                  className="w-full accent-[#E84C3D]"
                />
                <div className="flex justify-between text-xs text-white/40 mt-1">
                  <span>Trivial (1)</span>
                  <span>Core (10)</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Memory Content</label>
                <textarea
                  value={newMemoryForm.content}
                  onChange={(e) => setNewMemoryForm({ ...newMemoryForm, content: e.target.value })}
                  placeholder="E.g., Remembers that the user's favorite color is blue."
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#E84C3D] min-h-[120px] resize-y transition-colors"
                />
              </div>
            </div>
            
            <div className="p-4 border-t border-white/10 flex justify-end gap-3 bg-black/20">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white/70 hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveMemory}
                disabled={isSaving || !newMemoryForm.content.trim()}
                className="bg-[#E84C3D] hover:bg-[#D64536] disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {editingMemory ? 'Save Changes' : 'Inject Memory'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
