const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'cineaura.db');
const db = new Database(dbPath);

// Enable WAL mode for high concurrency and foreign keys
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initSchema() {
  db.exec(`
    -- Districts
    CREATE TABLE IF NOT EXISTS districts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      state TEXT NOT NULL DEFAULT 'Tamil Nadu'
    );

    -- Theatres
    CREATE TABLE IF NOT EXISTS theatres (
      id TEXT PRIMARY KEY,
      district_id TEXT NOT NULL,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      pin_code TEXT,
      facilities TEXT, -- JSON array
      rating REAL DEFAULT 4.5,
      image_url TEXT,
      FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE CASCADE
    );

    -- Screens
    CREATE TABLE IF NOT EXISTS screens (
      id TEXT PRIMARY KEY,
      theatre_id TEXT NOT NULL,
      name TEXT NOT NULL,
      total_seats INTEGER NOT NULL DEFAULT 64,
      experience TEXT NOT NULL DEFAULT 'Standard', -- Standard, IMAX, 4DX, Dolby Atmos, Premium
      FOREIGN KEY (theatre_id) REFERENCES theatres(id) ON DELETE CASCADE
    );

    -- Seats
    CREATE TABLE IF NOT EXISTS seats (
      id TEXT PRIMARY KEY,
      screen_id TEXT NOT NULL,
      seat_number TEXT NOT NULL,
      row_label TEXT NOT NULL,
      col_number INTEGER NOT NULL,
      seat_tier TEXT NOT NULL DEFAULT 'Executive', -- Normal, Executive, VIP
      seat_type TEXT NOT NULL DEFAULT 'SINGLE', -- SINGLE, COUPLE, FRIENDS, FAMILY
      couple_pair_id TEXT, -- Pairs with another seat if COUPLE
      base_price REAL NOT NULL DEFAULT 190.0,
      FOREIGN KEY (screen_id) REFERENCES screens(id) ON DELETE CASCADE
    );

    -- Movies
    CREATE TABLE IF NOT EXISTS movies (
      id TEXT PRIMARY KEY,
      tmdb_id INTEGER,
      title TEXT NOT NULL,
      tagline TEXT,
      poster_url TEXT NOT NULL,
      backdrop_url TEXT NOT NULL,
      trailer_url TEXT,
      language TEXT NOT NULL,
      secondary_languages TEXT, -- JSON array
      genres TEXT NOT NULL, -- JSON array
      duration_mins INTEGER NOT NULL,
      certificate TEXT NOT NULL, -- U, U/A 13+, U/A 16+, A
      rating REAL NOT NULL DEFAULT 8.0,
      vote_count INTEGER DEFAULT 1200,
      overview TEXT NOT NULL,
      director TEXT,
      cast_members TEXT, -- JSON array: [{ name, role, photo }]
      release_date TEXT,
      mood_tags TEXT, -- JSON array
      vibe_tags TEXT, -- JSON array
      travel_tags TEXT, -- JSON array
      is_active INTEGER NOT NULL DEFAULT 1
    );

    -- Shows
    CREATE TABLE IF NOT EXISTS shows (
      id TEXT PRIMARY KEY,
      movie_id TEXT NOT NULL,
      theatre_id TEXT NOT NULL,
      screen_id TEXT NOT NULL,
      show_date TEXT NOT NULL, -- YYYY-MM-DD
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      language TEXT NOT NULL,
      experience TEXT NOT NULL DEFAULT 'Standard',
      ticket_price REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, CANCELLED, COMPLETED
      FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
      FOREIGN KEY (theatre_id) REFERENCES theatres(id) ON DELETE CASCADE,
      FOREIGN KEY (screen_id) REFERENCES screens(id) ON DELETE CASCADE
    );

    -- Seat Holds (CRITICAL 5-minute Hold)
    CREATE TABLE IF NOT EXISTS seat_holds (
      id TEXT PRIMARY KEY,
      show_id TEXT NOT NULL,
      seat_id TEXT NOT NULL,
      user_id TEXT,
      session_id TEXT NOT NULL,
      held_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      UNIQUE(show_id, seat_id),
      FOREIGN KEY (show_id) REFERENCES shows(id) ON DELETE CASCADE,
      FOREIGN KEY (seat_id) REFERENCES seats(id) ON DELETE CASCADE
    );

    -- Blocked Seats (Manager Blocks)
    CREATE TABLE IF NOT EXISTS blocked_seats (
      id TEXT PRIMARY KEY,
      show_id TEXT NOT NULL,
      seat_id TEXT NOT NULL,
      blocked_by TEXT,
      reason TEXT DEFAULT 'Manager Reserved',
      blocked_at INTEGER NOT NULL,
      UNIQUE(show_id, seat_id),
      FOREIGN KEY (show_id) REFERENCES shows(id) ON DELETE CASCADE,
      FOREIGN KEY (seat_id) REFERENCES seats(id) ON DELETE CASCADE
    );

    -- Users (Customer, Theatre Manager, Theatre Employee)
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer', -- customer, manager, employee
      phone TEXT,
      district_id TEXT DEFAULT 'chennai',
      created_at INTEGER NOT NULL
    );

    -- Bookings
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      booking_reference TEXT UNIQUE NOT NULL,
      show_id TEXT NOT NULL,
      user_id TEXT,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      whatsapp_number TEXT NOT NULL,
      seat_names TEXT NOT NULL,
      seat_ids TEXT NOT NULL, -- JSON array
      seat_type TEXT NOT NULL DEFAULT 'SINGLE',
      subtotal REAL NOT NULL,
      tax_amount REAL NOT NULL,
      convenience_fee REAL NOT NULL,
      total_amount REAL NOT NULL,
      payment_status TEXT NOT NULL DEFAULT 'PAID', -- PAID, FAILED, REFUNDED
      payment_id TEXT,
      payment_method TEXT NOT NULL DEFAULT 'UPI', -- UPI, CARD, NETBANKING
      qr_token TEXT UNIQUE NOT NULL,
      qr_code_image TEXT, -- Base64
      verification_status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, CHECKED_IN, CANCELLED
      checked_in_at INTEGER,
      checked_in_by TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (show_id) REFERENCES shows(id) ON DELETE CASCADE
    );

    -- Booking Seats
    CREATE TABLE IF NOT EXISTS booking_seats (
      id TEXT PRIMARY KEY,
      booking_id TEXT NOT NULL,
      show_id TEXT NOT NULL,
      seat_id TEXT NOT NULL,
      seat_number TEXT NOT NULL,
      price REAL NOT NULL,
      UNIQUE(show_id, seat_id),
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
      FOREIGN KEY (show_id) REFERENCES shows(id) ON DELETE CASCADE,
      FOREIGN KEY (seat_id) REFERENCES seats(id) ON DELETE CASCADE
    );

    -- Watchlist
    CREATE TABLE IF NOT EXISTS watchlist (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      movie_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      UNIQUE(user_id, movie_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
    );

    -- Notifications
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'booking',
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- WhatsApp Dispatch Logs
    CREATE TABLE IF NOT EXISTS whatsapp_logs (
      id TEXT PRIMARY KEY,
      booking_id TEXT NOT NULL,
      phone_number TEXT NOT NULL,
      message_content TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'DELIVERED',
      sent_at INTEGER NOT NULL,
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
    );

    -- Indexes for lightning fast lookups
    CREATE INDEX IF NOT EXISTS idx_theatres_district ON theatres(district_id);
    CREATE INDEX IF NOT EXISTS idx_shows_movie ON shows(movie_id);
    CREATE INDEX IF NOT EXISTS idx_shows_theatre ON shows(theatre_id);
    CREATE INDEX IF NOT EXISTS idx_shows_date ON shows(show_date);
    CREATE INDEX IF NOT EXISTS idx_seat_holds_show ON seat_holds(show_id);
    CREATE INDEX IF NOT EXISTS idx_seat_holds_expires ON seat_holds(expires_at);
    CREATE INDEX IF NOT EXISTS idx_booking_seats_show ON booking_seats(show_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_ref ON bookings(booking_reference);
    CREATE INDEX IF NOT EXISTS idx_bookings_qr ON bookings(qr_token);
  `);
}

initSchema();

module.exports = db;
