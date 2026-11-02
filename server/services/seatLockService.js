const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');

const HOLD_DURATION_MS = 5 * 60 * 1000; // 5 MINUTES EXACTLY

// Atomic Hold Cleanup: Delete any hold whose expires_at < now
function sweepExpiredHolds() {
  const now = Date.now();
  const stmt = db.prepare('DELETE FROM seat_holds WHERE expires_at <= ?');
  const result = stmt.run(now);
  return result.changes;
}

// Get comprehensive seat status map for a given show
function getShowSeatMap(showId, currentSessionId = null) {
  sweepExpiredHolds();

  // 1. Get all seats for the screen assigned to this show
  const show = db.prepare('SELECT screen_id FROM shows WHERE id = ?').get(showId);
  if (!show) throw new Error('Show not found');

  const allSeats = db.prepare(`
    SELECT id, seat_number, row_label, col_number, seat_tier, seat_type, couple_pair_id, base_price
    FROM seats
    WHERE screen_id = ?
    ORDER BY row_label ASC, col_number ASC
  `).all(show.screen_id);

  // 2. Get booked seats for this show
  const bookedSeats = db.prepare(`
    SELECT bs.seat_id
    FROM booking_seats bs
    JOIN bookings b ON bs.booking_id = b.id
    WHERE bs.show_id = ? AND b.payment_status = 'PAID'
  `).all(showId).map(r => r.seat_id);
  const bookedSet = new Set(bookedSeats);

  // 3. Get currently held seats for this show
  const now = Date.now();
  const heldRows = db.prepare(`
    SELECT seat_id, session_id, user_id, expires_at
    FROM seat_holds
    WHERE show_id = ? AND expires_at > ?
  `).all(showId, now);
  const heldMap = new Map();
  heldRows.forEach(h => {
    heldMap.set(h.seat_id, h);
  });

  // 4. Get manager-blocked seats for this show
  const blockedRows = db.prepare(`
    SELECT seat_id, reason FROM blocked_seats WHERE show_id = ?
  `).all(showId);
  const blockedMap = new Map();
  blockedRows.forEach(b => {
    blockedMap.set(b.seat_id, b.reason);
  });

  // Build annotated seat list
  const annotatedSeats = allSeats.map(seat => {
    let status = 'AVAILABLE';
    let expiresAt = null;
    let remainingSeconds = 0;
    let isCurrentSession = false;

    if (bookedSet.has(seat.id)) {
      status = 'BOOKED';
    } else if (blockedMap.has(seat.id)) {
      status = 'BLOCKED';
    } else if (heldMap.has(seat.id)) {
      const hold = heldMap.get(seat.id);
      expiresAt = hold.expires_at;
      remainingSeconds = Math.max(0, Math.floor((hold.expires_at - now) / 1000));
      if (currentSessionId && hold.session_id === currentSessionId) {
        status = 'SELECTED'; // Held by this user
        isCurrentSession = true;
      } else {
        status = 'HELD'; // Held by another user
      }
    }

    return {
      ...seat,
      status,
      expiresAt,
      remainingSeconds,
      isCurrentSession
    };
  });

  return annotatedSeats;
}

