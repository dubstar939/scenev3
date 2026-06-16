'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Lock, CheckCircle, Star, ArrowRight } from 'lucide-react';
import type { UserAchievement, AchievementProgress } from '../types';
import { getUserAchievements, getUpcomingAchievements } from '../services/achievementService';

interface AchievementCardProps {
  achievement: UserAchievement;
}

const AchievementCard: React.FC<AchievementCardProps> = ({ achievement }) => {
  const iconMap: Record<string, React.ReactNode> = {
    'map-pin': <Trophy className="w-5 h-5" />,
    'navigation': <Trophy className="w-5 h-5" />,
    'globe': <Trophy className="w-5 h-5" />,
    'camera': <Trophy className="w-5 h-5" />,
    'images': <Trophy className="w-5 h-5" />,
    'image-plus': <Trophy className="w-5 h-5" />,
    'flag': <Trophy className="w-5 h-5" />,
    'compass': <Trophy className="w-5 h-5" />,
    'message-circle': <Trophy className="w-5 h-5" />,
    'messages-square': <Trophy className="w-5 h-5" />,
    'users': <Trophy className="w-5 h-5" />,
    'user-check': <Trophy className="w-5 h-5" />,
    'triangle-alert': <Trophy className="w-5 h-5" />,
    'shield': <Trophy className="w-5 h-5" />,
    'gas-pump': <Trophy className="w-5 h-5" />,
    'trending-down': <Trophy className="w-5 h-5" />,
    'calendar': <Trophy className="w-5 h-5" />,
    'calendar-days': <Trophy className="w-5 h-5" />,
    'award': <Trophy className="w-5 h-5" />,
  };

  const icon = iconMap[achievement.icon || ''] || <Star className="w-5 h-5" />;

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-start gap-3">
        <div className="bg-amber-500 text-white p-2.5 rounded-lg shadow-sm">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-amber-900 dark:text-amber-100 truncate">
            {achievement.title || 'Achievement'}
          </h4>
          <p className="text-sm text-amber-700 dark:text-amber-300 mt-1 line-clamp-2">
            {achievement.description || ''}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="inline-flex items-center gap-1 text-xs font-medium bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded-full">
              <Star className="w-3 h-3" />
              Level {achievement.level}
            </span>
            <span className="text-xs text-amber-600 dark:text-amber-400">
              +{achievement.xp_awarded} XP
            </span>
          </div>
        </div>
        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
      </div>
    </div>
  );
};

interface ProgressAchievementCardProps {
  progress: AchievementProgress;
}

const ProgressAchievementCard: React.FC<ProgressAchievementCardProps> = ({ progress }) => {
  const isCompleted = progress.is_completed;
  
  const iconMap: Record<string, React.ReactNode> = {
    'map-pin': <Trophy className="w-5 h-5" />,
    'navigation': <Trophy className="w-5 h-5" />,
    'globe': <Trophy className="w-5 h-5" />,
    'camera': <Trophy className="w-5 h-5" />,
    'images': <Trophy className="w-5 h-5" />,
    'image-plus': <Trophy className="w-5 h-5" />,
    'flag': <Trophy className="w-5 h-5" />,
    'compass': <Trophy className="w-5 h-5" />,
    'message-circle': <Trophy className="w-5 h-5" />,
    'messages-square': <Trophy className="w-5 h-5" />,
    'users': <Trophy className="w-5 h-5" />,
    'user-check': <Trophy className="w-5 h-5" />,
    'triangle-alert': <Trophy className="w-5 h-5" />,
    'shield': <Trophy className="w-5 h-5" />,
    'gas-pump': <Trophy className="w-5 h-5" />,
    'trending-down': <Trophy className="w-5 h-5" />,
    'calendar': <Trophy className="w-5 h-5" />,
    'calendar-days': <Trophy className="w-5 h-5" />,
    'award': <Trophy className="w-5 h-5" />,
  };

  const icon = iconMap[progress.icon] || <Star className="w-5 h-5" />;

  return (
    <div className={`border rounded-xl p-4 transition-all duration-300 ${
      isCompleted 
        ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700' 
        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`p-2.5 rounded-lg ${
          isCompleted 
            ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400' 
            : 'bg-blue-500 text-white'
        }`}>
          {isCompleted ? <Lock className="w-5 h-5" /> : icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={`font-semibold truncate ${
            isCompleted 
              ? 'text-gray-500 dark:text-gray-400' 
              : 'text-gray-900 dark:text-gray-100'
          }`}>
            {progress.title}
          </h4>
          <p className={`text-sm mt-1 line-clamp-2 ${
            isCompleted 
              ? 'text-gray-400 dark:text-gray-500' 
              : 'text-gray-600 dark:text-gray-400'
          }`}>
            {progress.description}
          </p>
          
          {!isCompleted && progress.next_threshold !== null && (
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500 dark:text-gray-400">
                  {Math.floor(progress.current_value).toLocaleString()} / {Math.floor(progress.next_threshold).toLocaleString()}
                </span>
                <span className="text-blue-600 dark:text-blue-400 font-medium">
                  {Math.round(progress.progress_percent)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${progress.progress_percent}%` }}
                />
              </div>
            </div>
          )}
          
          {isCompleted && (
            <div className="mt-2 flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
              <CheckCircle className="w-3 h-3" />
              <span>All levels completed</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface AchievementPanelProps {
  onClose?: () => void;
}

export const AchievementPanel: React.FC<AchievementPanelProps> = ({ onClose }) => {
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [upcoming, setUpcoming] = useState<AchievementProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'unlocked' | 'progress'>('unlocked');

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    setLoading(true);
    try {
      const [unlockedData, upcomingData] = await Promise.all([
        getUserAchievements(),
        getUpcomingAchievements()
      ]);
      setAchievements(unlockedData);
      setUpcoming(upcomingData);
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalXP = achievements.reduce((sum, a) => sum + (a.xp_awarded || 0), 0);
  const completedCount = achievements.length;
  const totalCount = upcoming.length;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-center gap-3 text-gray-600 dark:text-gray-300">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
            <span>Loading achievements...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-500" />
              Achievements
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Track your progress and unlock rewards
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{completedCount}</div>
            <div className="text-xs text-amber-700 dark:text-amber-300 mt-1">Unlocked</div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalCount - completedCount}</div>
            <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">In Progress</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{totalXP}</div>
            <div className="text-xs text-purple-700 dark:text-purple-300 mt-1">Total XP</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('unlocked')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'unlocked'
                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-b-2 border-amber-500'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Unlocked ({completedCount})
          </button>
          <button
            onClick={() => setActiveTab('progress')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'progress'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-b-2 border-blue-500'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            In Progress ({totalCount - completedCount})
          </button>
        </div>

        {/* Content */}
        <div className="space-y-3">
          {activeTab === 'unlocked' && (
            <>
              {achievements.length === 0 ? (
                <div className="text-center py-12">
                  <Trophy className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">No achievements unlocked yet</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    Start exploring to earn your first badge!
                  </p>
                </div>
              ) : (
                achievements.map((achievement) => (
                  <AchievementCard key={achievement.id} achievement={achievement} />
                ))
              )}
            </>
          )}

          {activeTab === 'progress' && (
            <>
              {upcoming.filter(p => !p.is_completed).length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-3" />
                  <p className="text-gray-900 dark:text-white font-medium">All achievements completed!</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    You're a true Scene veteran!
                  </p>
                </div>
              ) : (
                upcoming
                  .filter(p => !p.is_completed)
                  .map((progress) => (
                    <ProgressAchievementCard key={progress.achievement_id} progress={progress} />
                  ))
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AchievementPanel;
