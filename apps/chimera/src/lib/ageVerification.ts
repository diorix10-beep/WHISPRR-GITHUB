/**
 * Age verification is not connected to a provider yet, so the Guardian's Library is shown as
 * "coming soon" and the pages that point to it say so. Nothing is relaxed by this: Mature and Adult
 * content stays locked by the database and the server, which only open for a verified account.
 *
 * Switch this to `true` when verification goes live. Every "coming soon" label, the menu tag, the
 * footer, the Guardian's Library page and the wording in Discover and in locked scenes follow it.
 */
export const AGE_VERIFICATION_LIVE: boolean = false;
