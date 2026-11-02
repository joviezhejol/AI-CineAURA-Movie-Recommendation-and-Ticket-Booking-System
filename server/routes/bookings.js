const express = require('express');
const router = express.Router();
const db = require('../db/database');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const { verifySeatsHeldForBooking } = require('../services/seatLockService');
const { sendWhatsAppNotification } = require('../services/whatsappService');

// Helper to generate elegant booking reference
function generateBookingReference() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let ref = 'CINE-';
  for (let i = 0; i < 6; i++) {
    ref += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return ref;
}

// POST /api/bookings/create
router.post('/create', async (req, res) => {
  try {
    const {
      showId,
      seatIds,
      seatType = 'SINGLE',
      sessionId,
      userId = null,
      customerName,
      customerEmail,
      customerPhone,
      whatsappNumber,
      paymentMethod = 'UPI',
      paymentDetails = {}
    } = req.body;

    if (!showId || !sessionId || !Array.isArray(seatIds) || seatIds.length === 0) {
      return res.status(400).json({ error: 'Missing show or seat information' });
    }

    if (!customerName || !customerEmail || !customerPhone) {
      return res.status(400).json({ error: 'Please provide customer name, email, and phone number' });
    }

    // 1. Verify show exists
    const show = await db.getOne(`
      SELECT s.*, m.title as movie_title, m.poster_url as movie_poster, m.language as movie_language,
             m.certificate as movie_certificate, t.name as theatre_name, t.address as theatre_address,
             t.city as theatre_city, scr.name as screen_name
      FROM shows s
      JOIN movies m ON s.movie_id = m.id
      JOIN theatres t ON s.theatre_id = t.id
      JOIN screens scr ON s.screen_id = scr.id
      WHERE s.id = $1
    `, [showId]);

    if (!show) {
      return res.status(404).json({ error: 'Show not found' });
    }

    // 2. Critical atomic check: verify seats are actively held by this session
    const isHeld = await verifySeatsHeldForBooking(showId, seatIds, sessionId);
    if (!isHeld) {
      return res.status(409).json({
        error: 'Seat hold has expired or is no longer reserved for your session. Please select your seats again.'
      });
    }

    // 3. Fetch seat information
    const placeholders = seatIds.map((_, i) => `$${i + 1}`).join(',');
    const seats = await db.getAll(`
      SELECT * FROM seats WHERE id IN (${placeholders})
    `, seatIds);

    if (seats.length !== seatIds.length) {
      return res.status(400).json({ error: 'Invalid seat identifiers' });
    }

    // 4. Calculate prices
    let subtotal = 0;
    seats.forEach(s => {
      subtotal += (Number(s.base_price) || Number(show.ticket_price) || 190.0);
    });

    const convenienceFee = seats.length * 35.0; // ₹35 per ticket convenience
    const taxAmount = (subtotal + convenienceFee) * 0.18; // 18% GST
    const totalAmount = Math.round((subtotal + convenienceFee + taxAmount) * 100) / 100;

    // 5. Generate identifiers
    const bookingId = uuidv4();
    const bookingRef = generateBookingReference();
    const qrToken = `CINE-${uuidv4().substring(0, 12).toUpperCase()}`;
    const paymentId = paymentDetails.transactionId || `PAY-${uuidv4().substring(0, 8).toUpperCase()}`;
    const now = Date.now();
    const seatNames = seats.map(s => s.seat_number).sort().join(', ');

    // 6. Generate QR code Base64
    const qrPayload = JSON.stringify({
      bookingRef,
      qrToken,
      movie: show.movie_title,
      theatre: show.theatre_name,
      screen: show.screen_name,
      date: show.show_date,
      time: show.start_time,
      seats: seatNames,
      status: 'VERIFIED'
    });
    const qrCodeDataUrl = await QRCode.toDataURL(qrPayload, {
      width: 320,
      margin: 2,
      color: {
        dark: '#0a0e17',
        light: '#ffffff'
      }
    });

    // 7. Atomic DB Transaction for creating booking & releasing hold
    await db.withTransaction(async (tx) => {
      // Insert booking record
      await tx.execute(`
        INSERT INTO bookings (
          id, booking_reference, show_id, user_id, customer_name, customer_email,
          customer_phone, whatsapp_number, seat_names, seat_ids, seat_type,
          subtotal, tax_amount, convenience_fee, total_amount, payment_status,
          payment_id, payment_method, qr_token, qr_code_image, verification_status,
          created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11,
          $12, $13, $14, $15, 'PAID',
          $16, $17, $18, $19, 'PENDING',
          $20
        )
      `, [
        bookingId, bookingRef, showId, userId, customerName, customerEmail,
        customerPhone, whatsappNumber || customerPhone, seatNames, JSON.stringify(seatIds), seatType,
        subtotal, taxAmount, convenienceFee, totalAmount,
        paymentId, paymentMethod, qrToken, qrCodeDataUrl,
        now
      ]);

      // Insert individual booking seats
      for (const s of seats) {
        await tx.execute(`
          INSERT INTO booking_seats (id, booking_id, show_id, seat_id, seat_number, price)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          uuidv4(),
          bookingId,
          showId,
          s.id,
          s.seat_number,
          Number(s.base_price) || Number(show.ticket_price) || 190.0
        ]);
      }

      // Clear holds for these seats
      const clearHoldPlaceholders = seatIds.map((_, i) => `$${i + 2}`).join(',');
      await tx.execute(`
        DELETE FROM seat_holds WHERE show_id = $1 AND seat_id IN (${clearHoldPlaceholders})
      `, [showId, ...seatIds]);

      // Add customer notification if user is logged in
      if (userId) {
        await tx.execute(`
          INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
          VALUES ($1, $2, $3, $4, 'booking', 0, $5)
        `, [
          uuidv4(),
          userId,
          `Booking Confirmed! 🎟️ ${show.movie_title}`,
          `Your seats (${seatNames}) at ${show.theatre_name} are confirmed. Reference: ${bookingRef}`,
          now
        ]);
      }
    });

    // 8. Dispatch authentic WhatsApp confirmation
    const targetWhatsapp = whatsappNumber || customerPhone;
    const waLog = await sendWhatsAppNotification({
      bookingId,
      phone: targetWhatsapp,
      messageData: {
        bookingRef,
        customerName,
        movieTitle: show.movie_title,
        language: show.movie_language,
        experience: show.experience,
        theatreName: show.theatre_name,
        screenName: show.screen_name,
        showDate: show.show_date,
        startTime: show.start_time,
        seatNames,
        seatType,
        totalAmount,
        qrToken
      }
    });

    // Broadcast seats updated event
    const io = req.app.get('io');
    if (io) {
      io.to(`show_${showId}`).emit('seats_updated', {
        showId,
        action: 'booked',
        bookedSeats: seatIds
      });
    }

    res.status(201).json({
      success: true,
      booking: {
        id: bookingId,
        bookingReference: bookingRef,
        qrToken,
        qrCodeImage: qrCodeDataUrl,
        customerName,
        customerEmail,
        customerPhone,
        whatsappNumber: targetWhatsapp,
        movieTitle: show.movie_title,
        moviePoster: show.movie_poster,
        theatreName: show.theatre_name,
        screenName: show.screen_name,
        showDate: show.show_date,
        startTime: show.start_time,
        seatNames,
        seatCount: seats.length,
        seatType,
        subtotal,
        taxAmount,
        convenienceFee,
        totalAmount,
        paymentStatus: 'PAID',
        paymentMethod,
        paymentId,
        verificationStatus: 'PENDING',
        createdAt: now
      },
      whatsAppDispatch: waLog
    });
  } catch (err) {
    console.error('Booking Creation Error:', err);
    res.status(500).json({ error: 'Failed to process booking' });
  }
});

// GET /api/bookings/:id
router.get('/:id', async (req, res) => {
  try {
    const booking = await db.getOne(`
      SELECT b.*, s.show_date, s.start_time, s.language as show_language, s.experience as show_experience,
             m.title as movie_title, m.poster_url as movie_poster, m.backdrop_url as movie_backdrop,
             m.certificate as movie_certificate, t.name as theatre_name, t.address as theatre_address,
             t.city as theatre_city, scr.name as screen_name
      FROM bookings b
      JOIN shows s ON b.show_id = s.id
      JOIN movies m ON s.movie_id = m.id
      JOIN theatres t ON s.theatre_id = t.id
      JOIN screens scr ON s.screen_id = scr.id
      WHERE b.id = $1 OR b.booking_reference = $2
    `, [req.params.id, req.params.id]);

    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    res.json({
      booking: {
        ...booking,
        subtotal: Number(booking.subtotal),
        tax_amount: Number(booking.tax_amount),
        convenience_fee: Number(booking.convenience_fee),
        total_amount: Number(booking.total_amount),
        seat_ids: JSON.parse(booking.seat_ids || '[]')
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
});

// GET /api/bookings/ticket/:qrToken
router.get('/ticket/:qrToken', async (req, res) => {
  try {
    const booking = await db.getOne(`
      SELECT b.*, s.show_date, s.start_time, s.language as show_language, s.experience as show_experience,
             m.title as movie_title, m.poster_url as movie_poster, m.certificate as movie_certificate,
             t.name as theatre_name, t.address as theatre_address, t.city as theatre_city,
             scr.name as screen_name
      FROM bookings b
      JOIN shows s ON b.show_id = s.id
      JOIN movies m ON s.movie_id = m.id
      JOIN theatres t ON s.theatre_id = t.id
      JOIN screens scr ON s.screen_id = scr.id
      WHERE b.qr_token = $1
    `, [req.params.qrToken]);

    if (!booking) return res.status(404).json({ error: 'Ticket pass not found or invalid QR token' });

    res.json({
      ticket: {
        ...booking,
        subtotal: Number(booking.subtotal),
        tax_amount: Number(booking.tax_amount),
        convenience_fee: Number(booking.convenience_fee),
        total_amount: Number(booking.total_amount),
        seat_ids: JSON.parse(booking.seat_ids || '[]')
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load ticket pass' });
  }
});

// GET /api/bookings/user/:userId
router.get('/user/:userId', async (req, res) => {
  try {
    const bookings = await db.getAll(`
      SELECT b.*, s.show_date, s.start_time, m.title as movie_title, m.poster_url as movie_poster,
             t.name as theatre_name, scr.name as screen_name
      FROM bookings b
      JOIN shows s ON b.show_id = s.id
      JOIN movies m ON s.movie_id = m.id
      JOIN theatres t ON s.theatre_id = t.id
      JOIN screens scr ON s.screen_id = scr.id
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC
    `, [req.params.userId]);

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
    res.status(500).json({ error: 'Failed to fetch user bookings' });
  }
});

// GET /api/bookings/:id/whatsapp-log
router.get('/:id/whatsapp-log', async (req, res) => {
  try {
    const log = await db.getOne('SELECT * FROM whatsapp_logs WHERE booking_id = $1 ORDER BY sent_at DESC LIMIT 1', [req.params.id]);
    res.json({ log });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load WhatsApp dispatch log' });
  }
});

module.exports = router;
