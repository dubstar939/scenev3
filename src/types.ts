export interface Spot {
  id: string;
  name: string;
  type: "Meetup" | "Fuel" | "Food" | "Scenic";
  location: [number, number];
  description?: string;
  imageUrl?: string;
  createdBy: string;
  createdAt: string;
}

export interface Member {
  id: string;
  name: string;
  avatar?: string;
  car?: string;
  status: "Online" | "Offline" | "Cruising" | "Parked";
  location: [number, number];
  lastSeen: string;
  isGhost?: boolean;
  privacy?: {
    visibility: "public" | "favorites" | "private";
  };
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: string;
}

export interface Cruise {
  isActive: boolean;
  route: [number, number][];
  participants: string[];
}

// Achievement System Types
export interface AchievementLevel {
  level: number;
  threshold: number;
  xp: number;
}

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
  event_type: string;
  levels: AchievementLevel[];
  created_at?: string;
  is_active?: boolean;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  level: number;
  completed_at: string;
  xp_awarded: number;
  // Joined fields
  title?: string;
  description?: string;
  icon?: string;
}

export interface UserStats {
  user_id: string;
  distance_traveled: number;
  photos_shared: number;
  checkpoints_visited: number;
  messages_sent: number;
  meets_attended: number;
  hazards_reported: number;
  fuel_checks: number;
  days_active: number;
  last_updated?: string;
}

export interface AchievementProgress {
  achievement_id: string;
  title: string;
  description: string;
  icon: string;
  event_type: string;
  current_level: number | null;
  max_level: number;
  current_value: number;
  next_threshold: number | null;
  progress_percent: number;
  is_completed: boolean;
}

export type EventType = 
  | 'distance_traveled'
  | 'photo_shared'
  | 'checkpoint_visited'
  | 'message_sent'
  | 'meet_attended'
  | 'hazard_reported'
  | 'fuel_check'
  | 'daily_login';

export interface EventPayload {
  distance?: number;
  checkpoint_id?: string;
  [key: string]: any;
}
