-- CHIMERA: members who can see and use a Model House model that is still being tried (`testersOnly`).
-- Nobody can add themselves: there is no insert policy, so rows are added by the team in the SQL editor.

CREATE TABLE IF NOT EXISTS public.chimera_model_testers (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.chimera_model_testers ENABLE ROW LEVEL SECURITY;

CREATE POLICY read_own_model_tester ON public.chimera_model_testers
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);

REVOKE ALL ON public.chimera_model_testers FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.chimera_model_testers TO authenticated;
