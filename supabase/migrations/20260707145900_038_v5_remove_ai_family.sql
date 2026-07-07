-- Remove System-Seeded AI Family Characters
-- Removes Iris, Echo, Nova, Atlas, Cipher, etc., from the directory
-- to simplify the platform around Custom User Characters and the singular Oracle.

DELETE FROM public.ai_characters 
WHERE creator_notes = 'System-seeded member of the WHISPRR AI Family.';
