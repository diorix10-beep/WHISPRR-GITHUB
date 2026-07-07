-- Remove Oracle from AI Family
-- Oracle is now a system profile with a custom Quickchat integration,
-- so she should not appear as a regular character in the AI Family Directory.

DELETE FROM public.ai_characters 
WHERE creator_id = 'da01a00a-60d7-41ec-b827-8178cd3bf084';