// Atomic Hold Seats Transaction
function holdSeats(showId, seatIds, sessionId, userId = null) {
  sweepExpiredHolds();
  const now = Date.now();
  const expiresAt = now + HOLD_DURATION_MS;

  const tx = db.transaction(() => {
    // 1. Check if show exists and is active
    const show = db.prepare('SELECT id, status FROM shows WHERE id = ?').get(showId);
    if (!show || show.status !== 'ACTIVE') {
      return { success: false, error: 'Show is not active or does not exist' };
    }

    // 2. Check if any seat is already booked
    const bookedQuery = db.prepare(`
      SELECT bs.seat_id
      FROM booking_seats bs
      JOIN bookings b ON bs.booking_id = b.id
      WHERE bs.show_id = ? AND bs.seat_id IN (${seatIds.map(() => '?').join(',')}) AND b.payment_status = 'PAID'
    `);
    const conflictBooked = bookedQuery.all(showId, ...seatIds);
    if (conflictBooked.length > 0) {
      return { success: false, error: 'One or more seats have already been booked', conflictSeats: conflictBooked.map(c => c.seat_id) };
    }

    // 3. Check if any seat is blocked by manager
    const blockedQuery = db.prepare(`
      SELECT seat_id FROM blocked_seats WHERE show_id = ? AND seat_id IN (${seatIds.map(() => '?').join(',')})
    `);
    const conflictBlocked = blockedQuery.all(showId, ...seatIds);
    if (conflictBlocked.length > 0) {
      return { success: false, error: 'One or more seats are reserved/blocked by theatre management', conflictSeats: conflictBlocked.map(c => c.seat_id) };
    }

    // 4. Check if any seat is held by someone ELSE
    const heldQuery = db.prepare(`
      SELECT seat_id, session_id FROM seat_holds
      WHERE show_id = ? AND expires_at > ? AND seat_id IN (${seatIds.map(() => '?').join(',')})
    `);
    const conflictHeld = heldQuery.all(showId, now, ...seatIds);
    const heldByOthers = conflictHeld.filter(h => h.session_id !== sessionId);
    if (heldByOthers.length > 0) {
      return { success: false, error: 'One or more seats are currently held by another customer', conflictSeats: heldByOthers.map(c => c.seat_id) };
    }

    // 5. Release any existing holds by THIS session for seats NOT in the new list for this show
    const deleteOldHolds = db.prepare(`
      DELETE FROM seat_holds
      WHERE show_id = ? AND session_id = ? AND seat_id NOT IN (${seatIds.length > 0 ? seatIds.map(() => '?').join(',') : "''"})
    `);
    if (seatIds.length > 0) {
      deleteOldHolds.run(showId, sessionId, ...seatIds);
    } else {
      db.prepare('DELETE FROM seat_holds WHERE show_id = ? AND session_id = ?').run(showId, sessionId);
    }

    // 6. Insert / refresh hold for the requested seats
    const insertHold = db.prepare(`
      INSERT OR REPLACE INTO seat_holds (id, show_id, seat_id, user_id, session_id, held_at, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const seatId of seatIds) {
      const holdId = uuidv4();
      insertHold.run(holdId, showId, seatId, userId, sessionId, now, expiresAt);
    }

    return {
      success: true,
      heldSeats: seatIds,
      expiresAt,
      holdDurationMs: HOLD_DURATION_MS
    };
  });

  return tx();
}

// Release holds for a session
function releaseSeats(showId, sessionId, seatIds = null) {
  if (seatIds && seatIds.length > 0) {
    const stmt = db.prepare(`
      DELETE FROM seat_holds
      WHERE show_id = ? AND session_id = ? AND seat_id IN (${seatIds.map(() => '?').join(',')})
    `);
    stmt.run(showId, sessionId, ...seatIds);
  } else {
    const stmt = db.prepare('DELETE FROM seat_holds WHERE show_id = ? AND session_id = ?');
    stmt.run(showId, sessionId);
  }
  return { success: true };
}

// Check if seats are actively held by session for booking confirmation
function verifySeatsHeldForBooking(showId, seatIds, sessionId) {
  sweepExpiredHolds();
  const now = Date.now();

  const holds = db.prepare(`
    SELECT seat_id FROM seat_holds
    WHERE show_id = ? AND session_id = ? AND expires_at > ? AND seat_id IN (${seatIds.map(() => '?').join(',')})
  `).all(showId, sessionId, now, ...seatIds);

  return holds.length === seatIds.length;
}

module.exports = {
  HOLD_DURATION_MS,
  sweepExpiredHolds,
  getShowSeatMap,
  holdSeats,
  releaseSeats,
  verifySeatsHeldForBooking
};
