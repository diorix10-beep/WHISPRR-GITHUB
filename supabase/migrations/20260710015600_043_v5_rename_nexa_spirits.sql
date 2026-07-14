-- Migration: Rename nexa_spirits to chimera_spirits
-- Completion of the brand transition from NEXA to CHIMERA in the database schema.

DO $$
BEGIN
  -- 1. Rename table if old one exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'nexa_spirits'
  ) THEN
    ALTER TABLE public.nexa_spirits RENAME TO chimera_spirits;
  END IF;

  -- 2. Rename constraint if old one exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'nexa_spirits_user_unique'
  ) THEN
    ALTER TABLE public.chimera_spirits RENAME CONSTRAINT nexa_spirits_user_unique TO chimera_spirits_user_unique;
  END IF;

  -- 3. Rename index if old one exists
  IF EXISTS (
    SELECT 1 FROM pg_class 
    WHERE relname = 'idx_nexa_spirits_user'
  ) THEN
    ALTER INDEX public.idx_nexa_spirits_user RENAME TO idx_chimera_spirits_user;
  END IF;
END $$;
