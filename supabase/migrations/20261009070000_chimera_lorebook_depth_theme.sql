-- CHIMERA lorebooks: how many recent messages are searched for keywords, and a colour.
--
-- Additive only: three new columns with defaults, nothing is dropped or rewritten, and the existing row-level
-- security (the owner manages a lorebook and its entries) already covers them.
--
--   lorebooks.scan_depth        how many of the latest chat messages the lorebook checks for keywords (1 to 10, default 3)
--   lorebooks.theme             the colour of the lorebook in the member's list
--   lorebook_entries.scan_depth optional: this entry checks that many messages instead of the lorebook's number

ALTER TABLE public.lorebooks
  ADD COLUMN IF NOT EXISTS scan_depth integer NOT NULL DEFAULT 3 CHECK (scan_depth BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS theme text NOT NULL DEFAULT 'purple'
    CHECK (theme IN ('purple', 'midnight', 'sky', 'teal', 'forest', 'mint', 'green', 'orange', 'sunset', 'red', 'candy'));

ALTER TABLE public.lorebook_entries
  ADD COLUMN IF NOT EXISTS scan_depth integer CHECK (scan_depth IS NULL OR scan_depth BETWEEN 1 AND 10);
