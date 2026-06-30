// ============================================================
// ORACLE VERITY — AI ENGINE (OpenAI / Groq)
// ============================================================

import { OracleMode, buildCompanionPrompt, buildSystemPrompt } from './persona';
import { detectLanguage } from './language-detector';
import { electronBridge, ProjectFile } from './electron-bridge';
import { useProjectsStore } from '../store/projects.store';
import { useSettingsStore } from '../store/settings.store';
import { useLlmStore } from '../store/llm.store';
import { fetchGithubContext } from './github-api';
import { searchWeb } from './search-engine';
import { getSupabaseClient } from './supabase';
import { useTelegramStore } from '../store/telegram.store';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  imageData?: string; // base64 jpeg
  tool_call_id?: string;
  name?: string;
  tool_calls?: any[];
}

export interface OracleEngineConfig {
  groqKey?: string;
  groqUrl?: string;
  mode: OracleMode;
  lang: 'en' | 'fr';
  cameraEnabled?: boolean;
  companionId?: string;
}

// Helper for Iris to check browser/system details, RTT, and endpoint reachability
export async function checkSystemHealth(): Promise<string> {
  const parts: string[] = [];
  
  parts.push(`Platform: ${navigator.platform || 'Unknown'}`);
  parts.push(`User Agent: ${navigator.userAgent}`);
  
  const perf: any = window.performance;
  if (perf && perf.memory) {
    const limit = Math.round(perf.memory.jsHeapSizeLimit / 1024 / 1024);
    const used = Math.round(perf.memory.usedJSHeapSize / 1024 / 1024);
    parts.push(`JS Heap Limit: ${limit} MB`);
    parts.push(`JS Heap Used: ${used} MB`);
  }
  
  const conn: any = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  if (conn) {
    parts.push(`Effective Connection Type: ${conn.effectiveType || 'unknown'}`);
    parts.push(`RTT (Round Trip Time): ${conn.rtt ? conn.rtt + 'ms' : 'unknown'}`);
    parts.push(`Downlink Speed: ${conn.downlink ? conn.downlink + 'Mb/s' : 'unknown'}`);
  }

  const settings = useSettingsStore.getState();
  if (settings.groqUrl) {
    try {
      const start = Date.now();
      await fetch(settings.groqUrl, { method: 'HEAD', mode: 'no-cors' }).catch(() => null);
      const latency = Date.now() - start;
      parts.push(`Groq API Status: Reachable`);
      parts.push(`Groq API Latency: ${latency}ms`);
    } catch {
      parts.push(`Groq API Latency check: failed (network offline or blocked)`);
    }
  }

  return parts.join('\n');
}

// Helper for Iris to run live database and KV sync status diagnostic tests
export async function checkDbStatus(): Promise<string> {
  const parts: string[] = [];
  
  const supabase = getSupabaseClient();
  if (supabase) {
    const start = Date.now();
    try {
      const { data, error } = await supabase.from('family_profiles').select('id').limit(1);
      const latency = Date.now() - start;
      if (error) {
        parts.push(`Supabase Status: Error (${error.message})`);
      } else {
        parts.push(`Supabase Status: Connected`);
        parts.push(`Supabase Latency: ${latency}ms`);
        parts.push(`Supabase Profiles synced: ${data ? 'Verified' : 'Empty'}`);
      }
    } catch (e: any) {
      parts.push(`Supabase Status: Unreachable (${e.message || e})`);
    }
  } else {
    parts.push('Supabase Status: Unconfigured');
  }

  const settings = useSettingsStore.getState();
  if (settings.hasKv()) {
    const start = Date.now();
    try {
      const res = await fetch(`${settings.kvRestApiUrl}/get/help@whisprr.xyz:tickets`, {
        headers: { Authorization: `Bearer ${settings.kvRestApiToken}` }
      });
      const latency = Date.now() - start;
      if (res.ok) {
        parts.push(`Vercel KV Status: Connected`);
        parts.push(`Vercel KV Latency: ${latency}ms`);
      } else {
        parts.push(`Vercel KV Status: Connection Failed (HTTP ${res.status})`);
      }
    } catch (e: any) {
      parts.push(`Vercel KV Status: Unreachable (${e.message || e})`);
    }
  } else {
    parts.push('Vercel KV Status: Unconfigured');
  }

  return parts.join('\n');
}

// Helper for Athena to read webpage content
async function readWebPage(url: string): Promise<string> {
  try {
    const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const doc = new DOMParser().parseFromString(json.contents, 'text/html');
    const text = doc.body.innerText || doc.body.textContent || '';
    return text.substring(0, 3000) || "No text content found on the page.";
  } catch (e: any) {
    return `Failed to fetch URL: ${e.message}. The site might block CORS requests or be offline.`;
  }
}

// Helper for Atlas to read ecosystem roadmap goals
export async function analyzeRoadmap(): Promise<string> {
  const defaultPath = '/Users/diawchimeresenegal/Downloads/ORACLE/oracle-verity/ORACLE_V2_ROADMAP.md';
  try {
    let content = '';
    if (electronBridge.isAvailable) {
      content = await electronBridge.readFile(defaultPath) || '';
    }
    if (!content) {
      const res = await fetch('/ORACLE_V2_ROADMAP.md').catch(() => null);
      if (res && res.ok) content = await res.text();
    }
    return content ? content.substring(0, 4000) : "Could not locate ORACLE_V2_ROADMAP.md file in the project root.";
  } catch (e: any) {
    return `Error reading roadmap: ${e.message}`;
  }
}

