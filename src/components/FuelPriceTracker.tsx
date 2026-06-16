import React, { useState, useEffect } from "react";
import { 
  Fuel, 
  MapPin, 
  Navigation, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Clock,
  CheckCircle,
  X,
  Zap,
  Car,
  DollarSign
} from "lucide-react";

export interface FuelStation {
  id: string;
  name: string;
  brand?: string;
  location: [number, number];
  address?: string;
  prices: {
    regular: number;
    midGrade?: number;
    premium?: number;
    diesel?: number;
  };
  lastUpdated: string;
  distance?: number; // in miles
  amenities?: string[];
}

interface FuelPriceTrackerProps {
  currentUserLocation: [number, number] | null;
  route?: [number, number][];
  onSelectStation: (station: FuelStation) => void;
  onClose: () => void;
}

// Mock fuel stations data - in production this would come from an API
const MOCK_FUEL_STATIONS: FuelStation[] = [
  {
    id: 'fuel-1',
    name: 'Shell Station',
    brand: 'Shell',
    location: [30.4213, -87.2169],
    address: '123 Main St',
    prices: { regular: 2.89, midGrade: 3.19, premium: 3.49, diesel: 3.29 },
    lastUpdated: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    distance: 0.5,
    amenities: ['car-wash', 'convenience-store', 'air-pump']
  },
  {
    id: 'fuel-2',
    name: 'Chevron',
    brand: 'Chevron',
    location: [30.4350, -87.2280],
    address: '456 Highway 98',
    prices: { regular: 2.79, midGrade: 3.09, premium: 3.39, diesel: 3.19 },
    lastUpdated: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    distance: 1.2,
    amenities: ['convenience-store', 'restrooms']
  },
  {
    id: 'fuel-3',
    name: 'Exxon Mobil',
    brand: 'Exxon',
    location: [30.4180, -87.2350],
    address: '789 Airport Blvd',
    prices: { regular: 2.95, midGrade: 3.25, premium: 3.55, diesel: 3.35 },
    lastUpdated: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    distance: 1.8,
    amenities: ['car-wash', 'convenience-store', 'loyalty-rewards']
  },
  {
    id: 'fuel-4',
    name: 'BP Gas',
    brand: 'BP',
    location: [30.4450, -87.2100],
    address: '321 Naval Air Station Rd',
    prices: { regular: 2.85, midGrade: 3.15, premium: 3.45, diesel: 3.25 },
    lastUpdated: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    distance: 2.3,
    amenities: ['convenience-store', 'air-pump']
  },
  {
    id: 'fuel-5',
    name: 'Costco Wholesale',
    brand: 'Costco',
    location: [30.4280, -87.2450],
    address: '5550 N Davis Hwy',
    prices: { regular: 2.69, midGrade: 2.99, premium: 3.29, diesel: 3.09 },
    lastUpdated: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    distance: 2.5,
    amenities: ['membership-required', 'convenience-store']
  },
];

