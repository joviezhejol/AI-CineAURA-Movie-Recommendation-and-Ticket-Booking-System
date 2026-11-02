const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET /api/theatres/districts
router.get('/districts', (req, res) => {
  try {
    const districts = db.prepare('SELECT * FROM districts ORDER BY name ASC').all();
    res.json({ districts });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch districts' });
  }
});

// GET /api/theatres
router.get('/', (req, res) => {
  try {
    const { district_id } = req.query;
    let query = 'SELECT * FROM theatres';
    const params = [];

    if (district_id && district_id !== 'all') {
      query += ' WHERE district_id = ?';
      params.push(district_id);
    }

    query += ' ORDER BY rating DESC';
    const theatres = db.prepare(query).all(...params);

    const formatted = theatres.map(t => ({
      ...t,
      facilities: JSON.parse(t.facilities || '[]')
    }));

    res.json({ theatres: formatted });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch theatres' });
  }
});

// GET /api/theatres/:id
router.get('/:id', (req, res) => {
  try {
    const theatre = db.prepare('SELECT * FROM theatres WHERE id = ?').get(req.params.id);
    if (!theatre) return res.status(404).json({ error: 'Theatre not found' });

    const screens = db.prepare('SELECT * FROM screens WHERE theatre_id = ?').all(theatre.id);
    const district = db.prepare('SELECT * FROM districts WHERE id = ?').get(theatre.district_id);

    res.json({
      theatre: {
        ...theatre,
        district_name: district?.name,
        facilities: JSON.parse(theatre.facilities || '[]'),
        screens
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch theatre details' });
  }
});

module.exports = router;
