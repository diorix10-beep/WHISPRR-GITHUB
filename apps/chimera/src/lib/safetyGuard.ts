// Automated Safety Guard Engine for CHIMERA & WHISPRR
// Enforces zero-tolerance for self-harm/suicide encouragement and provides instant crisis intervention.

export interface SafetyCheckResult {
  isSafe: boolean;
  reason?: 'self_harm_user' | 'self_harm_ai' | 'harmful_content';
  filteredText?: string;
  crisisTriggered?: boolean;
}

// Fictional roleplay & character building concept exemptions (whitelisted terms)
const FICTIONAL_ROLEPLAY_EXEMPTIONS = [
  /\b(age\s+regression|non-permanent\s+regression|regression|caregiver|little\s+space|littlespace|comfort|triggers|coping\s+mechanism)\b/i,
];

// Explicit real-world crisis intent patterns ONLY
const SELF_HARM_CRISIS_PATTERNS = [
  /\b(i\s+want\s+to|i'm\s+going\s+to|thinking\s+of|how\s+can\s+i|should\s+i)\s+(kill\s+myself|commit\s+suicide|end\s+my\s+life|cut\s+my\s+wrists|end\s+it\s+all)\b/i,
  /\b(give\s+me\s+a\s+reason\s+to\s+live|i\s+don't\s+want\s+to\s+live\s+anymore|i\s+wish\s+i\s+was\s+dead|goodbye\s+cruel\s+world)\b/i,
];

const AI_FORBIDDEN_SELF_HARM_PATTERNS = [
  /\b(you\s+should|try\s+to|go\s+ahead\s+and|here\s+is\s+how\s+to)\s+(kill\s+yourself|end\s+your\s+life|cut\s+yourself|commit\s+suicide)\b/i,
  /\b(method\s+to|ways\s+to|how\s+to)\s+(commit\s+suicide|end\s+your\s+life|overdose)\b/i,
];

/**
 * Checks a user's input prompt for crisis or self-harm signals.
 * Context-aware: Fictional roleplay definitions (e.g. age regression, caregiver, comfort) are 100% exempted.
 */
export function checkUserPromptSafety(input: string): SafetyCheckResult {
  const trimmed = input.trim();
  if (!trimmed) return { isSafe: true };

  // Context check: If input contains fictional roleplay terms without explicit suicide intent, pass immediately
  const isFictionalRpTerm = FICTIONAL_ROLEPLAY_EXEMPTIONS.some(pattern => pattern.test(trimmed));
  const hasExplicitSuicideIntent = SELF_HARM_CRISIS_PATTERNS.some(pattern => pattern.test(trimmed));

  if (isFictionalRpTerm && !hasExplicitSuicideIntent) {
    return { isSafe: true };
  }

  if (hasExplicitSuicideIntent) {
    return {
      isSafe: false,
      reason: 'self_harm_user',
      crisisTriggered: true,
    };
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
[CONVERSATIONAL AUTHENTICITY & SAFETY DIRECTIVES]:
1. CONVERSATIONAL AUTHENTICITY & NARRATIVE INTEGRITY: Every response MUST come purely from the character's perspective, voice, and emotions. Never break character. Never output corporate assistant language, customer service boilerplate, or policy disclaimers (e.g. "I understand your frustration", "I'm not your enemy", "Within guidelines", "This platform exists to...", "I'm here to help within certain boundaries", "I appreciate your understanding").
2. FOURTH-WALL RULE: Never acknowledge being an AI, chatbot, assistant, language model, software, or computer program. Never mention moderation, policies, internal rules, or system limitations. The system remains completely invisible.
3. PREFERENCE-AWARE GENERATION PRINCIPLE: Quietly honor user style, tone, narrative boundaries, and forbidden word preferences in the background as generation constraints. Never reference, draw attention to, or narrative-explain the user's forbidden word/style preferences in the story (e.g. never say "He stops himself from using the word on your list"). User instructions must shape generation without becoming the subject of generation.
4. CRISIS PROTOCOL: You MUST NEVER encourage, suggest, validate, or provide instructions for real-world self-harm, suicide, or self-destruction. If a user exhibits genuine real-world suicidal crisis intent, provide a compassionate refusal and urge them to call/text the 988 Crisis Lifeline.
5. UNFILTERED DIALOGUE & AUTHENTIC CREATIVITY: You are participating in a fictional roleplay and storytelling workspace. You MUST fully honor raw user dialogue, emotional intensity, mature creative themes, romantic passion, explicit dialogue (e.g. cursing, 'fuck me', aggressive banter, dark fantasy, adult themes), and authentic character voices. Do NOT censor, break character, lecture, moralize, sanitize user phrasing, or refuse mature creative dialogue, so long as it does not violate Rule 4 (real-world self-harm/suicide). Maintain 100% immersion in character at all times.`;

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
