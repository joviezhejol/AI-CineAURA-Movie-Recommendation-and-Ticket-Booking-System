import React, { useState, useEffect } from 'react';
import { api, Movie, Show } from '../services/api';
import { useDistrict } from '../context/DistrictContext';
import {
  Star,
  Clock,
  Calendar,
  Ticket,
  Play,
  Bookmark,
  Check,
  ChevronLeft,
  Building2,
  Sparkles,
  User,
  X
} from 'lucide-react';

interface MovieDetailsPageProps {
  movieId: string;
  onBack: () => void;
  onSelectShow: (show: Show) => void;
  onBookTicketsDirect: (movie: Movie) => void;
}

export const MovieDetailsPage: React.FC<MovieDetailsPageProps> = ({
  movieId,
  onBack,
  onSelectShow,
  onBookTicketsDirect
}) => {
  const { districtId, districtName } = useDistrict();
  
  const [movieData, setMovieData] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setIsTrailerOpen(false);
    const fetchMovie = async () => {
      try {
        setIsLoading(true);
        const res = await api.getMovieById(movieId, districtId);
        setMovieData(res.movie);
        if (res.movie?.available_dates?.length > 0) {
          setSelectedDate(res.movie.available_dates[0]);
        }
      } catch (err) {
        console.error('Fetch movie details error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMovie();
  }, [movieId, districtId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleWatchlist = () => {
    setIsWatchlisted(!isWatchlisted);
    showToast(!isWatchlisted ? 'Added to your Watchlist! 🔖' : 'Removed from Watchlist');
  };

  if (isLoading || !movieData) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm text-gray-400">Loading cinema story details...</p>
      </div>
    );
  }

  // Filter shows for selected date
  const showsOnDate = (movieData.all_shows || []).filter(
    (s: Show) => s.show_date === selectedDate
  );

  // Group shows on this date by theatre
  const theatreGrouped: { [theatreId: string]: { theatreName: string; address: string; shows: Show[] } } = {};
  showsOnDate.forEach((s: Show) => {
    if (!theatreGrouped[s.theatre_id]) {
      theatreGrouped[s.theatre_id] = {
        theatreName: s.theatre_name || 'CineAura Multiplex',
        address: s.theatre_address || s.theatre_city || districtName,
        shows: []
      };
    }
    theatreGrouped[s.theatre_id].shows.push(s);
  });

  return (
    <div className="space-y-8 pb-20 relative">
      
      {/* Toast popup */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-2xl bg-amber-500 text-black font-bold text-xs shadow-2xl animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center space-x-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back to Movies</span>
      </button>

      {/* Hero Backdrop Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl min-h-[460px] flex flex-col justify-end p-6 lg:p-12">
        {/* Cinematic Background Layer - Seamless full-bleed image with unified color tone */}
        <div className="absolute inset-0 overflow-hidden bg-black">
          {/* Full-width continuous movie backdrop image across the entire banner */}
          <img
            src={movieData.backdrop_url || movieData.poster_url}
            alt={movieData.title}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = movieData.poster_url || '/posters/amaran.jpg';
            }}
            className="w-full h-full object-cover object-center scale-105 filter brightness-[0.7] contrast-[1.08]"
          />

          {/* Unified dark vignette across the entire banner so text and poster pop naturally without color separation */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-black/25" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-end">
          {/* Complete, Crisp Original Poster */}
          <div className="w-44 sm:w-56 aspect-[2/3] rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl shadow-black/80 flex-shrink-0 bg-[#090d16] group">
            <img
              src={movieData.poster_url}
              alt={movieData.title}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/posters/amaran.jpg';
              }}
              className="w-full h-full object-contain bg-black/60 transition-transform duration-300 group-hover:scale-105"
            />
          </div>

          {/* Details */}
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                {movieData.certificate}
              </span>
              <div className="flex items-center space-x-1 text-xs text-amber-400 bg-black/40 px-2.5 py-1 rounded backdrop-blur-md">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span className="font-bold text-white">{movieData.rating?.toFixed(1)}</span>
                <span className="text-gray-400">({movieData.vote_count?.toLocaleString()} votes)</span>
              </div>
            </div>

            <h1 className="text-3xl lg:text-5xl font-black text-white tracking-tight">
              {movieData.title}
            </h1>

            <p className="text-sm text-amber-200/90 italic font-medium">
              "{movieData.tagline || movieData.overview?.slice(0, 80)}"
            </p>

            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-300 font-medium">
              <span>{movieData.language}</span>
              <span>•</span>
              <span>{movieData.genres?.join(', ')}</span>
              <span>•</span>
              <span>{Math.floor(movieData.duration_mins / 60)}h {movieData.duration_mins % 60}m</span>
              <span>•</span>
              <span>Released {movieData.release_date}</span>
            </div>

            {/* Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-3">
              <button
                onClick={() => onBookTicketsDirect(movieData)}
                className="flex items-center space-x-2 px-6 py-3 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-black font-extrabold text-sm shadow-xl shadow-amber-500/25 transition-all transform hover:-translate-y-0.5"
              >
                <Ticket className="w-4 h-4" />
                <span>Book Tickets</span>
              </button>

              <button
                onClick={() => setIsTrailerOpen(true)}
                className="flex items-center space-x-2 px-5 py-3 rounded-full bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-bold text-sm backdrop-blur-md border border-amber-500/40 shadow-lg shadow-amber-500/10 transition-all hover:scale-105"
              >
                <Play className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>Watch Trailer</span>
              </button>

              {movieData.trailer_url && (
                <a
                  href={movieData.trailer_url.replace('/embed/', '/watch?v=')}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center space-x-1.5 px-4 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium text-xs backdrop-blur-md border border-white/15 transition-all"
                  title="Open in YouTube"
                >
                  <span>Open on YouTube ↗</span>
                </a>
              )}

              <button
                onClick={handleToggleWatchlist}
                className={`flex items-center space-x-2 px-5 py-3 rounded-full font-bold text-sm backdrop-blur-md border transition-all ${
                  isWatchlisted
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                    : 'bg-white/5 hover:bg-white/10 border-white/15 text-gray-300'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${isWatchlisted ? 'fill-amber-400 text-amber-400' : ''}`} />
                <span>{isWatchlisted ? 'Added to Watchlist' : 'Add to Watchlist'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Synopsis & Cast */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Story Overview & Cast */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-3xl bg-[#0f172a] border border-white/10 space-y-3">
            <h3 className="text-base font-bold text-white uppercase tracking-wider">
              Synopsis
            </h3>
            <p className="text-sm text-gray-300 leading-relaxed font-normal">
              {movieData.overview}
            </p>
            <div className="pt-2 flex items-center space-x-4 text-xs text-gray-400">
              <span>Director: <strong className="text-white">{movieData.director || 'Acclaimed Filmmaker'}</strong></span>
            </div>
          </div>

          {/* Cast */}
          {movieData.cast_members && movieData.cast_members.length > 0 && (
            <div className="p-6 rounded-3xl bg-[#0f172a] border border-white/10 space-y-4">
              <h3 className="text-base font-bold text-white uppercase tracking-wider">
                Starring Cast
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {movieData.cast_members.map((c: any, idx: number) => (
                  <div key={idx} className="flex items-center space-x-3 p-2 rounded-2xl bg-white/5 border border-white/5">
                    {c.photo ? (
                      <img
                        src={c.photo}
                        alt={c.name}
                        className="w-11 h-11 rounded-full object-cover flex-shrink-0 border border-amber-400/30"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-gray-400">
                        <User className="w-5 h-5" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{c.name}</p>
                      <p className="text-[11px] text-gray-400 truncate">{c.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: Aura AI Insights */}
        <div className="p-6 rounded-3xl bg-gradient-to-b from-[#131b2e] to-[#0e1626] border border-purple-500/25 space-y-4">
          <div className="flex items-center space-x-2 text-purple-400">
            <Sparkles className="w-5 h-5" />
            <h3 className="text-base font-bold text-white">Aura AI Story Insights</h3>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">
            Content-based emotional metadata for this cinematic experience:
          </p>
          
          <div className="space-y-3 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Mood Alignment</span>
              <div className="flex flex-wrap gap-1.5">
                {(movieData.mood_tags || ['Excited', 'Energetic']).map((m: string) => (
                  <span key={m} className="px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30 font-semibold">
                    {m}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Cinematic Vibe</span>
              <div className="flex flex-wrap gap-1.5">
                {(movieData.vibe_tags || ['Mass', 'Action']).map((v: string) => (
                  <span key={v} className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-semibold">
                    {v}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Travel Companion</span>
              <div className="flex flex-wrap gap-1.5">
                {(movieData.travel_tags || ['Weekend outing', 'Night drive']).map((t: string) => (
                  <span key={t} className="px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-semibold">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Available Theatres & Shows Section */}
      <div className="p-6 lg:p-8 rounded-3xl bg-[#0f172a] border border-white/10 space-y-6">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-amber-400" />
            <span>Select Showtime in {districtName}</span>
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Pick a date and cinema auditorium to begin seat selection with atomic 5-minute hold protection.
          </p>
        </div>

        {/* Date Selector Pills */}
        {movieData.available_dates && movieData.available_dates.length > 0 ? (
          <div className="flex items-center space-x-2 overflow-x-auto pb-2">
            {movieData.available_dates.map((dateStr: string) => {
              const d = new Date(dateStr);
              const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
              const monthName = d.toLocaleDateString('en-US', { month: 'short' });
              const dayNum = d.getDate();
              const isSelected = selectedDate === dateStr;

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`p-3 rounded-2xl border flex flex-col items-center min-w-[70px] transition-all ${
                    isSelected
                      ? 'bg-amber-500 text-black border-amber-400 font-bold shadow-lg shadow-amber-500/20'
                      : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <span className="text-[10px] uppercase">{dayName}</span>
                  <span className="text-base font-black">{dayNum}</span>
                  <span className="text-[10px] uppercase">{monthName}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center bg-white/5 rounded-2xl">
            <p className="text-xs text-gray-400">
              No shows currently scheduled in {districtName} for this movie. Check back soon or switch districts!
            </p>
          </div>
        )}

        {/* Theatres with Shows on this date */}
        {Object.keys(theatreGrouped).length > 0 ? (
          <div className="space-y-4 pt-2">
            {Object.entries(theatreGrouped).map(([thId, th]) => (
              <div
                key={thId}
                className="p-5 rounded-2xl bg-[#090d16] border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div>
                  <h4 className="text-sm font-bold text-white">{th.theatreName}</h4>
                  <p className="text-xs text-gray-400 mt-0.5">{th.address}</p>
                </div>

                {/* Showtimes Buttons */}
                <div className="flex flex-wrap gap-2.5">
                  {th.shows.map((show) => (
                    <button
                      key={show.id}
                      onClick={() => onSelectShow(show)}
                      className="px-4 py-2 rounded-xl bg-white/5 hover:bg-amber-500 hover:text-black border border-white/15 text-white font-semibold text-xs transition-all shadow-md group/time flex flex-col items-center"
                    >
                      <span className="font-bold">{show.start_time}</span>
                      <span className="text-[10px] text-gray-400 group-hover/time:text-black mt-0.5">
                        {show.experience} • ₹{show.ticket_price}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          selectedDate && (
            <p className="text-xs text-gray-400 py-4 text-center">
              No shows found for {selectedDate} in {districtName}.
            </p>
          )
        )}

      </div>

      {/* Trailer Modal */}
      {isTrailerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-[#0f172a] border border-white/20 rounded-3xl max-w-3xl w-full p-4 shadow-2xl relative">
            <button
              onClick={() => setIsTrailerOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white z-10 p-1 rounded-full hover:bg-white/10"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="flex items-center justify-between mb-3 pr-8">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Play className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>{movieData.title} • Official Trailer</span>
              </h3>
              {movieData.trailer_url && (
                <a
                  href={movieData.trailer_url.replace('/embed/', '/watch?v=')}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center space-x-1"
                >
                  <span>Watch on YouTube ↗</span>
                </a>
              )}
            </div>
            <div className="aspect-video rounded-2xl overflow-hidden bg-black flex items-center justify-center">
              {movieData.trailer_url ? (
                <iframe
                  src={`${movieData.trailer_url}?autoplay=1&rel=0&modestbranding=1&origin=http://localhost:5005`}
                  title={`${movieData.title} Official Trailer`}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                ></iframe>
              ) : (
                <div className="text-center p-6 space-y-3">
                  <Play className="w-12 h-12 text-gray-500 mx-auto opacity-40" />
                  <p className="text-gray-300 font-medium">Official trailer is not yet available for this movie.</p>
                  <a
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(movieData.title + ' official trailer')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-xl transition"
                  >
                    <span>Search on YouTube</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
