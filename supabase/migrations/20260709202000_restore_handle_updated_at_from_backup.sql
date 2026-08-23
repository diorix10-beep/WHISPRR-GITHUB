-- Restore a function present in the verified WHISPRR production backup but
-- missing from the historical migration chain. This additive migration makes
-- clean local rebuilds reproducible without rewriting any existing migration.
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_updated_at() FROM PUBLIC;
