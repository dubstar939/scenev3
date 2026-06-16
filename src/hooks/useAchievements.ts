'use client';

import React, { useEffect, useState, useCallback } from 'react';
import type { UserAchievement } from '../types';
import { 
  getUserAchievements, 
  subscribeToAchievementUnlocks,
  logEvent 
} from '../services/achievementService';
import { AchievementToastContainer } from '../components/AchievementToast';
import { supabase } from '../lib/supabase';

interface UseAchievementsReturn {
  achievements: UserAchievement[];
  pendingNotifications: UserAchievement[];
  isLoading: boolean;
  refreshAchievements: () => Promise<void>;
  dismissNotification: (id: string) => void;
  logAchievementEvent: typeof logEvent;
}

/**
 * Hook to manage achievement state and real-time notifications
 */
export function useAchievements(): UseAchievementsReturn {
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [pendingNotifications, setPendingNotifications] = useState<UserAchievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Load initial achievements
  const refreshAchievements = useCallback(async () => {
    try {
      const data = await getUserAchievements();
      setAchievements(data);
    } catch (error) {
      console.error('Error refreshing achievements:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    refreshAchievements();
  }, [refreshAchievements]);

  // Get user ID for subscription
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
      } else {
        setIsLoading(false);
      }
    });
  }, []);

  // Subscribe to real-time achievement unlocks
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = subscribeToAchievementUnlocks(userId, (newAchievement) => {
      // Add to achievements list
      setAchievements(prev => {
        const exists = prev.some(a => a.id === newAchievement.id);
        if (exists) return prev;
        return [newAchievement, ...prev];
      });

      // Add to notifications
      setPendingNotifications(prev => {
        const exists = prev.some(a => a.id === newAchievement.id);
        if (exists) return prev;
        return [...prev, newAchievement];
      });
    });

    return () => {
      unsubscribe();
    };
  }, [userId]);

  const dismissNotification = useCallback((id: string) => {
    setPendingNotifications(prev => prev.filter(a => a.id !== id));
  }, []);

  return {
    achievements,
    pendingNotifications,
    isLoading,
    refreshAchievements,
    dismissNotification,
    logAchievementEvent: logEvent
  };
}

/**
 * Provider component that wraps the app and manages achievement toasts
 */
interface AchievementProviderProps {
  children: React.ReactNode;
}

export const AchievementProvider: React.FC<AchievementProviderProps> = ({ children }) => {
  const { pendingNotifications, dismissNotification } = useAchievements();

  return (
    <>
      {children}
      <AchievementToastContainer
        achievements={pendingNotifications}
        onDismiss={dismissNotification}
      />
    </>
  );
};

export default useAchievements;
