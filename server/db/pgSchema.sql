-- AI CineAura PostgreSQL Database Schema
-- Complete, strict relational schema strictly aligned with SQLite schema in server/db/database.js

-- 1. Districts
CREATE TABLE IF NOT EXISTS districts (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  state VARCHAR(128) NOT NULL DEFAULT 'Tamil Nadu'
);

-- 2. Theatres
CREATE TABLE IF NOT EXISTS theatres (
  id VARCHAR(64) PRIMARY KEY,
  district_id VARCHAR(64) NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(128) NOT NULL,
  pin_code VARCHAR(20),
  facilities TEXT, -- JSON array
  rating REAL DEFAULT 4.5,
  image_url TEXT
);

-- 3. Screens
CREATE TABLE IF NOT EXISTS screens (
  id VARCHAR(64) PRIMARY KEY,
  theatre_id VARCHAR(64) NOT NULL REFERENCES theatres(id) ON DELETE CASCADE,
  name VARCHAR(128) NOT NULL,
  total_seats INTEGER NOT NULL DEFAULT 64,
  experience VARCHAR(64) NOT NULL DEFAULT 'Standard' -- Standard, IMAX, 4DX, Dolby Atmos, Premium
);

-- 4. Seats
CREATE TABLE IF NOT EXISTS seats (
  id VARCHAR(64) PRIMARY KEY,
  screen_id VARCHAR(64) NOT NULL REFERENCES screens(id) ON DELETE CASCADE,
  seat_number VARCHAR(16) NOT NULL,
  row_label VARCHAR(8) NOT NULL,
  col_number INTEGER NOT NULL,
  seat_tier VARCHAR(32) NOT NULL DEFAULT 'Executive', -- Normal, Executive, VIP
  seat_type VARCHAR(32) NOT NULL DEFAULT 'SINGLE', -- SINGLE, COUPLE, FRIENDS, FAMILY
  couple_pair_id VARCHAR(64),
  base_price REAL NOT NULL DEFAULT 190.0
);

-- 5. Movies
CREATE TABLE IF NOT EXISTS movies (
  id VARCHAR(64) PRIMARY KEY,
  tmdb_id INTEGER,
  title VARCHAR(255) NOT NULL,
  tagline TEXT,
  poster_url TEXT NOT NULL,
  backdrop_url TEXT NOT NULL,
  trailer_url TEXT,
  language VARCHAR(64) NOT NULL,
  secondary_languages TEXT, -- JSON array
  genres TEXT NOT NULL, -- JSON array
  duration_mins INTEGER NOT NULL,
  certificate VARCHAR(16) NOT NULL, -- U, U/A 13+, U/A 16+, A
  rating REAL NOT NULL DEFAULT 8.0,
  vote_count INTEGER DEFAULT 1200,
  overview TEXT NOT NULL,
  director VARCHAR(128),
  cast_members TEXT, -- JSON array
  release_date VARCHAR(32),
  mood_tags TEXT, -- JSON array
  vibe_tags TEXT, -- JSON array
  travel_tags TEXT, -- JSON array
  is_active INTEGER NOT NULL DEFAULT 1
);

-- 6. Shows
CREATE TABLE IF NOT EXISTS shows (
  id VARCHAR(64) PRIMARY KEY,
  movie_id VARCHAR(64) NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  theatre_id VARCHAR(64) NOT NULL REFERENCES theatres(id) ON DELETE CASCADE,
  screen_id VARCHAR(64) NOT NULL REFERENCES screens(id) ON DELETE CASCADE,
  show_date VARCHAR(16) NOT NULL, -- YYYY-MM-DD
  start_time VARCHAR(16) NOT NULL,
  end_time VARCHAR(16) NOT NULL,
  language VARCHAR(64) NOT NULL,
  experience VARCHAR(64) NOT NULL DEFAULT 'Standard',
  ticket_price REAL NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE' -- ACTIVE, CANCELLED, COMPLETED
);

