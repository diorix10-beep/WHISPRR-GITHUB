-- Migration: 022_v4_disable_maintenance_mode.sql
-- Description: Disables maintenance mode by setting enabled to false in system_settings.

UPDATE public.system_settings
SET value = jsonb_set(value, '{enabled}', 'false')
WHERE key = 'maintenance_mode';
