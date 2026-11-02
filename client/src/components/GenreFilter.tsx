import React from 'react';
import { Film, ChevronRight, Flame, Smile, Heart, Theater, Gamepad2, Users, Skull, Globe } from 'lucide-react';

interface GenreFilterProps {
  selectedGenre: string;
  onSelectGenre: (genre: string) => void;
  onViewAll?: () => void;
}

export const GenreFilter: React.FC<GenreFilterProps> = ({
  selectedGenre,
  onSelectGenre,
  onViewAll
}) => {
  const genres = [
    { name: 'Action', icon: Flame, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
    { name: 'Comedy', icon: Smile, color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
    { name: 'Romance', icon: Heart, color: 'text-pink-500 bg-pink-500/10 border-pink-500/20' },
    { name: 'Thriller', icon: Theater, color: 'text-purple-400 bg-purple-400/10 border-purple-400/20' },
    { name: 'Animation', icon: Gamepad2, color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20' },
    { name: 'Family', icon: Users, color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
    { name: 'Horror', icon: Skull, color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' },
    { name: 'Sci-Fi', icon: Globe, color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  ];

  return (
    <div className="rounded-2xl bg-[#0f172a]/80 border border-white/10 p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Film className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white tracking-wide">
            Popular Genres
          </h3>
        </div>
        <button
          onClick={onViewAll}
          className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center space-x-1"
        >
          <span>View All</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {genres.map((g) => {
          const Icon = g.icon;
          const isSelected = selectedGenre.toLowerCase() === g.name.toLowerCase();
          return (
            <button
              key={g.name}
              onClick={() => onSelectGenre(isSelected ? 'All' : g.name)}
              className={`p-3 rounded-xl border flex items-center space-x-3 transition-all text-left ${
                isSelected
                  ? 'bg-purple-600/20 border-purple-400 text-white shadow-md ring-1 ring-purple-400/50'
                  : 'bg-white/5 border-white/5 hover:border-white/20 text-gray-200 hover:bg-white/10'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center border flex-shrink-0 ${g.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold truncate">{g.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
