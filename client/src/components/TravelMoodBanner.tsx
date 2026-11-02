import React from 'react';
import { Plane, ArrowRight, Sparkles } from 'lucide-react';

interface TravelMoodBannerProps {
  onExploreTravel: () => void;
}

export const TravelMoodBanner: React.FC<TravelMoodBannerProps> = ({ onExploreTravel }) => {
  return (
    <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-gradient-to-r from-[#141b2e] via-[#101726] to-[#0c1220] p-6 lg:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 group">
      
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-80 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex items-center space-x-4 z-10">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center text-black shadow-xl shadow-amber-500/20 flex-shrink-0 group-hover:rotate-6 transition-transform">
          <Plane className="w-7 h-7" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-lg lg:text-xl font-bold text-white tracking-tight">
              Travelling Soon?
            </h3>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Unique Feature
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Let Aura AI plan your perfect movie journey for night drives, weekend outings, or flights.
          </p>
        </div>
      </div>

      <button
        onClick={onExploreTravel}
        className="z-10 flex items-center space-x-2 px-6 py-3 rounded-full bg-[#182238] hover:bg-[#1f2b48] border border-amber-500/40 hover:border-amber-400 text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-black/40 group/btn flex-shrink-0"
      >
        <span>Explore Travel Mood</span>
        <ArrowRight className="w-4 h-4 text-amber-400 group-hover/btn:translate-x-1 transition-transform" />
      </button>

    </div>
  );
};
