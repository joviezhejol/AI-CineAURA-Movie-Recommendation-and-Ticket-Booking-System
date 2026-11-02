import React from 'react';
import { Languages, ChevronRight } from 'lucide-react';

interface LanguageFilterProps {
  selectedLanguage: string;
  onSelectLanguage: (lang: string) => void;
  onViewAll?: () => void;
}

export const LanguageFilter: React.FC<LanguageFilterProps> = ({
  selectedLanguage,
  onSelectLanguage,
  onViewAll
}) => {
  const languages = [
    { name: 'Tamil', script: 'த', color: 'from-orange-500/20 to-amber-500/10' },
    { name: 'Malayalam', script: 'മ', color: 'from-emerald-500/20 to-teal-500/10' },
    { name: 'Hindi', script: 'अ', color: 'from-rose-500/20 to-pink-500/10' },
    { name: 'English', script: 'A', color: 'from-blue-500/20 to-indigo-500/10' },
    { name: 'Telugu', script: 'తె', color: 'from-purple-500/20 to-violet-500/10' },
  ];

  return (
    <div className="rounded-2xl bg-[#0f172a]/80 border border-white/10 p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Languages className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-bold text-white tracking-wide">
            Explore by Language
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
        {languages.map((l) => {
          const isSelected = selectedLanguage.toLowerCase() === l.name.toLowerCase();
          return (
            <button
              key={l.name}
              onClick={() => onSelectLanguage(isSelected ? 'All' : l.name)}
              className={`p-3 rounded-xl border flex items-center space-x-3 transition-all text-left ${
                isSelected
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md ring-1 ring-amber-400/50'
                  : 'bg-white/5 border-white/5 hover:border-white/20 text-gray-200 hover:bg-white/10'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center font-bold text-base text-amber-400 border border-white/10 flex-shrink-0">
                {l.script}
              </div>
              <span className="text-xs font-bold truncate">{l.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
