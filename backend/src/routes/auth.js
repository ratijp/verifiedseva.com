const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendEmail, sendSms } = require('../services/notify');

const router = express.Router();
const OTP_EXPIRY_MS = 10 * 60 * 1000;

router.post('/register', async (req, res) => {
  const { name, email, password, phone, role } = req.body;
  if (!name || !email || !password || !phone || !role) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({ message: 'Email already registered.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = new Date(Date.now() + OTP_EXPIRY_MS);

  const user = new User({ name, email, passwordHash, phone, role, otpCode, otpExpires, isVerified: false });
  await user.save();

  const message = `Your VerifiedSeva OTP is ${otpCode}. It expires in 10 minutes.`;
  await Promise.all([
    sendEmail(email, 'Verify your VerifiedSeva account', message),
    sendSms(phone, message)
  ]).catch(() => {});

  res.json({ message: 'OTP sent to email and phone. Complete verification to activate account.' });
});

router.post('/verify-otp', async (req, res) => {
  const { email, otpCode } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'User not found.' });
  if (user.isVerified) return res.status(400).json({ message: 'User already verified.' });
  if (user.otpCode !== otpCode || user.otpExpires < new Date()) {
    return res.status(400).json({ message: 'Invalid or expired OTP.' });
  }

  user.isVerified = true;
  user.otpCode = null;
  user.otpExpires = null;
  await user.save();

  const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'User not found.' });
  if (!user.isVerified) return res.status(401).json({ message: 'Account not verified.' });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ message: 'Invalid credentials.' });

  const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
});

module.exports = router;
