import type { SupabaseClient } from '@supabase/supabase-js';
import { replyCost, type ChatModel } from '../../src/lib/chatModels.js';
import { RequestError } from './requestProtection.js';

/** The request a reply is generated for, as returned when it was reserved. */
interface Reservation {
  id: string;
  lease: string;
}

/**
 * Takes the price of a reply from the member's SHARDS before a paid model is called. Free models take
 * nothing. Returns the SHARDS charged. `onAttempt` runs just before the charge is sent, so the caller
 * knows to refund even if the answer never came back.
 */
export async function chargeForReply(admin: SupabaseClient, reservation: Reservation, model: ChatModel, onAttempt: () => void): Promise<number> {
  const cost = replyCost(model);
  if (cost <= 0) return 0;
  onAttempt();
  const { error } = await admin.rpc('charge_chimera_reply', {
    p_request_id: reservation.id,
    p_lease: reservation.lease,
    p_amount: cost,
    p_model: model.name,
  });
  if (!error) return cost;
  if (error.code === 'CH402' || /insufficient_shards/.test(error.message ?? '')) {
    throw new RequestError(402, `${model.name} costs ${cost} SHARDS per reply and your reserve is not enough. Get more SHARDS, or choose SUPERNOVA in the Model House.`);
  }
  throw new RequestError(503, 'SHARDS could not be charged right now. Anything taken is returned to your reserve; please retry.');
}

/**
 * Gives back what a reply cost when no reply was delivered. Never throws: a refund that cannot run now
 * is picked up by the stale-charge sweep the next time the member is charged.
 */
export async function refundUndeliveredReply(admin: SupabaseClient, reservation: Reservation): Promise<void> {
  await admin.rpc('refund_chimera_reply', { p_request_id: reservation.id, p_lease: reservation.lease }).then(() => undefined, () => undefined);
}
