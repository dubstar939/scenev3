-- Achievement System Migration
-- Creates tables, functions, and triggers for automatic achievement tracking

-- ============================================
-- 1. TABLES
-- ============================================

-- User statistics table
CREATE TABLE IF NOT EXISTS public.user_stats (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    distance_traveled NUMERIC DEFAULT 0, -- in meters
    photos_shared INTEGER DEFAULT 0,
    checkpoints_visited INTEGER DEFAULT 0,
    messages_sent INTEGER DEFAULT 0,
    meets_attended INTEGER DEFAULT 0,
    hazards_reported INTEGER DEFAULT 0,
    fuel_checks INTEGER DEFAULT 0,
    days_active INTEGER DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Achievements definitions table
CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    event_type TEXT NOT NULL, -- matches event_type in record_event
    levels JSONB NOT NULL, -- [{level: 1, threshold: 100, xp: 50}, {level: 2, threshold: 500, xp: 100}]
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- User achievements table (tracks which achievements users have unlocked)
CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
    level INTEGER NOT NULL, -- which level was achieved
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    xp_awarded INTEGER DEFAULT 0,
    UNIQUE(user_id, achievement_id, level)
);

-- ============================================
-- 2. INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON public.user_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_event_type ON public.achievements(event_type);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON public.user_achievements(achievement_id);

-- ============================================
-- 3. HELPER FUNCTIONS
-- ============================================

-- Function to get or create user stats
CREATE OR REPLACE FUNCTION public.get_or_create_user_stats(p_user_id UUID)
RETURNS public.user_stats AS $$
DECLARE
    v_stats public.user_stats;
BEGIN
    SELECT * INTO v_stats FROM public.user_stats WHERE user_id = p_user_id;
    
    IF v_stats IS NULL THEN
        INSERT INTO public.user_stats (user_id)
        VALUES (p_user_id)
        RETURNING * INTO v_stats;
    END IF;
    
    RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. MAIN EVENT RECORDING FUNCTION
-- ============================================

-- Record an event and update user stats
CREATE OR REPLACE FUNCTION public.record_event(
    p_user_id UUID,
    p_event_type TEXT,
    p_payload JSONB DEFAULT '{}'::jsonb
)
RETURNS public.user_stats AS $$
DECLARE
    v_stats public.user_stats;
    v_distance NUMERIC;
    v_checkpoint_id TEXT;
BEGIN
    -- Get or create user stats
    v_stats := public.get_or_create_user_stats(p_user_id);
    
    -- Update stats based on event type
    CASE p_event_type
        WHEN 'distance_traveled' THEN
            v_distance := (p_payload->>'distance')::NUMERIC;
            UPDATE public.user_stats 
            SET distance_traveled = distance_traveled + COALESCE(v_distance, 0),
                last_updated = NOW()
            WHERE user_id = p_user_id;
            
        WHEN 'photo_shared' THEN
            UPDATE public.user_stats 
            SET photos_shared = photos_shared + 1,
                last_updated = NOW()
            WHERE user_id = p_user_id;
            
        WHEN 'checkpoint_visited' THEN
            v_checkpoint_id := p_payload->>'checkpoint_id';
            -- Only count unique checkpoints per session (simplified: just increment)
            UPDATE public.user_stats 
            SET checkpoints_visited = checkpoints_visited + 1,
                last_updated = NOW()
            WHERE user_id = p_user_id;
            
        WHEN 'message_sent' THEN
            UPDATE public.user_stats 
            SET messages_sent = messages_sent + 1,
                last_updated = NOW()
            WHERE user_id = p_user_id;
            
        WHEN 'meet_attended' THEN
            UPDATE public.user_stats 
            SET meets_attended = meets_attended + 1,
                last_updated = NOW()
            WHERE user_id = p_user_id;
            
        WHEN 'hazard_reported' THEN
            UPDATE public.user_stats 
            SET hazards_reported = hazards_reported + 1,
                last_updated = NOW()
            WHERE user_id = p_user_id;
            
        WHEN 'fuel_check' THEN
            UPDATE public.user_stats 
            SET fuel_checks = fuel_checks + 1,
                last_updated = NOW()
            WHERE user_id = p_user_id;
            
        WHEN 'daily_login' THEN
            UPDATE public.user_stats 
            SET days_active = days_active + 1,
                last_updated = NOW()
            WHERE user_id = p_user_id;
            
        ELSE
            -- Unknown event type, just update last_updated
            UPDATE public.user_stats 
            SET last_updated = NOW()
            WHERE user_id = p_user_id;
    END CASE;
    
    -- Return updated stats
    SELECT * INTO v_stats FROM public.user_stats WHERE user_id = p_user_id;
    
    -- Automatically check for achievements
    PERFORM public.check_achievements(p_user_id);
    
    RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. ACHIEVEMENT CHECKING FUNCTION
-- ============================================

