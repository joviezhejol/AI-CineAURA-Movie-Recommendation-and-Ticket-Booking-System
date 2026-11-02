const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { searchTmdbMovies, getTmdbMovieDetails } = require('../services/tmdb');

// GET /api/movies
router.get('/', async (req, res) => {
  try {
    const { district_id, language, genre, experience, search, now_showing_only } = req.query;

    // Get list of movie IDs that have active shows in the district (if specified)
    let activeMovieIdsInDistrict = null;
    if (district_id && district_id !== 'all') {
      const activeShowsQuery = `
        SELECT DISTINCT s.movie_id
        FROM shows s
        JOIN theatres t ON s.theatre_id = t.id
        WHERE t.district_id = $1 AND s.status = 'ACTIVE'
      `;
      const rows = await db.getAll(activeShowsQuery, [district_id]);
      activeMovieIdsInDistrict = rows.map(r => r.movie_id);
    }

    const allMovies = await db.getAll('SELECT * FROM movies WHERE is_active = 1');

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
        rating: Number(m.rating),
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
      const matchingTheatres = await db.getAll(`
        SELECT DISTINCT s.movie_id
        FROM shows s
        JOIN theatres t ON s.theatre_id = t.id
        WHERE LOWER(t.name) LIKE $1 OR LOWER(t.city) LIKE $2
      `, [`%${q}%`, `%${q}%`]);
      const matchingMovieIds = matchingTheatres.map(r => r.movie_id);

      filtered = filtered.filter(m =>
        m.title.toLowerCase().includes(q) ||
        m.language.toLowerCase().includes(q) ||
        m.director?.toLowerCase().includes(q) ||
        m.genres.some(g => g.toLowerCase().includes(q)) ||
        matchingMovieIds.includes(m.id)
      );
    }

    // Experience filter (IMAX, 4DX, Dolby Atmos, Standard)
    if (experience && experience !== 'All') {
      const expMovies = await db.getAll(`
        SELECT DISTINCT movie_id FROM shows WHERE experience = $1 AND status = 'ACTIVE'
      `, [experience]);
      const expMovieIds = expMovies.map(r => r.movie_id);
      filtered = filtered.filter(m => expMovieIds.includes(m.id));
    }

    res.json({ movies: filtered });
  } catch (err) {
    console.error('Movies fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch movies' });
  }
});

// GET /api/movies/:id
router.get('/:id', async (req, res) => {
  try {
    const movie = await db.getOne('SELECT * FROM movies WHERE id = $1', [req.params.id]);
    if (!movie) return res.status(404).json({ error: 'Movie not found' });

    res.json({
      movie: {
        ...movie,
        rating: Number(movie.rating),
        genres: JSON.parse(movie.genres || '[]'),
        secondary_languages: JSON.parse(movie.secondary_languages || '[]'),
        cast_members: JSON.parse(movie.cast_members || '[]'),
        mood_tags: JSON.parse(movie.mood_tags || '[]'),
        vibe_tags: JSON.parse(movie.vibe_tags || '[]'),
        travel_tags: JSON.parse(movie.travel_tags || '[]')
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch movie details' });
  }
});

// GET /api/movies/:id/shows
router.get('/:id/shows', async (req, res) => {
  try {
    const { district_id, date } = req.query;
    let query = `
      SELECT s.*, t.name as theatre_name, t.address as theatre_address, t.city as theatre_city,
             t.district_id, scr.name as screen_name, scr.experience as screen_experience
      FROM shows s
      JOIN theatres t ON s.theatre_id = t.id
      JOIN screens scr ON s.screen_id = scr.id
      WHERE s.movie_id = $1 AND s.status = 'ACTIVE'
    `;
    const params = [req.params.id];

    if (district_id && district_id !== 'all') {
      params.push(district_id);
      query += ` AND t.district_id = $${params.length}`;
    }

    if (date) {
      params.push(date);
      query += ` AND s.show_date = $${params.length}`;
    }

    query += ' ORDER BY s.show_date ASC, s.start_time ASC';
    const shows = await db.getAll(query, params);

    res.json({ shows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch movie shows' });
  }
});

module.exports = router;
