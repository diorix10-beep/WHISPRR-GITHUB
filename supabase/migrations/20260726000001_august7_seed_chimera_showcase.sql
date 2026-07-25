-- Migration: 20260726000001_august7_seed_chimera_showcase.sql
-- Description: Seed exemplary CHIMERA showcase creations (Worlds & Lorebooks) matching lean guaranteed table schemas

-- 1. Seed Exemplary World
INSERT INTO public.worlds (user_id, name, description, scenario, visibility, created_at)
SELECT 
  p.user_id, 
  'Aetheria — The Floating Realm', 
  'A grand archipelago of floating islands suspended in a sky of infinite aurora. Powered by ancient Aetherium crystal magic.', 
  'Aetherium crystals power all levitation ships. Skylords govern the high islands while Guild Navigators chart the cloud sea.', 
  'public', 
  NOW()
FROM (SELECT user_id FROM public.profiles LIMIT 1) p
WHERE NOT EXISTS (SELECT 1 FROM public.worlds WHERE name LIKE 'Aetheria%');

-- 2. Seed Exemplary Lorebook
INSERT INTO public.lorebooks (user_id, title, description, visibility, created_at)
SELECT 
  p.user_id, 
  'The Aetherium Chronicles', 
  'Comprehensive compendium of levitation magic, skyship designs, island factions, and sky-beasts across Aetheria.', 
  'public', 
  NOW()
FROM (SELECT user_id FROM public.profiles LIMIT 1) p
WHERE NOT EXISTS (SELECT 1 FROM public.lorebooks WHERE title LIKE 'The Aetherium Chronicles%');
