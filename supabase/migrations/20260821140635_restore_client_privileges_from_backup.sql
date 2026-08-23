-- Restore the Data API privileges recorded in the verified 2026-08-21
-- production schema backup. RLS remains the row-level authorization boundary.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_class AS relation
    JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace
    WHERE namespace.nspname = 'public'
      AND relation.relkind = 'r'
      AND NOT relation.relrowsecurity
  ) THEN
    RAISE EXCEPTION 'Refusing client grants: every public table must have RLS enabled';
  END IF;
END;
$$;

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- These four creative tables were intentionally authenticated-only in the
-- production snapshot. Preserve that distinction instead of widening access.
REVOKE ALL PRIVILEGES ON TABLE
  public.lorebooks,
  public.lorebook_entries,
  public.lorebook_characters,
  public.lorebook_worlds
FROM anon;