-- Check and award achievements for a user
CREATE OR REPLACE FUNCTION public.check_achievements(p_user_id UUID)
RETURNS TABLE(
    achievement_id UUID,
    title TEXT,
    level INTEGER,
    xp_awarded INTEGER
) AS $$
DECLARE
    v_stats public.user_stats;
    v_achievement RECORD;
    v_level_record JSONB;
    v_level INTEGER;
    v_threshold NUMERIC;
    v_xp INTEGER;
    v_current_value NUMERIC;
    v_already_awarded BOOLEAN;
BEGIN
    -- Get user stats
    SELECT * INTO v_stats FROM public.user_stats WHERE user_id = p_user_id;
    
    IF v_stats IS NULL THEN
        RETURN;
    END IF;
    
    -- Iterate through all active achievements
    FOR v_achievement IN 
        SELECT * FROM public.achievements 
        WHERE is_active = true 
        AND event_type IS NOT NULL
    LOOP
        -- Get current stat value based on event type
        CASE v_achievement.event_type
            WHEN 'distance_traveled' THEN
                v_current_value := v_stats.distance_traveled;
            WHEN 'photo_shared' THEN
                v_current_value := v_stats.photos_shared;
            WHEN 'checkpoint_visited' THEN
                v_current_value := v_stats.checkpoints_visited;
            WHEN 'message_sent' THEN
                v_current_value := v_stats.messages_sent;
            WHEN 'meet_attended' THEN
                v_current_value := v_stats.meets_attended;
            WHEN 'hazard_reported' THEN
                v_current_value := v_stats.hazards_reported;
            WHEN 'fuel_check' THEN
                v_current_value := v_stats.fuel_checks;
            WHEN 'daily_login' THEN
                v_current_value := v_stats.days_active;
            ELSE
                CONTINUE;
        END CASE;
        
        -- Iterate through achievement levels
        FOR v_level_record IN 
            SELECT * FROM jsonb_array_elements(v_achievement.levels)
        LOOP
            v_level := (v_level_record->>'level')::INTEGER;
            v_threshold := (v_level_record->>'threshold')::NUMERIC;
            v_xp := (v_level_record->>'xp')::INTEGER;
            
            -- Check if threshold is met
            IF v_current_value >= v_threshold THEN
                -- Check if already awarded this level
                SELECT EXISTS(
                    SELECT 1 FROM public.user_achievements 
                    WHERE user_id = p_user_id 
                    AND achievement_id = v_achievement.id 
                    AND level = v_level
                ) INTO v_already_awarded;
                
                -- Award if not already has it
                IF NOT v_already_awarded THEN
                    INSERT INTO public.user_achievements (user_id, achievement_id, level, xp_awarded, completed_at)
                    VALUES (p_user_id, v_achievement.id, v_level, COALESCE(v_xp, 0), NOW())
                    ON CONFLICT (user_id, achievement_id, level) DO NOTHING;
                    
                    -- Return the newly awarded achievement
                    achievement_id := v_achievement.id;
                    title := v_achievement.title;
                    level := v_level;
                    xp_awarded := COALESCE(v_xp, 0);
                    RETURN NEXT;
                END IF;
            END IF;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. TRIGGER FOR AUTOMATIC ACHIEVEMENT CHECKING
-- ============================================

