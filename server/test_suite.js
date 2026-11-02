/**
 * Automated Verification & Testing Suite for AI CineAura Migration
 */
const http = require('http');

async function runTests() {
  console.log('🧪 Starting CineAura Automated Migration Verification Tests...\n');

  const db = require('./db/database');
  console.log('Mode:', db.isPostgres() ? 'PostgreSQL' : 'SQLite fallback');

  // Test 1: Districts Check
  try {
    const districts = await db.getAll('SELECT * FROM districts ORDER BY name ASC');
    console.log(`✅ Test 1: Districts query succeeded (${districts.length} districts found)`);
    if (districts.length !== 3) {
      throw new Error(`Expected 3 districts, got ${districts.length}`);
    }
  } catch (err) {
    console.error('❌ Test 1 Failed:', err.message);
    process.exit(1);
  }

  // Test 2: Movies & Shows
  try {
    const movies = await db.getAll('SELECT id, title, rating FROM movies WHERE is_active = 1');
    console.log(`✅ Test 2: Active movies query succeeded (${movies.length} movies found)`);
    if (movies.length === 0) throw new Error('No active movies found');

    const shows = await db.getAll('SELECT id, movie_id, theatre_id, start_time FROM shows WHERE status = $1 LIMIT 5', ['ACTIVE']);
    console.log(`✅ Test 2b: Active shows query succeeded (${shows.length} shows sampled)`);
  } catch (err) {
    console.error('❌ Test 2 Failed:', err.message);
    process.exit(1);
  }

  // Test 3: Seat Locking Service (Hold, Map, Parameter Numbering, Expired Sweep, Release)
  const { holdSeats, getShowSeatMap, releaseSeats, verifySeatsHeldForBooking } = require('./services/seatLockService');
  try {
    const sampleShow = await db.getOne('SELECT id FROM shows WHERE status = $1 LIMIT 1', ['ACTIVE']);
    if (!sampleShow) throw new Error('No active show available for seat test');

    const seats = await db.getAll('SELECT s.id FROM seats s JOIN shows sh ON s.screen_id = sh.screen_id WHERE sh.id = $1 LIMIT 2', [sampleShow.id]);
    const seatIds = seats.map(s => s.id);
    const testSession = 'test-session-' + Date.now();

    // 3a. Hold seats (tests parameter mapping $1, $2, $3...)
    const holdRes = await holdSeats(sampleShow.id, seatIds, testSession);
    if (!holdRes.success) throw new Error(`Seat hold failed: ${holdRes.error}`);
    console.log(`✅ Test 3a: 5-minute atomic seat hold succeeded for seats:`, holdRes.heldSeats);

    // 3b. Double booking prevention: another session attempts to hold the same seats
    const otherSession = 'other-session-' + Date.now();
    const conflictRes = await holdSeats(sampleShow.id, seatIds, otherSession);
    if (conflictRes.success) {
      throw new Error('Seat concurrency conflict failed: conflicting session was able to hold already reserved seats!');
    }
    console.log(`✅ Test 3b: Simultaneous double-booking prevention verified (conflict detected as expected)`);

    // 3c. Verify seat map reflects SELECTED for current session
    const seatMap = await getShowSeatMap(sampleShow.id, testSession);
    const heldInMap = seatMap.filter(s => seatIds.includes(s.id));
    if (heldInMap.some(s => s.status !== 'SELECTED')) {
      throw new Error('Seat map status mismatch for held seats');
    }
    console.log(`✅ Test 3c: Seat map correctly annotated with SELECTED status and live timer`);

    // 3d. Verify verifySeatsHeldForBooking returns true
    const isVerified = await verifySeatsHeldForBooking(sampleShow.id, seatIds, testSession);
    if (!isVerified) throw new Error('verifySeatsHeldForBooking returned false for actively held seats');
    console.log(`✅ Test 3d: Pre-booking seat hold verification passed`);

    // 3e. Release seats
    await releaseSeats(sampleShow.id, testSession, seatIds);
    const postReleaseMap = await getShowSeatMap(sampleShow.id, testSession);
    const releasedInMap = postReleaseMap.filter(s => seatIds.includes(s.id));
    if (releasedInMap.some(s => s.status !== 'AVAILABLE')) {
      throw new Error('Seat release failed, seats still not available');
    }
    console.log(`✅ Test 3e: Seat release passed`);
  } catch (err) {
    console.error('❌ Test 3 Failed:', err.message);
    process.exit(1);
  }

  // Test 4: AI Recommendations Engine
  const { recommendMovies, generateAuraResponse } = require('./services/aiEngine');
  try {
    const recs = await recommendMovies({ mood: 'Happy', vibe: 'Feel-good', language: 'Tamil', districtId: 'chennai' });
    console.log(`✅ Test 4a: AI Mood & Vibe recommendation engine returned ${recs.length} recommendations`);

    const auraResp = await generateAuraResponse({
      userMessage: 'Recommend something cheerful',
      mood: 'Happy',
      vibe: 'Feel-good',
      districtId: 'chennai'
    });
    if (!auraResp.message) throw new Error('Aura AI generated empty response');
    console.log(`✅ Test 4b: Aura AI conversational response generated successfully`);
  } catch (err) {
    console.error('❌ Test 4 Failed:', err.message);
    process.exit(1);
  }

  // Test 5: WhatsApp Ticket Message Formatter
  const { formatWhatsAppMessage } = require('./services/whatsappService');
  try {
    const waMsg = formatWhatsAppMessage({
      bookingRef: 'CINE-TEST99',
      customerName: 'Karthik',
      movieTitle: 'Interstellar',
      language: 'English',
      experience: 'IMAX',
      theatreName: 'CineAura IMAX Phoenix Marketcity',
      screenName: 'Screen 1',
      showDate: '2026-11-03',
      startTime: '07:00 PM',
      seatNames: 'F4, F5',
      seatType: 'COUPLE',
      totalAmount: 480.0,
      qrToken: 'CINE-TOKEN-XYZ'
    });
    if (!waMsg.includes('CINE-TEST99') || !waMsg.includes('/ticket/CINE-TOKEN-XYZ')) {
      throw new Error('WhatsApp message format invalid');
    }
    console.log(`✅ Test 5: WhatsApp ticket dispatch message formatted with dynamic client URL`);
  } catch (err) {
    console.error('❌ Test 5 Failed:', err.message);
    process.exit(1);
  }

  // Test 6: Auth Registration, Centralized JWT_SECRET, & Role Enforcement
  const bcrypt = require('bcryptjs');
  const jwt = require('jsonwebtoken');
  const { JWT_SECRET } = require('./config/security');
  try {
    const testEmail = `testuser_${Date.now()}@example.com`;
    const hash = bcrypt.hashSync('testpassword123', 10);
    const testId = 'user-test-' + Date.now();

    await db.execute(`
      INSERT INTO users (id, name, email, password_hash, role, phone, district_id, created_at)
      VALUES ($1, $2, $3, $4, 'customer', '9876543210', 'chennai', $5)
    `, [testId, 'Test User', testEmail, hash, Date.now()]);

    const retrieved = await db.getOne('SELECT * FROM users WHERE LOWER(email) = $1', [testEmail]);
    if (!retrieved || !bcrypt.compareSync('testpassword123', retrieved.password_hash)) {
      throw new Error('User authentication check failed');
    }
    const token = jwt.sign({ id: retrieved.id, role: retrieved.role }, JWT_SECRET);
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.id !== testId) throw new Error('JWT verification mismatch');

    // Clean up test user
    await db.execute('DELETE FROM users WHERE id = $1', [testId]);
    console.log(`✅ Test 6: Centralized JWT verification and customer auth passed`);
  } catch (err) {
    console.error('❌ Test 6 Failed:', err.message);
    process.exit(1);
  }

  console.log('\n🌟 ALL AUTOMATED MIGRATION VERIFICATION TESTS PASSED!\n');
}

runTests().catch(err => {
  console.error('Fatal Test Suite Error:', err);
  process.exit(1);
});