const FuelPriceTracker: React.FC<FuelPriceTrackerProps> = ({
  currentUserLocation,
  route,
  onSelectStation,
  onClose,
}) => {
  const [stations, setStations] = useState<FuelStation[]>([]);
  const [sortBy, setSortBy] = useState<'price' | 'distance' | 'recent'>('price');
  const [fuelType, setFuelType] = useState<'regular' | 'midGrade' | 'premium' | 'diesel'>('regular');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);

  useEffect(() => {
    // Simulate loading fuel stations near user or along route
    const loadStations = async () => {
      setIsLoading(true);
      
      // In production, this would call a real fuel price API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      let filteredStations = [...MOCK_FUEL_STATIONS];
      
      // If we have a route, prioritize stations along the route
      if (route && route.length > 0) {
        // Simple distance calculation - in production use proper routing API
        filteredStations = filteredStations.map(station => ({
          ...station,
          distance: Math.random() * 5 + 0.5 // Mock distance along route
        }));
      }
      
      setStations(filteredStations);
      setIsLoading(false);
    };

    loadStations();
  }, [currentUserLocation, route]);

  const sortedStations = [...stations].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return a.prices[fuelType] - b.prices[fuelType];
      case 'distance':
        return (a.distance || 0) - (b.distance || 0);
      case 'recent':
        return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
      default:
        return 0;
    }
  });

  const cheapestStation = stations.reduce((min, station) => 
    station.prices[fuelType] < min.prices[fuelType] ? station : min
  , stations[0]);

  const getPriceTrend = (price: number, index: number) => {
    if (index === 0) return 'stable';
    const prevPrice = sortedStations[index - 1]?.prices[fuelType] || price;
    if (price < prevPrice) return 'down';
    if (price > prevPrice) return 'up';
    return 'stable';
  };

  const formatLastUpdated = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 z-[6000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-xl">
              <Fuel size={20} className="text-orange-400" />
            </div>
            <div>
              <h3 className="font-black text-white italic uppercase tracking-tighter">
                Fuel Prices
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                Compare prices along your route
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-xl transition-colors"
          >
            <X size={18} className="text-slate-400" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-white/5 space-y-3 shrink-0">
          {/* Fuel Type Selection */}
          <div className="flex gap-2">
            {(['regular', 'midGrade', 'premium', 'diesel'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFuelType(type)}
                className={`flex-1 py-2 rounded-xl border text-[8px] font-black uppercase tracking-wider transition-all ${
                  fuelType === type
                    ? 'bg-orange-500 border-orange-400 text-white'
                    : 'bg-slate-800/50 border-white/5 text-slate-400 hover:bg-slate-800'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Sort Options */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {[
                { value: 'price', label: 'Price', icon: DollarSign },
                { value: 'distance', label: 'Distance', icon: Navigation },
                { value: 'recent', label: 'Recent', icon: Clock }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSortBy(option.value as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                    sortBy === option.value
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <option.icon size={12} />
                  {option.label}
                </button>
              ))}
            </div>
            
            {cheapestStation && (
              <div className="text-[8px] text-emerald-400 font-bold uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                Best: ${cheapestStation.prices[fuelType].toFixed(2)}
              </div>
            )}
          </div>
        </div>

        {/* Stations List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <Fuel size={32} className="animate-pulse mb-4" />
              <p className="text-[10px] font-black uppercase tracking-widest">
                Loading fuel prices...
              </p>
            </div>
          ) : sortedStations.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Fuel size={32} className="mx-auto mb-4 opacity-50" />
              <p className="text-[10px] font-black uppercase tracking-widest">
                No fuel stations found nearby
              </p>
            </div>
          ) : (
            sortedStations.map((station, index) => {
              const trend = getPriceTrend(station.prices[fuelType], index);
              const isSelected = selectedStationId === station.id;
              
              return (
                <div
                  key={station.id}
                  onClick={() => {
                    setSelectedStationId(station.id);
                    onSelectStation(station);
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-orange-500/10 border-orange-500/30 shadow-lg shadow-orange-500/10'
                      : 'bg-slate-800/30 border-white/5 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${
                        station.brand === 'Shell' ? 'bg-yellow-500/20 text-yellow-400' :
                        station.brand === 'Chevron' ? 'bg-blue-500/20 text-blue-400' :
                        station.brand === 'Exxon' ? 'bg-red-500/20 text-red-400' :
                        station.brand === 'BP' ? 'bg-green-500/20 text-green-400' :
                        station.brand === 'Costco' ? 'bg-red-600/20 text-red-400' :
                        'bg-slate-700 text-slate-400'
                      }`}>
                        <Fuel size={16} />
                      </div>
                      <div>
                        <h4 className="font-black text-white italic uppercase text-sm">
                          {station.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">
                            {station.distance?.toFixed(1)} mi away
                          </span>
                          <span className="text-[8px] text-slate-600">•</span>
                          <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">
                            Updated {formatLastUpdated(station.lastUpdated)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-black text-white tracking-tighter">
                        ${station.prices[fuelType].toFixed(2)}
                      </div>
                      <div className="flex items-center justify-end gap-1 mt-0.5">
                        {trend === 'down' ? (
                          <TrendingDown size={12} className="text-emerald-400" />
                        ) : trend === 'up' ? (
                          <TrendingUp size={12} className="text-red-400" />
                        ) : (
                          <Minus size={12} className="text-slate-500" />
                        )}
                        <span className={`text-[8px] font-black uppercase tracking-widest ${
                          trend === 'down' ? 'text-emerald-400' :
                          trend === 'up' ? 'text-red-400' :
                          'text-slate-500'
                        }`}>
                          {trend === 'down' ? 'Great deal' : trend === 'up' ? 'Higher' : 'Average'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Price breakdown */}
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/5">
                    {station.prices.regular && (
                      <div className={`text-center p-2 rounded-lg ${fuelType === 'regular' ? 'bg-orange-500/10 border border-orange-500/20' : 'bg-slate-900/50'}`}>
                        <div className="text-[7px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Regular</div>
                        <div className="text-xs font-black text-white">${station.prices.regular.toFixed(2)}</div>
                      </div>
                    )}
                    {station.prices.premium && (
                      <div className={`text-center p-2 rounded-lg ${fuelType === 'premium' ? 'bg-orange-500/10 border border-orange-500/20' : 'bg-slate-900/50'}`}>
                        <div className="text-[7px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Premium</div>
                        <div className="text-xs font-black text-white">${station.prices.premium.toFixed(2)}</div>
                      </div>
                    )}
                    {station.prices.diesel && (
                      <div className={`text-center p-2 rounded-lg ${fuelType === 'diesel' ? 'bg-orange-500/10 border border-orange-500/20' : 'bg-slate-900/50'}`}>
                        <div className="text-[7px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Diesel</div>
                        <div className="text-xs font-black text-white">${station.prices.diesel.toFixed(2)}</div>
                      </div>
                    )}
                  </div>

                  {/* Amenities */}
                  {station.amenities && station.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {station.amenities.map((amenity) => (
                        <span
                          key={amenity}
                          className="text-[7px] text-slate-500 font-bold uppercase tracking-wider bg-slate-800/50 px-2 py-0.5 rounded-md"
                        >
                          {amenity.replace(/-/g, ' ')}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Action button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectStation(station);
                    }}
                    className="w-full mt-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                  >
                    <Navigation size={12} />
                    Navigate to Station
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer with savings info */}
        {cheapestStation && sortedStations.length > 1 && (
          <div className="p-4 border-t border-white/5 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 shrink-0">
            <div className="flex items-center gap-2 text-emerald-400">
              <Zap size={14} className="animate-pulse" />
              <p className="text-[9px] font-bold uppercase tracking-wider">
                Save up to ${(sortedStations[sortedStations.length - 1]?.prices[fuelType] - cheapestStation.prices[fuelType]).toFixed(2)}/gal by choosing the cheapest station
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FuelPriceTracker;