-- Trigger function to check achievements after stats update
CREATE OR REPLACE FUNCTION public.trigger_check_achievements()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.check_achievements(NEW.user_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on user_stats table
DROP TRIGGER IF EXISTS trg_check_achievements ON public.user_stats;
CREATE TRIGGER trg_check_achievements
    AFTER UPDATE ON public.user_stats
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_check_achievements();

-- ============================================
-- 7. SEED DATA - DEFAULT ACHIEVEMENTS
-- ============================================

-- Distance achievements
INSERT INTO public.achievements (id, title, description, icon, event_type, levels) VALUES
('a1_distance_novice', 'Weekend Cruiser', 'Travel your first 10 km', 'map-pin', 'distance_traveled', 
 '[{"level": 1, "threshold": 10000, "xp": 50}]'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.achievements (id, title, description, icon, event_type, levels) VALUES
('a2_distance_regular', 'Road Warrior', 'Travel 100 km total', 'navigation', 'distance_traveled',
 '[{"level": 1, "threshold": 100000, "xp": 100}]'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.achievements (id, title, description, icon, event_type, levels) VALUES
('a3_distance_expert', 'Highway Legend', 'Travel 1000 km total', 'globe', 'distance_traveled',
 '[{"level": 1, "threshold": 1000000, "xp": 250}]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Photo sharing achievements
INSERT INTO public.achievements (id, title, description, icon, event_type, levels) VALUES
('a4_photo_starter', 'Shutterbug', 'Share your first photo', 'camera', 'photo_shared',
 '[{"level": 1, "threshold": 1, "xp": 25}]'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.achievements (id, title, description, icon, event_type, levels) VALUES
('a5_photo_enthusiast', 'Photo Enthusiast', 'Share 10 photos', 'images', 'photo_shared',
 '[{"level": 1, "threshold": 10, "xp": 75}]'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.achievements (id, title, description, icon, event_type, levels) VALUES
('a6_photo_master', 'Gallery Master', 'Share 50 photos', 'image-plus', 'photo_shared',
 '[{"level": 1, "threshold": 50, "xp": 150}]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Checkpoint achievements
INSERT INTO public.achievements (id, title, description, icon, event_type, levels) VALUES
('a7_checkpoint_first', 'Explorer', 'Visit your first checkpoint', 'flag', 'checkpoint_visited',
 '[{"level": 1, "threshold": 1, "xp": 30}]'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.achievements (id, title, description, icon, event_type, levels) VALUES
('a8_checkpoint_seeker', 'Checkpoint Seeker', 'Visit 25 checkpoints', 'compass', 'checkpoint_visited',
 '[{"level": 1, "threshold": 25, "xp": 100}]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Chat achievements
INSERT INTO public.achievements (id, title, description, icon, event_type, levels) VALUES
('a9_chat_hello', 'Chatterbox', 'Send your first message', 'message-circle', 'message_sent',
 '[{"level": 1, "threshold": 1, "xp": 20}]'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.achievements (id, title, description, icon, event_type, levels) VALUES
('a10_chat_active', 'Active Conversationalist', 'Send 100 messages', 'messages-square', 'message_sent',
 '[{"level": 1, "threshold": 100, "xp": 80}]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Meetup achievements
INSERT INTO public.achievements (id, title, description, icon, event_type, levels) VALUES
('a11_meet_first', 'Social Butterfly', 'Attend your first meetup', 'users', 'meet_attended',
 '[{"level": 1, "threshold": 1, "xp": 50}]'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.achievements (id, title, description, icon, event_type, levels) VALUES
('a12_meet_regular', 'Meetup Regular', 'Attend 10 meetups', 'user-check', 'meet_attended',
 '[{"level": 1, "threshold": 10, "xp": 120}]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Hazard reporting achievements
INSERT INTO public.achievements (id, title, description, icon, event_type, levels) VALUES
('a13_hazard_helper', 'Community Helper', 'Report your first hazard', 'triangle-alert', 'hazard_reported',
 '[{"level": 1, "threshold": 1, "xp": 40}]'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.achievements (id, title, description, icon, event_type, levels) VALUES
('a14_hazard_guardian', 'Road Guardian', 'Report 20 hazards', 'shield', 'hazard_reported',
 '[{"level": 1, "threshold": 20, "xp": 150}]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Fuel check achievements
INSERT INTO public.achievements (id, title, description, icon, event_type, levels) VALUES
('a15_fuel_first', 'Fuel Saver', 'Check fuel prices once', 'gas-pump', 'fuel_check',
 '[{"level": 1, "threshold": 1, "xp": 15}]'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.achievements (id, title, description, icon, event_type, levels) VALUES
('a16_fuel_smart', 'Smart Spender', 'Check fuel prices 50 times', 'trending-down', 'fuel_check',
 '[{"level": 1, "threshold": 50, "xp": 100}]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Daily login achievements
INSERT INTO public.achievements (id, title, description, icon, event_type, levels) VALUES
('a17_daily_first', 'Daily Driver', 'Log in for 7 days', 'calendar', 'daily_login',
 '[{"level": 1, "threshold": 7, "xp": 50}]'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.achievements (id, title, description, icon, event_type, levels) VALUES
('a18_daily_dedicated', 'Dedicated Member', 'Log in for 30 days', 'calendar-days', 'daily_login',
 '[{"level": 1, "threshold": 30, "xp": 150}]'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.achievements (id, title, description, icon, event_type, levels) VALUES
('a19_daily_veteran', 'Scene Veteran', 'Log in for 100 days', 'award', 'daily_login',
 '[{"level": 1, "threshold": 100, "xp": 300}]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 8. UTILITY VIEWS
-- ============================================

-- View for user achievement progress
CREATE OR REPLACE VIEW public.user_achievement_progress AS
SELECT 
    ua.user_id,
    a.id as achievement_id,
    a.title,
    a.description,
    a.icon,
    a.event_type,
    a.levels,
    ua.level as unlocked_level,
    ua.completed_at,
    ua.xp_awarded
FROM public.user_achievements ua
JOIN public.achievements a ON ua.achievement_id = a.id
WHERE a.is_active = true;

-- View for upcoming achievements (not yet unlocked)
CREATE OR REPLACE VIEW public.upcoming_achievements AS
SELECT 
    a.id as achievement_id,
    a.title,
    a.description,
    a.icon,
    a.event_type,
    a.levels,
    (SELECT MAX((level->>'level')::INTEGER) 
     FROM jsonb_array_elements(a.levels) as level) as max_level
FROM public.achievements a
WHERE a.is_active = true;

COMMENT ON TABLE public.user_stats IS 'Tracks user statistics for achievement system';
COMMENT ON TABLE public.achievements IS 'Defines achievement criteria and levels';
COMMENT ON TABLE public.user_achievements IS 'Records which achievements users have unlocked';
COMMENT ON FUNCTION public.record_event IS 'Records an event and updates user stats, then checks achievements';
COMMENT ON FUNCTION public.check_achievements IS 'Checks and awards achievements based on user stats';
