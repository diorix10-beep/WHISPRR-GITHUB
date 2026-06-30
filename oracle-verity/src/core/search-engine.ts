import { setRealActivity } from './activity-engine';

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export async function searchWeb(query: string): Promise<string> {
  try {
    setRealActivity('Searching the web...');
    
    // Call the serverless edge function proxy
    const res = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });

    if (!res.ok) {
      const err = await res.json();
      console.error('Search failed:', err);
      return `Search failed: ${err.error || res.statusText}`;
    }

    const data = await res.json();
    const results: SearchResult[] = data.results || [];

    if (results.length === 0) {
      return `No results found for query: "${query}"`;
    }

    // Format results for the LLM
    let formattedResults = `Search Results for "${query}":\n\n`;
    results.forEach((r, i) => {
      formattedResults += `[Result ${i + 1}]\n`;
      formattedResults += `Title: ${r.title}\n`;
      formattedResults += `URL: ${r.url}\n`;
      formattedResults += `Snippet: ${r.snippet}\n\n`;
    });

    return formattedResults;
  } catch (e: any) {
    console.error('Search engine error:', e);
    return `Search engine error: ${e.message}`;
  }
}
