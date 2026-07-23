import React, { useState } from 'react';
import { X, Brain, Plus, Trash2, Edit3, Link2, Sparkles, Sliders, ShieldCheck } from 'lucide-react';
import { MemoryNode, MemoryEdge, MemoryNexusState } from '../../types';

interface MemoryVisualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  memoryNexusState: MemoryNexusState;
  onUpdateState: (newState: MemoryNexusState) => void;
}

const CATEGORY_COLORS: Record<MemoryNode['category'], { bg: string; border: string; text: string; glow: string }> = {
  event: { bg: 'bg-purple-500/20', border: 'border-purple-500', text: 'text-purple-300', glow: 'rgba(168, 85, 247, 0.4)' },
  fact: { bg: 'bg-blue-500/20', border: 'border-blue-500', text: 'text-blue-300', glow: 'rgba(59, 130, 246, 0.4)' },
  relationship: { bg: 'bg-emerald-500/20', border: 'border-emerald-500', text: 'text-emerald-300', glow: 'rgba(16, 185, 129, 0.4)' },
  secret: { bg: 'bg-rose-500/20', border: 'border-rose-500', text: 'text-rose-300', glow: 'rgba(244, 63, 94, 0.4)' },
  preference: { bg: 'bg-amber-500/20', border: 'border-amber-500', text: 'text-amber-300', glow: 'rgba(245, 158, 11, 0.4)' },
};

