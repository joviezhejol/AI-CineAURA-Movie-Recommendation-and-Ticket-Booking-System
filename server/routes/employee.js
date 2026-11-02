const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET /api/employee/today-shows
router.get('/today-shows', (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const shows = db.prepare(`
      SELECT s.*, m.title as movie_title, m.poster_url as movie_poster,
             t.name as theatre_name, scr.name as screen_name,
             (SELECT COUNT(*) FROM booking_seats bs WHERE bs.show_id = s.id) as booked_seats_count
      FROM shows s
      JOIN movies m ON s.movie_id = m.id
      JOIN theatres t ON s.theatre_id = t.id
      JOIN screens scr ON s.screen_id = scr.id
      WHERE s.show_date = ? AND s.status = 'ACTIVE'
      ORDER BY s.start_time ASC
    `).all(todayStr);

    res.json({ shows });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch today's shows" });
  }
});

// GET /api/employee/bookings/search
router.get('/bookings/search', (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.trim() === '') {
      return res.json({ bookings: [] });
    }

    const q = `%${query.trim().toLowerCase()}%`;
    const bookings = db.prepare(`
      SELECT b.*, s.show_date, s.start_time, m.title as movie_title,
             t.name as theatre_name, scr.name as screen_name
      FROM bookings b
      JOIN shows s ON b.show_id = s.id
      JOIN movies m ON s.movie_id = m.id
      JOIN theatres t ON s.theatre_id = t.id
      JOIN screens scr ON s.screen_id = scr.id
      WHERE LOWER(b.booking_reference) LIKE ?
         OR LOWER(b.customer_name) LIKE ?
         OR LOWER(b.customer_phone) LIKE ?
         OR LOWER(b.whatsapp_number) LIKE ?
         OR LOWER(b.qr_token) LIKE ?
      ORDER BY b.created_at DESC
      LIMIT 25
    `).all(q, q, q, q, q);

    res.json({ bookings });
  } catch (err) {
    res.status(500).json({ error: 'Search failed' });
  }
});

// POST /api/employee/verify-ticket (Scan QR or Enter Token / Ref)
router.post('/verify-ticket', (req, res) => {
  try {
    const { code, employeeName = 'Gate Attendant' } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'QR token or Booking reference is required' });
    }

    // Attempt match on either qr_token or booking_reference
    const cleanCode = code.trim();
    const booking = db.prepare(`
      SELECT b.*, s.show_date, s.start_time, s.status as show_status,
             m.title as movie_title, m.poster_url as movie_poster,
             t.name as theatre_name, scr.name as screen_name
      FROM bookings b
      JOIN shows s ON b.show_id = s.id
      JOIN movies m ON s.movie_id = m.id
      JOIN theatres t ON s.theatre_id = t.id
      JOIN screens scr ON s.screen_id = scr.id
      WHERE b.qr_token = ? OR b.booking_reference = ?
    `).get(cleanCode, cleanCode);

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
      return res.json({
        verified: false,
        status: 'ALREADY_CHECKED_IN',
        message: `⚠️ This ticket was already verified and scanned at ${new Date(booking.checked_in_at).toLocaleTimeString()} by ${booking.checked_in_by || 'Gate Staff'}. Duplicate entry rejected!`,
        booking
      });
    }

    if (booking.payment_status !== 'PAID') {
      return res.status(400).json({
        verified: false,
        status: 'UNPAID',
        message: 'This booking payment has not been completed or has been refunded.',
        booking
      });
    }

    // Mark as checked in
    db.prepare(`
      UPDATE bookings
      SET verification_status = 'CHECKED_IN',
          checked_in_at = ?,
          checked_in_by = ?
      WHERE id = ?
    `).run(now, employeeName, booking.id);

    booking.verification_status = 'CHECKED_IN';
    booking.checked_in_at = now;
    booking.checked_in_by = employeeName;

    res.json({
      verified: true,
      status: 'VERIFIED',
      message: `✅ Admission Authorized! Welcome ${booking.customer_name} to ${booking.screen_name}.`,
      booking
    });
  } catch (err) {
    console.error('Verify Ticket error:', err);
    res.status(500).json({ error: 'Failed to verify ticket' });
  }
});

module.exports = router;
