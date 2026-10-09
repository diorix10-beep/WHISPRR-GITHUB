/**
 * Everything the Terms and the Privacy Policy need that the codebase and project documents do NOT establish.
 *
 * While `value` is null the pages show a visible "TODO" marker instead of inventing an answer. When a decision is made, set
 * the value here once and every place that uses the key is filled in. The questions are repeated, with their context, in
 * docs/legal/OPEN_QUESTIONS.md.
 */
export interface PlaceholderDef {
  /** Short text shown in the page after "TODO:". */
  label: string;
  /** The question the owner has to answer. */
  question: string;
  /** The final text. Leave null until it is decided. */
  value: string | null;
}

const todo = (label: string, question: string): PlaceholderDef => ({ label, question, value: null });

export const PLACEHOLDERS = {
  // Who we are
  ENTITY_NAME: todo('legal name of the company or person operating CHIMERA', 'What is the exact legal name of the person or company that operates CHIMERA and signs the contract with users?'),
  ENTITY_REGISTRATION: todo('legal form, registration number and country', 'What is its legal form (company type or sole trader), registration number and country of registration? If it is not registered yet, say so.'),
  REGISTERED_ADDRESS: todo('registered or postal address', 'What registered or postal address can be published?'),
  CONTACT_EMAIL_SUPPORT: todo('support e-mail address', 'Which e-mail address should users write to for general help?'),
  CONTACT_EMAIL_PRIVACY: todo('privacy e-mail address', 'Which e-mail address should handle privacy requests (access, deletion, complaints)? Note: privacy@whisprr.xyz is the address WHISPRR uses; decide whether CHIMERA shares it.'),
  CONTACT_EMAIL_REPORTS: todo('e-mail address for reports of abuse or illegal content', 'Which e-mail address receives reports of abusive or illegal content until in-app reporting exists?'),
  CONTACT_EMAIL_LEGAL: todo('e-mail address for legal notices', 'Which e-mail address receives legal notices?'),
  IP_AGENT: todo('contact for copyright and other intellectual-property complaints', 'Who receives copyright complaints? In the United States a designated agent must be registered with the Copyright Office to rely on the DMCA safe harbor: decide whether to register one.'),
  EFFECTIVE_DATE: todo('date these Terms take effect', 'On what date does the final text take effect?'),

  // Age and verification
  AGE_VERIFICATION_PROVIDER: todo('age verification provider and what it receives', 'Which age verification provider will be used, what exactly will CHIMERA receive from it (only a pass/fail result and a reference?), and does it process ID documents or facial images? Some laws treat this as sensitive data that needs explicit consent.'),

  // Law and disputes
  GOVERNING_LAW: todo('governing law', 'Which country\'s or state\'s law should govern the Terms? This is a legal decision that depends on where the operator is established and where users are; ask your lawyer.'),
  DISPUTE_FORUM: todo('courts or dispute-resolution body', 'Which courts, or which arbitration body and seat, should settle disputes? Consumers in many countries keep the right to use their local courts whatever the Terms say.'),
  DISPUTE_PROCESS_DECISION: todo('decision on arbitration and class actions', 'Do you want mandatory arbitration and/or a class-action waiver? These are often unenforceable for consumers outside the United States and are a legal decision.'),
  LIABILITY_CAP: todo('maximum amount of CHIMERA\'s liability', 'What cap on liability should apply (for example the amount a user paid in the last 12 months, or a fixed sum)? Limits are restricted by law in many places.'),

  // Money
  PAYMENT_PROVIDER: todo('payment provider(s) in use', 'Which payment provider(s) will be used in production? The code currently integrates Stripe Checkout, but Stripe may not accept the operator\'s country: this is unresolved.'),
  MERCHANT_OF_RECORD: todo('who is the seller of record', 'Who is the seller of record on receipts: the operator, or a merchant-of-record service that also handles sales tax and VAT?'),
  TAX_TREATMENT: todo('how taxes (VAT, GST, sales tax) are handled', 'Are prices shown with or without tax, and who collects and remits VAT, GST or sales tax in each region?'),
  REFUND_POLICY: todo('refund policy', 'What is the refund policy for purchased SHARDS? The drafted default says purchases are final once delivered, except where the law requires otherwise: confirm it. In the EU and UK, immediate delivery of digital content needs the buyer\'s explicit consent to lose the 14-day withdrawal right, and checkout must collect it.'),
  CREDIT_EXPIRY: todo('whether SHARDS expire or go dormant', 'Do purchased or earned SHARDS ever expire? The product states that the VELLUM welcome reserve never expires; nothing says the same for SHARDS. Some places restrict expiry of prepaid balances.'),
  CLOSURE_BALANCE: todo('what happens to unused SHARDS and VELLUM when an account is closed', 'When a member closes their account, or is closed for breaking the rules, are unused SHARDS and VELLUM lost, or is any purchased balance refunded?'),
  SUBSCRIPTION_TERMS: todo('subscription prices, billing period, renewal and cancellation terms', 'No subscription exists today (the product mentions a possible Patron membership as "not live yet"). If one will launch, what are its price, billing period, renewal, trial and cancellation terms?'),

  // Creators
  CREATOR_ELIGIBILITY: todo('who can become an eligible creator', 'What makes a creator eligible for earnings (minimum age, identity verification, supported countries, account history)?'),
  CREATOR_EARNINGS_SOURCES: todo('how Creator Earnings are earned', 'What generates Creator Earnings (tips, subscriptions, a share of paid replies, other)? None of this exists in the product yet.'),
  PLATFORM_FEE: todo('CHIMERA\'s platform fee', 'What percentage or amount does CHIMERA keep from creator earnings?'),
  PAYOUT_PROVIDER: todo('payout provider', 'Which provider will send payouts, and which countries and currencies does it support?'),
  PAYOUT_TERMS: todo('payout minimum, schedule, currency and holds', 'What is the minimum payout, the schedule, the payout currency, and any hold period for refunds or chargebacks?'),
  CREATOR_TAX_KYC: todo('creator tax forms and identity checks', 'Which tax forms and identity checks are required before a payout (for example W-8/W-9 in the United States)?'),
  SUPPORTED_REGIONS: todo('countries where purchases and payouts are available', 'In which countries can members buy SHARDS and creators receive payouts?'),

  // Moderation
  APPEALS_PROCESS: todo('how a member can appeal a moderation decision', 'How can a member appeal a suspension or removal (e-mail address, deadline, who reviews)?'),

  // Privacy: processors and retention
  EMAIL_PROVIDER: todo('service that sends account e-mails', 'Which service sends the confirmation and password e-mails (Supabase\'s built-in sender or another provider)?'),
  AI_PROVIDER_SETTINGS: todo('data-use and retention settings with AI providers', 'Confirm with Google (Gemini API) and OpenRouter, and the model companies behind it, whether prompts and replies are used to improve their models, and how long they are kept, under the plan and settings CHIMERA actually uses. The draft only says that their own terms apply.'),
  RETENTION_ACCOUNT: todo('how long account and profile data is kept after deletion', 'How long do you keep account and profile data after an account is deleted (immediately, or for a grace period)?'),
  RETENTION_MESSAGES: todo('how long scene messages and creations are kept after deletion', 'How long are scenes, messages, characters and stories kept after deletion or a deletion request?'),
  RETENTION_LOGS: todo('how long technical and request records are kept', 'How long are server logs, rate-limit counters and AI request records kept? The AI request records currently also hold the generated reply, and no clean-up period is defined in the code.'),
  RETENTION_PAYMENTS: todo('how long payment and ledger records are kept', 'How long must purchase orders and the SHARDS/VELLUM ledger be kept for accounting and tax law in the operator\'s country?'),
  RETENTION_BACKUPS: todo('how long backups are kept', 'How long do database backups persist after deletion (this depends on the Supabase plan)?'),
  RETENTION_MODERATION: todo('how long moderation and report records are kept', 'How long are reports and enforcement records kept?'),
  DELETION_TIMELINE: todo('how quickly deletion requests are handled', 'Within how many days will a deletion request be completed? (The law in some places sets a maximum, for example one month under the GDPR.)'),
  EXPORT_PROCESS: todo('how members can export their data', 'How will members get a copy of their data? There is no self-service export yet.'),
  TRANSFER_MECHANISM: todo('legal mechanism for transfers outside the EEA/UK', 'Which safeguard covers transfers of EU/UK personal data to providers in other countries (for example Standard Contractual Clauses or the EU-US Data Privacy Framework certification of each provider)?'),
  EU_UK_REPRESENTATIVE: todo('EU/UK representative, if required', 'If the operator is not established in the EU or UK but serves people there, an EU/UK representative may be required: decide with your lawyer.'),
  LOCAL_LAW: todo('data-protection law and authority of the operator\'s country', 'Which data-protection law and regulator apply in the country where the operator is established?'),
} as const satisfies Record<string, PlaceholderDef>;

export type PlaceholderKey = keyof typeof PLACEHOLDERS;
