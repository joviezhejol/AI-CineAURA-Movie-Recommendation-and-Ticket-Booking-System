const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET /api/theatres/districts
router.get('/districts', async (req, res) => {
  try {
    const districts = await db.getAll('SELECT * FROM districts ORDER BY name ASC');
    res.json({ districts });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch districts' });
  }
});

// GET /api/theatres
router.get('/', async (req, res) => {
  try {
    const { district_id } = req.query;
    let query = 'SELECT * FROM theatres';
    const params = [];

    if (district_id && district_id !== 'all') {
      params.push(district_id);
      query += ' WHERE district_id = $1';
    }

    query += ' ORDER BY rating DESC';
    const theatres = await db.getAll(query, params);

    const formatted = theatres.map(t => ({
      ...t,
      rating: Number(t.rating),
      facilities: JSON.parse(t.facilities || '[]')
    }));

    res.json({ theatres: formatted });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch theatres' });
  }
});

// GET /api/theatres/:id
router.get('/:id', async (req, res) => {
  try {
    const theatre = await db.getOne('SELECT * FROM theatres WHERE id = $1', [req.params.id]);
    if (!theatre) return res.status(404).json({ error: 'Theatre not found' });

    const screens = await db.getAll('SELECT * FROM screens WHERE theatre_id = $1', [theatre.id]);
    const district = await db.getOne('SELECT * FROM districts WHERE id = $1', [theatre.district_id]);

    res.json({
      theatre: {
        ...theatre,
        rating: Number(theatre.rating),
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
