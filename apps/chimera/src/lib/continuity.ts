export interface ContinuitySource {
  id: string;
  sender_id: string;
  excerpt: string;
  digest: string;
  created_at: string;
}
export interface ScopedFact {
  id: string;
  content: string;
  memory_type: string;
  importance: number;
  approval_status?: string;
  persona_id?: string | null;
  conversation_id?: string | null;
  session_id?: string | null;
  expires_at?: string | null;
}

export function selectScopedFacts(
  facts: ScopedFact[],
  scope: {
    personaId: string | null;
    conversationId?: string;
    sessionId?: string;
  },
  now = Date.now(),
) {
  return facts
    .filter(
      (f) =>
        (f.approval_status || "approved") === "approved" &&
        (f.persona_id || null) === scope.personaId &&
        (!f.conversation_id || f.conversation_id === scope.conversationId) &&
        (!f.session_id || f.session_id === scope.sessionId) &&
        (!f.expires_at || Date.parse(f.expires_at) > now),
    )
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 24);
}

// Source excerpts are recall aids, not inferred canon. Prefer topic matches,
// retain chronological provenance, and stay within the existing context budget.
export function selectContinuitySources(
  sources: ContinuitySource[],
  recentText: string[],
  budget = 6000,
) {
  const terms = new Set(
    recentText
      .join(" ")
      .toLowerCase()
      .match(/[\p{L}\p{N}]{4,}/gu) || [],
  );
  const scored = sources.map((s, index) => ({
    s,
    index,
    score: (s.excerpt.toLowerCase().match(/[\p{L}\p{N}]{4,}/gu) || []).filter(
      (w) => terms.has(w),
    ).length,
  }));
  scored.sort((a, b) => b.score - a.score || b.index - a.index);
  const selected: ContinuitySource[] = [];
  let used = 0;
  for (const { s } of scored) {
    if (selected.length >= 24) break;
    if (used + s.excerpt.length > budget) continue;
    selected.push(s);
    used += s.excerpt.length;
  }
  return selected.sort(
    (a, b) =>
      a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id),
  );
}
export function formatContinuity(sources: ContinuitySource[]) {
  return sources.length
    ? [
        "## Source-backed scene recall",
        "These are attributed excerpts of earlier turns, not approved facts. They may include dialogue, speculation or unreliable narrators. Creator canon overrides them.",
        ...sources.map(
          (s) => `[source ${s.id}; speaker ${s.sender_id}] ${s.excerpt}`,
        ),
      ].join("\n")
    : "";
}
