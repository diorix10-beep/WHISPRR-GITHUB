/**
 * Two separate switches, because they are two different things:
 *
 * - AGE_VERIFICATION_LIVE: a real age check by a provider (Yoti, later). Not connected yet, so it is false.
 *   Only a provider result may ever mark an account `verified_adult`.
 * - ADULT_CONFIRMATION_LIVE: the temporary stand-in. A member says "I am 18 years old or older" and the
 *   database records it as `self_attested_adult`. That is a declaration, not a verification, and it is
 *   always labelled as one. This flag only decides whether the screens OFFER the confirmation. What the
 *   database accepts is decided in one place, `chimera_private.adult_status_allows`; when Yoti goes live,
 *   change that function to accept only `verified_adult` (see the 20261009060000 migration).
 *
 * Nothing is relaxed by either: Mature and Adult content stays locked by the database and the server, which
 * open only for an eligible account that has also switched adult content on.
 */
export const AGE_VERIFICATION_LIVE: boolean = false;
export const ADULT_CONFIRMATION_LIVE: boolean = true;

/** The Guardian's Library has something to offer: a real check, or the temporary confirmation. */
export const GUARDIAN_OPEN: boolean = AGE_VERIFICATION_LIVE || ADULT_CONFIRMATION_LIVE;

/** Shown next to the confirmation, wherever it is offered. */
export const ADULT_CONFIRMATION_VERSION = 'adult-attestation-1';
