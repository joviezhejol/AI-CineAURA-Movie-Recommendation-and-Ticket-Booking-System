const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');

const HOLD_DURATION_MS = 5 * 60 * 1000; // 5 MINUTES EXACTLY

// Atomic Hold Cleanup: Delete any hold whose expires_at <= now
async function sweepExpiredHolds() {
  const now = Date.now();
  const result = await db.execute('DELETE FROM seat_holds WHERE expires_at <= $1', [now]);
  return result.rowCount || 0;
}

// Get comprehensive seat status map for a given show
async function getShowSeatMap(showId, currentSessionId = null) {
  await sweepExpiredHolds();

  // 1. Get all seats for the screen assigned to this show
  const show = await db.getOne('SELECT screen_id FROM shows WHERE id = $1', [showId]);
  if (!show) throw new Error('Show not found');

  const allSeats = await db.getAll(`
    SELECT id, seat_number, row_label, col_number, seat_tier, seat_type, couple_pair_id, base_price
    FROM seats
    WHERE screen_id = $1
    ORDER BY row_label ASC, col_number ASC
  `, [show.screen_id]);

  // 2. Get booked seats for this show
  const bookedSeatRows = await db.getAll(`
    SELECT bs.seat_id
    FROM booking_seats bs
    JOIN bookings b ON bs.booking_id = b.id
    WHERE bs.show_id = $1 AND b.payment_status = 'PAID'
  `, [showId]);
  const bookedSet = new Set(bookedSeatRows.map(r => r.seat_id));

  // 3. Get currently held seats for this show
  const now = Date.now();
  const heldRows = await db.getAll(`
    SELECT seat_id, session_id, user_id, expires_at
    FROM seat_holds
    WHERE show_id = $1 AND expires_at > $2
  `, [showId, now]);

  const heldMap = new Map();
  heldRows.forEach(h => {
    heldMap.set(h.seat_id, {
      ...h,
      expires_at: Number(h.expires_at)
    });
  });

  // 4. Get manager-blocked seats for this show
  const blockedRows = await db.getAll(`
    SELECT seat_id, reason FROM blocked_seats WHERE show_id = $1
  `, [showId]);
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
      base_price: Number(seat.base_price),
      status,
      expiresAt,
      remainingSeconds,
      isCurrentSession
    };
  });

  return annotatedSeats;
}

