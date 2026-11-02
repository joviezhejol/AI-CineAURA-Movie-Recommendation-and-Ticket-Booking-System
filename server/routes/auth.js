const express = require('express');
const router = express.Router();
const db = require('../db/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { JWT_SECRET, IS_PRODUCTION } = require('../config/security');

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, district_id = 'chennai' } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await db.getOne('SELECT id FROM users WHERE LOWER(email) = $1', [cleanEmail]);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const userId = uuidv4();
    const hash = bcrypt.hashSync(password, 10);
    const now = Date.now();

    await db.execute(`
      INSERT INTO users (id, name, email, password_hash, role, phone, district_id, created_at)
      VALUES ($1, $2, $3, $4, 'customer', $5, $6, $7)
    `, [userId, name, cleanEmail, hash, phone || '', district_id, now]);

    const token = jwt.sign({ id: userId, email: cleanEmail, role: 'customer', name }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      user: { id: userId, name, email: cleanEmail, role: 'customer', phone, district_id },
      token
    });
  } catch (err) {
    console.error('Register Error:', err);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await db.getOne('SELECT * FROM users WHERE LOWER(email) = $1', [cleanEmail]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const match = bcrypt.compareSync(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name, district_id: user.district_id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        district_id: user.district_id
      },
      token
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await db.getOne('SELECT id, name, email, role, phone, district_id, created_at FROM users WHERE id = $1', [req.user.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// POST /api/auth/switch-role (Strictly guarded role switcher)
router.post('/switch-role', async (req, res) => {
  try {
    const { role } = req.body;
    if (!['customer', 'manager', 'employee'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // In production, unauthenticated arbitrary role escalation is strictly blocked
    if (IS_PRODUCTION && role !== 'customer') {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      if (!token) {
        return res.status(403).json({ error: 'Role switching to staff accounts is disabled in production without prior authorization.' });
      }
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'manager' && decoded.role !== role) {
          return res.status(403).json({ error: 'Insufficient authorization to switch to this role.' });
        }
      } catch (err) {
        return res.status(403).json({ error: 'Invalid authentication credentials.' });
      }
    }

    const targetEmail = `${role}@cineaura.com`;
    let user = await db.getOne('SELECT * FROM users WHERE LOWER(email) = $1', [targetEmail.toLowerCase()]);

    if (!user) {
      user = await db.getOne('SELECT * FROM users WHERE role = $1 LIMIT 1', [role]);
    }

    if (!user) {
      return res.status(404).json({ error: `No account found for ${role}` });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name, district_id: user.district_id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        district_id: user.district_id
      },
      token
    });
  } catch (err) {
    console.error('Role Switch Error:', err);
    res.status(500).json({ error: 'Role switch failed' });
  }
});

// GET /api/auth/notifications
router.get('/notifications', authenticateToken, async (req, res) => {
  try {
    const notifs = await db.getAll('SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20', [req.user.id]);
    res.json({ notifications: notifs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load notifications' });
  }
});

module.exports = router;
module.exports.authenticateToken = authenticateToken;