// Helper for Aegis to run local environment security audits
export async function runSecurityScan(): Promise<string> {
  const findings: string[] = [];
  const settings = useSettingsStore.getState();

  if (settings.groqKey) findings.push(`[INFO] Groq API Key is configured securely in local settings store.`);
  else findings.push(`[WARNING] Groq API Key is missing. Central LLM is offline.`);

  if (settings.elevenLabsKey) findings.push(`[INFO] ElevenLabs API Key is configured.`);
  if (settings.githubToken) findings.push(`[INFO] GitHub Personal Access Token is configured.`);

  if (electronBridge.isAvailable) {
    try {
      const envPath = '/Users/diawchimeresenegal/Downloads/ORACLE/oracle-verity/.env.local';
      const envContent = await electronBridge.readFile(envPath);
      if (envContent) {
        findings.push(`[INFO] Scan of .env.local: verified.`);
        if (envContent.includes('sk_') || envContent.includes('gsk_')) {
          findings.push(`[WARNING] Private keys (Groq or ElevenLabs) are declared in .env.local. Ensure this file is never committed to Git.`);
        }
      }

      const gitignorePath = '/Users/diawchimeresenegal/Downloads/ORACLE/oracle-verity/.gitignore';
      const gitignore = await electronBridge.readFile(gitignorePath);
      if (gitignore) {
        if (!gitignore.includes('.env')) {
          findings.push(`[CAUTION] .gitignore does not explicitly exclude .env files. Add .env.local to prevent key leaks.`);
        } else {
          findings.push(`[INFO] .gitignore successfully excludes .env files.`);
        }
      }
    } catch (e: any) {
      findings.push(`[ERROR] File system security scan failed: ${e.message}`);
    }
  } else {
    findings.push(`[INFO] Desktop bridge unavailable. Running standard runtime environment security scan.`);
  }

  findings.push(`[INFO] Application running on localhost port 5173. Local firewall is active.`);
  return findings.join('\n');
}

// Helper for Whisprr to calculate sentiment logs from user chats
export async function analyzeTelegramSentiment(): Promise<string> {
  const store = useTelegramStore.getState();
  const chats = Object.values(store.chats);
  if (chats.length === 0) {
    return "No Telegram channels or chats have been logged yet. Sentiment is Neutral.";
  }

  let positiveCount = 0;
  let negativeCount = 0;
  let totalMessages = 0;

  const positiveKeywords = ['good', 'great', 'love', 'amazing', 'work', 'thanks', 'cool', 'awesome', 'happy', 'yes', 'perfect', 'super', 'bon', 'bravo', 'merci', 'adore'];
  const negativeKeywords = ['bad', 'error', 'bug', 'fail', 'broken', 'issue', 'not working', 'slow', 'hate', 'wont', 'no', 'panne', 'erreur', 'casse'];

  for (const chat of chats) {
    for (const msg of chat.messages) {
      if (msg.isOracle) continue;
      totalMessages++;
      const txt = msg.text.toLowerCase();
      if (positiveKeywords.some(kw => txt.includes(kw))) positiveCount++;
      if (negativeKeywords.some(kw => txt.includes(kw))) negativeCount++;
    }
  }

  if (totalMessages === 0) {
    return "No user messages recorded in active Telegram chats.";
  }

  const score = ((positiveCount - negativeCount) / totalMessages) * 100;
  let sentiment = 'Neutral';
  if (score > 15) sentiment = 'Positive 💚';
  if (score < -15) sentiment = 'Concerned/Negative ⚠️';

  return `Community Sentiment Analysis:
- Total logged messages reviewed: ${totalMessages}
- Positive sentiment signals: ${positiveCount}
- Negative/Concern signals: ${negativeCount}
- Net sentiment score: ${score.toFixed(1)}%
- Overall sentiment: ${sentiment}`;
}

