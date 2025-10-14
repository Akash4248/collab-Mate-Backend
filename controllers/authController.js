const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');

// Generate JWT for a user id and email
function generateToken(user) {
  const secret = process.env.JWT_SECRET || 'devsecret';
  return jwt.sign({ id: user._id, email: user.email }, secret, { expiresIn: '7d' });
}

// POST /api/auth/register
// Register a new user
async function register(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { name, email, password } = req.body;
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    const user = await User.create({ name, email, password });
    const token = generateToken(user);
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, avatarUrl: user.avatarUrl },
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/login
// Authenticate user and return JWT
async function login(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const match = await user.comparePassword(password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });
    const token = generateToken(user);
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, avatarUrl: user.avatarUrl },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/me
// Return current user profile
async function me(req, res, next) {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, me };