-- 7. Seat Holds (5-minute server-side atomic lock)
CREATE TABLE IF NOT EXISTS seat_holds (
  id VARCHAR(64) PRIMARY KEY,
  show_id VARCHAR(64) NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  seat_id VARCHAR(64) NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
  user_id VARCHAR(64),
  session_id VARCHAR(128) NOT NULL,
  held_at BIGINT NOT NULL,
  expires_at BIGINT NOT NULL,
  CONSTRAINT uq_show_seat_hold UNIQUE(show_id, seat_id)
);

-- 8. Blocked Seats (Manager reserved)
CREATE TABLE IF NOT EXISTS blocked_seats (
  id VARCHAR(64) PRIMARY KEY,
  show_id VARCHAR(64) NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  seat_id VARCHAR(64) NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
  blocked_by VARCHAR(128),
  reason VARCHAR(255) DEFAULT 'Manager Reserved',
  blocked_at BIGINT NOT NULL,
  CONSTRAINT uq_show_seat_block UNIQUE(show_id, seat_id)
);

-- 9. Users
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'customer', -- customer, manager, employee
  phone VARCHAR(32),
  district_id VARCHAR(64) DEFAULT 'chennai',
  created_at BIGINT NOT NULL
);

-- 10. Bookings
CREATE TABLE IF NOT EXISTS bookings (
  id VARCHAR(64) PRIMARY KEY,
  booking_reference VARCHAR(64) UNIQUE NOT NULL,
  show_id VARCHAR(64) NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  user_id VARCHAR(64),
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(32) NOT NULL,
  whatsapp_number VARCHAR(32) NOT NULL,
  seat_names TEXT NOT NULL,
  seat_ids TEXT NOT NULL, -- JSON array
  seat_type VARCHAR(32) NOT NULL DEFAULT 'SINGLE',
  subtotal REAL NOT NULL,
  tax_amount REAL NOT NULL,
  convenience_fee REAL NOT NULL,
  total_amount REAL NOT NULL,
  payment_status VARCHAR(32) NOT NULL DEFAULT 'PAID', -- PAID, FAILED, REFUNDED
  payment_id VARCHAR(128),
  payment_method VARCHAR(64) NOT NULL DEFAULT 'UPI',
  qr_token VARCHAR(128) UNIQUE NOT NULL,
  qr_code_image TEXT,
  verification_status VARCHAR(32) NOT NULL DEFAULT 'PENDING', -- PENDING, CHECKED_IN, CANCELLED
  checked_in_at BIGINT,
  checked_in_by VARCHAR(128),
  created_at BIGINT NOT NULL
);

-- 11. Booking Seats
CREATE TABLE IF NOT EXISTS booking_seats (
  id VARCHAR(64) PRIMARY KEY,
  booking_id VARCHAR(64) NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  show_id VARCHAR(64) NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  seat_id VARCHAR(64) NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
  seat_number VARCHAR(16) NOT NULL,
  price REAL NOT NULL,
  CONSTRAINT uq_show_seat_booked UNIQUE(show_id, seat_id)
);

-- 12. Watchlist
CREATE TABLE IF NOT EXISTS watchlist (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  movie_id VARCHAR(64) NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  created_at BIGINT NOT NULL,
  CONSTRAINT uq_user_movie_watchlist UNIQUE(user_id, movie_id)
);

-- 13. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(64) NOT NULL DEFAULT 'booking',
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at BIGINT NOT NULL
);

-- 14. WhatsApp Dispatch Logs
CREATE TABLE IF NOT EXISTS whatsapp_logs (
  id VARCHAR(64) PRIMARY KEY,
  booking_id VARCHAR(64) NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  phone_number VARCHAR(32) NOT NULL,
  message_content TEXT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'DELIVERED',
  sent_at BIGINT NOT NULL
);

-- Performance Indexes (Exact match to SQLite schema)
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
