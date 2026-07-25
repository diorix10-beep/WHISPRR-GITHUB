-- Migration: 20260726000000_august7_launch_communities.sql
-- Description: Seed official launch hubs for WHISPRR × CHIMERA World Launch (August 7th)

INSERT INTO public.communities (name, slug, description, category, is_official, created_at)
VALUES 
  (
    'Welcome to WHISPRR', 
    'welcome', 
    'Official community hub for new creators! Introduce yourself, discover creators, and explore the WHISPRR × CHIMERA ecosystem.', 
    'General', 
    true, 
    NOW()
  ),
  (
    'AI Roleplay & Personas', 
    'roleplay', 
    'Discover, share, and discuss AI characters, persona cards, and interactive roleplay scenarios built in CHIMERA.', 
    'Roleplay', 
    true, 
    NOW()
  ),
  (
    'Worldbuilding & Lore', 
    'worldbuilding', 
    'Craft maps, factions, magic systems, and universe lorebooks. Share your world cards with fellow creators.', 
    'Worldbuilding', 
    true, 
    NOW()
  ),
  (
    'Creators Showcase', 
    'creators', 
    'Showcase your stories, fiction, art, and project updates. Connect with potential co-authors and collaborators.', 
    'Showcase', 
    true, 
    NOW()
  )
ON CONFLICT (slug) DO UPDATE 
SET 
  is_official = true,
  description = EXCLUDED.description;
