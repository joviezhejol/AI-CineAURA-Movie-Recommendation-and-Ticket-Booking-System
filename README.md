# AI CineAura — "Stories That Made for You"

A complete, fully functional, commercial-grade movie ticket booking platform built with dark cinematic design, real-time WebSocket seat locking, AI-powered mood discovery, QR gate validation, and authentic WhatsApp confirmations.

---

## 🌟 Key Highlights & Design Reference Fidelity

Inspired by the CineAura design specification, this application delivers:
- **Cinematic Dark Navigation & Palette**: Deep space navy-black surfaces (`#080b12`, `#0f172a`), luxury gold accents (`#f59e0b`), and purple/blue AI glows.
- **Hero Showcase & Carousel**: Featured blockbusters with rating, certificate, duration, language, and direct actions.
- **Aura AI Intelligent Assistant**:
  - Mood System (11 options: Happy, Sad, Romantic, Excited, Relaxed, Energetic, Emotional, Adventurous, Scared, Motivated, Bored)
  - Vibe System (12 options: Feel-good, Mass, Chill, Romantic, Family, Thriller, Comedy, Action, Emotional, Mind-bending, Fun, Adventure)
  - Travel Mood (8 options: Long journey, Short trip, Night drive, Weekend outing, Family trip, Friends trip, Solo travel, Relaxing travel)
  - **Mood Protection**: Empathetically supports users in a sad mood by recommending uplifting/comforting movies instead of depressing ones.
  - **Spoiler Protection**: Zero plot-spoilers guaranteed.
  - **Content-Based Filtering & Anti-Hallucination**: Recommendations match real metadata from active CineAura database shows.
- **District Restriction (Tamil Nadu)**:
  - **Chennai**
  - **Chengalpattu**
  - **Kanchipuram**
  - *Selecting a district strictly filters active theatres, screens, shows, and movies.*
- **Mandatory 5-Minute Server-Side Atomic Seat Lock**:
  - Powered by SQLite ACID transactions in WAL mode.
  - Live countdown timer (`05:00` → `00:00`).
  - Real-time updates pushed via **Socket.IO** so any other customer viewing the seat map sees held seats lock immediately.
  - Automatic expiration and sweep.
- **Seat Types**: Single (1 seat), Couple (linked 2-seat pairs in VIP lounge rows), Friends (multiple adjacent seats), and Family rows.
- **Checkout, Real QR Code & Thermal Pass**:
  - Payment gateway simulation (UPI with VPA, Credit/Debit card, Netbanking).
  - Authentic QR code generated with `qrcode` containing unique cryptographic ticket tokens.
  - Printable / Downloadable thermal ticket format with tax breakdown (Subtotal, Convenience fee, 18% GST).
- **Simulated WhatsApp Pass Dispatch**:
  - Logs actual messages to the database and displays an authentic smartphone WhatsApp chat mockup.

---

## 👥 Three Dedicated Login Roles & Demo Accounts

Use the **Role Portal Switcher** in the header to switch roles with a single click, or log in using these credentials:

| Role | Email | Password | Permissions & Features |
| :--- | :--- | :--- | :--- |
| **Customer** | `customer@cineaura.com` | `password123` | Browse, Aura AI, 5-min seat hold, pay, get QR passes, WhatsApp confirmation, profile & history. |
| **Theatre Manager** | `manager@cineaura.com` | `password123` | Analytics dashboard (Revenue, Bookings, Occupancy), Show management (Add/Cancel), **Seat Blocking & Release** tool. |
| **Theatre Employee** | `employee@cineaura.com` | `password123` | Today's shows, booking search, **Live Gate QR Scanner / Check-in tool**, seat occupancy checker. |

---

## 🛠️ Technology Stack

- **Backend**: Node.js, Express 5, `better-sqlite3` (SQLite with WAL mode and foreign keys), `socket.io`, `qrcode`, `bcryptjs`, `jsonwebtoken`.
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React icons, Canvas Confetti.
- **Database**: `cineaura.db` with relational schema for districts, theatres, screens, seats, movies, shows, seat holds, bookings, booking seats, blocked seats, users, and WhatsApp logs.

---

## 🚀 Running the Application

### 1. Start Backend & Static Server (Port 5005)
```bash
npm start
```
The application will be accessible at:
👉 **http://localhost:5005**

### 2. Optional: Run Client in Vite Dev Mode (Port 5173 with HMR)
```bash
npm run dev:client
```
👉 **http://localhost:5173** (proxies `/api` and `/socket.io` to `http://localhost:5005`)

### 3. Re-seed Database
```bash
npm run seed
```

---

## 📍 Supported Locations
1. **Chennai** (e.g. CineAura IMAX Phoenix Marketcity, CineAura Palazzo Nexus Vijaya, CineAura Escape Express Avenue)
2. **Chengalpattu** (e.g. CineAura Grand Marina, CineAura VGP Cineplex)
3. **Kanchipuram** (e.g. CineAura Heritage Cineplex, CineAura Silk City Cinemas)

---

## 🛡️ Double Booking & Concurrency Protection

- Seat locking is enforced on the database level using atomic transactions (`BEGIN IMMEDIATE`).
- A seat cannot be held if it is already booked, blocked by a theatre manager, or held by another active session with `expires_at > Date.now()`.
- Expired holds are cleared automatically on access and by a background interval every 10 seconds.
- Every payment confirmation re-verifies that the seats are still held by the active session before transitioning `HELD` → `BOOKED`.
