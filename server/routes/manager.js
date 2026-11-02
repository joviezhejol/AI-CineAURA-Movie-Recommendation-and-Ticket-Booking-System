const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/security');

// Strict Middleware to verify manager role
function requireManager(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Manager authorization required. Please provide a valid Bearer token.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired manager token' });
    if (user.role !== 'manager') {
      return res.status(403).json({ error: 'Access restricted to Theatre Managers' });
    }
    req.user = user;
    next();
  });
}

// GET /api/manager/analytics
router.get('/analytics', requireManager, async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    // Today's Bookings and Revenue
    const todayStats = await db.getOne(`
      SELECT COUNT(*) as bookingCount, COALESCE(SUM(total_amount), 0) as totalRevenue
      FROM bookings b
      JOIN shows s ON b.show_id = s.id
      WHERE s.show_date = $1 AND b.payment_status = 'PAID'
    `, [todayStr]);

    // All Time Bookings & Revenue
    const overallStats = await db.getOne(`
      SELECT COUNT(*) as totalBookings, COALESCE(SUM(total_amount), 0) as totalRevenue
      FROM bookings WHERE payment_status = 'PAID'
    `);

    // Active Shows count
    const activeShowsRow = await db.getOne(`
      SELECT COUNT(*) as count FROM shows WHERE status = 'ACTIVE' AND show_date >= $1
    `, [todayStr]);

    // Currently Held Seats count
    const now = Date.now();
    const heldSeatsRow = await db.getOne(`
      SELECT COUNT(*) as count FROM seat_holds WHERE expires_at > $1
    `, [now]);

    // Blocked seats count
    const blockedSeatsRow = await db.getOne(`
      SELECT COUNT(*) as count FROM blocked_seats
    `);

    // Total booked seats count
    const bookedSeatsRow = await db.getOne(`
      SELECT COUNT(*) as count FROM booking_seats
    `);

    // Occupancy Percentage calculation
    const capacityRow = await db.getOne(`
      SELECT COALESCE(SUM(scr.total_seats), 1000) as total
      FROM shows s
      JOIN screens scr ON s.screen_id = scr.id
      WHERE s.show_date = $1 AND s.status = 'ACTIVE'
    `, [todayStr]);
    const totalCapacity = Number(capacityRow?.total) || 500;

    const todayBookedRow = await db.getOne(`
      SELECT COUNT(bs.id) as count
      FROM booking_seats bs
      JOIN shows s ON bs.show_id = s.id
      WHERE s.show_date = $1
    `, [todayStr]);
    const todayBookedSeats = Number(todayBookedRow?.count) || 0;

    const occupancyRate = Math.min(100, Math.round((todayBookedSeats / Math.max(1, totalCapacity)) * 100));

    // Popular Movies
    const popularMovies = await db.getAll(`
      SELECT m.id, m.title, m.poster_url, COUNT(b.id) as bookingsCount,
             COALESCE(SUM(b.total_amount), 0) as revenue
      FROM movies m
      LEFT JOIN shows s ON m.id = s.movie_id
      LEFT JOIN bookings b ON s.id = b.show_id AND b.payment_status = 'PAID'
      GROUP BY m.id, m.title, m.poster_url
      ORDER BY bookingsCount DESC
      LIMIT 5
    `);

    // Most Booked Seats
    const popularSeats = await db.getAll(`
      SELECT seat_number, COUNT(*) as bookCount
      FROM booking_seats
      GROUP BY seat_number
      ORDER BY bookCount DESC
      LIMIT 8
    `);

    // Revenue Trends (Past 7 days)
    const revenueTrends = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

      const dayRev = await db.getOne(`
        SELECT COALESCE(SUM(b.total_amount), 0) as rev, COUNT(b.id) as count
        FROM bookings b
        JOIN shows s ON b.show_id = s.id
        WHERE s.show_date = $1 AND b.payment_status = 'PAID'
      `, [dateStr]);

      revenueTrends.push({
        date: dateStr,
        day: dayName,
        revenue: Number(dayRev?.rev) || 0,
        bookings: Number(dayRev?.count) || 0
      });
    }

    res.json({
      analytics: {
        todayBookings: Number(todayStats?.bookingcount || todayStats?.bookingCount) || 0,
        todayRevenue: Number(todayStats?.totalrevenue || todayStats?.totalRevenue) || 0,
        totalBookings: Number(overallStats?.totalbookings || overallStats?.totalBookings) || 0,
        totalRevenue: Number(overallStats?.totalrevenue || overallStats?.totalRevenue) || 0,
        activeShows: Number(activeShowsRow?.count) || 0,
        heldSeats: Number(heldSeatsRow?.count) || 0,
        blockedSeats: Number(blockedSeatsRow?.count) || 0,
        totalBookedSeats: Number(bookedSeatsRow?.count) || 0,
        occupancyRate,
        popularMovies: popularMovies.map(m => ({
          ...m,
          bookingsCount: Number(m.bookingscount || m.bookingsCount),
          revenue: Number(m.revenue)
        })),
        popularSeats: popularSeats.map(s => ({
          ...s,
          bookCount: Number(s.bookcount || s.bookCount)
        })),
        revenueTrends
      }
    });
  } catch (err) {
    console.error('Analytics Error:', err);
    res.status(500).json({ error: 'Failed to compile management analytics' });
  }
});

