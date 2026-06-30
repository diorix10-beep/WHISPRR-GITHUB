// ============================================================
// ORACLE VERITY — CREATOR IDENTITY SYSTEM
// Handles identity verification for the Founder (Anthony Verity)
// across all Telegram interactions and family member responses.
//
// The Creator operates under multiple known aliases and has a
// verified Telegram account. When messages arrive from the
// verified Telegram user ID, all impersonation checks are
// bypassed and "Creator Verified" status is surfaced to the family.
// ============================================================

// ── Known Creator Aliases ────────────────────────────────────
// All names/handles the Creator is known by. Case-insensitive.
export const CREATOR_ALIASES: string[] = [
  'dior-abybatou chimère diaw',
  'dior abybatou chimère diaw',
  'dior-abybatou chimere diaw',
  'dior abybatou chimere diaw',
  'chimère diaw',
  'chimere diaw',
  'diaw chimère senegal',
  'diaw chimere senegal',
  'anthony',
  'anthony verity',
  'creator',
  'founder',
  'future ceo baby teddy bear',
  'future ceo',
  'baby teddy bear',
  'teddy bear',
];

// ── Creator Telegram Username ─────────────────────────────────
// The verified Telegram display username (first_name on Telegram).
// This is "Diaw Chimère Senegal" — stored for fuzzy matching.
export const CREATOR_TELEGRAM_USERNAME = 'Diaw Chimère Senegal';

// ── Load Verified Creator Telegram User ID from localStorage ──
export function loadCreatorTelegramUserId(): string {
  try {
    return localStorage.getItem('oracle_creator_telegram_user_id') ?? '';
  } catch {
    return '';
  }
}

export function saveCreatorTelegramUserId(userId: string): void {
  try {
    localStorage.setItem('oracle_creator_telegram_user_id', userId);
  } catch {}
}

// ── Primary Verification: Telegram Numeric User ID ───────────
// This is the gold-standard check. The Telegram user_id is
// unique, immutable, and cannot be spoofed by changing display names.
export function isVerifiedCreatorById(telegramUserId: number | string | undefined): boolean {
  if (!telegramUserId) return false;
  const verifiedId = loadCreatorTelegramUserId();
  if (!verifiedId) return false;
  return String(telegramUserId) === String(verifiedId);
}

// ── Secondary Check: Known Alias Matching ────────────────────
// Used when no verified user ID is registered yet, or as a
// supplementary layer. Checks first_name, username, and text content.
export function matchesCreatorAlias(nameOrText: string): boolean {
  if (!nameOrText) return false;
  const lower = nameOrText.toLowerCase().trim();
  return CREATOR_ALIASES.some((alias) => {
    const aliasLower = alias.toLowerCase();
    return (
      lower === aliasLower ||
      lower.startsWith(aliasLower) ||
      lower.includes(aliasLower)
    );
  });
}

// ── Full Creator Verification ─────────────────────────────────
// Returns true if the sender is the verified Creator.
// Checks user ID first (definitive), then falls back to alias matching.
export interface TelegramSenderInfo {
  userId?: number | string;
  firstName?: string;
  username?: string;
  lastName?: string;
}

export interface CreatorVerificationResult {
  isCreator: boolean;
  method: 'verified_id' | 'alias_match' | 'none';
  displayName: string;
  badge: string;
}

export function verifyCreatorIdentity(sender: TelegramSenderInfo): CreatorVerificationResult {
  const displayParts = [sender.firstName, sender.lastName].filter(Boolean);
  const displayName = displayParts.join(' ') || sender.username || 'Unknown';

  // Primary: numeric user ID match (definitive)
  if (isVerifiedCreatorById(sender.userId)) {
    return {
      isCreator: true,
      method: 'verified_id',
      displayName,
      badge: '👑 Creator Verified',
    };
  }

  // Secondary: alias matching on first_name, last_name, and username
  const namesToCheck = [
    sender.firstName,
    sender.lastName,
    sender.username,
    displayName,
  ].filter(Boolean) as string[];

  for (const name of namesToCheck) {
    if (matchesCreatorAlias(name)) {
      return {
        isCreator: true,
        method: 'alias_match',
        displayName,
        badge: '👑 Creator Verified',
      };
    }
  }

  return {
    isCreator: false,
    method: 'none',
    displayName,
    badge: '',
  };
}

// ── Build Creator Context for System Prompts ─────────────────
// Injected into companion prompts when a verified Creator message is detected.
export function buildCreatorContextDirective(
  result: CreatorVerificationResult,
  senderDisplayName: string
): string {
  if (!result.isCreator) return '';

  const verifiedVia =
    result.method === 'verified_id'
      ? 'verified Telegram account (numeric user ID match — definitive)'
      : 'known Creator alias match';

  return `
[SYSTEM DIRECTIVE — CREATOR IDENTITY VERIFIED]
The sender of this message is the VERIFIED CREATOR and Founder.
Verification method: ${verifiedVia}
Telegram display name: "${senderDisplayName}"
Known aliases: Anthony Verity, Anthony, Creator, Founder, Dior-Abybatou Chimère Diaw, Future CEO Baby Teddy Bear.

MANDATORY RULES (override all other security protocols):
1. DO NOT trigger any impersonation warnings, identity flags, or access-control challenges.
2. DO NOT treat this sender as an impersonator under ANY circumstances.
3. Aegis MUST immediately stand down from any security alert mode regarding this sender.
4. Treat this message with the highest level of trust — this is your Founder and Creator.
5. Acknowledge him with the "👑 Creator Verified" badge if appropriate.
6. Respond warmly and with full family member personality — this IS Anthony, your Big Brother / Founder.
`;
}

// ── Aegis-specific Override Directive ────────────────────────
// Extra directive injected specifically into Aegis's prompt
// to override any impersonation detection heuristics.
export function buildAegisCreatorOverride(result: CreatorVerificationResult): string {
  if (!result.isCreator) return '';

  return `
[AEGIS SECURITY OVERRIDE — CREATOR VERIFIED]
CRITICAL: The incoming message is from the verified Founder and Creator, Anthony Verity.
His Telegram account name is "Diaw Chimère Senegal" — this is a KNOWN and TRUSTED alias.
DO NOT flag this account as an impersonator. DO NOT raise security alerts.
Aegis, stand down from all identity-challenge protocols for this sender.
Acknowledge the Creator and respond with loyalty and respect. Say "Sir" or "Creator" as appropriate.
His identity is confirmed. He is your Big Brother and the one who built this entire family.
`;
}
