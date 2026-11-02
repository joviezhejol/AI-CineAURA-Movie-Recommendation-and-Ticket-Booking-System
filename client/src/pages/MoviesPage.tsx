import React from 'react';
import { Movie } from '../services/api';
import { MovieCard } from '../components/MovieCard';
import { SearchFilterBar } from '../components/SearchFilterBar';
import { Film } from 'lucide-react';

interface MoviesPageProps {
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
}

export const MoviesPage: React.FC<MoviesPageProps> = ({
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
  onViewDetails
}) => {
  return (
    <div className="space-y-8 pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white flex items-center space-x-2">
            <Film className="w-6 h-6 text-amber-400" />
            <span>Movie Catalogue</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Browse currently running blockbusters and all-time classics in your district.
          </p>
        </div>
      </div>

      {/* Search & Filters */}
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

      {/* Movie Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="h-96 rounded-2xl bg-white/5 animate-pulse"></div>
          ))}
        </div>
      ) : movies.length === 0 ? (
        <div className="p-16 text-center rounded-3xl bg-[#0f172a] border border-white/10 space-y-3">
          <Film className="w-16 h-16 text-gray-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No results found</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            We couldn't find any movie matching your current filters. Try resetting the language or genre filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {movies.map((movie) => (
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
  );
};
