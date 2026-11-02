const db = require('../db/database');

const MOODS = [
  'Happy', 'Sad', 'Romantic', 'Excited', 'Relaxed',
  'Energetic', 'Emotional', 'Adventurous', 'Scared', 'Motivated', 'Bored'
];

const VIBES = [
  'Feel-good', 'Mass', 'Chill', 'Romantic', 'Family',
  'Thriller', 'Comedy', 'Action', 'Emotional', 'Mind-bending', 'Fun', 'Adventure'
];

const TRAVEL_MOODS = [
  'Long journey', 'Short trip', 'Night drive', 'Weekend outing',
  'Family trip', 'Friends trip', 'Solo travel', 'Relaxing travel'
];

// Content-based recommendation algorithm
async function recommendMovies({ mood, vibe, travelMood, language, districtId = 'chennai' }) {
  // Fetch active movies from DB
  const movies = await db.getAll('SELECT * FROM movies WHERE is_active = 1');

  // If districtId is specified, check which movies have active shows in that district
  const districtShows = await db.getAll(`
    SELECT DISTINCT s.movie_id
    FROM shows s
    JOIN theatres t ON s.theatre_id = t.id
    WHERE t.district_id = $1 AND s.status = 'ACTIVE'
  `, [districtId]);
  const districtMovieSet = new Set(districtShows.map(r => r.movie_id));

  const scoredMovies = movies.map(movie => {
    let score = 0;
    const matchReasons = [];

    const movieMoods = JSON.parse(movie.mood_tags || '[]');
    const movieVibes = JSON.parse(movie.vibe_tags || '[]');
    const movieTravel = JSON.parse(movie.travel_tags || '[]');
    const movieGenres = JSON.parse(movie.genres || '[]');
    const secondaryLangs = JSON.parse(movie.secondary_languages || '[]');

    // 1. Language matching
    if (language && language !== 'All') {
      if (movie.language.toLowerCase() === language.toLowerCase()) {
        score += 30;
        matchReasons.push(`${movie.language} language`);
      } else if (secondaryLangs.map(l => l.toLowerCase()).includes(language.toLowerCase())) {
        score += 15;
        matchReasons.push(`available in ${language}`);
      }
    }

    // 2. Mood matching & Mood Protection
    if (mood) {
      const lowerMood = mood.toLowerCase();
      if (lowerMood === 'sad') {
        // Mood protection: prefer uplifting/comforting feel-good genres
        if (movieVibes.some(v => ['Feel-good', 'Comedy', 'Family', 'Fun'].includes(v))) {
          score += 35;
          matchReasons.push('comforting and uplifting vibe to brighten your spirits');
        } else if (movieMoods.some(m => ['Happy', 'Relaxed'].includes(m))) {
          score += 25;
          matchReasons.push('heartwarming energy');
        }
      } else {
        const foundMood = movieMoods.find(m => m.toLowerCase() === lowerMood);
        if (foundMood) {
          score += 25;
          matchReasons.push(`${foundMood.toLowerCase()} mood`);
        }
      }
    }

    // 3. Vibe matching
    if (vibe) {
      const foundVibe = movieVibes.find(v => v.toLowerCase() === vibe.toLowerCase());
      if (foundVibe) {
        score += 25;
        matchReasons.push(`${foundVibe.toLowerCase()} vibe`);
      }
    }

    // 4. Travel Mood matching
    if (travelMood) {
      const foundTravel = movieTravel.find(t => t.toLowerCase() === travelMood.toLowerCase());
      if (foundTravel) {
        score += 20;
        matchReasons.push(`${foundTravel.toLowerCase()} travel`);
      }
    }

    // 5. Rating weight
    score += (Number(movie.rating) || 7.0) * 2;

    // 6. District availability bonus
    const isShowingLocally = districtMovieSet.has(movie.id);
    if (isShowingLocally) {
      score += 20;
    }

    return {
      movie: {
        ...movie,
        rating: Number(movie.rating),
        genres: movieGenres,
        secondary_languages: secondaryLangs,
        mood_tags: movieMoods,
        vibe_tags: movieVibes,
        travel_tags: movieTravel,
        cast_members: JSON.parse(movie.cast_members || '[]'),
        is_showing_locally: isShowingLocally
      },
      score,
      matchReason: matchReasons.length > 0
        ? `Recommended for your ${matchReasons.join(', ')}.`
        : 'Popular blockbuster trending in your district.'
    };
  });

  // Sort descending by score
  scoredMovies.sort((a, b) => b.score - a.score);

  return scoredMovies.slice(0, 6);
}

// Generate empathetic, cinematic response without plot spoilers
async function generateAuraResponse({ userMessage, mood, vibe, travelMood, language, districtId }) {
  const recommendations = await recommendMovies({ mood, vibe, travelMood, language, districtId });
  const topMovie = recommendations[0]?.movie;

  let greeting = 'Hello! I am Aura, your personal CineAura cinema curator. ';
  let moodNote = '';

  if (mood) {
    if (mood.toLowerCase() === 'sad') {
      moodNote = "I hear you. Cinema has a wonderful way of offering solace and warmth. I've hand-picked uplifting and heartwarming stories designed to gently brighten your day. ";
    } else if (mood.toLowerCase() === 'romantic') {
      moodNote = "Love is in the air! Here are captivating, soulful cinematic journeys that tug at heartstrings. ";
    } else if (mood.toLowerCase() === 'excited' || mood.toLowerCase() === 'energetic') {
      moodNote = "Love that high octane energy! Let's dial it up with pulse-pounding, edge-of-your-seat cinematic spectacles! ";
    } else if (mood.toLowerCase() === 'bored') {
      moodNote = "Let's banish boredom with mind-bending plots, fast-paced thrillers, and absolute mass entertainment! ";
    } else {
      moodNote = `Curating stories that resonate deeply with your ${mood.toLowerCase()} mood. `;
    }
  }

  let travelNote = '';
  if (travelMood) {
    travelNote = `Perfect match for your ${travelMood.toLowerCase()}! `;
  }

  let recommendationSummary = '';
  if (topMovie) {
    recommendationSummary = `I strongly suggest experiencing "${topMovie.title}" (${topMovie.language} • ${topMovie.certificate}) — ${topMovie.tagline || topMovie.overview.substring(0, 90) + '...'}`;
  }

  const aiMessage = `${greeting}${moodNote}${travelNote}${recommendationSummary}`;

  return {
    message: aiMessage,
    mood,
    vibe,
    travelMood,
    recommendations
  };
}

module.exports = {
  MOODS,
  VIBES,
  TRAVEL_MOODS,
  recommendMovies,
  generateAuraResponse
};
