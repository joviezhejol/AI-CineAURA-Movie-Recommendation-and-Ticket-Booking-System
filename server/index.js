const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const { sweepExpiredHolds } = require('./services/seatLockService');
const authRoutes = require('./routes/auth');
const moviesRoutes = require('./routes/movies');
const theatresRoutes = require('./routes/theatres');
const showsRoutes = require('./routes/shows');
const holdsRoutes = require('./routes/holds');
const bookingsRoutes = require('./routes/bookings');
const aiRoutes = require('./routes/ai');
const managerRoutes = require('./routes/manager');
const employeeRoutes = require('./routes/employee');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Attach Socket.IO to express app for routes to access
app.set('io', io);

// Configure CORS
app.use(cors({
  origin: '*',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/movies', moviesRoutes);
app.use('/api/theatres', theatresRoutes);
app.use('/api/shows', showsRoutes);
app.use('/api/holds', holdsRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/employee', employeeRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'AI CineAura',
    tagline: 'Stories That Made for You',
    port: process.env.PORT || 5005,
    nodeEnv: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Real-Time Socket.IO Handling
io.on('connection', (socket) => {
  // Join a show room to receive live seat updates
  socket.on('join_show', (showId) => {
    socket.join(`show_${showId}`);
  });

  socket.on('leave_show', (showId) => {
    socket.leave(`show_${showId}`);
  });

  socket.on('disconnect', () => {
    // Client disconnected
  });
});

// Periodic background hold cleanup job (every 10 seconds)
setInterval(async () => {
  try {
    const expiredCount = await sweepExpiredHolds();
    if (expiredCount > 0) {
      // Broadcast global event so any open show can re-fetch
      io.emit('holds_expired_sweep', { count: expiredCount });
    }
  } catch (err) {
    console.error('Hold sweep error:', err.message);
  }
}, 10000);

// Serve static client assets in production if built
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDistPath));

// Fallback for SPA routing in production
app.use((req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
    return next();
  }
  const indexPath = path.join(clientDistPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(200).send(`
        <html>
          <head><title>AI CineAura Backend</title></head>
          <body style="background:#080b12; color:#fff; font-family:sans-serif; text-align:center; padding:50px;">
            <h1 style="color:#f5a623;">AI CineAura API Server is running</h1>
            <p>Stories That Made for You.</p>
            <p>Vite client is running on <a href="http://localhost:5173" style="color:#38bdf8;">http://localhost:5173</a></p>
          </body>
        </html>
      `);
    }
  });
});

const PORT = process.env.PORT || 5005;
server.listen(PORT, () => {
  console.log(`🎬 AI CineAura Server running on port ${PORT}`);
  console.log(`📍 Districts supported: Chennai, Chengalpattu, Kanchipuram`);
  console.log(`🤖 Aura AI Assistant initialized`);
});
