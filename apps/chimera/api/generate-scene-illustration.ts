import { refreshIllustrationResult } from './_lib/illustrationResult.js';
import { createClient } from '@supabase/supabase-js';
import { fingerprint, finishRequest, providerFetch, readPayload, requestFailure, RequestError, reserveRequest, uuid } from './_lib/requestProtection.js';

export const config = { runtime: 'edge' };

const SCENE_ILLUSTRATION_COST = 400;
const IMAGE_MODEL = 'gemini-2.5-flash-image';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function extensionFor(mimeType: string) {
  if (mimeType === 'image/jpeg') return 'jpg';
  if (mimeType === 'image/webp') return 'webp';
  return 'png';
}

export default async function handler(req: Request) {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  const authHeader = req.headers.get('Authorization');
  const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const geminiKey = process.env.GEMINI_API_KEY_SERVER || process.env.GEMINI_API_KEY || '';

  if (!authHeader || !supabaseUrl || !supabaseAnonKey) return jsonResponse({ error: 'Please sign in before illustrating a scene.' }, 401);
  if (!serviceRoleKey || !geminiKey) return jsonResponse({ error: 'Scene Illustration is not configured yet. No VELLUM was used.' }, 503);

  const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: { user }, error: userError } = await userSupabase.auth.getUser();
  if (userError || !user) return jsonResponse({ error: 'Please sign in before illustrating a scene.' }, 401);

  let requestReservation: Awaited<ReturnType<typeof reserveRequest>> | undefined;
  let completionAttempted = false;
  let beginAttempted = false;
  let illustrationId: string | null = null;
  let storagePath: string | null = null;
  const adminSupabase = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

  try {
    const payload = await readPayload(req);
    const storyId = typeof payload.story_id === 'string' ? payload.story_id : '';
    const chapterId = typeof payload.chapter_id === 'string' ? payload.chapter_id : null;
    const prompt = typeof payload.prompt === 'string' ? payload.prompt : '';
    const style = typeof payload.style === 'string' ? payload.style : '';
    const aspectRatio = typeof payload.aspect_ratio === 'string' ? payload.aspect_ratio : '';
    if (!uuid(storyId) || (chapterId && !uuid(chapterId)) || !prompt.trim() || prompt.length > 1800 || !['cinematic','painterly','graphic_novel'].includes(style) || !['16:9','4:5','1:1'].includes(aspectRatio)) throw new RequestError(400, 'Choose a story and a supported scene format first.');
    const { data: story } = await userSupabase.from('stories').select('user_id').eq('id', storyId).maybeSingle();
    if (story?.user_id !== user.id) throw new RequestError(403, 'Only the author can illustrate this story.');
    requestReservation = await reserveRequest(adminSupabase, user.id, 'illustration', storyId, req.headers.get('Idempotency-Key') || '', await fingerprint(payload));
    if (requestReservation.state === 'completed') return jsonResponse(await refreshIllustrationResult(adminSupabase,user.id,requestReservation.result));

    beginAttempted = true;
    const { data: startedId, error: startError } = await adminSupabase.rpc('begin_guarded_chimera_illustration', {
      p_request_id: requestReservation.id, p_lease: requestReservation.lease,
      p_story_id: storyId,
      p_chapter_id: chapterId,
      p_prompt: prompt,
      p_style: style,
      p_aspect_ratio: aspectRatio,
    });
    if (startError || !startedId) throw new RequestError(400, 'CHIMERA could not reserve VELLUM for this scene.');
    illustrationId = startedId;

    const sceneDirection = `Create one ${style.replace('_', ' ')} illustration for a fictional story scene. Aspect ratio: ${aspectRatio}. Do not add captions, words, logos, watermarks, UI, or borders. Depict fictional characters only; never a real person, celebrity, or recognizable public figure. Do not depict minors in sexual or romanticized contexts. Preserve the scene's mood, setting, and story specificity.\n\nScene direction from the author:\n${prompt.trim()}`;
    const response = await providerFetch(`https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_MODEL}:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: sceneDirection }] }],
        generationConfig: {
          responseModalities: ['IMAGE'],
          responseFormat: { image: { aspectRatio } },
        },
      }),
    }, 90_000);
    if (!response.ok) {

      throw new Error('CHIMERA could not create this scene illustration.');
    }

    const generation = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }> } }> };
    const parts = generation.candidates?.flatMap((candidate) => candidate?.content?.parts || []) || [];
    const imagePart = parts.find((part) => typeof part?.inlineData?.data === 'string');
    const mimeType = imagePart?.inlineData?.mimeType;
    if (!imagePart?.inlineData?.data || !mimeType || !['image/png', 'image/jpeg', 'image/webp'].includes(mimeType)) {
      throw new Error('CHIMERA did not receive a usable image for this scene.');
    }

    storagePath = `${user.id}/${illustrationId}.${extensionFor(mimeType)}`;
    const imageBytes = Uint8Array.from(atob(imagePart.inlineData.data), (character) => character.charCodeAt(0));
    const { error: uploadError } = await adminSupabase.storage.from('story-illustrations').upload(storagePath, imageBytes, {
      contentType: mimeType,
      upsert: false,
    });
    if (uploadError) throw uploadError;

    const { data: signed, error: signedError } = await adminSupabase.storage.from('story-illustrations').createSignedUrl(storagePath, 60 * 60);
    if (signedError || !signed?.signedUrl) throw new Error('Your illustration was made, but its private preview could not be opened.');

    const result = { illustration: { id: illustrationId, storage_path: storagePath, signed_url: signed.signedUrl, vellum_cost: SCENE_ILLUSTRATION_COST } };
    completionAttempted = true;
    const { error: completeError } = await adminSupabase.rpc('complete_guarded_chimera_illustration', {
      p_request_id: requestReservation.id, p_lease: requestReservation.lease, p_storage_path: storagePath, p_result: result,
    });
    if (completeError) throw new Error('Illustration completion could not be confirmed.');
    return jsonResponse(result);
  } catch (error) {
    if (beginAttempted && !illustrationId && requestReservation) {
      const { data: confirmed, error: confirmationError } = await adminSupabase.rpc('get_chimera_ai_request', { p_request_id: requestReservation.id, p_lease: requestReservation.lease });
      if (confirmationError || !confirmed) return jsonResponse({ error: 'The scene reservation could not be confirmed. Please check your gallery before retrying.' }, 503);
      if (confirmed.state === 'completed') return jsonResponse(await refreshIllustrationResult(adminSupabase,user.id,confirmed.result));
      illustrationId = confirmed.result?.illustration_id || null;
    }
    if (!illustrationId) {
      if (requestReservation?.state === 'reserved') {
        try { await finishRequest(adminSupabase, requestReservation.id, requestReservation.lease, null, true); }
        catch { return jsonResponse({ error: 'The scene reservation could not be released safely. Please check your gallery before retrying.' }, 503); }
      }
      return requestFailure(error);
    }
    if (completionAttempted && requestReservation) {
      const { data: confirmed, error: confirmationError } = await adminSupabase.rpc('get_chimera_ai_request', { p_request_id: requestReservation.id, p_lease: requestReservation.lease });
      if (confirmed?.state === 'completed') return jsonResponse(await refreshIllustrationResult(adminSupabase,user.id,confirmed.result));
      if (confirmationError || !confirmed) return jsonResponse({ error: 'Illustration completion could not be confirmed. Please check your gallery before retrying.' }, 503);
    }
    // Preserve uploaded output after uncertain completion. Orphan cleanup requires operator review;
    // deleting here could remove a paid image after a lost completion acknowledgement.
    let refunded = false;
    if (illustrationId) {
      const { error: refundError } = await adminSupabase.rpc('refund_vellum_scene_illustration', { p_illustration_id: illustrationId });
      refunded = !refundError;
    }
    if (refunded && requestReservation?.state === 'reserved') await finishRequest(adminSupabase, requestReservation.id, requestReservation.lease, null, true).catch(() => undefined);
    return jsonResponse({ error: refunded ? 'CHIMERA could not create this scene. Your VELLUM has been refunded.' : 'CHIMERA could not create this scene. The VELLUM refund could not be confirmed; please contact support.' }, 502);
  }
}
