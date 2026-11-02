import React, { useState } from 'react';
import { useDistrict } from '../context/DistrictContext';
import { Search, MapPin, Globe, SlidersHorizontal, Check, X } from 'lucide-react';

interface SearchFilterBarProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  selectedLanguage: string;
  onLanguageChange: (lang: string) => void;
  selectedGenre: string;
  onGenreChange: (genre: string) => void;
  selectedExperience: string;
  onExperienceChange: (exp: string) => void;
}

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  searchTerm,
  onSearchChange,
  selectedLanguage,
  onLanguageChange,
  selectedGenre,
  onGenreChange,
  selectedExperience,
  onExperienceChange
}) => {
  const { districtId, districtName, setDistrict, availableDistricts } = useDistrict();
  
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const languages = ['All Languages', 'Tamil', 'Malayalam', 'Hindi', 'English', 'Telugu'];
  const genres = ['All Genres', 'Action', 'Comedy', 'Romance', 'Thriller', 'Animation', 'Family', 'Horror', 'Sci-Fi', 'Drama', 'Adventure'];
  const experiences = ['All Experiences', 'Standard', 'Premium', 'IMAX', '4DX', 'Dolby Atmos'];

  return (
    <div className="relative">
      <div className="rounded-2xl bg-[#0f172a]/90 backdrop-blur-md border border-white/10 p-2 sm:p-2.5 flex flex-col md:flex-row items-center gap-2 shadow-2xl">
        
        {/* Search Input */}
        <div className="flex-1 w-full flex items-center px-3 space-x-3 bg-[#090d16] rounded-xl border border-white/5 focus-within:border-amber-400/50 transition-colors">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search movies, theatres, languages..."
            className="w-full py-2.5 bg-transparent text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none"
          />
          {searchTerm && (
            <button onClick={() => onSearchChange('')} className="text-gray-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Controls Right */}
        <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-2">
          
          {/* Location Dropdown Pill */}
          <div className="relative">
            <button
              onClick={() => {
                setIsLocationOpen(!isLocationOpen);
                setIsLanguageOpen(false);
              }}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-[#141d33] hover:bg-[#1a2540] border border-white/10 text-xs font-semibold text-gray-200 transition-all"
            >
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>{districtName}</span>
            </button>

            {isLocationOpen && (
              <div className="absolute right-0 mt-2 w-44 rounded-xl bg-[#0f172a] border border-white/15 shadow-2xl py-2 z-50">
                <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase">District</div>
                {availableDistricts.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => {
                      setDistrict(d.id);
                      setIsLocationOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-1.5 text-xs flex items-center justify-between hover:bg-white/5 ${
                      districtId === d.id ? 'text-amber-400 font-bold bg-amber-400/10' : 'text-gray-300'
                    }`}
                  >
                    <span>{d.name}</span>
                    {districtId === d.id && <Check className="w-3 h-3 text-amber-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Language Dropdown Pill */}
          <div className="relative">
            <button
              onClick={() => {
                setIsLanguageOpen(!isLanguageOpen);
                setIsLocationOpen(false);
              }}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-[#141d33] hover:bg-[#1a2540] border border-white/10 text-xs font-semibold text-gray-200 transition-all"
            >
              <Globe className="w-3.5 h-3.5 text-purple-400" />
              <span>{selectedLanguage === 'All' ? 'All Languages' : selectedLanguage}</span>
            </button>

            {isLanguageOpen && (
              <div className="absolute right-0 mt-2 w-44 rounded-xl bg-[#0f172a] border border-white/15 shadow-2xl py-2 z-50">
                <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase">Language</div>
                {languages.map((l) => {
                  const val = l === 'All Languages' ? 'All' : l;
                  return (
                    <button
                      key={l}
                      onClick={() => {
                        onLanguageChange(val);
                        setIsLanguageOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-1.5 text-xs flex items-center justify-between hover:bg-white/5 ${
                        selectedLanguage === val ? 'text-purple-400 font-bold bg-purple-400/10' : 'text-gray-300'
                      }`}
                    >
                      <span>{l}</span>
                      {selectedLanguage === val && <Check className="w-3 h-3 text-purple-400" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Advanced Filters Button */}
          <button
            onClick={() => setIsFilterModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 border border-amber-500/30 text-xs font-bold text-amber-300 transition-all"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
          </button>

        </div>
      </div>

      {/* Advanced Filter Modal */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-white/15 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                <span>Cinematic Filters</span>
              </h3>
              <button onClick={() => setIsFilterModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Experience */}
              <div>
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-2">
                  Experience Format
                </label>
                <div className="flex flex-wrap gap-2">
                  {experiences.map((exp) => {
                    const val = exp === 'All Experiences' ? 'All' : exp;
                    return (
                      <button
                        key={exp}
                        onClick={() => onExperienceChange(val)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                          selectedExperience === val
                            ? 'bg-amber-500 text-black border-amber-500 font-bold'
                            : 'bg-white/5 border-white/10 text-gray-300 hover:border-white/30'
                        }`}
                      >
                        {exp}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Genre */}
              <div>
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-2">
                  Genre
                </label>
                <div className="flex flex-wrap gap-2">
                  {genres.map((g) => {
                    const val = g === 'All Genres' ? 'All' : g;
                    return (
                      <button
                        key={g}
                        onClick={() => onGenreChange(val)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                          selectedGenre === val
                            ? 'bg-purple-600 text-white border-purple-500 font-bold'
                            : 'bg-white/5 border-white/10 text-gray-300 hover:border-white/30'
                        }`}
                      >
                        {g}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* District */}
              <div>
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-2">
                  District (Tamil Nadu)
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableDistricts.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setDistrict(d.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        districtId === d.id
                          ? 'bg-cyan-600 text-white border-cyan-500 font-bold'
                          : 'bg-white/5 border-white/10 text-gray-300 hover:border-white/30'
                      }`}
                    >
                      {d.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between pt-3 border-t border-white/10">
              <button
                onClick={() => {
                  onLanguageChange('All');
                  onGenreChange('All');
                  onExperienceChange('All');
                }}
                className="text-xs text-gray-400 hover:text-white"
              >
                Reset All
              </button>
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold shadow-lg shadow-amber-500/20"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
