const express = require('express');
const jwt = require('jsonwebtoken');
const Job = require('../models/Job');
const User = require('../models/User');
const { sendEmail, sendSms } = require('../services/notify');

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

router.get('/', async (req, res) => {
  const { category, location, search } = req.query;
  const filter = { status: 'open' };
  if (category) filter.category = category;
  if (location) filter.location = { $regex: location, $options: 'i' };
  if (search) filter.$or = [
    { title: { $regex: search, $options: 'i' } },
    { description: { $regex: search, $options: 'i' } }
  ];

  const jobs = await Job.find(filter).populate('postedBy', 'name role phone email');
  res.json(jobs);
});

router.post('/', auth, async (req, res) => {
  const { title, description, category, location, budget } = req.body;
  const job = new Job({ title, description, category, location, budget, postedBy: req.user.userId });
  await job.save();
  res.json(job);
});

router.post('/:id/hire', auth, async (req, res) => {
  const job = await Job.findById(req.params.id).populate('postedBy');
  if (!job) return res.status(404).json({ message: 'Job not found.' });
  if (job.status !== 'open') return res.status(400).json({ message: 'Job is not available.' });

  job.hiredBy = req.user.userId;
  job.status = 'hired';
  await job.save();

  const hirer = await User.findById(req.user.userId);
  const message = `Your job '${job.title}' has been hired by ${hirer.name}.`;
  await Promise.all([
    sendEmail(job.postedBy.email, 'Job hired', message),
    sendSms(job.postedBy.phone, message)
  ]).catch(() => {});

  res.json({ message: 'Worker hired successfully.', job });
});

module.exports = router;
