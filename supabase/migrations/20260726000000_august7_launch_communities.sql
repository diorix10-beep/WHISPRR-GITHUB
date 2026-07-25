-- Migration: 20260726000000_august7_launch_communities.sql
-- Description: Seed official launch hubs for WHISPRR × CHIMERA World Launch (August 7th)

INSERT INTO public.communities (name, description, interest, category, emoji, is_featured, owner_id, created_at)
SELECT 
  c.name, 
  c.description, 
  c.interest, 
  c.category, 
  c.emoji, 
  c.is_featured, 
  u.id AS owner_id, 
  NOW()
FROM (
  VALUES 
    (
      'Welcome to WHISPRR', 
      'Official community hub for new creators! Introduce yourself, discover creators, and explore the WHISPRR × CHIMERA ecosystem.', 
      'General', 
      'General', 
      '💜', 
      true
    ),
    (
      'AI Roleplay & Personas', 
      'Discover, share, and discuss AI characters, persona cards, and interactive roleplay scenarios built in CHIMERA.', 
      'Roleplay', 
      'Roleplay', 
      '🎭', 
      true
    ),
    (
      'Worldbuilding & Lore', 
      'Craft maps, factions, magic systems, and universe lorebooks. Share your world cards with fellow creators.', 
      'Worldbuilding', 
      'Worldbuilding', 
      '🗺️', 
      true
    ),
    (
      'Creators Showcase', 
      'Showcase your stories, fiction, art, and project updates. Connect with potential co-authors and collaborators.', 
      'Showcase', 
      'Showcase', 
      '✨', 
      true
    )
) AS c(name, description, interest, category, emoji, is_featured)
CROSS JOIN (
  SELECT id FROM auth.users LIMIT 1
) AS u
ON CONFLICT DO NOTHING;
