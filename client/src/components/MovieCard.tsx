import React from 'react';
import { Movie } from '../services/api';
import { Star, Clock, Ticket, Info } from 'lucide-react';

interface MovieCardProps {
  movie: Movie;
  onBook: (movie: Movie) => void;
  onDetails: (movieId: string) => void;
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie, onBook, onDetails }) => {
  return (
    <div className="group rounded-2xl bg-[#0f172a]/80 border border-white/10 hover:border-amber-400/50 overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-300 flex flex-col justify-between transform hover:-translate-y-1">
      
      {/* Poster Container */}
      <div className="relative aspect-[2/3] overflow-hidden bg-[#090d16]">
        <img
          src={movie.poster_url}
          alt={movie.title}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80';
          }}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Gradient vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity"></div>

        {/* "Now Showing" Badge */}
        {movie.is_now_showing !== false && (
          <div className="absolute top-3 left-3">
            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-500 text-black shadow-lg">
              Now Showing
            </span>
          </div>
        )}

        {/* Certificate Badge */}
        <div className="absolute top-3 right-3">
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-black/60 text-gray-200 backdrop-blur-md border border-white/20">
            {movie.certificate}
          </span>
        </div>
      </div>

      {/* Info Container */}
      <div className="p-3.5 sm:p-4 flex flex-col justify-between flex-1">
        <div>
          {/* Movie Title */}
          <h3
            onClick={() => onDetails(movie.id)}
            className="text-sm sm:text-base font-bold text-white group-hover:text-amber-400 transition-colors truncate cursor-pointer"
            title={movie.title}
          >
            {movie.title}
          </h3>

          {/* Language & Genre */}
          <p className="text-[11px] text-gray-400 truncate mt-1">
            {movie.language} • {movie.genres.slice(0, 2).join(' • ')}
          </p>

          {/* Rating & Runtime */}
          <div className="flex items-center space-x-2 text-[11px] text-gray-300 mt-2 font-medium">
            <div className="flex items-center space-x-1 text-amber-400 font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{movie.rating.toFixed(1)}</span>
            </div>
            <span className="text-gray-600">|</span>
            <span>
              {Math.floor(movie.duration_mins / 60)}h {movie.duration_mins % 60}m
            </span>
            <span className="text-gray-600">|</span>
            <span className="text-gray-400">{movie.certificate}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-white/5">
          <button
            onClick={() => onBook(movie)}
            className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-black font-bold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center justify-center space-x-1"
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>Book Now</span>
          </button>

          <button
            onClick={() => onDetails(movie.id)}
            className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-white font-semibold text-xs transition-all flex items-center justify-center space-x-1"
          >
            <Info className="w-3.5 h-3.5 text-gray-300" />
            <span>Details</span>
          </button>
        </div>
      </div>

    </div>
  );
};
