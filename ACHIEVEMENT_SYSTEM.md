# Achievement System Implementation

## Overview

A fully automatic achievement system for the Scene app that tracks user activities, awards achievements, and displays progress with real-time notifications.

## Database Schema (Supabase)

### Tables

1. **user_stats** - Tracks user statistics
   - `user_id` (UUID, PK) - Reference to auth.users
   - `distance_traveled` (NUMERIC) - Total distance in meters
   - `photos_shared` (INTEGER) - Number of photos shared
   - `checkpoints_visited` (INTEGER) - Checkpoints visited count
   - `messages_sent` (INTEGER) - Chat messages sent
   - `meets_attended` (INTEGER) - Meetups attended
   - `hazards_reported` (INTEGER) - Hazard reports filed
   - `fuel_checks` (INTEGER) - Fuel price checks
   - `days_active` (INTEGER) - Days logged in
   - `last_updated` (TIMESTAMPTZ)

2. **achievements** - Achievement definitions
   - `id` (UUID, PK)
   - `title` (TEXT)
   - `description` (TEXT)
   - `icon` (TEXT) - Lucide icon name
   - `event_type` (TEXT) - Matches event types in record_event
   - `levels` (JSONB) - `[{level: 1, threshold: 100, xp: 50}, ...]`
   - `created_at` (TIMESTAMPTZ)
   - `is_active` (BOOLEAN)

3. **user_achievements** - Unlocked achievements
   - `id` (UUID, PK)
   - `user_id` (UUID, FK)
   - `achievement_id` (UUID, FK)
   - `level` (INTEGER) - Which level was achieved
   - `completed_at` (TIMESTAMPTZ)
   - `xp_awarded` (INTEGER)
   - UNIQUE constraint on (user_id, achievement_id, level)

### RPC Functions

#### `record_event(user_id, event_type, payload)`
Records an event and updates user stats automatically. Triggers achievement checking.

**Event Types:**
- `distance_traveled` - payload: `{ distance: number }` (meters)
- `photo_shared` - no payload needed
- `checkpoint_visited` - payload: `{ checkpoint_id: string }`
- `message_sent` - no payload needed
- `meet_attended` - no payload needed
- `hazard_reported` - no payload needed
- `fuel_check` - no payload needed
- `daily_login` - no payload needed

#### `check_achievements(user_id)`
Checks all achievements against user stats and awards any newly completed levels. Returns newly awarded achievements. Does NOT overwrite higher levels already earned.

### Triggers

- `trg_check_achievements` - Automatically calls `check_achievements` after any update to `user_stats`

## Frontend Implementation

### TypeScript Types (`src/types.ts`)

```typescript
interface AchievementLevel {
  level: number;
  threshold: number;
  xp: number;
}

interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
  event_type: string;
  levels: AchievementLevel[];
}

interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  level: number;
  completed_at: string;
  xp_awarded: number;
  title?: string;
  description?: string;
  icon?: string;
}

interface UserStats {
  user_id: string;
  distance_traveled: number;
  photos_shared: number;
  // ... etc
}

interface AchievementProgress {
  achievement_id: string;
  title: string;
  current_level: number | null;
  max_level: number;
  current_value: number;
  next_threshold: number | null;
  progress_percent: number;
  is_completed: boolean;
}
```

### Services (`src/services/achievementService.ts`)

- **`logEvent(eventType, payload)`** - Log an event to trigger stat tracking
- **`getUserAchievements()`** - Get all unlocked achievements
- **`getUpcomingAchievements()`** - Get achievements with progress info
- **`getUserStats()`** - Get current user stats
- **`subscribeToAchievementUnlocks(userId, callback)`** - Real-time subscription

### Components

1. **`AchievementPanel.tsx`** - Full achievement list modal with tabs for unlocked/in-progress
2. **`AchievementToast.tsx`** - Toast notification for newly unlocked achievements
3. **`useAchievements.ts`** - Hook for managing achievement state + `AchievementProvider`

## Usage Examples

### Logging Events

```typescript
import { logEvent } from './services/achievementService';

// When user travels
await logEvent('distance_traveled', { distance: 5000 }); // 5km

// When user shares photo
await logEvent('photo_shared');

// When user visits checkpoint
await logEvent('checkpoint_visited', { checkpoint_id: 'abc123' });

// When user sends message
await logEvent('message_sent');
```

### Displaying Achievements

```typescript
import { useAchievements } from './hooks/useAchievements';

function MyComponent() {
  const { achievements, pendingNotifications, isLoading } = useAchievements();
  
  return (
    <>
      {/* Main content */}
      <div>Achievements unlocked: {achievements.length}</div>
      
      {/* Toast notifications are handled automatically by AchievementProvider */}
    </>
  );
}
```

### Using the Provider

Wrap your app with `AchievementProvider` to enable automatic toast notifications:

```tsx
import { AchievementProvider } from './hooks/useAchievements';

function App() {
  return (
    <AchievementProvider>
      {/* Your app components */}
    </AchievementProvider>
  );
}
```

### Opening Achievement Panel

```tsx
import { AchievementPanel } from './components/AchievementPanel';

function App() {
  const [showAchievements, setShowAchievements] = useState(false);
  
  return (
    <>
      <button onClick={() => setShowAchievements(true)}>
        View Achievements
      </button>
      
      {showAchievements && (
        <AchievementPanel onClose={() => setShowAchievements(false)} />
      )}
    </>
  );
}
```

## Default Achievements

The migration includes 19 default achievements across 8 categories:

| Category | Achievements |
|----------|-------------|
| Distance | Weekend Cruiser (10km), Road Warrior (100km), Highway Legend (1000km) |
| Photos | Shutterbug (1), Photo Enthusiast (10), Gallery Master (50) |
| Checkpoints | Explorer (1), Checkpoint Seeker (25) |
| Chat | Chatterbox (1), Active Conversationalist (100) |
| Meetups | Social Butterfly (1), Meetup Regular (10) |
| Hazards | Community Helper (1), Road Guardian (20) |
| Fuel | Fuel Saver (1), Smart Spender (50) |
| Daily Login | Daily Driver (7), Dedicated Member (30), Scene Veteran (100) |

## Integration Points

Integrate event logging into existing features:

1. **MapComponent** - Log `distance_traveled` during location updates
2. **Chat** - Log `message_sent` when sending messages
3. **FuelPriceTracker** - Log `fuel_check` when viewing prices
4. **HazardReportingPanel** - Log `hazard_reported` when submitting reports
5. **AuthComponent** - Log `daily_login` on successful login

## Security

- All database functions use `SECURITY DEFINER` to run with elevated privileges
- Row-level security (RLS) should be configured to ensure users can only access their own data
- The system is idempotent - duplicate events won't cause issues

## Migration

Run the SQL migration file in Supabase:

```bash
psql -h <host> -U postgres -d postgres -f supabase_achievements_migration.sql
```

Or paste the contents of `supabase_achievements_migration.sql` into the Supabase SQL editor.

## Performance Considerations

- Achievement checking happens automatically via triggers
- Real-time subscriptions use Supabase's change data capture
- Progress calculation is done client-side to reduce database load
- Indexes are created on frequently queried columns
