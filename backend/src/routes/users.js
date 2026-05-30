const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: 'Missing authorization header.' });
  const token = header.replace('Bearer ', '');
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token.' });
  }
}

router.get('/profile', auth, async (req, res) => {
  const user = await User.findById(req.user.userId).select('-passwordHash -otpCode -otpExpires');
  res.json(user);
});

router.get('/search', auth, async (req, res) => {
  const { query = '', role = 'worker' } = req.query;
  const filter = { role };
  if (query) {
    filter.name = { $regex: query, $options: 'i' };
  }
  const users = await User.find(filter).select('-passwordHash -otpCode -otpExpires');
  res.json(users);
});

router.get('/', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required.' });
  const users = await User.find().select('-passwordHash -otpCode -otpExpires');
  res.json(users);
});

module.exports = router;
