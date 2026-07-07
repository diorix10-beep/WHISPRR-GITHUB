-- Create Oracle Profile Migration
-- Ensures the system Oracle user exists with a verified profile

DO $$
DECLARE
    oracle_uuid uuid := '00000000-0000-0000-0000-000000000000';
    existing_user_id uuid;
BEGIN
    -- Check if 'oracle' profile already exists
    SELECT user_id INTO existing_user_id FROM profiles WHERE username = 'oracle';

    IF existing_user_id IS NOT NULL THEN
        -- Update existing oracle profile
        UPDATE profiles SET
            display_name = 'Oracle',
            avatar_emoji = '✨',
            bio = 'Your guide to the WHISPRR ecosystem. I can help you create characters, worlds, and lorebooks. How can I assist you today?',
            mood = 'Helpful',
            location = 'The Nexus Core',
            profile_visible = true,
            photo_url = '/family/oracle.png'
        WHERE username = 'oracle';
    ELSE
        -- 1. Create dummy auth user if not exists (so we can satisfy FK constraint)
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, 
            last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, 
            created_at, updated_at
        )
        VALUES (
            oracle_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'oracle@whisprr.xyz',
            crypt('oracle_super_secret_password_do_not_use', gen_salt('bf')), now(),
            now(), '{"provider": "email", "providers": ["email"]}', '{"name": "Oracle"}', false,
            now(), now()
        )
        ON CONFLICT (id) DO NOTHING;

        -- 2. Insert new oracle profile
        INSERT INTO profiles (
            id, user_id, display_name, username, avatar_emoji, bio, mood, 
            location, profile_visible, onboarding_complete, photo_url
        )
        VALUES (
            oracle_uuid, oracle_uuid, 'Oracle', 'oracle', '✨',
            'Your guide to the WHISPRR ecosystem. I can help you create characters, worlds, and lorebooks. How can I assist you today?',
            'Helpful', 'The Nexus Core', true, true, '/family/oracle.png'
        )
        ON CONFLICT (user_id) DO UPDATE SET
            display_name = 'Oracle',
            username = 'oracle',
            avatar_emoji = '✨',
            bio = 'Your guide to the WHISPRR ecosystem. I can help you create characters, worlds, and lorebooks. How can I assist you today?',
            location = 'The Nexus Core',
            photo_url = '/family/oracle.png';
    END IF;
END $$;
