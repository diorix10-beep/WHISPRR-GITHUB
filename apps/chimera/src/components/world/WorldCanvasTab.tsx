import { useState } from 'react';
import { MapPin, Shield, Plus, Move, Link as LinkIcon, Trash2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

interface CanvasNode {
  id: string;
  title: string;
  type: 'location' | 'faction' | 'lore';
  x: number;
  y: number;
  description?: string;
}

interface CanvasConnection {
  id: string;
  fromId: string;
  toId: string;
  label?: string;
}

interface WorldCanvasTabProps {
  worldId: string;
  locations?: any[];
  factions?: any[];
}

export function WorldCanvasTab({ worldId, locations = [], factions = [] }: WorldCanvasTabProps) {
  const { showToast } = useToast();
  const [nodes, setNodes] = useState<CanvasNode[]>([
    { id: 'node-1', title: 'The Great Citadel', type: 'location', x: 220, y: 150, description: 'Capital city of the realm' },
    { id: 'node-2', title: 'Maison Verity', type: 'location', x: 500, y: 220, description: 'Sanctuary of knowledge' },
    { id: 'node-3', title: 'Order of Solon', type: 'faction', x: 360, y: 380, description: 'Guardians of ancient archives' },
  ]);

  const [connections, setConnections] = useState<CanvasConnection[]>([
    { id: 'conn-1', fromId: 'node-1', toId: 'node-2', label: 'Trade Route' },
    { id: 'conn-2', fromId: 'node-2', toId: 'node-3', label: 'Allied Faction' },
  ]);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [connectingFromId, setConnectingFromId] = useState<string | null>(null);

  // New node form state
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'location' | 'faction' | 'lore'>('location');
  const [isAdding, setIsAdding] = useState(false);

  const handleMouseDownNode = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (connectingFromId) {
      if (connectingFromId !== id) {
        // Create connection
        const newConn: CanvasConnection = {
          id: `conn-${Date.now()}`,
          fromId: connectingFromId,
          toId: id,
          label: 'Connected'
        };
        setConnections([...connections, newConn]);
        showToast('Nodes connected!', 'success');
      }
      setConnectingFromId(null);
      return;
    }
    setSelectedNodeId(id);
    setDraggingNodeId(id);
  };

  const handleMouseMoveCanvas = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!draggingNodeId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) / zoom);
    const y = Math.round((e.clientY - rect.top) / zoom);

    setNodes(nodes.map(n => n.id === draggingNodeId ? { ...n, x: Math.max(20, Math.min(800, x)), y: Math.max(20, Math.min(500, y)) } : n));
  };

  const handleMouseUpCanvas = () => {
    setDraggingNodeId(null);
  };

  const handleAddNode = () => {
    if (!newTitle.trim()) return;
    const newNode: CanvasNode = {
      id: `node-${Date.now()}`,
      title: newTitle.trim(),
      type: newType,
      x: 300 + Math.random() * 100,
      y: 200 + Math.random() * 100,
    };
    setNodes([...nodes, newNode]);
    setNewTitle('');
    setIsAdding(false);
    showToast('New node placed on map canvas!', 'success');
  };

  const handleDeleteNode = (id: string) => {
    setNodes(nodes.filter(n => n.id !== id));
    setConnections(connections.filter(c => c.fromId !== id && c.toId !== id));
    setSelectedNodeId(null);
    showToast('Node removed from canvas', 'info');
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Canvas Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-warm-900 border border-warm-200 dark:border-warm-800 p-3.5 rounded-2xl">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-warm-700 dark:text-warm-300">Visual World Canvas</span>
          <span className="px-2 py-0.5 bg-red-500/10 text-red-500 rounded-md text-[10px] font-bold">100% Handcrafted</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center bg-warm-100 dark:bg-warm-800 rounded-xl p-1 gap-1">
            <button
              onClick={() => setZoom(Math.max(0.6, zoom - 0.1))}
              className="p-1 text-warm-600 dark:text-warm-300 hover:text-red-500 transition-colors"
            >
              <ZoomOut size={16} />
            </button>
            <span className="text-[10px] font-bold text-warm-600 dark:text-warm-300 px-1">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(Math.min(1.5, zoom + 0.1))}
              className="p-1 text-warm-600 dark:text-warm-300 hover:text-red-500 transition-colors"
            >
              <ZoomIn size={16} />
            </button>
          </div>

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus size={14} /> Place Node
          </button>
        </div>
      </div>

      {/* Add Node Form Drawer */}
      {isAdding && (
        <div className="bg-warm-50 dark:bg-warm-850 border border-warm-200 dark:border-warm-800 p-4 rounded-2xl flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[11px] font-bold text-warm-600 dark:text-warm-400 mb-1">Node Title</label>
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="e.g. Iron Fortress, Shadow Forest"
              className="w-full text-xs bg-white dark:bg-warm-900 border border-warm-200 dark:border-warm-800 rounded-xl px-3 py-2 text-warm-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-warm-600 dark:text-warm-400 mb-1">Node Type</label>
            <select
              value={newType}
              onChange={e => setNewType(e.target.value as any)}
              className="text-xs bg-white dark:bg-warm-900 border border-warm-200 dark:border-warm-800 rounded-xl px-3 py-2 text-warm-900 dark:text-white"
            >
              <option value="location">Location</option>
              <option value="faction">Faction</option>
              <option value="lore">Lore Point</option>
            </select>
          </div>
          <button
            onClick={handleAddNode}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs"
          >
            Add to Canvas
          </button>
        </div>
      )}

      {/* Canvas Area */}
      <div
        onMouseMove={handleMouseMoveCanvas}
        onMouseUp={handleMouseUpCanvas}
        className="relative w-full h-[520px] bg-warm-100/50 dark:bg-warm-950/80 border border-warm-200 dark:border-warm-800 rounded-3xl overflow-hidden cursor-crosshair select-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(120, 120, 120, 0.15) 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      >
        <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', width: '100%', height: '100%' }}>
          {/* SVG Connection Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            {connections.map(conn => {
              const fromNode = nodes.find(n => n.id === conn.fromId);
              const toNode = nodes.find(n => n.id === conn.toId);
              if (!fromNode || !toNode) return null;

              const midX = (fromNode.x + toNode.x) / 2;
              const midY = (fromNode.y + toNode.y) / 2;

              return (
                <g key={conn.id}>
                  <line
                    x1={fromNode.x + 60}
                    y1={fromNode.y + 24}
                    x2={toNode.x + 60}
                    y2={toNode.y + 24}
                    stroke="rgba(239, 68, 68, 0.4)"
                    strokeWidth="2"
                    strokeDasharray="4"
                  />
                  {conn.label && (
                    <text
                      x={midX + 60}
                      y={midY + 20}
                      fill="#9ca3af"
                      fontSize="10"
                      fontWeight="bold"
                      textAnchor="middle"
                      className="bg-warm-900 px-1"
                    >
                      {conn.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Render Nodes */}
          {nodes.map(node => {
            const isSelected = selectedNodeId === node.id;
            const isConnecting = connectingFromId === node.id;

            return (
              <div
                key={node.id}
                onMouseDown={e => handleMouseDownNode(node.id, e)}
                style={{ left: `${node.x}px`, top: `${node.y}px` }}
                className={`absolute z-10 p-3 rounded-2xl border-2 transition-shadow cursor-grab active:cursor-grabbing flex items-center gap-2.5 shadow-md ${
                  isSelected
                    ? 'border-red-600 bg-red-500/10 text-red-500 shadow-red-500/20'
                    : isConnecting
                    ? 'border-amber-500 bg-amber-500/10 text-amber-500 animate-pulse'
                    : 'border-warm-200 dark:border-warm-750 bg-white dark:bg-warm-850 text-warm-900 dark:text-white hover:border-warm-400'
                }`}
              >
                <div className={`p-2 rounded-xl ${node.type === 'location' ? 'bg-red-500/10 text-red-500' : 'bg-purple-500/10 text-purple-500'}`}>
                  {node.type === 'location' ? <MapPin size={16} /> : <Shield size={16} />}
                </div>

                <div>
                  <h4 className="font-bold text-xs leading-none">{node.title}</h4>
                  {node.description && <p className="text-[10px] text-warm-500 mt-1 max-w-[120px] truncate">{node.description}</p>}
                </div>

                {isSelected && (
                  <div className="flex items-center gap-1 ml-2 border-l border-warm-200 dark:border-warm-750 pl-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConnectingFromId(node.id);
                        showToast('Click another node to connect line!', 'info');
                      }}
                      className="p-1 text-warm-400 hover:text-amber-500"
                      title="Connect to node"
                    >
                      <LinkIcon size={12} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNode(node.id);
                      }}
                      className="p-1 text-warm-400 hover:text-red-500"
                      title="Delete node"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
