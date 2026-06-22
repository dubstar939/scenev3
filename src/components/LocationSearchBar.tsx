import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, MapPin, Navigation, X, Loader2, Mic, Clock, Star, Fuel, Utensils, Camera, Users } from 'lucide-react';

interface SearchResult {
  id: string;
  name: string;
  address: string;
  location: [number, number];
  type: 'fuel' | 'food' | 'scenic' | 'meetup' | 'other';
  rating?: number;
  distance?: number;
  imageUrl?: string;
}

interface LocationSearchBarProps {
  onLocationSelect: (result: SearchResult) => void;
  onNavigate: (result: SearchResult) => void;
  currentLocation?: [number, number];
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

const CATEGORY_ICONS = {
  fuel: Fuel,
  food: Utensils,
  scenic: Camera,
  meetup: Users,
  other: MapPin,
};

const LocationSearchBar: React.FC<LocationSearchBarProps> = ({
  onLocationSelect,
  onNavigate,
  currentLocation,
  placeholder = 'Search places...',
  autoFocus = false,
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<SearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('scene_recent_searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        // Simulated search - replace with actual API call
        const mockResults: SearchResult[] = [
          {
            id: '1',
            name: query,
            address: 'Near your location',
            location: currentLocation || [30.4213, -87.2169],
            type: selectedCategory !== 'all' ? selectedCategory as any : 'other',
            rating: 4.5,
            distance: 2.3,
          },
        ];
        setResults(mockResults);
      } catch (error) {
        console.error('Search failed:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, currentLocation, selectedCategory]);

  const handleSelect = useCallback((result: SearchResult) => {
    onLocationSelect(result);
    setQuery(result.name);
    setShowSuggestions(false);
    
    // Save to recent searches
    const updated = [result, ...recentSearches.filter(r => r.id !== result.id)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('scene_recent_searches', JSON.stringify(updated));
  }, [onLocationSelect, recentSearches]);

  const handleVoiceSearch = useCallback(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.start();
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
      };
    } else {
      alert('Voice search not supported in this browser');
    }
  }, []);

  const categories = useMemo(() => [
    { id: 'all', label: 'All', icon: Search },
    { id: 'fuel', label: 'Fuel', icon: Fuel },
    { id: 'food', label: 'Food', icon: Utensils },
    { id: 'scenic', label: 'Scenic', icon: Camera },
    { id: 'meetup', label: 'Meets', icon: Users },
  ], []);

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
          {isLoading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Search size={18} />
          )}
        </div>
        
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full bg-slate-800/80 border border-white/10 rounded-2xl py-3 pl-12 pr-24 text-sm outline-none focus:border-indigo-500/50 focus:bg-slate-800 transition-all placeholder:text-slate-500 font-semibold text-white"
        />
        
        <div className="absolute inset-y-0 right-2 flex items-center gap-1">
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-2 hover:bg-slate-700 rounded-xl transition-colors text-slate-400 hover:text-white"
            >
              <X size={16} />
            </button>
          )}
          <button
            onClick={handleVoiceSearch}
            className="p-2 hover:bg-indigo-600 rounded-xl transition-colors text-indigo-400 hover:text-white"
            title="Voice search"
          >
            <Mic size={16} />
          </button>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'bg-slate-800/50 text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              <Icon size={14} />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (results.length > 0 || recentSearches.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 max-h-80 overflow-y-auto">
          {/* Recent Searches */}
          {!query && recentSearches.length > 0 && (
            <div className="p-3 border-b border-white/5">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                <Clock size={12} /> Recent Searches
              </h4>
              <div className="space-y-1">
                {recentSearches.map((search) => {
                  const Icon = CATEGORY_ICONS[search.type] || MapPin;
                  return (
                    <button
                      key={search.id}
                      onClick={() => handleSelect(search)}
                      className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800 transition-all text-left group"
                    >
                      <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-indigo-600/20 transition-colors">
                        <Icon size={14} className="text-slate-400 group-hover:text-indigo-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{search.name}</p>
                        <p className="text-[10px] text-slate-500 truncate">{search.address}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Search Results */}
          {results.length > 0 && (
            <div className="p-3">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                Results
              </h4>
              <div className="space-y-1">
                {results.map((result) => {
                  const Icon = CATEGORY_ICONS[result.type] || MapPin;
                  return (
                    <div
                      key={result.id}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800 transition-all group"
                    >
                      <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-indigo-600/20 transition-colors">
                        <Icon size={14} className="text-slate-400 group-hover:text-indigo-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-white truncate">{result.name}</p>
                          {result.rating && (
                            <span className="flex items-center gap-1 text-[10px] text-amber-400 font-bold">
                              <Star size={8} fill="currentColor" /> {result.rating}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 truncate">{result.address}</p>
                      </div>
                      {result.distance && (
                        <span className="text-[10px] font-bold text-slate-400">
                          {result.distance} mi
                        </span>
                      )}
                      <button
                        onClick={() => onNavigate(result)}
                        className="p-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all text-white opacity-0 group-hover:opacity-100"
                      >
                        <Navigation size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(LocationSearchBar);
