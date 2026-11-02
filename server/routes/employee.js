const express = require('express');
const router = express.Router();
const db = require('../db/database');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/security');

// Strict Middleware to verify employee role
function requireEmployee(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Employee authorization required. Please provide a valid Bearer token.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired staff token' });
    if (user.role !== 'employee' && user.role !== 'manager') {
      return res.status(403).json({ error: 'Access restricted to Theatre Staff' });
    }
    req.user = user;
    next();
  });
}

// GET /api/employee/today-shows
router.get('/today-shows', requireEmployee, async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const shows = await db.getAll(`
      SELECT s.*, m.title as movie_title, m.poster_url as movie_poster,
             t.name as theatre_name, scr.name as screen_name,
             (SELECT COUNT(*) FROM booking_seats bs WHERE bs.show_id = s.id) as booked_seats_count
      FROM shows s
      JOIN movies m ON s.movie_id = m.id
      JOIN theatres t ON s.theatre_id = t.id
      JOIN screens scr ON s.screen_id = scr.id
      WHERE s.show_date = $1 AND s.status = 'ACTIVE'
      ORDER BY s.start_time ASC
    `, [todayStr]);

    res.json({
      shows: shows.map(s => ({
        ...s,
        booked_seats_count: Number(s.booked_seats_count)
      }))
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch today's shows" });
  }
});

// GET /api/employee/bookings/search
router.get('/bookings/search', requireEmployee, async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.trim() === '') {
      return res.json({ bookings: [] });
    }

    const q = `%${query.trim().toLowerCase()}%`;
    const bookings = await db.getAll(`
      SELECT b.*, s.show_date, s.start_time, m.title as movie_title,
             t.name as theatre_name, scr.name as screen_name
      FROM bookings b
      JOIN shows s ON b.show_id = s.id
      JOIN movies m ON s.movie_id = m.id
      JOIN theatres t ON s.theatre_id = t.id
      JOIN screens scr ON s.screen_id = scr.id
      WHERE LOWER(b.booking_reference) LIKE $1
         OR LOWER(b.customer_name) LIKE $2
         OR LOWER(b.customer_phone) LIKE $3
         OR LOWER(b.whatsapp_number) LIKE $4
         OR LOWER(b.qr_token) LIKE $5
      ORDER BY b.created_at DESC
      LIMIT 25
    `, [q, q, q, q, q]);

    res.json({
      bookings: bookings.map(b => ({
        ...b,
        subtotal: Number(b.subtotal),
        tax_amount: Number(b.tax_amount),
        convenience_fee: Number(b.convenience_fee),
        total_amount: Number(b.total_amount),
        seat_ids: JSON.parse(b.seat_ids || '[]')
      }))
    });
  } catch (err) {
    res.status(500).json({ error: 'Search failed' });
  }
});

// POST /api/employee/verify-ticket (Scan QR or Enter Token / Ref)
router.post('/verify-ticket', requireEmployee, async (req, res) => {
  try {
    const { code, employeeName = req.user?.name || 'Gate Attendant' } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'QR token or Booking reference is required' });
    }

    // Attempt match on either qr_token or booking_reference
    const cleanCode = code.trim();
    const booking = await db.getOne(`
      SELECT b.*, s.show_date, s.start_time, s.status as show_status,
             m.title as movie_title, m.poster_url as movie_poster,
             t.name as theatre_name, scr.name as screen_name
      FROM bookings b
      JOIN shows s ON b.show_id = s.id
      JOIN movies m ON s.movie_id = m.id
      JOIN theatres t ON s.theatre_id = t.id
      JOIN screens scr ON s.screen_id = scr.id
      WHERE b.qr_token = $1 OR b.booking_reference = $2
    `, [cleanCode, cleanCode]);

    if (!booking) {
      return res.status(404).json({
        verified: false,
        status: 'INVALID',
        message: 'Invalid ticket pass. No matching booking found in CineAura system.'
      });
    }

    const now = Date.now();

    // Check if already checked in
    if (booking.verification_status === 'CHECKED_IN') {
      const checkedTime = booking.checked_in_at ? new Date(Number(booking.checked_in_at)).toLocaleTimeString() : 'Earlier';
      return res.json({
        verified: false,
        status: 'ALREADY_CHECKED_IN',
        message: `⚠️ This ticket was already verified and scanned at ${checkedTime} by ${booking.checked_in_by || 'Gate Staff'}. Duplicate entry rejected!`,
        booking: {
          ...booking,
          subtotal: Number(booking.subtotal),
          total_amount: Number(booking.total_amount),
          seat_ids: JSON.parse(booking.seat_ids || '[]')
        }
      });
    }

    // Perform check-in atomically
    await db.execute(`
      UPDATE bookings
      SET verification_status = 'CHECKED_IN',
          checked_in_at = $1,
          checked_in_by = $2
      WHERE id = $3
    `, [now, employeeName, booking.id]);

    const updatedBooking = await db.getOne('SELECT * FROM bookings WHERE id = $1', [booking.id]);

    res.json({
      verified: true,
      status: 'SUCCESS',
      message: `✅ Admission Verified! Welcome ${booking.customer_name}. Enjoy "${booking.movie_title}"!`,
      booking: {
        ...booking,
        ...updatedBooking,
        subtotal: Number(booking.subtotal),
        total_amount: Number(booking.total_amount),
        seat_ids: JSON.parse(booking.seat_ids || '[]')
      }
    });
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ error: 'Failed to verify ticket pass' });
  }
});

// GET /api/employee/shows/:id/occupancy
router.get('/shows/:id/occupancy', requireEmployee, async (req, res) => {
  try {
    const { id: showId } = req.params;
    const show = await db.getOne(`
      SELECT s.*, scr.total_seats, scr.name as screen_name, m.title as movie_title, t.name as theatre_name
      FROM shows s
      JOIN screens scr ON s.screen_id = scr.id
      JOIN movies m ON s.movie_id = m.id
      JOIN theatres t ON s.theatre_id = t.id
      WHERE s.id = $1
    `, [showId]);

    if (!show) return res.status(404).json({ error: 'Show not found' });

    const bookedCountRow = await db.getOne(`
      SELECT COUNT(*) as count FROM booking_seats WHERE show_id = $1
    `, [showId]);
    const bookedCount = Number(bookedCountRow?.count) || 0;

    const checkedInCountRow = await db.getOne(`
      SELECT COUNT(DISTINCT b.id) as count
      FROM bookings b
      WHERE b.show_id = $1 AND b.verification_status = 'CHECKED_IN'
    `, [showId]);
    const checkedInCount = Number(checkedInCountRow?.count) || 0;

    res.json({
      showId,
      movieTitle: show.movie_title,
      theatreName: show.theatre_name,
      screenName: show.screen_name,
      totalSeats: show.total_seats,
      bookedSeats: bookedCount,
      checkedInCount,
      occupancyPercentage: Math.round((bookedCount / Math.max(1, show.total_seats)) * 100)
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch occupancy' });
  }
});

module.exports = router;
