export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { query } = await req.json();

    if (!query) {
      return new Response(JSON.stringify({ error: 'Missing query' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Hit the DuckDuckGo HTML endpoint which is lightweight and no-JS
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: `Search failed: ${response.statusText}` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const html = await response.text();

    // Very naive Regex parsing to extract results from the DDG HTML
    // We look for <a class="result__url" href="URL">...</a>
    // and <a class="result__snippet"...>TEXT</a>
    // and <h2 class="result__title">...<a class="result__a"...>TITLE</a></h2>
    
    const results = [];
    const resultBlockRegex = /<div class="result__body">([\s\S]*?)<\/div>\s*<\/div>/g;
    let match;
    let count = 0;

    while ((match = resultBlockRegex.exec(html)) !== null && count < 5) {
      const block = match[1];

      // Extract Title
      const titleMatch = block.match(/<h2 class="result__title">[\s\S]*?<a class="result__a"[^>]*>([\s\S]*?)<\/a>/);
      // Extract URL
      const urlMatch = block.match(/<a class="result__url" href="([^"]+)">/);
      // Extract Snippet
      const snippetMatch = block.match(/<a class="result__snippet[^>]*>([\s\S]*?)<\/a>/);

      if (titleMatch && urlMatch && snippetMatch) {
        // Clean HTML tags and decode basic entities
        const title = titleMatch[1].replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").trim();
        const href = urlMatch[1].trim();
        const snippet = snippetMatch[1].replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").trim();

        // DDG routes links through //duckduckgo.com/l/?uddg= encoded URL sometimes.
        // Let's attempt to decode it if it exists.
        let finalUrl = href;
        if (href.includes('uddg=')) {
          const urlParams = new URLSearchParams(href.split('?')[1]);
          const uddg = urlParams.get('uddg');
          if (uddg) finalUrl = decodeURIComponent(uddg);
        }

        results.push({
          title,
          url: finalUrl,
          snippet
        });
        count++;
      }
    }

    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
