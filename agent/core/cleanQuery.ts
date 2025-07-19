// Query cleaner to strip helper words before searching
export function cleanQuery(q: string): string {
  if (!q) return "";
  
  return q
    .toLowerCase()
    .replace(/(can you|please|find|show me|look up|search|in the|section|clients?|leads?)/gi, "")
    .replace(/[^\w@\.\s+-]/g, "")   // strip punctuation
    .replace(/\s+/g, " ")          // collapse multiple spaces
    .trim();
}