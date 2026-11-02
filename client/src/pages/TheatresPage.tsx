import React, { useState, useEffect } from 'react';
import { api, Theatre } from '../services/api';
import { useDistrict } from '../context/DistrictContext';
import { Building2, MapPin, Star, Sparkles, Check, ChevronRight } from 'lucide-react';

interface TheatresPageProps {
  onSelectTheatre: (theatre: Theatre) => void;
}

export const TheatresPage: React.FC<TheatresPageProps> = ({ onSelectTheatre }) => {
  const { districtId, districtName, setDistrict, availableDistricts } = useDistrict();
  const [theatres, setTheatres] = useState<Theatre[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTheatres = async () => {
      try {
        setIsLoading(true);
        const res = await api.getTheatres(districtId);
        setTheatres(res.theatres || []);
      } catch (err) {
        console.error('Failed to load theatres:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTheatres();
  }, [districtId]);

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white flex items-center space-x-2">
            <Building2 className="w-6 h-6 text-amber-400" />
            <span>Theatres in {districtName}</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Certified CineAura cinematic venues with 4K Laser, Dolby Atmos, and Luxury Recliners.
          </p>
        </div>

        {/* District Switcher Tabs */}
        <div className="flex items-center space-x-2 bg-[#0f172a] p-1.5 rounded-2xl border border-white/10">
          {availableDistricts.map((d) => (
            <button
              key={d.id}
              onClick={() => setDistrict(d.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                districtId === d.id
                  ? 'bg-amber-500 text-black font-bold shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {d.name}
            </button>
          ))}
        </div>
      </div>

      {/* Theatres List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-64 rounded-3xl bg-white/5 animate-pulse"></div>
          ))}
        </div>
      ) : theatres.length === 0 ? (
        <div className="p-16 text-center rounded-3xl bg-[#0f172a] border border-white/10 space-y-3">
          <Building2 className="w-16 h-16 text-gray-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No theatres found in {districtName}</h3>
          <p className="text-xs text-gray-400">
            Switch between Chennai, Chengalpattu, or Kanchipuram using the location selector.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {theatres.map((theatre) => (
            <div
              key={theatre.id}
              className="rounded-3xl bg-[#0f172a] border border-white/10 hover:border-amber-400/40 p-6 shadow-xl transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                {/* Theatre Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                      {theatre.name}
                    </h3>
                    <p className="text-xs text-gray-400 flex items-center space-x-1.5 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      <span>{theatre.address}, {theatre.city}</span>
                    </p>
                  </div>
                  <div className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-black/40 border border-white/10 text-amber-400 text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{theatre.rating.toFixed(1)}</span>
                  </div>
                </div>

                {/* Facilities Badges */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {(theatre.facilities || []).map((fac: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] text-gray-300 font-medium"
                    >
                      {fac}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-[11px] text-gray-400">
                  Multiple showtimes running today
                </span>
                <button
                  onClick={() => onSelectTheatre(theatre)}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all shadow-md shadow-amber-500/20 flex items-center space-x-1"
                >
                  <span>View Shows</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};
