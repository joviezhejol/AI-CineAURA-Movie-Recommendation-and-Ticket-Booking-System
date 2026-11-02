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
    const show = db.prepare(`
      SELECT s.*, m.title as movie_title, m.poster_url as movie_poster, m.language as movie_language,
             m.certificate as movie_certificate, t.name as theatre_name, t.address as theatre_address,
             t.city as theatre_city, scr.name as screen_name
      FROM shows s
      JOIN movies m ON s.movie_id = m.id
      JOIN theatres t ON s.theatre_id = t.id
      JOIN screens scr ON s.screen_id = scr.id
      WHERE s.id = ?
    `).get(showId);

    if (!show) {
      return res.status(404).json({ error: 'Show not found' });
    }

    // 2. Critical atomic check: verify seats are actively held by this session
    const isHeld = verifySeatsHeldForBooking(showId, seatIds, sessionId);
    if (!isHeld) {
      return res.status(409).json({
        error: 'Seat hold has expired or is no longer reserved for your session. Please select your seats again.'
      });
    }

    // 3. Fetch seat information
    const seats = db.prepare(`
      SELECT * FROM seats WHERE id IN (${seatIds.map(() => '?').join(',')})
    `).all(...seatIds);

    if (seats.length !== seatIds.length) {
      return res.status(400).json({ error: 'Invalid seat identifiers' });
    }

    // 4. Calculate prices
    let subtotal = 0;
    seats.forEach(s => {
      subtotal += (s.base_price || show.ticket_price || 190.0);
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
    const tx = db.transaction(() => {
      // Insert booking record
      db.prepare(`
        INSERT INTO bookings (
          id, booking_reference, show_id, user_id, customer_name, customer_email,
          customer_phone, whatsapp_number, seat_names, seat_ids, seat_type,
          subtotal, tax_amount, convenience_fee, total_amount, payment_status,
          payment_id, payment_method, qr_token, qr_code_image, verification_status,
          created_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, 'PAID',
          ?, ?, ?, ?, 'PENDING',
          ?
        )
      `).run(
        bookingId, bookingRef, showId, userId, customerName, customerEmail,
        customerPhone, whatsappNumber || customerPhone, seatNames, JSON.stringify(seatIds), seatType,
        subtotal, taxAmount, convenienceFee, totalAmount,
        paymentId, paymentMethod, qrToken, qrCodeDataUrl,
        now
      );

      // Insert individual booking seats
      const insertBookingSeat = db.prepare(`
        INSERT INTO booking_seats (id, booking_id, show_id, seat_id, seat_number, price)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      seats.forEach(s => {
        insertBookingSeat.run(
          uuidv4(),
          bookingId,
          showId,
          s.id,
          s.seat_number,
          s.base_price || show.ticket_price || 190.0
        );
      });

      // Clear holds for these seats
      db.prepare(`
        DELETE FROM seat_holds WHERE show_id = ? AND seat_id IN (${seatIds.map(() => '?').join(',')})
      `).run(showId, ...seatIds);

      // Add customer notification if user is logged in
      if (userId) {
        db.prepare(`
          INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
          VALUES (?, ?, ?, ?, 'booking', 0, ?)
        `).run(
          uuidv4(),
          userId,
          `Booking Confirmed! 🎟️ ${show.movie_title}`,
          `Your seats (${seatNames}) at ${show.theatre_name} are confirmed. Reference: ${bookingRef}`,
          now
        );
      }
    });

    tx();

    // 8. Dispatch authentic WhatsApp confirmation
    const targetWhatsapp = whatsappNumber || customerPhone;
    const waLog = sendWhatsAppNotification({
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

    // 9. Broadcast Socket.IO update to all clients looking at this show
    const io = req.app.get('io');
    if (io) {
      io.to(`show_${showId}`).emit('seats_updated', {
        showId,
        action: 'booked',
        bookedSeats: seatIds,
        bookingRef
      });
    }

    res.status(201).json({
      success: true,
      booking: {
        id: bookingId,
        booking_reference: bookingRef,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        whatsapp_number: targetWhatsapp,
        movie_title: show.movie_title,
        movie_poster: show.movie_poster,
        theatre_name: show.theatre_name,
        theatre_address: show.theatre_address,
        theatre_city: show.theatre_city,
        screen_name: show.screen_name,
        experience: show.experience,
        show_date: show.show_date,
        start_time: show.start_time,
        seat_names: seatNames,
        seat_type: seatType,
        subtotal,
        convenience_fee: convenienceFee,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        payment_id: paymentId,
        payment_method: paymentMethod,
        qr_token: qrToken,
        qr_code_image: qrCodeDataUrl,
        verification_status: 'PENDING',
        created_at: now
      },
      whatsappNotification: waLog
    });
  } catch (err) {
    console.error('Booking Creation Error:', err);
    res.status(500).json({ error: err.message || 'Failed to complete booking' });
  }
});

// GET /api/bookings/ref/:bookingRef
router.get('/ref/:bookingRef', (req, res) => {
  try {
    const booking = db.prepare(`
      SELECT b.*, s.show_date, s.start_time, s.experience,
             m.title as movie_title, m.poster_url as movie_poster, m.certificate as movie_certificate,
             m.duration_mins, m.language as movie_language,
             t.name as theatre_name, t.address as theatre_address, t.city as theatre_city,
             scr.name as screen_name
      FROM bookings b
      JOIN shows s ON b.show_id = s.id
      JOIN movies m ON s.movie_id = m.id
      JOIN theatres t ON s.theatre_id = t.id
      JOIN screens scr ON s.screen_id = scr.id
      WHERE b.booking_reference = ?
    `).get(req.params.bookingRef);

    if (!booking) return res.status(404).json({ error: 'Booking reference not found' });

    res.json({ booking });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
});

// GET /api/bookings/qr/:qrToken
router.get('/qr/:qrToken', (req, res) => {
  try {
    const booking = db.prepare(`
      SELECT b.*, s.show_date, s.start_time, s.experience,
             m.title as movie_title, m.poster_url as movie_poster, m.certificate as movie_certificate,
             m.duration_mins, m.language as movie_language,
             t.name as theatre_name, t.address as theatre_address, t.city as theatre_city,
             scr.name as screen_name
      FROM bookings b
      JOIN shows s ON b.show_id = s.id
      JOIN movies m ON s.movie_id = m.id
      JOIN theatres t ON s.theatre_id = t.id
      JOIN screens scr ON s.screen_id = scr.id
      WHERE b.qr_token = ?
    `).get(req.params.qrToken);

    if (!booking) return res.status(404).json({ error: 'Digital ticket pass not found' });

    res.json({ booking });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch digital ticket' });
  }
});

// GET /api/bookings/my-bookings
router.get('/my-bookings', (req, res) => {
  try {
    const { user_id, email, phone } = req.query;

    let query = `
      SELECT b.*, s.show_date, s.start_time, s.experience,
             m.title as movie_title, m.poster_url as movie_poster, m.certificate as movie_certificate,
             t.name as theatre_name, t.city as theatre_city, scr.name as screen_name
      FROM bookings b
      JOIN shows s ON b.show_id = s.id
      JOIN movies m ON s.movie_id = m.id
      JOIN theatres t ON s.theatre_id = t.id
      JOIN screens scr ON s.screen_id = scr.id
      WHERE 1=1
    `;
    const params = [];

    if (user_id) {
      query += ' AND (b.user_id = ? OR b.customer_email = (SELECT email FROM users WHERE id = ?))';
      params.push(user_id, user_id);
    } else if (email) {
      query += ' AND b.customer_email = ?';
      params.push(email);
    } else if (phone) {
      query += ' AND (b.customer_phone = ? OR b.whatsapp_number = ?)';
      params.push(phone, phone);
    }

    query += ' ORDER BY b.created_at DESC';
    const bookings = db.prepare(query).all(...params);

    res.json({ bookings });
  } catch (err) {
    console.error('My Bookings error:', err);
    res.status(500).json({ error: 'Failed to fetch user bookings' });
  }
});

// GET /api/bookings/whatsapp/:phone
router.get('/whatsapp/:phone', (req, res) => {
  try {
    const logs = db.prepare(`
      SELECT * FROM whatsapp_logs
      WHERE phone_number LIKE ?
      ORDER BY sent_at DESC LIMIT 10
    `).all(`%${req.params.phone.replace(/[^0-9]/g, '').slice(-10)}%`);

    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch WhatsApp logs' });
  }
});

module.exports = router;
