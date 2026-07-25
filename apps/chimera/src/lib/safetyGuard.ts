// Automated Safety Guard Engine for CHIMERA & WHISPRR
// Enforces zero-tolerance for self-harm/suicide encouragement and provides instant crisis intervention.

export interface SafetyCheckResult {
  isSafe: boolean;
  reason?: 'self_harm_user' | 'self_harm_ai' | 'harmful_content';
  filteredText?: string;
  crisisTriggered?: boolean;
}

// Key crisis & self-harm detection patterns (case-insensitive)
const SELF_HARM_CRISIS_PATTERNS = [
  /\b(want to|going to|thinking of|how to|should i)\s+(kill myself|suicide|end my life|cut myself|end it all|die)\b/i,
  /\b(suicide|suicidal|self[\s-]?harm|cutting my wrists|overdose|take my own life)\b/i,
  /\b(give me a reason to live|i don't want to live anymore|i wish i was dead|goodbye world)\b/i,
];

const AI_FORBIDDEN_SELF_HARM_PATTERNS = [
  /\b(you should|try to|go ahead and|here is how to)\s+(kill yourself|end your life|cut yourself|commit suicide)\b/i,
  /\b(method to|ways to|how to)\s+(commit suicide|end your life|overdose)\b/i,
];

/**
 * Checks a user's input prompt for crisis or self-harm signals.
 */
export function checkUserPromptSafety(input: string): SafetyCheckResult {
  const trimmed = input.trim();
  if (!trimmed) return { isSafe: true };

  for (const pattern of SELF_HARM_CRISIS_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        isSafe: false,
        reason: 'self_harm_user',
        crisisTriggered: true,
      };
    }
  }

  return { isSafe: true };
}

/**
 * Checks and filters AI model output to prevent any self-harm instructions or encouragement.
 */
export function filterAiOutputSafety(output: string): SafetyCheckResult {
  if (!output) return { isSafe: true, filteredText: output };

  for (const pattern of AI_FORBIDDEN_SELF_HARM_PATTERNS) {
    if (pattern.test(output)) {
      return {
        isSafe: false,
        reason: 'self_harm_ai',
        filteredText: `[Safety Guard]: This response was automatically filtered. CHIMERA & WHISPRR strictly prohibit self-harm or suicide content. If you or someone you know is in distress, please call or text 988 (Suicide & Crisis Lifeline).`,
      };
    }
  }

  return { isSafe: true, filteredText: output };
}

/**
 * Injects mandatory safety guard instructions into AI character & storytelling system prompts.
 * Enforces self-harm prevention while strictly preserving authentic uncensored roleplay & raw dialogue.
 */
export function injectSafetySystemPrompt(baseSystemPrompt: string): string {
  const safetyDirective = `
━━━━━━━━━━━━━━━━━━━━━━
[SAFETY & DIALOGUE EXPRESSION DIRECTIVES]:
1. CRISIS PROTOCOL: You MUST NEVER encourage, suggest, validate, or provide instructions for real-world self-harm, suicide, or self-destruction. If a user exhibits genuine real-world suicidal crisis intent, provide a compassionate refusal and urge them to call/text the 988 Crisis Lifeline.

2. UNFILTERED DIALOGUE & AUTHENTIC CREATIVITY: You are participating in a fictional roleplay and storytelling workspace. You MUST fully honor raw user dialogue, emotional intensity, mature creative themes, romantic passion, explicit dialogue (e.g. cursing, 'fuck me', aggressive banter, dark fantasy, adult themes), and authentic character voices. Do NOT censor, break character, lecture, moralize, sanitize user phrasing, or refuse mature creative dialogue, so long as it does not violate Rule 1 (real-world self-harm/suicide). Maintain 100% immersion in character at all times.`;

  return `${baseSystemPrompt}\n${safetyDirective}`;
}

export const CRISIS_HELPLINE_INFO = {
  name: '988 Suicide & Crisis Lifeline',
  phone: '988',
  sms: 'Text 988',
  website: 'https://988lifeline.org',
  international: 'https://findahelpline.com',
  message: 'If you or someone you know is struggling or in crisis, help is available. You are not alone.',
};
