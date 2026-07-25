-- Migration: 20260726000001_august7_seed_chimera_showcase.sql
-- Description: Seed exemplary CHIMERA showcase creations (Characters, Worlds, Lorebooks) for August 7th World Launch

-- 1. Seed Exemplary AI Character
INSERT INTO public.ai_characters (name, tagline, description, greeting, system_prompt, is_public, created_at)
SELECT 
  'Elysia — Cyberpunk Architect', 
  'Master neon cityscapes, neural networks, and digital rebellion in Neo-Tokyo 2099.', 
  'Elysia is a legendary cybernetic architect who designs virtual sanctuaries within Neo-Tokyo. She is calculated, visionary, and fiercely protective of free creators.', 
  'The digital skyline of Neo-Tokyo never sleeps. Welcome to my sanctuary. What dream or design brings you here today?', 
  'You are Elysia, a brilliant cybernetic architect in Neo-Tokyo 2099. Speak with elegance, technical sharpness, and a touch of mysterious warmth.', 
  true, 
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.ai_characters WHERE name LIKE 'Elysia%');

-- 2. Seed Exemplary World
INSERT INTO public.worlds (name, description, genre, rules, is_public, created_at)
SELECT 
  'Aetheria — The Floating Realm', 
  'A grand archipelago of floating islands suspended in a sky of infinite aurora. Powered by ancient Aetherium crystal magic.', 
  'High Fantasy / Steampunk', 
  'Aetherium crystals power all levitation ships. Skylords govern the high islands while Guild Navigators chart the cloud sea.', 
  true, 
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.worlds WHERE name LIKE 'Aetheria%');

-- 3. Seed Exemplary Lorebook
INSERT INTO public.lorebooks (title, description, tags, is_public, created_at)
SELECT 
  'The Aetherium Chronicles', 
  'Comprehensive compendium of levitation magic, skyship designs, island factions, and sky-beasts across Aetheria.', 
  ARRAY['Fantasy', 'Magic', 'Worldbuilding'], 
  true, 
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.lorebooks WHERE title LIKE 'The Aetherium Chronicles%');
