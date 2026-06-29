-- Switch SECURITY DEFINER functions to SECURITY INVOKER
-- These are called by authenticated users via RPC and should respect RLS

ALTER FUNCTION public.upsert_interest_score(uuid, text, text, numeric) SECURITY INVOKER;
ALTER FUNCTION public.get_personalized_feed(uuid, integer, text) SECURITY INVOKER;
ALTER FUNCTION public.get_recommended_communities(uuid, integer) SECURITY INVOKER;
