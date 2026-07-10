-- Migration: Rename nexa_spirits to chimera_spirits
-- Completion of the brand transition from NEXA to CHIMERA in the database schema.

ALTER TABLE IF EXISTS public.nexa_spirits RENAME TO chimera_spirits;

-- Rename constraint
ALTER TABLE public.chimera_spirits RENAME CONSTRAINT nexa_spirits_user_unique TO chimera_spirits_user_unique;

-- Rename index
ALTER INDEX IF EXISTS public.idx_nexa_spirits_user RENAME TO idx_chimera_spirits_user;
