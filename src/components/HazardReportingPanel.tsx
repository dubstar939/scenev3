import React, { useState, useEffect } from "react";
import { 
  AlertTriangle, 
  AlertCircle, 
  ShieldAlert, 
  CloudRain, 
  Construction, 
  Flag,
  MapPin,
  Send,
  X,
  Mic,
  CheckCircle,
  Clock,
  Navigation
} from "lucide-react";
import { Spot } from "../types";

export interface HazardReport {
  id: string;
  type: HazardType;
  location: [number, number];
  description: string;
  severity: 'low' | 'medium' | 'high';
  reportedBy: string;
  reportedAt: string;
  upvotes: number;
  downvotes: number;
  resolved?: boolean;
  expiresAt?: string;
}

export type HazardType = 'accident' | 'police' | 'roadwork' | 'pothole' | 'weather' | 'traffic' | 'other';

interface HazardReportingPanelProps {
  currentUserLocation: [number, number] | null;
  currentUser: any;
  onSubmitReport: (report: HazardReport) => void;
  onClose: () => void;
}

const HAZARD_TYPES: { type: HazardType; icon: any; label: string; color: string }[] = [
  { type: 'accident', icon: AlertTriangle, label: 'Accident', color: 'bg-red-500' },
  { type: 'police', icon: ShieldAlert, label: 'Police', color: 'bg-blue-500' },
  { type: 'roadwork', icon: Construction, label: 'Road Work', color: 'bg-orange-500' },
  { type: 'pothole', icon: AlertCircle, label: 'Pothole', color: 'bg-yellow-500' },
  { type: 'weather', icon: CloudRain, label: 'Weather', color: 'bg-purple-500' },
  { type: 'traffic', icon: Navigation, label: 'Heavy Traffic', color: 'bg-amber-600' },
  { type: 'other', icon: Flag, label: 'Other', color: 'bg-slate-500' },
];

const SEVERITY_OPTIONS = [
  { value: 'low', label: 'Minor', color: 'bg-emerald-500' },
  { value: 'medium', label: 'Moderate', color: 'bg-yellow-500' },
  { value: 'high', label: 'Severe', color: 'bg-red-500' },
];

const HazardReportingPanel: React.FC<HazardReportingPanelProps> = ({
  currentUserLocation,
  currentUser,
  onSubmitReport,
  onClose,
}) => {
  const [selectedType, setSelectedType] = useState<HazardType | null>(null);
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high'>('medium');
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Voice recognition for natural language reporting
  const startVoiceInput = async () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice recognition is not supported in your browser.');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setDescription(transcript);
      
      // Simple AI-like parsing to detect hazard type from speech
      const lowerTranscript = transcript.toLowerCase();
      if (lowerTranscript.includes('accident') || lowerTranscript.includes('crash')) {
        setSelectedType('accident');
      } else if (lowerTranscript.includes('police') || lowerTranscript.includes('cop')) {
        setSelectedType('police');
      } else if (lowerTranscript.includes('construction') || lowerTranscript.includes('road work')) {
        setSelectedType('roadwork');
      } else if (lowerTranscript.includes('pothole') || lowerTranscript.includes('hole')) {
        setSelectedType('pothole');
      } else if (lowerTranscript.includes('rain') || lowerTranscript.includes('weather') || lowerTranscript.includes('flood')) {
        setSelectedType('weather');
      } else if (lowerTranscript.includes('traffic') || lowerTranscript.includes('congestion') || lowerTranscript.includes('slow')) {
        setSelectedType('traffic');
      }
      
      // Detect severity
      if (lowerTranscript.includes('severe') || lowerTranscript.includes('bad') || lowerTranscript.includes('major')) {
        setSeverity('high');
      } else if (lowerTranscript.includes('minor') || lowerTranscript.includes('small')) {
        setSeverity('low');
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  };

  const handleSubmit = async () => {
    if (!selectedType || !description.trim() || !currentUserLocation) {
      return;
    }

    setIsSubmitting(true);

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const report: HazardReport = {
      id: `hazard-${Date.now()}`,
      type: selectedType,
      location: currentUserLocation,
      description: description.trim(),
      severity,
      reportedBy: currentUser?.id || 'anonymous',
      reportedAt: new Date().toISOString(),
      upvotes: 0,
      downvotes: 0,
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours
    };

    onSubmitReport(report);
    setIsSubmitting(false);
    onClose();
  };

  const selectedHazard = HAZARD_TYPES.find(h => h.type === selectedType);

  return (
    <div className="fixed inset-0 z-[6000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-xl">
              <AlertTriangle size={20} className="text-red-400" />
            </div>
            <div>
              <h3 className="font-black text-white italic uppercase tracking-tighter">
                Report Hazard
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                Help other drivers stay safe
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

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Location indicator */}
          {currentUserLocation && (
            <div className="flex items-center gap-2 text-[10px] text-emerald-400 font-bold uppercase tracking-widest bg-emerald-500/10 px-3 py-2 rounded-xl border border-emerald-500/20">
              <MapPin size={12} />
              Location: {currentUserLocation[0].toFixed(4)}, {currentUserLocation[1].toFixed(4)}
            </div>
          )}

          {/* Hazard Type Selection */}
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block">
              Select Hazard Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {HAZARD_TYPES.map((hazard) => {
                const Icon = hazard.icon;
                const isSelected = selectedType === hazard.type;
                return (
                  <button
                    key={hazard.type}
                    onClick={() => setSelectedType(hazard.type)}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                      isSelected
                        ? `${hazard.color} border-white/20 text-white shadow-lg`
                        : 'bg-slate-800/50 border-white/5 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <Icon size={18} />
                    <span className="text-[8px] font-black uppercase tracking-wider">
                      {hazard.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Severity Selection */}
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block">
              Severity Level
            </label>
            <div className="flex gap-2">
              {SEVERITY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSeverity(option.value as any)}
                  className={`flex-1 py-2 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all ${
                    severity === option.value
                      ? `${option.color} border-white/20 text-white`
                      : 'bg-slate-800/50 border-white/5 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description with Voice Input */}
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block">
              Description
            </label>
            <div className="relative">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the hazard... (or use voice)"
                rows={3}
                className="w-full bg-slate-800/50 border border-white/5 rounded-xl px-4 py-3 pr-12 text-sm outline-none focus:border-indigo-500 resize-none"
              />
              <button
                onClick={startVoiceInput}
                disabled={isRecording}
                className={`absolute right-2 top-2 p-2 rounded-lg transition-all ${
                  isRecording
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-slate-700 text-slate-400 hover:text-white'
                }`}
                title="Use voice input"
              >
                <Mic size={16} />
              </button>
            </div>
            {isRecording && (
              <p className="text-[8px] text-red-400 font-bold uppercase tracking-widest mt-2 animate-pulse">
                Listening... Speak now
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={!selectedType || !description.trim() || isSubmitting}
            className="w-full py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-red-500/20 transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Clock size={16} className="animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Send size={16} />
                Submit Report
              </>
            )}
          </button>

          {/* Info */}
          <p className="text-[8px] text-slate-600 font-bold uppercase tracking-widest text-center">
            Reports expire after 2 hours or when marked resolved
          </p>
        </div>
      </div>
    </div>
  );
};

export default HazardReportingPanel;
