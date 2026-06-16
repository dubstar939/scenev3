import { supabase } from '../lib/supabase';
import type { EventType, EventPayload, UserStats, UserAchievement, AchievementDefinition, AchievementProgress, AchievementLevel } from '../../types';

/**
 * Log an event to trigger achievement tracking
 * This calls the Supabase RPC function record_event
 */
export async function logEvent(
  eventType: EventType,
  payload: EventPayload = {}
): Promise<UserStats | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('No authenticated user for event logging');
      return null;
    }

    const { data, error } = await supabase.rpc('record_event', {
      p_user_id: user.id,
      p_event_type: eventType,
      p_payload: payload as any
    });

    if (error) {
      console.error('Error logging event:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Unexpected error logging event:', err);
    return null;
  }
}

/**
 * Get all unlocked achievements for the current user
 */
export async function getUserAchievements(): Promise<UserAchievement[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return [];
    }

    const { data, error } = await supabase
      .from('user_achievements')
      .select(`
        id,
        user_id,
        achievement_id,
        level,
        completed_at,
        xp_awarded,
        achievements(title),
        achievements(description),
        achievements(icon)
      `)
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false });

    if (error) {
      console.error('Error fetching user achievements:', error);
      return [];
    }

    // Transform the data to match UserAchievement interface
    return (data || []).map((item: any) => ({
      id: item.id,
      user_id: item.user_id,
      achievement_id: item.achievement_id,
      level: item.level,
      completed_at: item.completed_at,
      xp_awarded: item.xp_awarded,
      title: item.achievements?.title,
      description: item.achievements?.description,
      icon: item.achievements?.icon
    }));
  } catch (err) {
    console.error('Unexpected error fetching achievements:', err);
    return [];
  }
}

/**
 * Get upcoming achievements with progress information
 */
export async function getUpcomingAchievements(): Promise<AchievementProgress[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return [];
    }

    // Get user stats
    const { data: statsData } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const stats: UserStats | null = statsData || null;

    // Get all achievements
    const { data: achievementsData } = await supabase
      .from('achievements')
      .select('*')
      .eq('is_active', true);

    if (!achievementsData) {
      return [];
    }

    // Get user's unlocked achievements
    const { data: unlockedData } = await supabase
      .from('user_achievements')
      .select('achievement_id, level')
      .eq('user_id', user.id);

    const unlockedMap = new Map<string, number>();
    (unlockedData || []).forEach((u: any) => {
      const currentMax = unlockedMap.get(u.achievement_id) || 0;
      if (u.level > currentMax) {
        unlockedMap.set(u.achievement_id, u.level);
      }
    });

    // Calculate progress for each achievement
    const progressList: AchievementProgress[] = [];

    for (const achievement of achievementsData) {
      const levels = achievement.levels as AchievementLevel[];
      const maxLevel = Math.max(...levels.map(l => l.level));
      const currentLevel = unlockedMap.get(achievement.id) || null;
      
      // Get current stat value
      let currentValue = 0;
      switch (achievement.event_type) {
        case 'distance_traveled':
          currentValue = stats?.distance_traveled || 0;
          break;
        case 'photo_shared':
          currentValue = stats?.photos_shared || 0;
          break;
        case 'checkpoint_visited':
          currentValue = stats?.checkpoints_visited || 0;
          break;
        case 'message_sent':
          currentValue = stats?.messages_sent || 0;
          break;
        case 'meet_attended':
          currentValue = stats?.meets_attended || 0;
          break;
        case 'hazard_reported':
          currentValue = stats?.hazards_reported || 0;
          break;
        case 'fuel_check':
          currentValue = stats?.fuel_checks || 0;
          break;
        case 'daily_login':
          currentValue = stats?.days_active || 0;
          break;
      }

      // Find next threshold
      let nextThreshold: number | null = null;
      let progressPercent = 100;

      if (currentLevel !== null && currentLevel < maxLevel) {
        const nextLevel = levels.find(l => l.level > currentLevel);
        if (nextLevel) {
          nextThreshold = nextLevel.threshold;
          const prevLevel = levels.find(l => l.level === currentLevel);
          const prevThreshold = prevLevel ? prevLevel.threshold : 0;
          const range = nextThreshold - prevThreshold;
          const progress = currentValue - prevThreshold;
          progressPercent = Math.min(100, Math.max(0, (progress / range) * 100));
        }
      } else if (currentLevel === null) {
        const firstLevel = levels[0];
        if (firstLevel) {
          nextThreshold = firstLevel.threshold;
          progressPercent = Math.min(100, Math.max(0, (currentValue / nextThreshold) * 100));
        }
      }

      progressList.push({
        achievement_id: achievement.id,
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        event_type: achievement.event_type,
        current_level: currentLevel,
        max_level: maxLevel,
        current_value: currentValue,
        next_threshold: nextThreshold,
        progress_percent: progressPercent,
        is_completed: currentLevel === maxLevel
      });
    }

    // Sort by progress (incomplete first, then by progress percent)
    return progressList.sort((a, b) => {
      if (a.is_completed !== b.is_completed) {
        return a.is_completed ? 1 : -1;
      }
      return b.progress_percent - a.progress_percent;
    });
  } catch (err) {
    console.error('Unexpected error fetching upcoming achievements:', err);
    return [];
  }
}

/**
 * Get user stats
 */
export async function getUserStats(): Promise<UserStats | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return null;
    }

    const { data, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      return null;
    }

    return data;
  } catch (err) {
    console.error('Unexpected error fetching user stats:', err);
    return null;
  }
}

/**
 * Subscribe to real-time achievement unlocks
 */
export function subscribeToAchievementUnlocks(
  userId: string,
  callback: (achievement: UserAchievement) => void
) {
  const channel = supabase
    .channel('achievements:' + userId)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'user_achievements',
        filter: `user_id=eq.${userId}`
      },
      async (payload) => {
        const newAchievement = payload.new as any;
        
        // Fetch full achievement details
        const { data: achievementData } = await supabase
          .from('achievements')
          .select('title, description, icon')
          .eq('id', newAchievement.achievement_id)
          .single();

        callback({
          id: newAchievement.id,
          user_id: newAchievement.user_id,
          achievement_id: newAchievement.achievement_id,
          level: newAchievement.level,
          completed_at: newAchievement.completed_at,
          xp_awarded: newAchievement.xp_awarded,
          title: achievementData?.title,
          description: achievementData?.description,
          icon: achievementData?.icon
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
