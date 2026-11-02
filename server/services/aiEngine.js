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
function recommendMovies({ mood, vibe, travelMood, language, districtId = 'chennai' }) {
  // Fetch active movies from DB
  const movies = db.prepare('SELECT * FROM movies WHERE is_active = 1').all();

  // If districtId is specified, check which movies have active shows in that district
  const districtShows = db.prepare(`
    SELECT DISTINCT s.movie_id
    FROM shows s
    JOIN theatres t ON s.theatre_id = t.id
    WHERE t.district_id = ? AND s.status = 'ACTIVE'
  `).all(districtId).map(r => r.movie_id);
  const districtMovieSet = new Set(districtShows);

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
    score += (movie.rating || 7.0) * 2;

    // 6. District availability bonus
    const isShowingLocally = districtMovieSet.has(movie.id);
    if (isShowingLocally) {
      score += 20;
    }

    let explanation = '';
    if (matchReasons.length > 0) {
      explanation = `Recommended because it perfectly aligns with your ${matchReasons.join(' + ')}.`;
    } else {
      explanation = `Highly rated blockbuster featuring gripping cinematic storytelling.`;
    }

    return {
      ...movie,
      genres: movieGenres,
      cast_members: JSON.parse(movie.cast_members || '[]'),
      is_showing_in_district: isShowingLocally,
      score,
      explanation
    };
  });

  // Sort descending by score
  scoredMovies.sort((a, b) => b.score - a.score);

  return scoredMovies;
}

// Conversational AI response generator with Mood & Spoiler Protection
function generateAuraResponse({ userMessage, mood, vibe, travelMood, language, districtId }) {
  const cleanMsg = (userMessage || '').toLowerCase();

  // Mood Protection Detection
  const sadTriggers = ['sad', 'down', 'depressed', 'crying', 'heartbroken', 'unhappy', 'low'];
  const isSadIntent = sadTriggers.some(word => cleanMsg.includes(word)) || (mood && mood.toLowerCase() === 'sad');

  if (isSadIntent && !vibe && !cleanMsg.includes('funny') && !cleanMsg.includes('uplifting') && !cleanMsg.includes('comfort')) {
    return {
      reply: "I've got you. ❤️ Sending you warmth. When you're feeling down, would you like something comforting and heartwarming, laugh-out-loud funny, relaxing, or an inspiring adventure?",
      suggestions: ['Comforting & Uplifting', 'Funny & Laughs', 'Relaxed & Chill', 'Inspiring & Adventurous'],
      recommendedMovies: recommendMovies({ mood: 'Sad', vibe: 'Feel-good', language, districtId }).slice(0, 3)
    };
  }

  // Handle travel query
  const travelTriggers = ['trip', 'journey', 'travel', 'drive', 'flight', 'outing'];
  const hasTravelQuery = travelTriggers.some(t => cleanMsg.includes(t)) || travelMood;

  // Perform recommendation search
  const recs = recommendMovies({
    mood: mood || (cleanMsg.includes('happy') ? 'Happy' : (cleanMsg.includes('excited') ? 'Excited' : (cleanMsg.includes('scared') ? 'Scared' : null))),
    vibe: vibe || (cleanMsg.includes('mass') ? 'Mass' : (cleanMsg.includes('feel good') || cleanMsg.includes('feel-good') ? 'Feel-good' : (cleanMsg.includes('chill') ? 'Chill' : null))),
    travelMood: travelMood || (cleanMsg.includes('night drive') ? 'Night drive' : (cleanMsg.includes('friends') ? 'Friends trip' : (cleanMsg.includes('family') ? 'Family trip' : null))),
    language,
    districtId
  });

  const topMovies = recs.slice(0, 4);

  let reply = '';
  if (topMovies.length > 0) {
    const top = topMovies[0];
    const vibeDesc = vibe ? `${vibe}` : 'cinematic';
    const travelDesc = travelMood ? ` during your ${travelMood}` : '';
    reply = `I curated these stories made just for you! Based on your ${vibeDesc} vibe${travelDesc}, you will love **${top.title}** (${top.genres.slice(0, 2).join(', ')}). ${top.explanation} Enjoy completely spoiler-free cinema!`;
  } else {
    reply = `I couldn't find a perfect match right now, but here are some popular movies currently thrilling audiences on the big screen!`;
  }

  return {
    reply,
    recommendedMovies: topMovies
  };
}

module.exports = {
  MOODS,
  VIBES,
  TRAVEL_MOODS,
  recommendMovies,
  generateAuraResponse
};
