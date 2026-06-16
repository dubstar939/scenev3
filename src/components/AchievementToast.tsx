'use client';

import React, { useEffect, useState } from 'react';
import { Trophy, X } from 'lucide-react';
import type { UserAchievement } from '../types';

interface AchievementToastProps {
  achievement: UserAchievement;
  onClose: () => void;
}

export const AchievementToast: React.FC<AchievementToastProps> = ({ achievement, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation
    setTimeout(() => setIsVisible(true), 100);

    // Auto-close after 5 seconds
    const timer = setTimeout(() => {
      handleClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const iconMap: Record<string, React.ReactNode> = {
    'map-pin': <Trophy className="w-6 h-6" />,
    'navigation': <Trophy className="w-6 h-6" />,
    'globe': <Trophy className="w-6 h-6" />,
    'camera': <Trophy className="w-6 h-6" />,
    'images': <Trophy className="w-6 h-6" />,
    'image-plus': <Trophy className="w-6 h-6" />,
    'flag': <Trophy className="w-6 h-6" />,
    'compass': <Trophy className="w-6 h-6" />,
    'message-circle': <Trophy className="w-6 h-6" />,
    'messages-square': <Trophy className="w-6 h-6" />,
    'users': <Trophy className="w-6 h-6" />,
    'user-check': <Trophy className="w-6 h-6" />,
    'triangle-alert': <Trophy className="w-6 h-6" />,
    'shield': <Trophy className="w-6 h-6" />,
    'gas-pump': <Trophy className="w-6 h-6" />,
    'trending-down': <Trophy className="w-6 h-6" />,
    'calendar': <Trophy className="w-6 h-6" />,
    'calendar-days': <Trophy className="w-6 h-6" />,
    'award': <Trophy className="w-6 h-6" />,
  };

  const icon = iconMap[achievement.icon || ''] || <Trophy className="w-6 h-6" />;

  return (
    <div
      className={`fixed top-4 right-4 z-[100] transform transition-all duration-500 ease-out ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-2xl p-4 shadow-2xl max-w-sm border border-amber-400/30">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="bg-white/20 backdrop-blur-sm p-2.5 rounded-xl">
            {icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wide bg-white/20 px-2 py-0.5 rounded-full">
                Achievement Unlocked!
              </span>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                Level {achievement.level}
              </span>
            </div>
            <h4 className="font-bold text-lg truncate">{achievement.title}</h4>
            <p className="text-sm text-amber-100 mt-1 line-clamp-2">
              {achievement.description}
            </p>
            <div className="flex items-center gap-2 mt-2 text-xs">
              <span className="bg-white/20 px-2 py-1 rounded-lg font-medium">
                +{achievement.xp_awarded} XP
              </span>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress bar animation */}
        <div className="mt-3 h-1 bg-white/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white/60 rounded-full animate-[shrink_5s_linear_forwards]"
            style={{ width: '100%' }}
          />
        </div>
      </div>

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

interface AchievementToastContainerProps {
  achievements: UserAchievement[];
  onDismiss: (id: string) => void;
}

export const AchievementToastContainer: React.FC<AchievementToastContainerProps> = ({
  achievements,
  onDismiss
}) => {
  if (achievements.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-3">
      {achievements.map((achievement, index) => (
        <div
          key={achievement.id}
          style={{
            animationDelay: `${index * 100}ms`
          }}
        >
          <AchievementToast
            achievement={achievement}
            onClose={() => onDismiss(achievement.id)}
          />
        </div>
      ))}
    </div>
  );
};

export default AchievementToast;
