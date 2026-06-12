import React from "react";
import { Plus, Trophy } from "lucide-react";
import { Achievement } from "../../../types";

interface AchievementsTabProps {
  filteredAchievements: Achievement[];
  achievementFilters: {
    priority: string;
    status: string;
    dateRange: { start: string; end: string };
  };
  setAchievementFilters: React.Dispatch<React.SetStateAction<{
    priority: string;
    status: string;
    dateRange: { start: string; end: string };
  }>>;
  handleAddAchievement: () => void;
}

/**
 * AchievementsTab Component
 * 
 * Displays a filtered list of achievements and provides controls for filtering and adding new ones.
 * 
 * @param {AchievementsTabProps} props - Component props
 * @returns {JSX.Element} The rendered achievements tab
 * 
 * @example
 * <AchievementsTab filteredAchievements={achievements} achievementFilters={filters} setAchievementFilters={setFilters} handleAddAchievement={onAdd} />
 */
const AchievementsTab: React.FC<AchievementsTabProps> = ({ 
  filteredAchievements, 
  achievementFilters, 
  setAchievementFilters, 
  handleAddAchievement 
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-black text-white italic uppercase tracking-tighter flex items-center gap-2">
          <Trophy size={20} className="text-indigo-500" /> Achievements
        </h3>
        <button 
          onClick={handleAddAchievement}
          className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95 flex items-center gap-2"
        >
          <Plus size={18} />
          <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">New Achievement</span>
        </button>
      </div>

      {/* Filters */}
      <div className="p-4 bg-slate-900/50 rounded-2xl border border-white/5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Priority</label>
            <select
              value={achievementFilters.priority}
              onChange={(e) => setAchievementFilters(prev => ({ ...prev, priority: e.target.value }))}
              className="w-full bg-slate-800 border border-white/5 rounded-xl px-3 py-2 text-xs outline-none focus:border-indigo-500"
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Status</label>
            <select
              value={achievementFilters.status}
              onChange={(e) => setAchievementFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full bg-slate-800 border border-white/5 rounded-xl px-3 py-2 text-xs outline-none focus:border-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In-Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Start Date</label>
            <input
              type="date"
              value={achievementFilters.dateRange.start}
              onChange={(e) => setAchievementFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, start: e.target.value } }))}
              className="w-full bg-slate-800 border border-white/5 rounded-xl px-3 py-2 text-xs outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">End Date</label>
            <input
              type="date"
              value={achievementFilters.dateRange.end}
              onChange={(e) => setAchievementFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, end: e.target.value } }))}
              className="w-full bg-slate-800 border border-white/5 rounded-xl px-3 py-2 text-xs outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredAchievements.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/50 rounded-3xl border border-white/5">
            <p className="text-slate-500 text-sm font-bold">No achievements found matching your filters.</p>
          </div>
        ) : (
          filteredAchievements.map((achievement) => (
            <div key={achievement.id} className="p-4 bg-slate-900/50 rounded-2xl border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-white font-bold">{achievement.title}</h4>
                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${
                  achievement.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                  achievement.priority === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {achievement.priority}
                </span>
              </div>
              <p className="text-slate-400 text-xs">{achievement.description}</p>
              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <span className="text-slate-600 text-[10px] font-bold uppercase">{new Date(achievement.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default React.memo(AchievementsTab);
