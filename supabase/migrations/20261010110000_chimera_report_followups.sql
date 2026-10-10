-- CHIMERA: two follow-ups to 20261010100000_chimera_moderation_reports.sql, both found in review.
--
-- FOR REVIEW. Small and idempotent.
--
-- 1. The 2,000-character limit on `reports.details` was put on the whole shared table. WHISPRR's own report form has no
--    limit, so it would have started failing for long explanations. The limit now applies to CHIMERA's reports only.
--    (Contains a DROP CONSTRAINT IF EXISTS of the constraint it recreates right after: run it in the Supabase SQL editor.)
-- 2. The e-mail alert limit (5 in 10 minutes) was counted and claimed in two separate steps, so several reports sent at
--    the same moment could all pass the count. claim_chimera_report_alert does both under one lock. Only the server
--    (service role) can call it.

ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_details_length;
ALTER TABLE public.reports ADD CONSTRAINT reports_details_length CHECK (content_type <> 'chimera_message' OR char_length(coalesce(details, '')) <= 2000);

-- Returns 'claimed' (this report may now be announced), 'already_sent' or 'throttled'.
CREATE OR REPLACE FUNCTION public.claim_chimera_report_alert(p_report_id uuid, p_max integer, p_window_minutes integer)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF p_max IS NULL OR p_max < 1 OR p_window_minutes IS NULL OR p_window_minutes < 1 THEN
    RAISE EXCEPTION 'Invalid limit' USING ERRCODE = '22023';
  END IF;
  -- One at a time: the count and the claim below cannot be interleaved with another request's.
  PERFORM pg_advisory_xact_lock(hashtextextended('chimera:report-alert', 0));
  IF NOT EXISTS (SELECT 1 FROM public.reports WHERE id = p_report_id AND content_type = 'chimera_message' AND alert_sent_at IS NULL) THEN
    RETURN 'already_sent';
  END IF;
  IF (SELECT count(*) FROM public.reports WHERE alert_sent_at >= now() - make_interval(mins => p_window_minutes)) >= p_max THEN
    RETURN 'throttled';
  END IF;
  UPDATE public.reports SET alert_sent_at = now() WHERE id = p_report_id AND alert_sent_at IS NULL;
  RETURN 'claimed';
END;
$$;

REVOKE ALL ON FUNCTION public.claim_chimera_report_alert(uuid, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_chimera_report_alert(uuid, integer, integer) TO service_role;
