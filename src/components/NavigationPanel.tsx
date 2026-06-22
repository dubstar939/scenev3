import React from 'react';
import { Navigation, X, MapPin, ChevronRight } from 'lucide-react';

interface NavigationStep {
  instruction: string;
  distance: number;
  duration: number;
  type: 'start' | 'turn-left' | 'turn-right' | 'straight' | 'arrive' | 'merge' | 'exit';
}

interface NavigationPanelProps {
  destination: {
    name: string;
    address: string;
    location: [number, number];
  };
  currentLocation?: [number, number];
  onNavigate: () => void;
  onCancel: () => void;
  eta?: number; // minutes
  distance?: number; // miles
  steps?: NavigationStep[];
  className?: string;
}

const INSTRUCTION_ICONS = {
  start: Navigation,
  'turn-left': ChevronRight,
  'turn-right': ChevronRight,
  straight: Navigation,
  arrive: MapPin,
  merge: Navigation,
  exit: Navigation,
};

const NavigationPanel: React.FC<NavigationPanelProps> = ({
  destination,
  currentLocation,
  onNavigate,
  onCancel,
  eta,
  distance,
  steps = [],
  className = '',
}) => {
  const nextStep = steps[0];
  const Icon = nextStep ? INSTRUCTION_ICONS[nextStep.type] : Navigation;

  return (
    <div className={`bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-xl">
            <Navigation size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-tight">
              Navigation
            </h3>
            <p className="text-[10px] text-slate-400 font-bold">
              {destination.name}
            </p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-red-500/10 rounded-xl transition-colors text-slate-400 hover:text-red-400"
        >
          <X size={18} />
        </button>
      </div>

      {/* ETA & Distance */}
      {(eta !== undefined || distance !== undefined) && (
        <div className="grid grid-cols-2 gap-4 p-4 border-b border-white/5">
          {eta !== undefined && (
            <div className="text-center">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                ETA
              </p>
              <p className="text-xl font-black text-emerald-400">
                {eta} min
              </p>
            </div>
          )}
          {distance !== undefined && (
            <div className="text-center">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Distance
              </p>
              <p className="text-xl font-black text-indigo-400">
                {distance.toFixed(1)} mi
              </p>
            </div>
          )}
        </div>
      )}

      {/* Next Turn Instruction */}
      {nextStep && (
        <div className="p-4 bg-indigo-600/10 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/20">
              <Icon 
                size={28} 
                className="text-white" 
                style={{ 
                  transform: nextStep.type === 'turn-left' ? 'rotate(-90deg)' : 'none' 
                }} 
              />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-white leading-tight">
                {nextStep.instruction}
              </p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">
                  {nextStep.distance.toFixed(1)} mi
                </span>
                <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">
                  •
                </span>
                <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">
                  {Math.round(nextStep.duration / 60)} min
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Destination Info */}
      <div className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <MapPin size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">
              {destination.name}
            </p>
            <p className="text-[10px] text-slate-400 truncate">
              {destination.address}
            </p>
          </div>
        </div>

        {/* Start Navigation Button */}
        <button
          onClick={onNavigate}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <Navigation size={16} />
          Start Navigation
        </button>

        {/* External Navigation Options */}
        <div className="pt-2 border-t border-white/5">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 text-center">
            Or open in
          </p>
          <div className="grid grid-cols-2 gap-2">
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${destination.location[0]},${destination.location[1]}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-black uppercase text-[10px] tracking-widest transition-all text-center"
            >
              Google Maps
            </a>
            <a
              href={`https://waze.com/ul?ll=${destination.location[0]},${destination.location[1]}&navigate=yes`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-black uppercase text-[10px] tracking-widest transition-all text-center"
            >
              Waze
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(NavigationPanel);
