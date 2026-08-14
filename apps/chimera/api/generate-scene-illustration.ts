import { createClient } from '@supabase/supabase-js';

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

  let illustrationId: string | null = null;
  let storagePath: string | null = null;
  const adminSupabase = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

  try {
    const payload = await req.json();
    const storyId = typeof payload.story_id === 'string' ? payload.story_id : '';
    const chapterId = typeof payload.chapter_id === 'string' ? payload.chapter_id : null;
    const prompt = typeof payload.prompt === 'string' ? payload.prompt : '';
    const style = typeof payload.style === 'string' ? payload.style : '';
    const aspectRatio = typeof payload.aspect_ratio === 'string' ? payload.aspect_ratio : '';
    if (!storyId || !prompt) return jsonResponse({ error: 'Choose a story and describe the scene first.' }, 400);

    const { data: startedId, error: startError } = await adminSupabase.rpc('begin_vellum_scene_illustration', {
      p_user_id: user.id,
      p_story_id: storyId,
      p_chapter_id: chapterId,
      p_prompt: prompt,
      p_style: style,
      p_aspect_ratio: aspectRatio,
      p_vellum_cost: SCENE_ILLUSTRATION_COST,
    });
    if (startError || !startedId) return jsonResponse({ error: startError?.message || 'CHIMERA could not reserve VELLUM for this scene.' }, 400);
    illustrationId = startedId;

    const sceneDirection = `Create one ${style.replace('_', ' ')} illustration for a fictional story scene. Aspect ratio: ${aspectRatio}. Do not add captions, words, logos, watermarks, UI, or borders. Depict fictional characters only; never a real person, celebrity, or recognizable public figure. Do not depict minors in sexual or romanticized contexts. Preserve the scene's mood, setting, and story specificity.\n\nScene direction from the author:\n${prompt.trim()}`;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_MODEL}:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: sceneDirection }] }],
        generationConfig: {
          responseModalities: ['IMAGE'],
          responseFormat: { image: { aspectRatio } },
        },
      }),
    });
    if (!response.ok) {
      console.error('Gemini scene illustration failed', response.status, await response.text());
      throw new Error('CHIMERA could not create this scene illustration.');
    }

    const generation = await response.json();
    const parts = generation.candidates?.flatMap((candidate: any) => candidate?.content?.parts || []) || [];
    const imagePart = parts.find((part: any) => typeof part?.inlineData?.data === 'string');
    const mimeType = imagePart?.inlineData?.mimeType;
    if (!imagePart || !['image/png', 'image/jpeg', 'image/webp'].includes(mimeType)) {
      throw new Error('CHIMERA did not receive a usable image for this scene.');
    }

    storagePath = `${user.id}/${illustrationId}.${extensionFor(mimeType)}`;
    const imageBytes = Uint8Array.from(atob(imagePart.inlineData.data), (character) => character.charCodeAt(0));
    const { error: uploadError } = await adminSupabase.storage.from('story-illustrations').upload(storagePath, imageBytes, {
      contentType: mimeType,
      upsert: false,
    });
    if (uploadError) throw uploadError;

    const { error: completeError } = await adminSupabase.rpc('complete_vellum_scene_illustration', {
      p_illustration_id: illustrationId,
      p_storage_path: storagePath,
    });
    if (completeError) throw completeError;

    const { data: signed, error: signedError } = await adminSupabase.storage.from('story-illustrations').createSignedUrl(storagePath, 60 * 60);
    if (signedError || !signed?.signedUrl) throw new Error('Your illustration was made, but its private preview could not be opened.');

    return jsonResponse({
      illustration: { id: illustrationId, storage_path: storagePath, signed_url: signed.signedUrl, vellum_cost: SCENE_ILLUSTRATION_COST },
    });
  } catch (error) {
    console.error('Scene illustration failed', error);
    if (storagePath) await adminSupabase.storage.from('story-illustrations').remove([storagePath]);
    if (illustrationId) {
      const { error: refundError } = await adminSupabase.rpc('refund_vellum_scene_illustration', { p_illustration_id: illustrationId });
      if (refundError) console.error('Scene illustration refund failed', refundError);
    }
    return jsonResponse({ error: error instanceof Error ? `${error.message} Your VELLUM has been refunded.` : 'CHIMERA could not create this scene. Your VELLUM has been refunded.' }, 502);
  }
}