export const MemoryVisualizerModal: React.FC<MemoryVisualizerModalProps> = ({
  isOpen,
  onClose,
  memoryNexusState,
  onUpdateState,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editingNode, setEditingNode] = useState<MemoryNode | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // New Node Form State
  const [newTopic, setNewTopic] = useState('');
  const [newFact, setNewFact] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryNode['category']>('fact');
  const [newWeight, setNewWeight] = useState(8);

  if (!isOpen) return null;

  const selectedNode = memoryNexusState.nodes.find((n) => n.id === selectedNodeId);

  // Calculate 2D position for each node in a circular/radial layout for clean visual presentation
  const getNodePosition = (index: number, total: number) => {
    if (total === 1) return { x: 300, y: 200 };
    const radius = Math.min(180, 70 + total * 10);
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
    return {
      x: 300 + radius * Math.cos(angle),
      y: 200 + radius * Math.sin(angle),
    };
  };

  const handleCreateNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopic.trim() || !newFact.trim()) return;

    const newNode: MemoryNode = {
      id: `mem-${Date.now()}`,
      conversation_id: 'current',
      topic: newTopic.trim(),
      fact: newFact.trim(),
      category: newCategory,
      recall_weight: newWeight,
      created_at: new Date().toISOString(),
    };

    // Automatically create a link to selected node if any
    const newEdges = [...memoryNexusState.edges];
    if (selectedNodeId) {
      newEdges.push({
        id: `edge-${Date.now()}`,
        source_id: selectedNodeId,
        target_id: newNode.id,
        label: 'Connected',
        strength: 3,
      });
    }

    onUpdateState({
      ...memoryNexusState,
      nodes: [...memoryNexusState.nodes, newNode],
      edges: newEdges,
    });

    setNewTopic('');
    setNewFact('');
    setIsAddingNew(false);
    setSelectedNodeId(newNode.id);
  };

  const handleDeleteNode = (id: string) => {
    onUpdateState({
      ...memoryNexusState,
      nodes: memoryNexusState.nodes.filter((n) => n.id !== id),
      edges: memoryNexusState.edges.filter((e) => e.source_id !== id && e.target_id !== id),
    });
    if (selectedNodeId === id) setSelectedNodeId(null);
    if (editingNode?.id === id) setEditingNode(null);
  };

  const handleSaveEdit = () => {
    if (!editingNode) return;
    onUpdateState({
      ...memoryNexusState,
      nodes: memoryNexusState.nodes.map((n) => (n.id === editingNode.id ? editingNode : n)),
    });
    setEditingNode(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-warm-900 border border-warm-800 rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden shadow-2xl relative text-white">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-warm-800 flex items-center justify-between bg-warm-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Brain size={22} />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                <span>Memory Visualizer Graph</span>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  2D Nexus
                </span>
              </h2>
              <p className="text-xs text-warm-400">
                Inspect every active memory node and visualize neural relationships in real-time.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddingNew(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-sm"
            >
              <Plus size={14} />
              <span>Add Memory Node</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-warm-400 hover:text-white hover:bg-warm-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Main Body (Graph + Inspector Side Panel) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          
          {/* 2D Interactive SVG Graph Canvas */}
          <div className="flex-1 relative bg-warm-950/80 overflow-hidden flex items-center justify-center p-4">
            {memoryNexusState.nodes.length === 0 ? (
              <div className="text-center p-8 max-w-sm space-y-3">
                <Brain size={48} className="mx-auto text-purple-400/40 animate-pulse" />
                <h4 className="font-serif font-bold text-lg text-white">No Memory Nodes Generated Yet</h4>
                <p className="text-xs text-warm-400">
                  Memory Nexus automatically extracts memories every 10 messages as you chat, or you can add custom nodes manually.
                </p>
                <button
                  onClick={() => setIsAddingNew(true)}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all inline-flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>Create First Memory</span>
                </button>
              </div>
            ) : (
              <svg className="w-full h-full min-h-[350px]" viewBox="0 0 600 400">
                {/* Render Edges (Connecting Lines) */}
                {memoryNexusState.edges.map((edge) => {
                  const sourceIdx = memoryNexusState.nodes.findIndex((n) => n.id === edge.source_id);
                  const targetIdx = memoryNexusState.nodes.findIndex((n) => n.id === edge.target_id);
                  if (sourceIdx === -1 || targetIdx === -1) return null;

                  const sPos = getNodePosition(sourceIdx, memoryNexusState.nodes.length);
                  const tPos = getNodePosition(targetIdx, memoryNexusState.nodes.length);

                  return (
                    <g key={edge.id}>
                      <line
                        x1={sPos.x}
                        y1={sPos.y}
                        x2={tPos.x}
                        y2={tPos.y}
                        stroke="rgba(168, 85, 247, 0.3)"
                        strokeWidth={edge.strength}
                        strokeDasharray="4 2"
                      />
                    </g>
                  );
                })}

                {/* Render Nodes */}
                {memoryNexusState.nodes.map((node, index) => {
                  const pos = getNodePosition(index, memoryNexusState.nodes.length);
                  const isSelected = node.id === selectedNodeId;
                  const colorConfig = CATEGORY_COLORS[node.category] || CATEGORY_COLORS.fact;

                  return (
                    <g
                      key={node.id}
                      onClick={() => setSelectedNodeId(node.id)}
                      className="cursor-pointer transition-transform duration-200 hover:scale-110"
                    >
                      {/* Glow effect */}
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={isSelected ? 26 : 20}
                        fill={colorConfig.glow}
                        className="animate-pulse"
                      />
                      {/* Inner Circle */}
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={isSelected ? 18 : 14}
                        fill="#181615"
                        stroke={isSelected ? '#c084fc' : colorConfig.glow}
                        strokeWidth={isSelected ? 3 : 2}
                      />
                      {/* Category icon indicator */}
                      <text
                        x={pos.x}
                        y={pos.y + 4}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize={isSelected ? '12' : '10'}
                        fontWeight="bold"
                      >
                        {node.category[0].toUpperCase()}
                      </text>
                      {/* Node Topic Label */}
                      <text
                        x={pos.x}
                        y={pos.y + 32}
                        textAnchor="middle"
                        fill="#d4d4d8"
                        fontSize="10"
                        fontWeight="500"
                        className="pointer-events-none drop-shadow"
                      >
                        {node.topic.length > 18 ? node.topic.substring(0, 16) + '...' : node.topic}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}

            {/* Category Legend Bar */}
            <div className="absolute bottom-4 left-4 flex flex-wrap gap-2 bg-warm-900/90 backdrop-blur-md px-3 py-2 rounded-2xl border border-warm-800 text-[10px]">
              {Object.entries(CATEGORY_COLORS).map(([cat, colors]) => (
                <div key={cat} className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full border ${colors.border} ${colors.bg}`} />
                  <span className="capitalize text-warm-300">{cat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Node Inspector Side Panel */}
          <div className="w-full md:w-80 bg-warm-900/95 border-t md:border-t-0 md:border-l border-warm-800 p-5 flex flex-col justify-between space-y-4 overflow-y-auto">
            {isAddingNew ? (
              <form onSubmit={handleCreateNode} className="space-y-4">
                <h3 className="font-serif font-bold text-base text-white flex items-center gap-2">
                  <Plus size={16} className="text-purple-400" />
                  <span>Create Custom Memory</span>
                </h3>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-warm-300">Topic / Key</label>
                  <input
                    type="text"
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    placeholder="e.g. Secret Artifact"
                    className="w-full px-3 py-2 bg-warm-950 border border-warm-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-warm-300">Memory Fact</label>
                  <textarea
                    value={newFact}
                    onChange={(e) => setNewFact(e.target.value)}
                    rows={3}
                    placeholder="Detail the memory or event facts..."
                    className="w-full px-3 py-2 bg-warm-950 border border-warm-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-warm-300">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-warm-950 border border-warm-800 rounded-xl text-xs text-white focus:outline-none"
                  >
                    <option value="fact">Fact</option>
                    <option value="event">Event</option>
                    <option value="relationship">Relationship</option>
                    <option value="secret">Secret</option>
                    <option value="preference">Preference</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-warm-300 flex justify-between">
                    <span>Recall Weight</span>
                    <span className="text-purple-400 font-bold">{newWeight}/10</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={newWeight}
                    onChange={(e) => setNewWeight(Number(e.target.value))}
                    className="w-full accent-purple-500"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(false)}
                    className="flex-1 py-2 bg-warm-800 hover:bg-warm-700 text-warm-300 text-xs font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-sm"
                  >
                    Save Node
                  </button>
                </div>
              </form>
            ) : selectedNode ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-warm-800 pb-3">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${CATEGORY_COLORS[selectedNode.category].bg} ${CATEGORY_COLORS[selectedNode.category].border} ${CATEGORY_COLORS[selectedNode.category].text}`}>
                    {selectedNode.category}
                  </span>
                  <button
                    onClick={() => handleDeleteNode(selectedNode.id)}
                    className="p-1.5 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors"
                    title="Delete Memory Node"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {editingNode?.id === selectedNode.id ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editingNode.topic}
                      onChange={(e) => setEditingNode({ ...editingNode, topic: e.target.value })}
                      className="w-full px-3 py-1.5 bg-warm-950 border border-warm-800 rounded-xl text-xs text-white"
                    />
                    <textarea
                      value={editingNode.fact}
                      onChange={(e) => setEditingNode({ ...editingNode, fact: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 bg-warm-950 border border-warm-800 rounded-xl text-xs text-white resize-none"
                    />
                    <button
                      onClick={handleSaveEdit}
                      className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl"
                    >
                      Save Changes
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <h3 className="font-serif font-bold text-lg text-white">{selectedNode.topic}</h3>
                    <p className="text-xs text-warm-300 leading-relaxed bg-warm-950 p-3 rounded-2xl border border-warm-850">
                      "{selectedNode.fact}"
                    </p>

                    <div className="pt-2 flex items-center justify-between text-xs text-warm-400">
                      <span>Recall Weight:</span>
                      <span className="font-bold text-purple-300">{selectedNode.recall_weight} / 10</span>
                    </div>

                    <button
                      onClick={() => setEditingNode(selectedNode)}
                      className="w-full py-2 bg-warm-800 hover:bg-warm-700 text-warm-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
                    >
                      <Edit3 size={14} />
                      <span>Edit Memory</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center p-6 space-y-2 my-auto">
                <Sparkles size={32} className="mx-auto text-warm-600" />
                <h4 className="font-bold text-sm text-warm-300">Select a Node</h4>
                <p className="text-xs text-warm-500">
                  Click any glowing memory node on the graph to inspect, edit, or manage its facts.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