// Atomic Hold Seats Transaction
async function holdSeats(showId, seatIds, sessionId, userId = null) {
  await sweepExpiredHolds();
  const now = Date.now();
  const expiresAt = now + HOLD_DURATION_MS;

  return await db.withTransaction(async (tx) => {
    // 1. Check if show exists and is active
    const show = await tx.getOne('SELECT id, status FROM shows WHERE id = $1', [showId]);
    if (!show || show.status !== 'ACTIVE') {
      return { success: false, error: 'Show is not active or does not exist' };
    }

    if (seatIds.length > 0) {
      // Correct parameter numbering: $1 is showId, seatIds are $2, $3, ...
      const inPlaceholdersForShow = seatIds.map((_, i) => `$${i + 2}`).join(',');

      // 2. Check if any seat is already booked
      const bookedQuery = `
        SELECT bs.seat_id
        FROM booking_seats bs
        JOIN bookings b ON bs.booking_id = b.id
        WHERE bs.show_id = $1 AND bs.seat_id IN (${inPlaceholdersForShow}) AND b.payment_status = 'PAID'
      `;
      const conflictBooked = await tx.getAll(bookedQuery, [showId, ...seatIds]);
      if (conflictBooked.length > 0) {
        return { success: false, error: 'One or more seats have already been booked', conflictSeats: conflictBooked.map(c => c.seat_id) };
      }

      // 3. Check if any seat is blocked by manager
      const blockedQuery = `
        SELECT seat_id FROM blocked_seats WHERE show_id = $1 AND seat_id IN (${inPlaceholdersForShow})
      `;
      const conflictBlocked = await tx.getAll(blockedQuery, [showId, ...seatIds]);
      if (conflictBlocked.length > 0) {
        return { success: false, error: 'One or more seats are reserved/blocked by theatre management', conflictSeats: conflictBlocked.map(c => c.seat_id) };
      }

      // 4. Check if any seat is held by someone ELSE
      // $1: showId, $2: now, seatIds: $3, $4, ...
      const inPlaceholdersWithNow = seatIds.map((_, i) => `$${i + 3}`).join(',');
      const heldQuery = `
        SELECT seat_id, session_id FROM seat_holds
        WHERE show_id = $1 AND expires_at > $2 AND seat_id IN (${inPlaceholdersWithNow})
      `;
      const conflictHeld = await tx.getAll(heldQuery, [showId, now, ...seatIds]);
      const heldByOthers = conflictHeld.filter(h => h.session_id !== sessionId);
      if (heldByOthers.length > 0) {
        return { success: false, error: 'One or more seats are currently held by another customer', conflictSeats: heldByOthers.map(c => c.seat_id) };
      }

      // 5. Release any existing holds by THIS session for seats NOT in the new list for this show
      // $1: showId, $2: sessionId, seatIds: $3, $4, ...
      const notInPlaceholders = seatIds.map((_, i) => `$${i + 3}`).join(',');
      const deleteOldQuery = `
        DELETE FROM seat_holds
        WHERE show_id = $1 AND session_id = $2 AND seat_id NOT IN (${notInPlaceholders})
      `;
      await tx.execute(deleteOldQuery, [showId, sessionId, ...seatIds]);

      // 6. Insert / upsert hold for the requested seats
      for (const seatId of seatIds) {
        const holdId = uuidv4();
        if (db.isPostgres()) {
          const insertQuery = `
            INSERT INTO seat_holds (id, show_id, seat_id, user_id, session_id, held_at, expires_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (show_id, seat_id) DO UPDATE SET
              user_id = EXCLUDED.user_id,
              session_id = EXCLUDED.session_id,
              held_at = EXCLUDED.held_at,
              expires_at = EXCLUDED.expires_at
          `;
          await tx.execute(insertQuery, [holdId, showId, seatId, userId, sessionId, now, expiresAt]);
        } else {
          const insertQuery = `
            INSERT OR REPLACE INTO seat_holds (id, show_id, seat_id, user_id, session_id, held_at, expires_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `;
          await tx.execute(insertQuery, [holdId, showId, seatId, userId, sessionId, now, expiresAt]);
        }
      }
    } else {
      // Clear holds for session if empty seatIds
      await tx.execute('DELETE FROM seat_holds WHERE show_id = $1 AND session_id = $2', [showId, sessionId]);
    }

    return {
      success: true,
      heldSeats: seatIds,
      expiresAt,
      holdDurationMs: HOLD_DURATION_MS
    };
  });
}

// Release holds for a session
async function releaseSeats(showId, sessionId, seatIds = null) {
  if (seatIds && seatIds.length > 0) {
    // $1: showId, $2: sessionId, seatIds: $3, $4, ...
    const placeholders = seatIds.map((_, i) => `$${i + 3}`).join(',');
    const query = `
      DELETE FROM seat_holds
      WHERE show_id = $1 AND session_id = $2 AND seat_id IN (${placeholders})
    `;
    await db.execute(query, [showId, sessionId, ...seatIds]);
  } else {
    await db.execute('DELETE FROM seat_holds WHERE show_id = $1 AND session_id = $2', [showId, sessionId]);
  }
  return { success: true };
}

// Check if seats are actively held by session for booking confirmation
async function verifySeatsHeldForBooking(showId, seatIds, sessionId) {
  await sweepExpiredHolds();
  const now = Date.now();

  // $1: showId, $2: sessionId, $3: now, seatIds: $4, $5, ...
  const placeholders = seatIds.map((_, i) => `$${i + 4}`).join(',');
  const query = `
    SELECT seat_id FROM seat_holds
    WHERE show_id = $1 AND session_id = $2 AND expires_at > $3 AND seat_id IN (${placeholders})
  `;
  const holds = await db.getAll(query, [showId, sessionId, now, ...seatIds]);

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
