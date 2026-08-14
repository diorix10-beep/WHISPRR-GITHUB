-- The preferences row is private account data. This policy makes both sides
-- of an UPDATE explicit: a member may update only their existing row and the
-- resulting row must still belong to that same authenticated member.
DROP POLICY IF EXISTS "update_chimera_user_preferences" ON public.chimera_user_preferences;

CREATE POLICY "update_chimera_user_preferences"
  ON public.chimera_user_preferences
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
