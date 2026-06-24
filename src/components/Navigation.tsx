import React, { useState } from "react";
import { MoreHorizontal, Home, MessageSquare, Users, Trophy, MapPin, Navigation, Calendar, User, Settings, Sparkles, BarChart3 } from "lucide-react";

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
}

/**
 * Navigation Component - Mobile-Optimized
 * 
 * Renders a responsive navigation bar:
 * - Desktop: Horizontal scrollable tabs
 * - Mobile: Bottom navigation bar with 5 main tabs + "More" dropdown
 */
const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Main tabs for mobile bottom nav (most frequently used)
  const mainTabs = [
    { id: "members", label: "Map", icon: Home },
    { id: "chat", label: "Chat", icon: MessageSquare },
    { id: "spots", label: "Spots", icon: MapPin },
    { id: "cruise", label: "Cruise", icon: Navigation },
    { id: "more", label: "More", icon: MoreHorizontal },
  ] as const;

  // Additional tabs shown in "More" menu on mobile
  const moreTabs = [
    { id: "contacts", label: "Contacts", icon: Users },
    { id: "achievements", label: "Achievements", icon: Trophy },
    { id: "reminders", label: "Events", icon: Calendar },
    { id: "leaderboard", label: "Leaderboard", icon: BarChart3 },
    { id: "profile", label: "Profile", icon: User },
    { id: "studio", label: "Studio", icon: Sparkles },
  ] as const;

  const getIcon = (tabId: string) => {
    const allTabs = [...mainTabs, ...moreTabs];
    const tab = allTabs.find(t => t.id === tabId);
    return tab ? <tab.icon size={20} strokeWidth={2} /> : null;
  };

  return (
    <>
      {/* Desktop Navigation - Horizontal scrollable tabs */}
      <div className="hidden md:flex p-2 gap-1 bg-black/40 m-4 md:m-6 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar">
        {[...mainTabs.slice(0, -1), ...moreTabs].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-shrink-0 px-4 py-3 text-sm font-bold rounded-xl transition-all touch-feedback flex items-center gap-2 ${
              activeTab === tab.id 
                ? "bg-indigo-600 text-white shadow-lg" 
                : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
            }`}
          >
            {tab.icon && <tab.icon size={16} />}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[2000] bg-slate-900/95 backdrop-blur-2xl border-t border-white/10 safe-area-bottom">
        <div className="flex items-center justify-around py-2 px-2">
          {mainTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            if (tab.id === "more") {
              return (
                <button
                  key={tab.id}
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className={`flex flex-col items-center justify-center p-2 min-w-[60px] min-h-[60px] rounded-xl transition-all touch-feedback relative ${
                    showMoreMenu || moreTabs.some(t => t.id === activeTab)
                      ? "text-indigo-400" 
                      : "text-slate-500"
                  }`}
                >
                  <div className={`p-2 rounded-xl transition-all ${
                    showMoreMenu || moreTabs.some(t => t.id === activeTab)
                      ? "bg-indigo-600/20" 
                      : ""
                  }`}>
                    <Icon size={22} strokeWidth={2.5} />
                  </div>
                  <span className="text-[10px] font-bold mt-1">{tab.label}</span>
                  
                  {/* Indicator dot if a "more" tab is active */}
                  {!showMoreMenu && moreTabs.some(t => t.id === activeTab) && (
                    <div className="absolute top-1 right-2 w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                  )}
                </button>
              );
            }
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center p-2 min-w-[60px] min-h-[60px] rounded-xl transition-all touch-feedback ${
                  isActive 
                    ? "text-indigo-400" 
                    : "text-slate-500"
                }`}
              >
                <div className={`p-2 rounded-xl transition-all ${
                  isActive ? "bg-indigo-600/20" : ""
                }`}>
                  <Icon size={22} strokeWidth={2.5} />
                </div>
                <span className="text-[10px] font-bold mt-1">{tab.label}</span>
              </button>
            );
          })}
        </div>
        
        {/* Safe area padding for devices with home indicator */}
        <div className="h-[env(safe-area-inset-bottom)] bg-slate-900/95" />
      </div>

      {/* More Menu Dropdown (Mobile) */}
      {showMoreMenu && (
        <>
          {/* Backdrop */}
          <div 
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[2001]"
            onClick={() => setShowMoreMenu(false)}
          />
          
          {/* Menu Panel */}
          <div className="md:hidden fixed bottom-[calc(env(safe-area-inset-bottom)+80px)] left-4 right-4 z-[2002] bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
            <div className="p-4 border-b border-white/5">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">More Options</h3>
            </div>
            <div className="p-2 grid grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {moreTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setShowMoreMenu(false);
                    }}
                    className={`flex flex-col items-center p-4 rounded-2xl transition-all touch-feedback min-h-[80px] ${
                      isActive 
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" 
                        : "bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <Icon size={24} strokeWidth={2} className="mb-2" />
                    <span className="text-[11px] font-bold text-center">{tab.label}</span>
                  </button>
                );
              })}
            </div>
            
            {/* Safe area padding */}
            <div className="h-[env(safe-area-inset-bottom)]" />
          </div>
        </>
      )}
    </>
  );
};

export default React.memo(Navigation);
