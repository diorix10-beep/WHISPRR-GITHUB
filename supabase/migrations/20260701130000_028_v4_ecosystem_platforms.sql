-- Migration: 028_v4_ecosystem_platforms.sql
-- Description: Adds scheduled_for to agent_drafts and registers ecosystem connected socials.

-- 1. Add scheduled_for column to agent_drafts
ALTER TABLE public.agent_drafts ADD COLUMN IF NOT EXISTS scheduled_for timestamptz DEFAULT NULL;

-- 2. Seed/Update default connected platforms
INSERT INTO public.system_settings (key, value)
VALUES (
  'ecosystem_platforms',
  '[
    {"id": "website", "name": "Website", "icon": "Globe", "url": "https://whisprr.xyz", "status": "available", "description": "The official web platform to share whispers."},
    {"id": "discord", "name": "Discord", "icon": "MessageSquare", "url": "https://discord.gg/WHISPRRHQ", "status": "available", "description": "Join our official community, share feedback, and chat."},
    {"id": "x", "name": "X (Twitter)", "icon": "Twitter", "url": "https://x.com/WHISPRRHQ", "status": "available", "description": "Stay updated with every release and strategic update."},
    {"id": "instagram", "name": "Instagram", "icon": "Instagram", "url": "https://instagram.com/whisprr", "status": "coming_soon", "description": "Behind-the-scenes and visual updates from the team."},
    {"id": "threads", "name": "Threads", "icon": "Send", "url": "https://threads.net/@whisprr", "status": "coming_soon", "description": "Community discussions and quick updates."},
    {"id": "github", "name": "GitHub", "icon": "Github", "url": "https://github.com/diorix10-beep/WHISPRR-GITHUB", "status": "available", "description": "Explore our open-source code and development loops."}
  ]'::jsonb
)
ON CONFLICT (key) 
DO UPDATE SET value = EXCLUDED.value;
