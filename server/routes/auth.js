const express = require('express');
const router = express.Router();
const db = require('../db/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const JWT_SECRET = process.env.JWT_SECRET || 'cineaura_super_secret_jwt_key_2026';

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
router.post('/register', (req, res) => {
  try {
    const { name, email, password, phone, district_id = 'chennai' } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const userId = uuidv4();
    const hash = bcrypt.hashSync(password, 10);
    const now = Date.now();

    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, role, phone, district_id, created_at)
      VALUES (?, ?, ?, ?, 'customer', ?, ?, ?)
    `).run(userId, name, email, hash, phone || '', district_id, now);

    const token = jwt.sign({ id: userId, email, role: 'customer', name }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      user: { id: userId, name, email, role: 'customer', phone, district_id },
      token
    });
  } catch (err) {
    console.error('Register Error:', err);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
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
router.get('/me', authenticateToken, (req, res) => {
  try {
    const user = db.prepare('SELECT id, name, email, role, phone, district_id, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// POST /api/auth/switch-role (Convenience 1-click test role switcher)
router.post('/switch-role', (req, res) => {
  try {
    const { role } = req.body;
    if (!['customer', 'manager', 'employee'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const targetEmail = `${role}@cineaura.com`;
    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(targetEmail);

    if (!user) {
      user = db.prepare('SELECT * FROM users WHERE role = ? LIMIT 1').get(role);
    }

    if (!user) {
      return res.status(404).json({ error: `No demo account found for ${role}` });
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
    res.status(500).json({ error: 'Role switch failed' });
  }
});

// GET /api/auth/notifications
router.get('/notifications', authenticateToken, (req, res) => {
  try {
    const notifs = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20').all(req.user.id);
    res.json({ notifications: notifs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load notifications' });
  }
});

module.exports = router;
module.exports.authenticateToken = authenticateToken;
