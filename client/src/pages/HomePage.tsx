import React from 'react';
import { Movie } from '../services/api';
import { HeroBanner } from '../components/HeroBanner';
import { AuraAiWidget } from '../components/AuraAiWidget';
import { SearchFilterBar } from '../components/SearchFilterBar';
import { MovieCard } from '../components/MovieCard';
import { LanguageFilter } from '../components/LanguageFilter';
import { GenreFilter } from '../components/GenreFilter';
import { TravelMoodBanner } from '../components/TravelMoodBanner';
import { Clapperboard, ChevronRight, Film } from 'lucide-react';
import { RightSidebar } from '../components/RightSidebar';

interface HomePageProps {
  movies: Movie[];
  isLoading: boolean;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  selectedLanguage: string;
  onLanguageChange: (lang: string) => void;
  selectedGenre: string;
  onGenreChange: (genre: string) => void;
  selectedExperience: string;
  onExperienceChange: (exp: string) => void;
  onBookMovie: (movie: Movie) => void;
  onViewDetails: (movieId: string) => void;
  onOpenAuraAi: () => void;
  onOpenAuraCategory: (category: 'mood' | 'vibe' | 'travel') => void;
  onNavigate: (page: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  movies,
  isLoading,
  searchTerm,
  onSearchChange,
  selectedLanguage,
  onLanguageChange,
  selectedGenre,
  onGenreChange,
  selectedExperience,
  onExperienceChange,
  onBookMovie,
  onViewDetails,
  onOpenAuraAi,
  onOpenAuraCategory,
  onNavigate
}) => {
  // Only show movies currently active in CineAura theatres
  const runningMovies = movies.filter(m => m.is_now_showing !== false);

  return (
    <div className="space-y-8 pb-16">
      
      {/* 1. Hero Row (Hero Banner on Left 2/3 + Aura AI Widget on Right 1/3) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <HeroBanner
            movies={movies}
            onBookMovie={onBookMovie}
            onViewDetails={onViewDetails}
          />
        </div>
        <div className="lg:col-span-1">
          <AuraAiWidget onOpenWithCategory={onOpenAuraCategory} />
        </div>
      </section>

      {/* 2. Search & Filter Bar */}
      <section>
        <SearchFilterBar
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          selectedLanguage={selectedLanguage}
          onLanguageChange={onLanguageChange}
          selectedGenre={selectedGenre}
          onGenreChange={onGenreChange}
          selectedExperience={selectedExperience}
          onExperienceChange={onExperienceChange}
        />
      </section>

      {/* 3. Main Split Section (Currently Running on Left + Languages/Genres on Right) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Currently Running in Theatres */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Clapperboard className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-white tracking-tight">
                  Currently Running in Theatres
                </h2>
                <p className="text-xs text-gray-400">
                  Experience the latest blockbusters on the big screen.
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('movies')}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center space-x-1"
            >
              <span>View All</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Movies Cards Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="h-80 rounded-2xl bg-white/5 animate-pulse"></div>
              ))}
            </div>
          ) : runningMovies.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-[#0f172a] border border-white/10 space-y-3">
              <Film className="w-12 h-12 text-gray-600 mx-auto" />
              <h3 className="text-base font-bold text-white">No results found</h3>
              <p className="text-xs text-gray-400">
                Try adjusting your search query, location district, or filter criteria.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {runningMovies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  onBook={onBookMovie}
                  onDetails={onViewDetails}
                />
              ))}
            </div>
          )}

        </div>

        {/* Right 1 Column: Sidebar with Trending / Top Rated / Coming Soon */}
        <RightSidebar
          movies={movies}
          onBook={onBookMovie}
          onDetails={onViewDetails}
        />


      </section>

      {/* 4. Bottom Travelling Soon Banner */}
      <section>
        <TravelMoodBanner onExploreTravel={() => onOpenAuraCategory('travel')} />
      </section>

    </div>
  );
};
