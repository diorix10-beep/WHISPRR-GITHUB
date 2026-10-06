-- CHIMERA-only review queue. No content/account deletion is executed by this migration or RPC.
BEGIN;
CREATE TABLE IF NOT EXISTS public.chimera_data_removal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(user_id),
  scope text NOT NULL DEFAULT 'chimera_creative_data' CHECK (scope = 'chimera_creative_data'),
  status text NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review','reviewed','withdrawn')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS chimera_one_pending_removal ON public.chimera_data_removal_requests(user_id)
  WHERE status = 'pending_review';
ALTER TABLE public.chimera_data_removal_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.chimera_data_removal_requests FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.chimera_data_removal_requests TO authenticated;
DROP POLICY IF EXISTS chimera_removal_own_read ON public.chimera_data_removal_requests;
CREATE POLICY chimera_removal_own_read ON public.chimera_data_removal_requests FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE OR REPLACE FUNCTION public.request_chimera_data_removal() RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE request_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
  -- Serialize repeat submissions, including concurrent tabs, without deleting anything.
  PERFORM pg_advisory_xact_lock(hashtextextended('chimera-removal:' || auth.uid()::text,0));
  SELECT id INTO request_id FROM public.chimera_data_removal_requests WHERE user_id = auth.uid() AND status = 'pending_review';
  IF request_id IS NULL THEN
    INSERT INTO public.chimera_data_removal_requests(user_id) VALUES(auth.uid()) RETURNING id INTO request_id;
  END IF;
  RETURN request_id;
END $$;
REVOKE ALL ON FUNCTION public.request_chimera_data_removal() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_chimera_data_removal() TO authenticated;
COMMIT;
