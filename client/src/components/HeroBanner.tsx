import React, { useState, useEffect, useCallback } from 'react';
import { Movie } from '../services/api';
import { Ticket, Info, ChevronLeft, ChevronRight, Star, Play } from 'lucide-react';

interface HeroBannerProps {
  movies: Movie[];
  onBookMovie: (movie: Movie) => void;
  onViewDetails: (movieId: string) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  movies,
  onBookMovie,
  onViewDetails
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const activeMovies = movies.length > 0 ? movies.slice(0, 6) : [];
  const currentMovie = activeMovies[currentIndex];

  const goToIndex = useCallback((idx: number) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(idx);
      setIsTransitioning(false);
    }, 200);
  }, []);

  useEffect(() => {
    if (activeMovies.length <= 1 || isHovered) return;
    const interval = setInterval(() => {
      goToIndex((currentIndex + 1) % activeMovies.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [activeMovies.length, currentIndex, isHovered, goToIndex]);

  if (!currentMovie) {
    return (
      <div className="h-[460px] rounded-3xl bg-[#0f172a] animate-pulse flex items-center justify-center">
        <span className="text-gray-500 text-sm">Loading featured cinematic showcase...</span>
      </div>
    );
  }

  const handlePrev = () => goToIndex((currentIndex - 1 + activeMovies.length) % activeMovies.length);
  const handleNext = () => goToIndex((currentIndex + 1) % activeMovies.length);

  return (
    <div
      className="relative h-[460px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Full-width Background Backdrop - Single unified seamless layer */}
      <div className="absolute inset-0 bg-black overflow-hidden">
        <img
          key={currentMovie.id}
          src={currentMovie.backdrop_url || currentMovie.poster_url}
          alt={currentMovie.title}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = currentMovie.poster_url || '';
          }}
          className={`w-full h-full object-cover object-center scale-105 transition-opacity duration-500 filter brightness-[0.72] contrast-[1.08] ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
        />
        {/* Soft balanced continuous vignette across entire banner */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
      </div>

      {/* LEFT: Content overlay */}
      <div className={`relative z-10 h-full flex transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
        <div className="flex flex-col justify-end p-8 lg:p-10 max-w-xl">

          {/* Badge row */}
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-400 bg-amber-400/15 px-3 py-1 rounded-full border border-amber-400/30 backdrop-blur-sm">
              Now In Theatres
            </span>
            <div className="flex items-center space-x-1 bg-black/50 px-2.5 py-1 rounded-full backdrop-blur-sm border border-white/10">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="text-xs font-black text-white">{currentMovie.rating.toFixed(1)}</span>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 backdrop-blur-sm">
              {currentMovie.certificate}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight mb-2 drop-shadow-2xl">
            {currentMovie.title}
          </h1>

          {/* Tagline */}
          <p className="text-sm font-medium text-amber-200/80 italic mb-4 line-clamp-2">
            "{currentMovie.tagline || currentMovie.overview.slice(0, 80) + '...'}"
          </p>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-300 font-medium mb-6">
            <span className="px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-sm">{currentMovie.language}</span>
            <span className="text-gray-600">•</span>
            <span className="px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-sm">{currentMovie.genres.slice(0, 2).join(' · ')}</span>
            <span className="text-gray-600">•</span>
            <span className="px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-sm">
              {Math.floor(currentMovie.duration_mins / 60)}h {currentMovie.duration_mins % 60}m
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => onBookMovie(currentMovie)}
              className="flex items-center space-x-2 px-7 py-3 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-black font-black text-sm shadow-2xl shadow-amber-500/30 transition-all hover:scale-105 active:scale-95"
            >
              <Ticket className="w-4 h-4" />
              <span>Book Tickets</span>
            </button>

            {currentMovie.trailer_url && (
              <a
                href={currentMovie.trailer_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 px-5 py-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-semibold text-sm border border-white/20 transition-all hover:scale-105"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Trailer</span>
              </a>
            )}

            <button
              onClick={() => onViewDetails(currentMovie.id)}
              className="flex items-center space-x-2 px-5 py-3 rounded-full bg-black/40 hover:bg-white/10 backdrop-blur-md text-white font-semibold text-sm border border-white/15 transition-all hover:scale-105"
            >
              <Info className="w-4 h-4" />
              <span>Details</span>
            </button>
          </div>
        </div>

        {/* RIGHT: Static Poster Thumbnails Grid (no sliding strip) */}
        <div className="hidden lg:flex flex-col justify-center items-end flex-1 pr-6 pb-8 pt-8 gap-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1 self-start ml-auto mr-0 pr-1">Now Showing</p>
          <div className="grid grid-cols-3 gap-2">
            {activeMovies.map((movie, idx) => (
              <button
                key={movie.id}
                onClick={() => goToIndex(idx)}
                className={`relative rounded-xl overflow-hidden transition-all duration-300 ${
                  idx === currentIndex
                    ? 'ring-2 ring-amber-400 scale-105 shadow-lg shadow-amber-500/30'
                    : 'ring-1 ring-white/10 hover:ring-white/40 opacity-60 hover:opacity-100 hover:scale-105'
                }`}
                style={{ width: '72px', height: '96px' }}
                title={movie.title}
              >
                <img
                  src={movie.poster_url}
                  alt={movie.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      movie.backdrop_url || '';
                  }}
                />
                {/* Active indicator */}
                {idx === currentIndex && (
                  <div className="absolute inset-0 bg-amber-500/10" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Prev / Next arrows */}
      <button
        onClick={handlePrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md border border-white/15 flex items-center justify-center text-white transition-all z-20 opacity-0 group-hover:opacity-100 hover:!opacity-100"
        style={{ opacity: isHovered ? 1 : 0 }}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md border border-white/15 flex items-center justify-center text-white transition-all z-20"
        style={{ opacity: isHovered ? 1 : 0 }}
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-10 flex items-center space-x-2 z-20">
        {activeMovies.map((_, idx) => (
          <button
            key={idx}
            onClick={() => goToIndex(idx)}
            className={`transition-all rounded-full ${
              currentIndex === idx ? 'w-6 h-1.5 bg-amber-400' : 'w-1.5 h-1.5 bg-white/30 hover:bg-white/60'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
