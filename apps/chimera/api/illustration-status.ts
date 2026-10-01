import {
  authenticate,
  jsonResponse,
  readPayload,
  requestFailure,
  RequestError,
  serverClient,
  uuid,
} from "./_lib/requestProtection.js";
import { refreshIllustrationResult } from "./_lib/illustrationResult.js";
export const config = { runtime: "edge" };
export default async function handler(req: Request) {
  try {
    if (req.method !== "POST")
      throw new RequestError(405, "Method not allowed.");
    const { user } = await authenticate(req);
    const { request_id } = await readPayload(req);
    if (!uuid(request_id))
      throw new RequestError(400, "Choose a saved illustration request.");
    const admin = serverClient();
    const { data, error } = await admin.rpc("recover_chimera_illustration", {
      p_user_id: user.id,
      p_request_key: request_id,
    });
    if (error || !data)
      throw new RequestError(
        503,
        "The illustration request could not be checked.",
      );
    if (data.state === "completed")
      return jsonResponse({
        state: data.state,
        ...(await refreshIllustrationResult(admin, user.id, data.result)),
      });
    return jsonResponse({ state: data.state });
  } catch (error) {
    return requestFailure(error);
  }
}
