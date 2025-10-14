const express = require('express');
const { body } = require('express-validator');
const { register, login, me } = require('../controllers/authController');
const { auth } = require('../middleware/authMiddleware');

const router = express.Router();

// Register route
router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  register
);

// Login route
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  login
);

// Current user profile
router.get('/me', auth, me);

module.exports = router;


