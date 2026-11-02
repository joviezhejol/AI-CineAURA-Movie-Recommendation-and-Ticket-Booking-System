// TMDB API Service with graceful fallback
const TMDB_API_KEY = process.env.TMDB_API_KEY || '';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMG_URL = 'https://image.tmdb.org/t/p/w780';

async function searchTmdbMovies(query) {
  if (!TMDB_API_KEY) {
    return [];
  }

  try {
    const res = await fetch(`${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&include_adult=false`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map(m => ({
      tmdb_id: m.id,
      title: m.title,
      overview: m.overview,
      poster_url: m.poster_path ? `${TMDB_IMG_URL}${m.poster_path}` : null,
      backdrop_url: m.backdrop_path ? `https://image.tmdb.org/t/p/original${m.backdrop_path}` : null,
      release_date: m.release_date,
      rating: m.vote_average,
      language: m.original_language
    }));
  } catch (err) {
    console.error('TMDB Search Error:', err.message);
    return [];
  }
}

async function getTmdbMovieDetails(tmdbId) {
  if (!TMDB_API_KEY) return null;

  try {
    const res = await fetch(`${TMDB_BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}&append_to_response=credits,videos`);
    if (!res.ok) return null;
    const data = await res.json();
    
    const trailer = (data.videos?.results || []).find(v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'));
    const director = (data.credits?.crew || []).find(c => c.job === 'Director')?.name || 'Director';
    const topCast = (data.credits?.cast || []).slice(0, 5).map(c => ({
      name: c.name,
      role: c.character,
      photo: c.profile_path ? `https://image.tmdb.org/t/p/w200${c.profile_path}` : null
    }));

    return {
      tmdb_id: data.id,
      title: data.title,
      tagline: data.tagline,
      overview: data.overview,
      poster_url: data.poster_path ? `${TMDB_IMG_URL}${data.poster_path}` : null,
      backdrop_url: data.backdrop_path ? `https://image.tmdb.org/t/p/original${data.backdrop_path}` : null,
      trailer_url: trailer ? `https://www.youtube.com/embed/${trailer.key}` : null,
      language: data.spoken_languages?.[0]?.english_name || 'Tamil',
      genres: (data.genres || []).map(g => g.name),
      duration_mins: data.runtime || 140,
      certificate: data.adult ? 'A' : 'U/A 13+',
      rating: Math.round(data.vote_average * 10) / 10,
      director,
      cast_members: topCast,
      release_date: data.release_date
    };
  } catch (err) {
    console.error('TMDB Details Error:', err.message);
    return null;
  }
}

module.exports = {
  searchTmdbMovies,
  getTmdbMovieDetails
};