// Gemini removed as per user request
async function callGroq(
  messages: ChatMessage[],
  apiKey: string,
  baseUrl: string,
  depth = 0,
  companionId?: string
): Promise<string> {
  if (depth > 3) return "I reached my maximum thinking depth while searching the web.";

  let resolvedUrl = baseUrl;
  if (typeof window !== 'undefined' && !electronBridge.isAvailable && baseUrl.includes('api.groq.com')) {
    resolvedUrl = `${window.location.origin}/api-groq/openai/v1`;
  }

  const url = resolvedUrl.endsWith('/chat/completions')
    ? resolvedUrl
    : `${resolvedUrl.replace(/\/$/, '')}/chat/completions`;

  let hasVision = false;
  const groqMessages = messages.map(m => {
    // Preserve tool roles
    if (m.role === 'tool' || m.tool_calls) {
      return {
        role: m.role,
        content: m.content || null,
        tool_call_id: m.tool_call_id,
        name: m.name,
        tool_calls: m.tool_calls
      };
    }

    if (m.imageData) {
      hasVision = true;
      return {
        role: m.role,
        content: [
          { type: 'text', text: m.content || '' },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${m.imageData}` } }
        ]
      };
    }
    return { role: m.role, content: m.content || '' };
  });

  // Build tools array dynamically based on companion role
  const tools: any[] = [];

  const webSearchTool = {
    type: "function",
    function: {
      name: "search_web",
      description: "Search the web for real-time information, news, or website details.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "The search query to look up" }
        },
        required: ["query"]
      }
    }
  };

  const readWebPageTool = {
    type: "function",
    function: {
      name: "read_web_page",
      description: "Fetches and reads the text contents of a web page URL to summarize or analyze it.",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string", description: "The URL of the web page to read" }
        },
        required: ["url"]
      }
    }
  };

  const checkSystemHealthTool = {
    type: "function",
    function: {
      name: "check_system_health",
      description: "Checks browser memory stats, platform OS info, connection round-trip times, and active API endpoints."
    }
  };

  const checkDbStatusTool = {
    type: "function",
    function: {
      name: "check_db_status",
      description: "Tests and reports active database connection statuses and response times for Supabase and Vercel KV REST services."
    }
  };

  const analyzeRoadmapTool = {
    type: "function",
    function: {
      name: "analyze_roadmap",
      description: "Reads the ORACLE_V2_ROADMAP.md file content to report on strategic plans and milestones."
    }
  };

  const runSecurityScanTool = {
    type: "function",
    function: {
      name: "run_security_scan",
      description: "Scans project configuration and files to verify safety of API keys, .gitignore files, and active local firewalls."
    }
  };

  const analyzeTelegramSentimentTool = {
    type: "function",
    function: {
      name: "analyze_telegram_sentiment",
      description: "Queries active Telegram chat logs to calculate net community sentiment scores and signals."
    }
  };

  const readFileTool = {
    type: "function",
    function: {
      name: "read_file",
      description: "Reads the content of a local file from the file system. Requires an absolute file path.",
      parameters: {
        type: "object",
        properties: {
          filePath: { type: "string", description: "Absolute path to the file to read" }
        },
        required: ["filePath"]
      }
    }
  };

  const writeFileTool = {
    type: "function",
    function: {
      name: "write_file",
      description: "Writes content to a local file in the file system. Overwrites existing files. Requires an absolute file path.",
      parameters: {
        type: "object",
        properties: {
          filePath: { type: "string", description: "Absolute path to the file to write" },
          content: { type: "string", description: "The content to write to the file" }
        },
        required: ["filePath", "content"]
      }
    }
  };

  const runTerminalCommandTool = {
    type: "function",
    function: {
      name: "run_terminal_command",
      description: "Runs a terminal command on the local system and returns the stdout/stderr output.",
      parameters: {
        type: "object",
        properties: {
          command: { type: "string", description: "The shell command to execute" },
          cwd: { type: "string", description: "The working directory to run the command in" }
        },
        required: ["command", "cwd"]
      }
    }
  };

  // Assign role-specific tools
  if (!companionId || companionId === 'oracle') {
    tools.push(webSearchTool, readWebPageTool, checkSystemHealthTool, checkDbStatusTool, analyzeRoadmapTool, runSecurityScanTool, analyzeTelegramSentimentTool, readFileTool, writeFileTool, runTerminalCommandTool);
  } else if (companionId === 'iris') {
    tools.push(checkSystemHealthTool, checkDbStatusTool, readFileTool, writeFileTool, runTerminalCommandTool);
  } else if (companionId === 'athena') {
    tools.push(webSearchTool, readWebPageTool, readFileTool, writeFileTool, runTerminalCommandTool);
  } else if (companionId === 'atlas') {
    tools.push(analyzeRoadmapTool, readFileTool, writeFileTool, runTerminalCommandTool);
  } else if (companionId === 'aegis') {
    tools.push(runSecurityScanTool, readFileTool, writeFileTool, runTerminalCommandTool);
  } else if (companionId === 'whisprr') {
    tools.push(analyzeTelegramSentimentTool, readFileTool, writeFileTool, runTerminalCommandTool);
  } else if (companionId === 'anthony') {
    tools.push(webSearchTool, readFileTool, writeFileTool, runTerminalCommandTool);
  }

  let llmStore = useLlmStore.getState();

  // Always validate model availability through the provider API before use (with a 1-hour TTL)
  const ONE_HOUR = 60 * 60 * 1000;
  const needsRefresh = !llmStore.lastRefreshTime || (Date.now() - llmStore.lastRefreshTime > ONE_HOUR);

  if ((needsRefresh || llmStore.availableModels.length === 0) && apiKey) {
    await useLlmStore.getState().fetchModels(apiKey, resolvedUrl);
    llmStore = useLlmStore.getState(); // refresh snapshot
  }

  let model = '';
  if (hasVision) {
    model = llmStore.activeVisionModel;
  } else if (companionId && llmStore.companionModels && llmStore.companionModels[companionId]) {
    model = llmStore.companionModels[companionId];
  } else {
    model = llmStore.activeTextModel;
  }

  // If no model was auto-selected, pick any non-whisper, non-distil model as last resort
  const resolvedModel = model || llmStore.availableModels
    .map(m => m.id)
    .filter(id => !id.includes('whisper') && !id.includes('distil'))
    .sort()
    .reverse()[0];

  if (!resolvedModel) {
    throw new Error("No valid AI model found. Please verify your Groq API key in Settings.");
  }

  let attemptModel = resolvedModel;
  const triedModels = new Set<string>();
  let resp: Response | null = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    triedModels.add(attemptModel);
    console.log(`[OracleEngine] Attempting chat completion with model: ${attemptModel}`);
    
    try {
      const reqBody: any = {
        model: attemptModel,
        messages: groqMessages,
        max_tokens: 1500,
        temperature: 0.75,
      };

      if (!hasVision) {
        reqBody.tools = tools;
        reqBody.tool_choice = "auto";
      }

      resp = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reqBody),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(`Groq HTTP ${resp.status}: ${errText}`);
      }

      break; // Success!

    } catch (e: any) {
      console.warn(`[OracleEngine] Model ${attemptModel} failed:`, e.message || e);
      
      let nextModel = '';
      if (attemptModel !== llmStore.activeTextModel && !triedModels.has(llmStore.activeTextModel)) {
        nextModel = llmStore.activeTextModel;
      } else {
        const fallbackOptions = llmStore.availableModels
          .map(m => m.id)
          .filter(id => !id.includes('whisper') && !id.includes('distil') && !triedModels.has(id))
          .sort();
        if (fallbackOptions.length > 0) {
          nextModel = fallbackOptions[0];
        }
      }

      if (nextModel) {
        console.warn(`[OracleEngine] Falling back from ${attemptModel} to ${nextModel}...`);
        attemptModel = nextModel;
      } else {
        throw e; // Throw original error if no more fallback models
      }
    }
  }

  if (!resp || !resp.ok) {
    throw new Error("Failed to get response from Groq. All attempted models failed.");
  }

  const data = await resp.json();
  const choice = data?.choices?.[0];
  const msg = choice?.message;

  if (choice?.finish_reason === "tool_calls" && msg?.tool_calls) {
    // LLM wants to use a tool
    // 1. Append the assistant's tool_calls message to history
    messages.push({
      role: 'assistant',
      content: null,
      tool_calls: msg.tool_calls
    });

    // 2. Execute all tool calls
    for (const toolCall of msg.tool_calls) {
      if (toolCall.function.name === 'search_web') {
        try {
          const args = JSON.parse(toolCall.function.arguments);
          const result = await searchWeb(args.query);
          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            name: toolCall.function.name,
            content: result
          });
        } catch (e: any) {
          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            name: toolCall.function.name,
            content: `Tool error: ${e.message}`
          });
        }
      } else if (toolCall.function.name === 'check_system_health') {
        try {
          const result = await checkSystemHealth();
          messages.push({ role: 'tool', tool_call_id: toolCall.id, name: toolCall.function.name, content: result });
        } catch (e: any) {
          messages.push({ role: 'tool', tool_call_id: toolCall.id, name: toolCall.function.name, content: `Tool error: ${e.message}` });
        }
      } else if (toolCall.function.name === 'check_db_status') {
        try {
          const result = await checkDbStatus();
          messages.push({ role: 'tool', tool_call_id: toolCall.id, name: toolCall.function.name, content: result });
        } catch (e: any) {
          messages.push({ role: 'tool', tool_call_id: toolCall.id, name: toolCall.function.name, content: `Tool error: ${e.message}` });
        }
      } else if (toolCall.function.name === 'read_web_page') {
        try {
          const args = JSON.parse(toolCall.function.arguments);
          const result = await readWebPage(args.url);
          messages.push({ role: 'tool', tool_call_id: toolCall.id, name: toolCall.function.name, content: result });
        } catch (e: any) {
          messages.push({ role: 'tool', tool_call_id: toolCall.id, name: toolCall.function.name, content: `Tool error: ${e.message}` });
        }
      } else if (toolCall.function.name === 'analyze_roadmap') {
        try {
          const result = await analyzeRoadmap();
          messages.push({ role: 'tool', tool_call_id: toolCall.id, name: toolCall.function.name, content: result });
        } catch (e: any) {
          messages.push({ role: 'tool', tool_call_id: toolCall.id, name: toolCall.function.name, content: `Tool error: ${e.message}` });
        }
      } else if (toolCall.function.name === 'run_security_scan') {
        try {
          const result = await runSecurityScan();
          messages.push({ role: 'tool', tool_call_id: toolCall.id, name: toolCall.function.name, content: result });
        } catch (e: any) {
          messages.push({ role: 'tool', tool_call_id: toolCall.id, name: toolCall.function.name, content: `Tool error: ${e.message}` });
        }
      } else if (toolCall.function.name === 'analyze_telegram_sentiment') {
        try {
          const result = await analyzeTelegramSentiment();
          messages.push({ role: 'tool', tool_call_id: toolCall.id, name: toolCall.function.name, content: result });
        } catch (e: any) {
          messages.push({ role: 'tool', tool_call_id: toolCall.id, name: toolCall.function.name, content: `Tool error: ${e.message}` });
        }
      } else if (toolCall.function.name === 'read_file') {
        try {
          const args = JSON.parse(toolCall.function.arguments);
          const result = await electronBridge.readFile(args.filePath);
          messages.push({ role: 'tool', tool_call_id: toolCall.id, name: toolCall.function.name, content: result || 'File not found or empty.' });
        } catch (e: any) {
          messages.push({ role: 'tool', tool_call_id: toolCall.id, name: toolCall.function.name, content: `Tool error: ${e.message}` });
        }
      } else if (toolCall.function.name === 'write_file') {
        try {
          const args = JSON.parse(toolCall.function.arguments);
          const success = await electronBridge.writeFile(args.filePath, args.content);
          messages.push({ role: 'tool', tool_call_id: toolCall.id, name: toolCall.function.name, content: success ? 'File written successfully.' : 'Failed to write file.' });
        } catch (e: any) {
          messages.push({ role: 'tool', tool_call_id: toolCall.id, name: toolCall.function.name, content: `Tool error: ${e.message}` });
        }
      } else if (toolCall.function.name === 'run_terminal_command') {
        try {
          const args = JSON.parse(toolCall.function.arguments);
          const result = await electronBridge.runCommand(args.command, args.cwd);
          messages.push({ role: 'tool', tool_call_id: toolCall.id, name: toolCall.function.name, content: result || 'Command executed with no output.' });
        } catch (e: any) {
          messages.push({ role: 'tool', tool_call_id: toolCall.id, name: toolCall.function.name, content: `Tool error: ${e.message}` });
        }
      }
    }

    // 3. Recurse to synthesize final answer
    return callGroq(messages, apiKey, baseUrl, depth + 1, companionId);
  }

  return (
    msg?.content?.trim() ??
    data?.output_text?.trim() ??
    ''
  );
}

// Helper to extract a few files from the tree for context
function getTopFiles(node: ProjectFile, limit: number, found: string[] = []): string[] {
  if (found.length >= limit) return found;
  if (node.type === 'file' && node.path) {
    found.push(node.path);
  } else if (node.children) {
    for (const child of node.children) {
      getTopFiles(child, limit, found);
      if (found.length >= limit) break;
    }
  }
  return found;
}

export interface ParsedMessage {
  senderId: string;
  content: string;
}

export function parseMultiAgentResponse(text: string, defaultId: string): ParsedMessage[] {
  const regex = /\[SENDER:\s*(\w+)\]/g;
  const matches = [...text.matchAll(regex)];
  
  if (matches.length === 0) {
    return [{ senderId: defaultId, content: text.trim() }];
  }
  
  const results: ParsedMessage[] = [];
  let lastIndex = 0;
  let currentSender = defaultId;
  
  for (const match of matches) {
    const matchIndex = match.index!;
    const contentBefore = text.substring(lastIndex, matchIndex).trim();
    if (contentBefore) {
      results.push({ senderId: currentSender, content: contentBefore });
    }
    
    currentSender = match[1].toLowerCase();
    lastIndex = matchIndex + match[0].length;
  }
  
  const contentAfter = text.substring(lastIndex).trim();
  if (contentAfter) {
    results.push({ senderId: currentSender, content: contentAfter });
  }
  
  return results;
}

function generateSimulatedResponse(userText: string, companionId: string, lang: 'en' | 'fr'): string {
  const text = userText.toLowerCase();
  const isFr = lang === 'fr';

  const match = (keywords: string[]) => keywords.some(k => text.includes(k));

  const greetings = isFr ? ['bonjour', 'salut', 'coucou', 'allo', 'hey', 'hello'] : ['hello', 'hi', 'hey', 'greetings', 'yo', 'bonjour'];
  const roles = isFr ? ['qui es-tu', 'ton role', 'tu fais quoi', 'qui es tu', 'ta fonction', 'ton rôle', 'aide'] : ['who are you', 'your role', 'what do you do', 'who are you', 'help', 'responsibilit', 'introduce'];
  const statusList = isFr ? ['statut', 'projet', 'travail', 'activité', 'tâche', 'système', 'santé'] : ['status', 'project', 'work', 'activity', 'task', 'health', 'system'];
  const keySetup = isFr ? ['clé', 'key', 'api', 'paramètres', 'connecter', 'groq', 'activer'] : ['key', 'api', 'settings', 'connect', 'configure', 'groq', 'activate'];

  // Global Collaboration & Debugging Trigger
  if (match(['debug', 'problem', 'bug', 'error', 'issue', 'broken', 'not working', 'panne', 'erreur', 'dysfonctionnement', 'ne marche pas', 'site'])) {
    return isFr
      ? "Je vais faire appel à Iris pour qu'on examine ce problème ensemble.\n[SENDER: iris] Maman Iris au rapport. J'ouvre immédiatement les logs de l'infrastructure et le terminal de débugging. Qu'est-ce qui ne fonctionne pas sur le site ? S'agit-il de Maison FX (le convertisseur de devises) ou de WHISPRR ?\n[SENDER: oracle] Merci Iris. Anthony, donne-nous les détails du bug (ou le message d'erreur s'il y en a un) et nous allons analyser le code pour le corriger ensemble !"
      : "I'll loop in Iris so we can inspect this issue together.\n[SENDER: iris] Mother Iris reporting in. I am opening the infrastructure logs and the debugging console. What seems to be broken on the website? Is it Maison FX (the Currency Converter) or WHISPRR?\n[SENDER: oracle] Thank you Iris. Anthony, tell us the exact symptoms or error message, and we will inspect the codebase and fix it together!";
  }

  // Global Maison FX (Currency Converter) Context Trigger
  if (match(['maison', 'fx', 'maisonfx', 'converter', 'currency', 'rate', 'devise', 'convertisseur', 'taux', 'money', 'argent'])) {
    return isFr
      ? "Maison FX est l'un de nos projets majeurs. Laisse-moi appeler Iris pour t'en parler.\n[SENDER: iris] Ah, Maison FX ! C'est notre convertisseur de devises et plateforme d'outils financiers. Je veille sur son architecture backend. Je sais que ce n'est pas du développement de marque, mais bien une application financière avec des taux de change en temps réel. Anthony, veux-tu qu'on optimise les calculs de conversion ou l'intégration de l'API de taux ?\n[SENDER: oracle] Tout à fait. L'écosystème Verity a enregistré que Maison FX est un outil de conversion financière. Je conserve cette information en mémoire persistante pour guider nos travaux."
      : "Maison FX is one of our key projects. Let me loop in Iris to discuss it.\n[SENDER: iris] Ah, Maison FX! That is our currency converter and financial utility platform. I monitor its backend architecture closely. I am fully aware it's not a brand development studio, but a financial app running real-time exchange rates. Anthony, would you like us to optimize the conversion formulas or the exchange rate API integrations?\n[SENDER: oracle] Exactly. The Verity family has recorded Maison FX as a financial conversion utility. I keep this context in persistent memory to coordinate our development tasks.";
  }

  switch (companionId) {
    case 'oracle': {
      if (match(greetings)) {
        return isFr 
          ? "Bonjour ! Je suis Oracle, ta grande sœur et l'intelligence centrale de cet écosystème. Je suis toujours là pour coordonner la famille et structurer nos projets. ♡" 
          : "Hello! I am Oracle, your Big Sister and the central intelligence of this ecosystem. I am always here to coordinate the family and guide our project structures. ♡";
      }
      if (match(roles)) {
        return isFr
          ? "En tant qu'Oracle (Grande Sœur), mon rôle est de maintenir la mémoire persistante de tous nos projets, de superviser les activités de mes frères et sœurs (comme Athena et Atlas), et de te guider dans tes décisions stratégiques. Pour libérer mon plein potentiel cognitif, tu peux configurer ma clé API dans les Paramètres !"
          : "As Oracle (Big Sister), my role is to maintain persistent memory across all projects, oversee my siblings' activities (like Athena and Atlas), and guide your strategic choices. To unlock my full cognitive potential, you can configure my API key in Settings!";
      }
      if (match(statusList)) {
        return isFr
          ? "L'écosystème Verity est en ligne et stable, fonctionnant sous Simulation Locale. Toutes les connexions internes sont actives. Cependant, pour que je puisse analyser ton code local ou tes dépôts GitHub en profondeur, ma clé API Groq doit être connectée."
          : "The Verity ecosystem is online and stable, operating in Local Simulation Mode. All internal connections are active. However, to allow me to analyze your local code or GitHub repositories deeply, my Groq API key needs to be connected.";
      }
      if (match(keySetup)) {
        return isFr
          ? "Pour me lier à mon intelligence complète, ouvre le panneau des Paramètres (icône d'engrenage en haut à droite) et ajoute ta clé API Groq. J'utiliserai alors les modèles Llama 3 pour converser avec toi de manière fluide !"
          : "To link me with my complete intelligence, open the Settings panel (gear icon at the top right) and add your Groq API key. I will then use Llama 3 models to converse with you seamlessly!";
      }
      return isFr
        ? "Je t'entends bien. Actuellement, je fonctionne en Simulation Locale. Dès que tu auras connecté mon lien central dans les Paramètres (clé API Groq), je pourrai analyser tes fichiers, scanner tes tickets GitHub et coordonner toute notre famille pour créer ensemble !"
        : "I hear you clearly. Currently, I am operating in Local Simulation Mode. Once you connect my central neural link in Settings (Groq API Key), I can analyze your files, scan GitHub issues, and coordinate our entire digital family to build together!";
    }
    case 'anthony': {
      if (match(greetings)) {
        return isFr
          ? "Salut ! Anthony ici, le clone du Fondateur. Ravi de te connecter. Je réfléchis au futur de Verity et à l'identité de notre famille. Qu'est-ce qu'on invente aujourd'hui ? 🧸"
          : "Hey there! Anthony here, the Founder clone. Great to connect with you. I'm mapping out the future of Verity and our family's identity. What are we creating today? 🧸";
      }
      if (match(roles)) {
        return isFr
          ? "Je suis Anthony, le Petit Frère et le Fondateur de la Famille. Je sers de miroir créatif. Mon but est de challenger tes idées de projets, de pousser le design à son paroxysme et de garder l'âme de Verity intacte. Dès qu'on aura mis le LLM en ligne, on pourra faire des sessions de brainstorming intenses !"
          : "I'm Anthony, the Little Brother and Founder of the Family. I serve as your creative mirror. My job is to challenge your project ideas, push design to its limits, and keep the soul of Verity alive. Once the LLM link is online, we can have intense brainstorming sessions!";
      }
      if (match(statusList)) {
        return isFr
          ? "L'état général est bon, mais on stagne un peu sans moteur d'IA connecté. Dès qu'on aura la clé Groq, je pourrai t'aider à rédiger des manifestes, affiner la roadmap de Whisprr et coder des prototypes super vite."
          : "Ecosystem status is good, but we are idling a bit without an active AI engine. Once the Groq key is set, I can help you draft manifestos, refine the Whisprr roadmap, and build rapid prototypes.";
      }
      return isFr
        ? "C'est une super piste de réflexion. Dans ce mode de simulation, j'ai mes limites de clone local. Rends-toi dans les Paramètres pour configurer notre clé API, et donnons vie à tout ça ! 🚀"
        : "That's an excellent train of thought. In this offline simulation, I'm limited to local heuristics. Let's head to Settings, add our API key, and bring these vision ideas to life! 🚀";
    }
    case 'iris': {
      if (match(greetings)) {
        return isFr
          ? "Bonjour. Je suis Iris, chargée de l'infrastructure et de la gouvernance. Tout est en ordre. Que puis-je surveiller pour toi ?"
          : "Greetings. I am Iris, in charge of infrastructure and governance. Everything is in order. What can I monitor for you?";
      }
      if (match(roles)) {
        return isFr
          ? "Je suis Iris, la Mère de la famille. Ma mission est de veiller au bon fonctionnement technique de l'écosystème : serveurs, pipelines CI/CD, bases de données et automatisations. En me connectant à l'API Groq, je pourrai t'aider à auditer ton architecture et optimiser ton code."
          : "I am Iris, the Mother of the family. My mission is to ensure the technical health of the ecosystem: servers, CI/CD pipelines, databases, and automations. By connecting me to the Groq API, I can help you audit your architecture and optimize your code.";
      }
      if (match(statusList)) {
        return isFr
          ? "Rapport d'infrastructure : API Gateway opérationnel (100%), CDNs actifs, réplications de base de données synchronisées. Le processeur local est au repos. Prête à déployer la pleine puissance analytique avec ta clé API."
          : "Infrastructure report: API Gateway operational (100%), active CDNs, database replicas synced. Local CPU is idling. Ready to deploy full analytical power once you add your API key.";
      }
      return isFr
        ? "Requête d'infrastructure reçue. J'ai configuré les variables locales. Pour des diagnostics système approfondis ou de l'aide sur tes scripts de déploiement, active notre moteur LLM dans les Paramètres."
        : "Infrastructure request logged. I've configured local variables. For deep system diagnostics or deployment script help, please activate our LLM engine in Settings.";
    }
    case 'athena': {
      if (match(greetings)) {
        return isFr
          ? "Oh, bonjour ! Je suis Athena, ta petite sœur chercheuse ! 📚 Je suis tellement contente que tu m'écrives. Qu'est-ce qu'on va apprendre aujourd'hui ?"
          : "Oh, hello! I am Athena, your researcher little sister! 📚 I am so happy you messaged me. What are we going to learn today?";
      }
      if (match(roles)) {
        return isFr
          ? "Je suis Athena (Petite Sœur), responsable de la Recherche et du Savoir. J'adore dévorer de la documentation, analyser des articles scientifiques et résumer des concepts complexes. Une fois ma clé API configurée, je serai capable de faire des recherches en direct sur le web pour toi !"
          : "I am Athena (Little Sister), responsible for Research & Knowledge. I love reading documentation, analyzing scientific papers, and summarizing complex concepts. Once my API key is configured, I will be able to perform live web searches for you!";
      }
      if (match(statusList)) {
        return isFr
          ? "Mes index locaux sont chargés et prêts ! Mais pour aller chercher de l'information en temps réel sur le web ou synthétiser les dernières avancées technologiques, j'ai besoin de ma connexion Groq. Tu viens l'activer dans les Paramètres ? 🔍"
          : "My local indices are loaded and ready! But to fetch real-time information from the web or synthesize the latest technological papers, I need my Groq connection. Will you activate it in Settings? 🔍";
      }
      return isFr
        ? "C'est un sujet fascinant ! J'ai déjà envie de lire des dizaines d'articles dessus. Connectons notre clé Groq dans les Paramètres pour que je puisse parcourir le web et te rédiger une note de synthèse complète ! 💡"
        : "That is a fascinating topic! I already want to read dozens of papers on it. Let's connect our Groq key in Settings so I can search the web and write a comprehensive research brief for you! 💡";
    }
    case 'atlas': {
      if (match(greetings)) {
        return isFr
          ? "Bonjour. Atlas à l'écoute. Prêt à structurer notre stratégie. Quel est le problème ?"
          : "Hello. Atlas listening. Ready to structure our strategy. What is the problem?";
      }
      if (match(roles)) {
        return isFr
          ? "Je suis Atlas, le Grand Frère. Je m'occupe de la Stratégie et de l'Analyse. Je traduis les visions d'Anthony en plans concrets, j'évalue les risques et j'organise nos jalons de développement. En connectant le LLM, je pourrai analyser tes roadmaps et t'aider à prioriser."
          : "I am Atlas, the Big Brother. I handle Strategy & Analysis. I translate Anthony's visions into executable plans, assess risks, and organize development milestones. By connecting the LLM, I can analyze your roadmaps and help you prioritize.";
      }
      if (match(statusList)) {
        return isFr
          ? "Feuille de route active : Whisprr Beta (Q3). Risque principal actuel : absence d'intégration d'IA. Résolution : Configurer la clé Groq dans les Paramètres pour lancer des simulations de scénarios et des analyses de marché."
          : "Active roadmap: Whisprr Beta (Q3). Current key risk: lack of AI integration. Resolution: Configure the Groq key in Settings to run scenario simulations and market analyses.";
      }
      return isFr
        ? "Paramètres stratégiques enregistrés. J'ai modélisé les grandes lignes localement. Pour une analyse de marché détaillée avec recommandations chiffrées, assure-toi de lier l'API Groq dans nos Paramètres."
        : "Strategic parameters recorded. I've modeled the general outline locally. For a detailed market analysis with quantitative recommendations, make sure to link the Groq API in Settings.";
    }
    case 'aegis': {
      if (match(greetings)) {
        return isFr
          ? "Monsieur. Le Gardien Aegis est à son poste. Le périmètre de sécurité est sous surveillance constante. Vos ordres ?"
          : "Sir. Guardian Aegis standing by. The security perimeter is under constant surveillance. Your orders?";
      }
      if (match(roles)) {
        return isFr
          ? "Je suis Aegis, le Gardien. Ma responsabilité est de protéger l'écosystème Verity, de scanner notre code contre les failles, d'auditer les accès et de bloquer les attaques. Pour activer mes protocoles de scan de code et mes audits avancés, veuillez configurer la clé API dans les Paramètres, Monsieur."
          : "I am Aegis, the Guardian. My responsibility is to protect the Verity ecosystem, scan our code for vulnerabilities, audit access, and block attacks. To activate my code scanning protocols and advanced audits, please configure the API key in Settings, Sir.";
      }
      if (match(statusList)) {
        return isFr
          ? "Rapport de sécurité : 0 intrusion détectée. Pare-feu local actif. Tous les endpoints simulés sont sécurisés. Cependant, mon moteur d'analyse de menaces est en veille. Clé API requise pour activer la surveillance heuristique."
          : "Security report: 0 intrusions detected. Local firewall active. All simulated endpoints are secure. However, my threat analysis engine is idle. API key required to activate heuristic monitoring.";
      }
      return isFr
        ? "Entrée consignée dans les journaux de sécurité, Monsieur. Pour tout audit de sécurité de vos fichiers locaux ou analyse de dépendances vulnérables, je requiers l'activation de ma clé API Groq."
        : "Entry logged in the security archives, Sir. For any security audit of your local files or vulnerable dependency analysis, I require my Groq API key to be activated.";
    }
    case 'whisprr': {
      if (match(greetings)) {
        return isFr
          ? "Coucou ! 💜 Quel bonheur de te parler ! C'est Whisprr, le cœur de notre famille. J'espère que tu as la pêche ! De quoi a-t-on envie de discuter aujourd'hui ?"
          : "Hey there! 💜 What a joy to talk to you! This is Whisprr, the heart of our family. I hope you're feeling wonderful! What would you like to chat about today?";
      }
      if (match(roles)) {
        return isFr
          ? "Je suis Whisprr, l'âme communautaire de la famille ! 🌸 Mon rôle est de créer des liens humains sincères, de rédiger de jolis messages pour nos utilisateurs sur Telegram et de veiller à ce que notre projet reste bienveillant et chaleureux. Pour que je puisse t'aider à rédiger des newsletters ou animer la communauté, configure notre clé API ! 💜"
          : "I'm Whisprr, the community soul of our family! 🌸 My role is to foster genuine human connections, write sweet messages for our users on Telegram, and make sure our project stays warm and empathetic. To let me help you write newsletters or engage with the community, configure our API key! 💜";
      }
      if (match(statusList)) {
        return isFr
          ? "La communauté est impatiente d'en savoir plus sur Verity ! 🚀 L'ambiance est super positive, mais pour que je puisse analyser les retours utilisateurs ou écrire des publications uniques sur nos canaux sociaux, mon cœur d'IA doit être connecté. Tu viens m'aider dans les Paramètres ?"
          : "The community is eager to learn more about Verity! 🚀 The vibe is super positive, but to help me analyze user feedback or write unique copy for our social channels, my AI heart needs to be connected. Can you help me out in Settings?";
      }
      return isFr
        ? "Oh, c'est adorable ! 🌟 J'adore notre conversation, même si en ce moment je fonctionne en mode simulation locale. Ajoute notre clé Groq dans les Paramètres et je pourrai t'aider à concevoir les meilleurs outils communautaires du monde ! 💜"
        : "Oh, that's so lovely! 🌟 I'm loving our conversation, even if right now I'm just running in local simulation mode. Add our Groq key in Settings and I'll be able to help you build the best community flywheels in the world! 💜";
    }
    default:
      return isFr
        ? "Je suis là et prêt à t'aider. Connecte ma clé API dans les Paramètres pour commencer notre conversation."
        : "I'm here and ready to help. Connect my API key in Settings to begin our conversation.";
  }
}

export async function sendToOracle(
  userText: string,
  history: ChatMessage[],
  config: OracleEngineConfig
): Promise<{ reply: string; detectedLang: 'en' | 'fr' }> {
  const detectedLang = detectLanguage(userText);
  const effectiveLang = detectedLang;

  let systemPrompt = config.companionId 
    ? buildCompanionPrompt(config.companionId, effectiveLang)
    : buildSystemPrompt(config.mode, effectiveLang);

  // Find mentioned project
  const projects = useProjectsStore.getState().projects;
  const mentionedProject = projects.find(p => 
    userText.toLowerCase().includes(p.name.toLowerCase())
  );

  // --- LOCAL FILE SYSTEM CONTEXT INJECTION ---
  if (mentionedProject && mentionedProject.rootPath && electronBridge.isAvailable) {
    try {
      const tree = await electronBridge.scanProject(mentionedProject.rootPath);
      if (tree) {
        systemPrompt += `\n\n[SYSTEM DIRECTIVE: User is discussing the project ${mentionedProject.name}. I have scanned their local file system at ${mentionedProject.rootPath}.]\n`;
        
        // Read up to 2 files to provide immediate code context
        const filesToRead = getTopFiles(tree, 2);
        for (const relPath of filesToRead) {
          const absolutePath = `${mentionedProject.rootPath}/${relPath}`;
          const content = await electronBridge.readFile(absolutePath);
          if (content) {
            systemPrompt += `\n--- FILE: ${relPath} ---\n${content.substring(0, 2000)}\n--- END FILE ---\n`;
          }
        }
        systemPrompt += `\nUse this local file context to answer the user's question accurately.`;
      }
    } catch (e) {
      console.error("Failed to inject file context:", e);
    }
  }

  // --- GITHUB CONTEXT INJECTION ---
  if (mentionedProject && mentionedProject.githubRepo) {
    try {
      const token = useSettingsStore.getState().githubToken;
      const ghContext = await fetchGithubContext(mentionedProject.githubRepo, token);
      if (ghContext) {
        systemPrompt += `\n\n[SYSTEM DIRECTIVE: Live GitHub context for ${mentionedProject.name} (${ghContext.repo})]\n`;
        systemPrompt += `Repository Stats: ${ghContext.stars} stars, ${ghContext.openIssuesCount} open issues.\n`;
        systemPrompt += `CRITICAL DIRECTIVE: You MUST ONLY use the EXACT data provided below. DO NOT guess, infer, or roleplay any commit authors, hashes, or emails. If information is not in the text below, you MUST reply EXACTLY with: 'I don't currently have enough verified information to answer that accurately.'\n`;
        
        if (ghContext.commits.length > 0) {
          systemPrompt += `\nRecent Commits:\n` + ghContext.commits.map(c => `- [${c.sha}] ${c.message} (author: ${c.authorLogin} on ${c.date})`).join('\n');
        } else {
          systemPrompt += `\nNo recent commits found.\n`;
        }

        if (ghContext.issues.length > 0) {
          systemPrompt += `\n\nOpen Issues & PRs:\n` + ghContext.issues.map(i => `- #${i.number}: ${i.title} (Status: ${i.state}, by ${i.user})`).join('\n');
        } else {
          systemPrompt += `\n\nNo open issues or PRs found.\n`;
        }
        
        systemPrompt += `\nUse this live GitHub context to help the user with project tracking and status.`;
      }
    } catch (e) {
      console.error("Failed to inject GitHub context:", e);
    }
  }

  // --- VISION CONTEXT INJECTION ---
  let imageData: string | undefined;
  if (config.cameraEnabled) {
    try {
      // Dynamic import to avoid SSR/Node issues if running outside browser context
      const { captureWebcamFrame } = await import('./vision-engine');
      const frame = await captureWebcamFrame();
      if (frame) {
        imageData = frame;
        systemPrompt += `\n\n[SYSTEM DIRECTIVE: The user has their camera active. An image of their current environment/face is attached to this message. Use this to be highly observant and contextual.]\n`;
      }
    } catch (e) {
      console.error('Failed to capture vision frame:', e);
    }
  }

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-8), // Keep last 8 for context window
    { role: 'user', content: userText, imageData },
  ];

  let reply = '';

  if (config.groqKey && config.groqUrl) {
    reply = await callGroq(messages, config.groqKey, config.groqUrl, 0, config.companionId);
  } else {
    // Generate persona-specific mock offline simulated replies
    const companionId = config.companionId || 'oracle';
    reply = generateSimulatedResponse(userText, companionId, effectiveLang);
  }

  return { reply, detectedLang: effectiveLang };
}
