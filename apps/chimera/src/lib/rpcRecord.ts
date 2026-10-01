/** Composite-row RPCs are represented as either a row or a one-row array by clients. */
export function singleRpcRecord<T extends { id: string }>(
  data: unknown,
): T | null {
  const row = Array.isArray(data) ? (data.length === 1 ? data[0] : null) : data;
  if (
    !row ||
    typeof row !== "object" ||
    Array.isArray(row) ||
    !("id" in row) ||
    typeof row.id !== "string" ||
    !row.id.trim()
  )
    return null;
  return row as T;
}
