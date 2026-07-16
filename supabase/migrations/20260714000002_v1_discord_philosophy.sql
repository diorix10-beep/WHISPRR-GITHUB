-- Migration: 20260714000002_v1_discord_philosophy.sql
-- Description: Update ecosystem platforms settings to reflect the creator-first philosophy.

INSERT INTO public.system_settings (key, value)
VALUES (
  'ecosystem_platforms',
  '[
    {"id": "website", "name": "Website", "icon": "Globe", "url": "https://whisprr.xyz", "status": "available", "description": "The home of creators to connect, share work, and join communities."},
    {"id": "discord", "name": "Discord", "icon": "MessageSquare", "url": "https://discord.gg/WHISPRRHQ", "status": "available", "description": "Join the home of creators on Discord—collaborate, share your stories, and shape the ecosystem."},
    {"id": "x", "name": "X (Twitter)", "icon": "Twitter", "url": "https://x.com/WHISPRRHQ", "status": "available", "description": "Stay updated with every release, community spotlight, and ecosystem update."},
    {"id": "instagram", "name": "Instagram", "icon": "Instagram", "url": "https://instagram.com/whisprr", "status": "coming_soon", "description": "Behind-the-scenes and visual updates from our creative community."},
    {"id": "threads", "name": "Threads", "icon": "Send", "url": "https://threads.net/@whisprr", "status": "coming_soon", "description": "Creator discussions and quick updates."},
    {"id": "github", "name": "GitHub", "icon": "Github", "url": "https://github.com/diorix10-beep/WHISPRR-GITHUB", "status": "available", "description": "Explore our open-source code and help build the future of the ecosystem."}
  ]'::jsonb
)
ON CONFLICT (key) 
DO UPDATE SET value = EXCLUDED.value;