// GET /api/manager/shows
router.get('/shows', requireManager, async (req, res) => {
  try {
    const { date, theatre_id } = req.query;
    let query = `
      SELECT s.*, m.title as movie_title, m.poster_url as movie_poster,
             t.name as theatre_name, scr.name as screen_name, scr.total_seats,
             (SELECT COUNT(*) FROM booking_seats bs WHERE bs.show_id = s.id) as booked_seats_count,
             (SELECT COUNT(*) FROM blocked_seats blk WHERE blk.show_id = s.id) as blocked_seats_count
      FROM shows s
      JOIN movies m ON s.movie_id = m.id
      JOIN theatres t ON s.theatre_id = t.id
      JOIN screens scr ON s.screen_id = scr.id
      WHERE 1=1
    `;
    const params = [];

    if (date) {
      params.push(date);
      query += ` AND s.show_date = $${params.length}`;
    }
    if (theatre_id) {
      params.push(theatre_id);
      query += ` AND s.theatre_id = $${params.length}`;
    }

    query += ' ORDER BY s.show_date DESC, s.start_time ASC';
    const shows = await db.getAll(query, params);

    res.json({
      shows: shows.map(s => ({
        ...s,
        booked_seats_count: Number(s.booked_seats_count),
        blocked_seats_count: Number(s.blocked_seats_count)
      }))
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch shows for manager' });
  }
});

// POST /api/manager/shows (Add Show)
router.post('/shows', requireManager, async (req, res) => {
  try {
    const { movieId, theatreId, screenId, showDate, startTime, endTime, language, experience, ticketPrice } = req.body;
    if (!movieId || !theatreId || !screenId || !showDate || !startTime || !endTime || !ticketPrice) {
      return res.status(400).json({ error: 'All show parameters are required' });
    }

    const showId = uuidv4();
    await db.execute(`
      INSERT INTO shows (id, movie_id, theatre_id, screen_id, show_date, start_time, end_time, language, experience, ticket_price, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'ACTIVE')
    `, [showId, movieId, theatreId, screenId, showDate, startTime, endTime, language || 'Tamil', experience || 'Standard', ticketPrice]);

    res.status(201).json({ success: true, showId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create show' });
  }
});

// PUT /api/manager/shows/:id/cancel
router.put('/shows/:id/cancel', requireManager, async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute("UPDATE shows SET status = 'CANCELLED' WHERE id = $1", [id]);

    const io = req.app.get('io');
    if (io) {
      io.to(`show_${id}`).emit('show_status_changed', { showId: id, status: 'CANCELLED' });
    }

    res.json({ success: true, message: 'Show cancelled successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel show' });
  }
});

// GET /api/manager/shows/:id/seats-status
router.get('/shows/:id/seats-status', requireManager, async (req, res) => {
  try {
    const { id: showId } = req.params;
    const show = await db.getOne('SELECT screen_id FROM shows WHERE id = $1', [showId]);
    if (!show) return res.status(404).json({ error: 'Show not found' });

    const allSeats = await db.getAll('SELECT * FROM seats WHERE screen_id = $1 ORDER BY row_label ASC, col_number ASC', [show.screen_id]);
    const bookedSeats = await db.getAll(`
      SELECT bs.seat_id, b.customer_name, b.booking_reference, b.payment_status
      FROM booking_seats bs
      JOIN bookings b ON bs.booking_id = b.id
      WHERE bs.show_id = $1 AND b.payment_status = 'PAID'
    `, [showId]);
    const blockedSeats = await db.getAll('SELECT * FROM blocked_seats WHERE show_id = $1', [showId]);

    const bookedMap = new Map();
    bookedSeats.forEach(b => bookedMap.set(b.seat_id, b));

    const blockedMap = new Map();
    blockedSeats.forEach(b => blockedMap.set(b.seat_id, b));

    const result = allSeats.map(s => {
      let status = 'AVAILABLE';
      let info = null;

      if (bookedMap.has(s.id)) {
        status = 'BOOKED';
        info = bookedMap.get(s.id);
      } else if (blockedMap.has(s.id)) {
        status = 'BLOCKED';
        info = blockedMap.get(s.id);
      }

      return {
        ...s,
        base_price: Number(s.base_price),
        status,
        details: info
      };
    });

    res.json({ seats: result });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load seats status' });
  }
});

// POST /api/manager/seats/block
router.post('/seats/block', requireManager, async (req, res) => {
  try {
    const { showId, seatIds, reason = 'Manager Reserved', blockedBy = req.user?.name || 'Theatre Manager' } = req.body;
    if (!showId || !Array.isArray(seatIds) || seatIds.length === 0) {
      return res.status(400).json({ error: 'Missing showId or seatIds' });
    }

    const now = Date.now();
    for (const seatId of seatIds) {
      const blockId = uuidv4();
      if (db.isPostgres()) {
        await db.execute(`
          INSERT INTO blocked_seats (id, show_id, seat_id, blocked_by, reason, blocked_at)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (show_id, seat_id) DO UPDATE SET
            blocked_by = EXCLUDED.blocked_by,
            reason = EXCLUDED.reason,
            blocked_at = EXCLUDED.blocked_at
        `, [blockId, showId, seatId, blockedBy, reason, now]);
      } else {
        await db.execute(`
          INSERT OR REPLACE INTO blocked_seats (id, show_id, seat_id, blocked_by, reason, blocked_at)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [blockId, showId, seatId, blockedBy, reason, now]);
      }
    }

    // Broadcast seat change via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`show_${showId}`).emit('seats_updated', {
        showId,
        action: 'blocked',
        blockedSeats: seatIds
      });
    }

    res.json({ success: true, blockedSeats: seatIds });
  } catch (err) {
    res.status(500).json({ error: 'Failed to block seats' });
  }
});

// POST /api/manager/seats/unblock
router.post('/seats/unblock', requireManager, async (req, res) => {
  try {
    const { showId, seatIds } = req.body;
    if (!showId || !Array.isArray(seatIds) || seatIds.length === 0) {
      return res.status(400).json({ error: 'Missing showId or seatIds' });
    }

    const placeholders = seatIds.map((_, i) => `$${i + 2}`).join(',');
    await db.execute(`
      DELETE FROM blocked_seats WHERE show_id = $1 AND seat_id IN (${placeholders})
    `, [showId, ...seatIds]);

    const io = req.app.get('io');
    if (io) {
      io.to(`show_${showId}`).emit('seats_updated', {
        showId,
        action: 'unblocked',
        unblockedSeats: seatIds
      });
    }

    res.json({ success: true, unblockedSeats: seatIds });
  } catch (err) {
    res.status(500).json({ error: 'Failed to unblock seats' });
  }
});

module.exports = router;
