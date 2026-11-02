const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { holdSeats, releaseSeats, sweepExpiredHolds } = require('../services/seatLockService');

// POST /api/holds
router.post('/', (req, res) => {
  try {
    const { showId, seatIds, sessionId, userId } = req.body;
    if (!showId || !sessionId || !Array.isArray(seatIds)) {
      return res.status(400).json({ error: 'Invalid hold parameters' });
    }

    const result = holdSeats(showId, seatIds, sessionId, userId);
    if (!result.success) {
      return res.status(409).json(result);
    }

    // Broadcast seat change via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`show_${showId}`).emit('seats_updated', {
        showId,
        action: 'hold',
        heldSeats: seatIds,
        sessionId
      });
    }

    res.json(result);
  } catch (err) {
    console.error('Hold error:', err);
    res.status(500).json({ error: 'Failed to hold seats' });
  }
});

// POST /api/holds/release
router.post('/release', (req, res) => {
  try {
    const { showId, sessionId, seatIds } = req.body;
    if (!showId || !sessionId) {
      return res.status(400).json({ error: 'Missing showId or sessionId' });
    }

    const result = releaseSeats(showId, sessionId, seatIds);

    const io = req.app.get('io');
    if (io) {
      io.to(`show_${showId}`).emit('seats_updated', {
        showId,
        action: 'release',
        releasedSeats: seatIds || 'all',
        sessionId
      });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to release seats' });
  }
});

// GET /api/holds/active
router.get('/active', (req, res) => {
  try {
    const { showId, sessionId } = req.query;
    if (!showId || !sessionId) {
      return res.status(400).json({ error: 'Missing showId or sessionId' });
    }

    sweepExpiredHolds();
    const now = Date.now();
    const holds = db.prepare(`
      SELECT sh.*, s.seat_number, s.base_price, s.seat_type, s.seat_tier
      FROM seat_holds sh
      JOIN seats s ON sh.seat_id = s.id
      WHERE sh.show_id = ? AND sh.session_id = ? AND sh.expires_at > ?
    `).all(showId, sessionId, now);

    if (holds.length === 0) {
      return res.json({ activeHold: null });
    }

    const expiresAt = holds[0].expires_at;
    const remainingSeconds = Math.max(0, Math.floor((expiresAt - now) / 1000));

    res.json({
      activeHold: {
        showId,
        sessionId,
        seats: holds,
        expiresAt,
        remainingSeconds
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch active hold' });
  }
});

module.exports = router;
