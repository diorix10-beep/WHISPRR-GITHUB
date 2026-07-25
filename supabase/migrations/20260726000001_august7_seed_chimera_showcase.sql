-- Migration: 20260726000001_august7_seed_chimera_showcase.sql
-- Description: Seed exemplary CHIMERA showcase creations (Worlds & Lorebooks) for August 7th World Launch

-- 1. Seed Exemplary World
INSERT INTO public.worlds (name, description, genre, rules, is_public, created_at)
SELECT 
  'Aetheria — The Floating Realm', 
  'A grand archipelago of floating islands suspended in a sky of infinite aurora. Powered by ancient Aetherium crystal magic.', 
  'High Fantasy / Steampunk', 
  'Aetherium crystals power all levitation ships. Skylords govern the high islands while Guild Navigators chart the cloud sea.', 
  true, 
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.worlds WHERE name LIKE 'Aetheria%');

-- 2. Seed Exemplary Lorebook
INSERT INTO public.lorebooks (title, description, tags, is_public, created_at)
SELECT 
  'The Aetherium Chronicles', 
  'Comprehensive compendium of levitation magic, skyship designs, island factions, and sky-beasts across Aetheria.', 
  ARRAY['Fantasy', 'Magic', 'Worldbuilding'], 
  true, 
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.lorebooks WHERE title LIKE 'The Aetherium Chronicles%');
