// RightSidebar component – displays auxiliary movie lists on the HomePage
// This replaces the previous Language/Genre filter column.

import React from 'react';
import { Movie } from '../services/api';
import { Star, TrendingUp, Clock, Film } from 'lucide-react';

interface RightSidebarProps {
  movies: Movie[];
  onBook: (movie: Movie) => void;
  onDetails: (movieId: string) => void;
}

const getTrending = (movies: Movie[]) =>
  [...movies]
    .filter((m) => typeof m.rating === 'number')
    .sort((a, b) => (b.rating as number) - (a.rating as number))
    .slice(0, 4);

const getComingSoon = (movies: Movie[]) =>
  movies.filter((m) => {
    if (!m.release_date) return false;
    const today = new Date();
    const rel = new Date(m.release_date);
    return rel > today;
  }).slice(0, 3);

const getTopPicks = (movies: Movie[]) =>
  [...movies]
    .filter((m) => m.rating >= 8)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3);

export const RightSidebar: React.FC<RightSidebarProps> = ({ movies, onBook, onDetails }) => {
  const trending = getTrending(movies);
  const comingSoon = getComingSoon(movies);
  const topPicks = getTopPicks(movies);

  const renderSmallCard = (movie: Movie) => (
    <div
      key={movie.id}
      className="flex items-center space-x-3 py-2.5 px-2 rounded-xl hover:bg-white/5 transition-all cursor-pointer group"
      onClick={() => onDetails(movie.id)}
    >
      <img
        src={movie.poster_url || '/placeholder-poster.png'}
        alt={movie.title}
        className="w-12 h-16 object-cover rounded-lg shadow-md ring-1 ring-white/10 group-hover:ring-amber-400/40 transition-all flex-shrink-0"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = '/placeholder-poster.png';
        }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate group-hover:text-amber-300 transition-colors" title={movie.title}>
          {movie.title}
        </p>
        {movie.rating !== undefined && (
          <div className="flex items-center space-x-1 mt-0.5">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <p className="text-xs text-amber-300 font-bold">{movie.rating.toFixed(1)}</p>
          </div>
        )}
        <p className="text-[11px] text-gray-400 truncate mt-0.5">{movie.genres?.slice(0, 2).join(' · ')}</p>
        <div className="flex space-x-2 mt-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); onDetails(movie.id); }}
            className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 transition-colors"
          >
            Details
          </button>
          <span className="text-gray-600">·</span>
          <button
            onClick={(e) => { e.stopPropagation(); onBook(movie); }}
            className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Book
          </button>
        </div>
      </div>
    </div>
  );

  // Large poster card for "Top Picks" section
  const renderPosterCard = (movie: Movie) => (
    <div
      key={movie.id}
      className="relative rounded-xl overflow-hidden cursor-pointer group/card ring-1 ring-white/10 hover:ring-amber-400/50 transition-all"
      style={{ height: '140px' }}
      onClick={() => onDetails(movie.id)}
    >
      <img
        src={movie.backdrop_url || movie.poster_url}
        alt={movie.title}
        className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = movie.poster_url || '/placeholder-poster.png';
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="text-sm font-bold text-white truncate">{movie.title}</p>
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center space-x-1">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="text-xs font-bold text-amber-300">{movie.rating.toFixed(1)}</span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onBook(movie); }}
            className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/90 text-black hover:bg-amber-400 transition-colors"
          >
            Book
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <aside className="space-y-6 lg:col-span-1">
      
      {/* Trending Movies */}
      <section className="bg-white/[0.03] rounded-2xl border border-white/10 p-4">
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <h3 className="text-sm font-bold text-white">Trending Now</h3>
        </div>
        {trending.length > 0 ? (
          <div className="divide-y divide-white/5">
            {trending.map(renderSmallCard)}
          </div>
        ) : (
          <p className="text-xs text-gray-400">No trending movies.</p>
        )}
      </section>

      {/* Top Picks - Large poster cards */}
      {topPicks.length > 0 && (
        <section className="bg-white/[0.03] rounded-2xl border border-white/10 p-4">
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-purple-500/15 flex items-center justify-center">
              <Film className="w-4 h-4 text-purple-400" />
            </div>
            <h3 className="text-sm font-bold text-white">Editor's Top Picks</h3>
          </div>
          <div className="space-y-2">
            {topPicks.map(renderPosterCard)}
          </div>
        </section>
      )}

      {/* Coming Soon */}
      {comingSoon.length > 0 && (
        <section className="bg-white/[0.03] rounded-2xl border border-white/10 p-4">
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/15 flex items-center justify-center">
              <Clock className="w-4 h-4 text-cyan-400" />
            </div>
            <h3 className="text-sm font-bold text-white">Coming Soon</h3>
          </div>
          <div className="divide-y divide-white/5">
            {comingSoon.map(renderSmallCard)}
          </div>
        </section>
      )}

      {/* Genre Quick Links */}
      <section className="bg-white/[0.03] rounded-2xl border border-white/10 p-4">
        <h3 className="text-sm font-bold text-white mb-3">Browse by Genre</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Action', emoji: '💥', color: 'bg-red-500/10 border-red-500/20 text-red-300' },
            { label: 'Drama', emoji: '🎭', color: 'bg-blue-500/10 border-blue-500/20 text-blue-300' },
            { label: 'Comedy', emoji: '😂', color: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300' },
            { label: 'Thriller', emoji: '🔪', color: 'bg-orange-500/10 border-orange-500/20 text-orange-300' },
            { label: 'Romance', emoji: '❤️', color: 'bg-pink-500/10 border-pink-500/20 text-pink-300' },
            { label: 'Sci-Fi', emoji: '🚀', color: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300' },
            { label: 'Horror', emoji: '👻', color: 'bg-purple-500/10 border-purple-500/20 text-purple-300' },
            { label: 'Family', emoji: '👨‍👩‍👧', color: 'bg-green-500/10 border-green-500/20 text-green-300' },
          ].map((g) => (
            <button
              key={g.label}
              className={`flex items-center space-x-1.5 px-2.5 py-2 rounded-xl border text-xs font-semibold transition-all hover:scale-105 ${g.color}`}
            >
              <span>{g.emoji}</span>
              <span>{g.label}</span>
            </button>
          ))}
        </div>
      </section>

    </aside>
  );
};
