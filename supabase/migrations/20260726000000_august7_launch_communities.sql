-- Migration: 20260726000000_august7_launch_communities.sql
-- Description: Seed official launch hubs for WHISPRR × CHIMERA World Launch (August 7th)

INSERT INTO public.communities (name, description, interest, category, emoji, is_featured, created_at)
VALUES 
  (
    'Welcome to WHISPRR', 
    'Official community hub for new creators! Introduce yourself, discover creators, and explore the WHISPRR × CHIMERA ecosystem.', 
    'General', 
    'General', 
    '💜', 
    true, 
    NOW()
  ),
  (
    'AI Roleplay & Personas', 
    'Discover, share, and discuss AI characters, persona cards, and interactive roleplay scenarios built in CHIMERA.', 
    'Roleplay', 
    'Roleplay', 
    '🎭', 
    true, 
    NOW()
  ),
  (
    'Worldbuilding & Lore', 
    'Craft maps, factions, magic systems, and universe lorebooks. Share your world cards with fellow creators.', 
    'Worldbuilding', 
    'Worldbuilding', 
    '🗺️', 
    true, 
    NOW()
  ),
  (
    'Creators Showcase', 
    'Showcase your stories, fiction, art, and project updates. Connect with potential co-authors and collaborators.', 
    'Showcase', 
    'Showcase', 
    '✨', 
    true, 
    NOW()
  )
ON CONFLICT DO NOTHING;
