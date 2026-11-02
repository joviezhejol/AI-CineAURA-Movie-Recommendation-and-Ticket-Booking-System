const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { getShowSeatMap } = require('../services/seatLockService');

// GET /api/shows
router.get('/', (req, res) => {
  try {
    const { movie_id, theatre_id, date, district_id } = req.query;
    let query = `
      SELECT s.*, m.title as movie_title, m.poster_url as movie_poster, m.certificate as movie_certificate,
             t.name as theatre_name, t.city as theatre_city, scr.name as screen_name
      FROM shows s
      JOIN movies m ON s.movie_id = m.id
      JOIN theatres t ON s.theatre_id = t.id
      JOIN screens scr ON s.screen_id = scr.id
      WHERE s.status = 'ACTIVE'
    `;
    const params = [];

    if (movie_id) {
      query += ' AND s.movie_id = ?';
      params.push(movie_id);
    }
    if (theatre_id) {
      query += ' AND s.theatre_id = ?';
      params.push(theatre_id);
    }
    if (date) {
      query += ' AND s.show_date = ?';
      params.push(date);
    }
    if (district_id && district_id !== 'all') {
      query += ' AND t.district_id = ?';
      params.push(district_id);
    }

    query += ' ORDER BY s.show_date ASC, s.start_time ASC';
    const shows = db.prepare(query).all(...params);

    res.json({ shows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch shows' });
  }
});

// GET /api/shows/:id
router.get('/:id', (req, res) => {
  try {
    const show = db.prepare(`
      SELECT s.*, m.title as movie_title, m.poster_url as movie_poster, m.backdrop_url as movie_backdrop,
             m.duration_mins, m.certificate as movie_certificate, m.language as movie_language,
             t.name as theatre_name, t.address as theatre_address, t.city as theatre_city, t.district_id,
             scr.name as screen_name, scr.total_seats
      FROM shows s
      JOIN movies m ON s.movie_id = m.id
      JOIN theatres t ON s.theatre_id = t.id
      JOIN screens scr ON s.screen_id = scr.id
      WHERE s.id = ?
    `).get(req.params.id);

    if (!show) return res.status(404).json({ error: 'Show not found' });

    res.json({ show });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch show' });
  }
});

// GET /api/shows/:id/seats
router.get('/:id/seats', (req, res) => {
  try {
    const { session_id } = req.query;
    const seats = getShowSeatMap(req.params.id, session_id);
    res.json({ seats });
  } catch (err) {
    console.error('Seats fetch error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch seats' });
  }
});

module.exports = router;
