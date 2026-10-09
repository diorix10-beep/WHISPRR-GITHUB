-- CHIMERA lorebooks: how much of a lorebook may go with one reply.
--
-- Additive only: one new column with a default. Nothing is dropped or rewritten, and the existing row-level security
-- (the owner manages a lorebook and its entries) already covers it.
--
--   lorebooks.reply_budget  the most characters of this lorebook sent with one reply (1,000 to 40,000, default 8,000, the
--                           size every lorebook had until now)

ALTER TABLE public.lorebooks
  ADD COLUMN IF NOT EXISTS reply_budget integer NOT NULL DEFAULT 8000 CHECK (reply_budget BETWEEN 1000 AND 40000);
