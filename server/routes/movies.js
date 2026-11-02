const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { searchTmdbMovies, getTmdbMovieDetails } = require('../services/tmdb');

// GET /api/movies
router.get('/', (req, res) => {
  try {
    const { district_id, language, genre, experience, search, now_showing_only } = req.query;

    // Get list of movie IDs that have active shows in the district (if specified)
    let activeMovieIdsInDistrict = null;
    if (district_id && district_id !== 'all') {
      const activeShowsQuery = `
        SELECT DISTINCT s.movie_id
        FROM shows s
        JOIN theatres t ON s.theatre_id = t.id
        WHERE t.district_id = ? AND s.status = 'ACTIVE'
      `;
      activeMovieIdsInDistrict = db.prepare(activeShowsQuery).all(district_id).map(r => r.movie_id);
    }

    let query = 'SELECT * FROM movies WHERE is_active = 1';
    const params = [];

    const allMovies = db.prepare(query).all(...params);

    // Filter in JS for rich JSON array matching
    let filtered = allMovies.map(m => {
      const genres = JSON.parse(m.genres || '[]');
      const secondaryLangs = JSON.parse(m.secondary_languages || '[]');
      const cast = JSON.parse(m.cast_members || '[]');
      const moodTags = JSON.parse(m.mood_tags || '[]');
      const vibeTags = JSON.parse(m.vibe_tags || '[]');
      const travelTags = JSON.parse(m.travel_tags || '[]');
      const isNowShowingInDistrict = activeMovieIdsInDistrict ? activeMovieIdsInDistrict.includes(m.id) : true;

      return {
        ...m,
        genres,
        secondary_languages: secondaryLangs,
        cast_members: cast,
        mood_tags: moodTags,
        vibe_tags: vibeTags,
        travel_tags: travelTags,
        is_now_showing: isNowShowingInDistrict
      };
    });

    // If now_showing_only is true, filter strictly
    if (now_showing_only === 'true' && activeMovieIdsInDistrict) {
      filtered = filtered.filter(m => m.is_now_showing);
    }

    // Language filter
    if (language && language !== 'All') {
      const langLower = language.toLowerCase();
      filtered = filtered.filter(m =>
        m.language.toLowerCase() === langLower ||
        m.secondary_languages.some(sl => sl.toLowerCase() === langLower)
      );
    }

    // Genre filter
    if (genre && genre !== 'All') {
      const genreLower = genre.toLowerCase();
      filtered = filtered.filter(m =>
        m.genres.some(g => g.toLowerCase() === genreLower)
      );
    }

    // Search filter (movie title, theatre name, language, genre)
    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();

      // Check if query matches any theatre name in district
      const matchingTheatres = db.prepare(`
        SELECT DISTINCT s.movie_id
        FROM shows s
        JOIN theatres t ON s.theatre_id = t.id
        WHERE LOWER(t.name) LIKE ? OR LOWER(t.city) LIKE ?
      `).all(`%${q}%`, `%${q}%`).map(r => r.movie_id);

      filtered = filtered.filter(m =>
        m.title.toLowerCase().includes(q) ||
        m.language.toLowerCase().includes(q) ||
        m.director?.toLowerCase().includes(q) ||
        m.genres.some(g => g.toLowerCase().includes(q)) ||
        matchingTheatres.includes(m.id)
      );
    }

    // Experience filter (IMAX, 4DX, Dolby Atmos, Standard)
    if (experience && experience !== 'All') {
      const expMovieIds = db.prepare(`
        SELECT DISTINCT movie_id FROM shows WHERE experience = ? AND status = 'ACTIVE'
      `).all(experience).map(r => r.movie_id);
      filtered = filtered.filter(m => expMovieIds.includes(m.id));
    }

    res.json({
      count: filtered.length,
      movies: filtered
    });
  } catch (err) {
    console.error('Movies Fetch Error:', err);
    res.status(500).json({ error: 'Failed to fetch movies' });
  }
});

// GET /api/movies/:id
router.get('/:id', (req, res) => {
  try {
    const { district_id = 'chennai' } = req.query;
    const movie = db.prepare('SELECT * FROM movies WHERE id = ?').get(req.params.id);
    if (!movie) return res.status(404).json({ error: 'Movie not found' });

    // Fetch theatres and active shows for this movie in the requested district
    let showsQuery = `
      SELECT s.*, t.name as theatre_name, t.address as theatre_address, t.city as theatre_city,
             t.district_id, scr.name as screen_name, scr.experience as screen_experience
      FROM shows s
      JOIN theatres t ON s.theatre_id = t.id
      JOIN screens scr ON s.screen_id = scr.id
      WHERE s.movie_id = ? AND s.status = 'ACTIVE'
    `;
    const params = [movie.id];

    if (district_id && district_id !== 'all') {
      showsQuery += ' AND t.district_id = ?';
      params.push(district_id);
    }

    showsQuery += ' ORDER BY s.show_date ASC, s.start_time ASC';
    const shows = db.prepare(showsQuery).all(...params);

    // Group available shows by theatre and date
    const theatreMap = new Map();
    const availableDates = new Set();

    shows.forEach(show => {
      availableDates.add(show.show_date);
      if (!theatreMap.has(show.theatre_id)) {
        theatreMap.set(show.theatre_id, {
          theatre_id: show.theatre_id,
          theatre_name: show.theatre_name,
          theatre_address: show.theatre_address,
          theatre_city: show.theatre_city,
          district_id: show.district_id,
          shows: []
        });
      }
      theatreMap.get(show.theatre_id).shows.push(show);
    });

    res.json({
      movie: {
        ...movie,
        genres: JSON.parse(movie.genres || '[]'),
        secondary_languages: JSON.parse(movie.secondary_languages || '[]'),
        cast_members: JSON.parse(movie.cast_members || '[]'),
        mood_tags: JSON.parse(movie.mood_tags || '[]'),
        vibe_tags: JSON.parse(movie.vibe_tags || '[]'),
        travel_tags: JSON.parse(movie.travel_tags || '[]'),
        available_theatres: Array.from(theatreMap.values()),
        available_dates: Array.from(availableDates).sort(),
        all_shows: shows
      }
    });
  } catch (err) {
    console.error('Movie Details Error:', err);
    res.status(500).json({ error: 'Failed to fetch movie details' });
  }
});

// TMDB Search Endpoint (Optional real-time import for Theatre Managers)
router.get('/tmdb/search', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.json({ results: [] });
    const results = await searchTmdbMovies(query);
    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: 'TMDB lookup failed' });
  }
});

module.exports = router;
