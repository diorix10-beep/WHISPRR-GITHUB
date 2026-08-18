import { MemoryNode, MemoryEdge, MemoryNexusState, ConversationMessage } from '../types';

/**
 * Default initial Memory Nexus state for a chat session.
 */
export const createInitialMemoryNexusState = (): MemoryNexusState => ({
  enabled: true,
  recall_strength: 8, // Default 8 as recommended in LoreMate AI specification
  nodes: [],
  edges: [],
  last_extracted_message_count: 0,
});

/**
 * Auto-extract new memories from recent messages if message count increased by >= 10.
 */
export const autoExtractMemoriesIfNeeded = (
  messages: ConversationMessage[],
  currentState: MemoryNexusState,
  conversationId: string
): MemoryNexusState => {
  if (!currentState.enabled) return currentState;

  const currentCount = messages.length;
  if (currentCount - currentState.last_extracted_message_count < 10) {
    return currentState;
  }

  // Extract key facts from the last 10 messages
  const recentMsgs = messages.slice(-10);
  const newNodes: MemoryNode[] = [];
  const newEdges: MemoryEdge[] = [];

  recentMsgs.forEach((msg, idx) => {
    const text = msg.content || '';
    if (!text || text.length < 15) return;

    // Pattern matching for key facts, relationships, choices
    if (text.toLowerCase().includes('remember') || text.toLowerCase().includes('always') || text.toLowerCase().includes('promise')) {
      const node: MemoryNode = {
        id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        conversation_id: conversationId,
        topic: 'User Promise & Preference',
        fact: text.substring(0, 120),
        category: 'preference',
        recall_weight: 9,
        created_at: new Date().toISOString(),
        source_message_index: currentState.last_extracted_message_count + idx,
      };
      newNodes.push(node);
    } else if (text.toLowerCase().includes('secret') || text.toLowerCase().includes('reveals') || text.toLowerCase().includes('hidden')) {
      const node: MemoryNode = {
        id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        conversation_id: conversationId,
        topic: 'Lore Secret Revealed',
        fact: text.substring(0, 120),
        category: 'secret',
        recall_weight: 8,
        created_at: new Date().toISOString(),
        source_message_index: currentState.last_extracted_message_count + idx,
      };
      newNodes.push(node);
    } else if (idx % 3 === 0) {
      // General narrative event extraction
      const node: MemoryNode = {
        id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        conversation_id: conversationId,
        topic: `Story Milestone #${currentState.nodes.length + newNodes.length + 1}`,
        fact: text.substring(0, 100) + '...',
        category: 'event',
        recall_weight: Math.floor(Math.random() * 4) + 6, // 6 to 9
        created_at: new Date().toISOString(),
        source_message_index: currentState.last_extracted_message_count + idx,
      };
      newNodes.push(node);
    }
  });

  // Create relationship links between newly generated nodes and existing nodes
  const allNodes = [...currentState.nodes, ...newNodes];
  if (allNodes.length >= 2) {
    newNodes.forEach((node) => {
      // Pick a random previous node to form a relationship edge
      const otherNode = currentState.nodes[Math.floor(Math.random() * currentState.nodes.length)];
      if (otherNode && otherNode.id !== node.id) {
        newEdges.push({
          id: `edge-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          source_id: otherNode.id,
          target_id: node.id,
          label: 'Relates to',
          strength: Math.floor(Math.random() * 3) + 2, // 2 to 4
        });
      }
    });
  }

  return {
    ...currentState,
    nodes: [...currentState.nodes, ...newNodes],
    edges: [...currentState.edges, ...newEdges],
    last_extracted_message_count: currentCount,
  };
};

/**
 * Formats active memories into a prompt context block based on Recall Strength (1 to 16).
 * Higher Recall Strength includes more memories with higher weight.
 */
export const formatMemoryNexusPromptContext = (state: MemoryNexusState): string => {
  if (!state.enabled || state.nodes.length === 0) return '';

  // Filter and sort nodes by recall_weight & recall_strength limit
  const maxMemoriesToInject = Math.min(state.recall_strength, state.nodes.length);
  const sortedNodes = [...state.nodes]
    .sort((a, b) => b.recall_weight - a.recall_weight)
    .slice(0, maxMemoriesToInject);

  if (sortedNodes.length === 0) return '';

  const memoryLines = sortedNodes.map(
    (n) => `- [${n.category.toUpperCase()} | Weight ${n.recall_weight}/10] ${n.topic}: ${n.fact}`
  );

  return `
[MEMORY NEXUS INFUSED RECALL (Recall Strength: ${state.recall_strength}/16)]
The AI must maintain strict consistency with the following long-term memories:
${memoryLines.join('\n')}
`;
};
