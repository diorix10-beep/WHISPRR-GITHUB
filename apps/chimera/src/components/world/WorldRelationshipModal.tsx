import { useState, useEffect } from 'react';
import { X, Globe, Users, BookOpen, Sparkles, Shield, Sword, MapPin, Feather, ChevronRight, Filter } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Avatar } from '../common/Avatar';

interface RelationshipNode {
  id: string;
  type: 'character' | 'world' | 'lore' | 'faction';
  title: string;
  subtitle?: string;
  avatar_emoji?: string;
  photo_url?: string;
  relationship?: 'Ally' | 'Rival' | 'Mentor' | 'Guild' | 'Core Lore';
  description?: string;
}

interface WorldRelationshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  worldId?: string;
  worldName?: string;
}

export function WorldRelationshipModal({ isOpen, onClose, worldId, worldName = 'Eldoria Nexus' }: WorldRelationshipModalProps) {
  const [nodes, setNodes] = useState<RelationshipNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<RelationshipNode | null>(null);
  const [filter, setFilter] = useState<'all' | 'allies' | 'rivals' | 'lore'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchWorldNetwork();
    }
  }, [isOpen, worldId]);

  const fetchWorldNetwork = async () => {
    setLoading(true);
    try {
      // 1. Fetch AI Characters linked to world or general public
      const { data: chars } = await supabase
        .from('ai_characters')
        .select('id, name, short_description, profiles:profiles!ai_characters_user_id_fkey(avatar_emoji, photo_url)')
        .limit(8);

      const charNodes: RelationshipNode[] = (chars || []).map((c: any, index: number) => ({
        id: `char-${c.id}`,
        type: 'character',
        title: c.name || 'AI Character',
        subtitle: c.short_description || 'Roleplay Identity',
        avatar_emoji: c.profiles?.avatar_emoji || (index % 2 === 0 ? '🧝‍♀️' : '⚔️'),
        photo_url: c.profiles?.photo_url,
        relationship: index % 3 === 0 ? 'Ally' : index % 3 === 1 ? 'Rival' : 'Guild',
        description: c.short_description || 'Bound to the secrets and conflicts of this realm.',
      }));

      // 2. Fetch Lorebook entries
      const { data: lores } = await supabase
        .from('lorebook_entries')
        .select('id, title, content, entry_type')
        .limit(4);

      const loreNodes: RelationshipNode[] = (lores || []).map((l: any) => ({
        id: `lore-${l.id}`,
        type: 'lore',
        title: l.title,
        subtitle: l.entry_type || 'Ancient Artifact / Location',
        avatar_emoji: '📜',
        relationship: 'Core Lore',
        description: l.content?.substring(0, 150) || 'Lore entry triggering context in roleplay.',
      }));

      // Core World Node
      const coreWorldNode: RelationshipNode = {
        id: 'core-world',
        type: 'world',
        title: worldName,
        subtitle: 'Realm Capital & Core World Hub',
        avatar_emoji: '🏰',
        relationship: 'Core Lore',
        description: 'The foundation of all roleplay storylines, character factions, and lorebooks in this setting.',
      };

      const allNodes = [coreWorldNode, ...charNodes, ...loreNodes];
      setNodes(allNodes);
      setSelectedNode(coreWorldNode);
    } catch (err) {
      console.error('Error fetching world relationship network:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredNodes = nodes.filter(n => {
    if (filter === 'allies') return n.relationship === 'Ally' || n.relationship === 'Guild';
    if (filter === 'rivals') return n.relationship === 'Rival';
    if (filter === 'lore') return n.type === 'lore' || n.type === 'world';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-warm-950/70 backdrop-blur-md p-3 sm:p-6 font-sans">
      <div className="w-full max-w-5xl bg-white dark:bg-warm-900 rounded-3xl border border-warm-200 dark:border-warm-800 shadow-2xl overflow-hidden flex flex-col h-[90vh] max-h-[850px] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-warm-200 dark:border-warm-800 bg-warm-50 dark:bg-warm-950/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              <Globe size={22} />
            </div>
            <div>
              <h2 className="font-serif text-lg sm:text-2xl font-bold text-warm-900 dark:text-white flex items-center gap-2">
                <span>{worldName}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-500 font-sans uppercase tracking-wider font-extrabold">
                  World Network 🕸️
                </span>
              </h2>
              <p className="text-xs text-warm-500">
                Interactive relationship map linking Characters, Lorebooks, Guilds, and Story Factions.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-warm-400 hover:text-warm-700 dark:hover:text-white rounded-full hover:bg-warm-100 dark:hover:bg-warm-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="px-4 py-2.5 border-b border-warm-200 dark:border-warm-800 bg-warm-100/50 dark:bg-warm-900/50 flex items-center gap-2 overflow-x-auto scrollbar-hide shrink-0">
          <span className="text-xs font-bold text-warm-400 uppercase tracking-wider flex items-center gap-1 shrink-0 mr-1">
            <Filter size={13} /> Filter:
          </span>
          {[
            { id: 'all', label: 'All Connections', icon: Globe },
            { id: 'allies', label: 'Allies & Guilds 🛡️', icon: Shield },
            { id: 'rivals', label: 'Rivals & Enemies ⚔️', icon: Sword },
            { id: 'lore', label: 'Lore & Artifacts 🔮', icon: BookOpen },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = filter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                    : 'bg-warm-200/60 dark:bg-warm-800/60 text-warm-600 dark:text-warm-300 hover:text-warm-900 dark:hover:text-white'
                }`}
              >
                <Icon size={13} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body: Split View (Interactive Map + Inspector Side Panel) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
          
          {/* Left: Interactive Node Map Canvas */}
          <div className="flex-1 p-6 overflow-y-auto bg-warm-50/50 dark:bg-warm-950/30 flex flex-wrap content-start gap-4">
            {loading ? (
              <div className="w-full py-20 text-center text-xs text-warm-400 flex items-center justify-center gap-2">
                <Sparkles size={18} className="animate-spin text-purple-500" />
                <span>Mapping world connections...</span>
              </div>
            ) : (
              filteredNodes.map(node => {
                const isSelected = selectedNode?.id === node.id;
                const isCore = node.type === 'world';

                return (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3 shadow-sm hover:scale-[1.02] ${
                      isCore
                        ? 'w-full bg-gradient-to-r from-purple-900/40 via-purple-800/20 to-warm-900 border-purple-500 text-white shadow-purple-500/10'
                        : isSelected
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/40 text-warm-900 dark:text-white shadow-md'
                        : 'border-warm-200 dark:border-warm-800 bg-white dark:bg-warm-900 hover:border-purple-400 dark:hover:border-purple-700 text-warm-900 dark:text-warm-100'
                    }`}
                  >
                    <Avatar
                      emoji={node.avatar_emoji}
                      photoUrl={node.photo_url}
                      size={isCore ? 'lg' : 'md'}
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-serif font-bold text-sm truncate">{node.title}</h4>
                        {node.relationship && !isCore && (
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            node.relationship === 'Ally' || node.relationship === 'Guild'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : node.relationship === 'Rival'
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                              : 'bg-purple-500/10 text-purple-500'
                          }`}>
                            {node.relationship}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-warm-500 dark:text-warm-400 truncate">{node.subtitle}</p>
                    </div>

                    <ChevronRight size={16} className={`transition-transform ${isSelected ? 'text-purple-500 translate-x-1' : 'text-warm-400'}`} />
                  </div>
                );
              })
            )}
          </div>

          {/* Right: Detailed Inspector Panel */}
          {selectedNode && (
            <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-warm-200 dark:border-warm-800 bg-white dark:bg-warm-900 p-6 overflow-y-auto shrink-0 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-warm-200 dark:border-warm-800">
                  <Avatar emoji={selectedNode.avatar_emoji} photoUrl={selectedNode.photo_url} size="lg" />
                  <div>
                    <h3 className="font-serif font-bold text-base text-warm-900 dark:text-white">{selectedNode.title}</h3>
                    <p className="text-xs text-purple-500 font-medium">{selectedNode.subtitle}</p>
                  </div>
                </div>

                <div>
                  <h5 className="text-[10px] uppercase font-bold text-warm-400 tracking-wider mb-1">Connection Details</h5>
                  <p className="text-xs text-warm-600 dark:text-warm-300 leading-relaxed">
                    {selectedNode.description}
                  </p>
                </div>

                {selectedNode.relationship && (
                  <div className="p-3 rounded-xl bg-warm-50 dark:bg-warm-950 border border-warm-200 dark:border-warm-800">
                    <span className="text-[10px] uppercase font-bold text-warm-400 block mb-1">Relationship Status</span>
                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                      {selectedNode.relationship} Connection
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-warm-200 dark:border-warm-800">
                <button
                  onClick={onClose}
                  className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all"
                >
                  Close Network Inspector
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
