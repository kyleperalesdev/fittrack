import { Router } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import InviteCode from '../models/InviteCode.js';
import { protect } from '../middleware/auth.js';

const router = Router();

function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, inviteCode } = req.body;
    if (!name || !email || !password || !inviteCode) {
      return res.status(400).json({ message: 'All fields including invite code are required' });
    }

    const invite = await InviteCode.findOne({ code: inviteCode });
    if (!invite || invite.usedBy.length >= invite.maxUses) {
      return res.status(400).json({ message: 'Invalid or expired invite code' });
    }

    if (await User.findOne({ email })) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const user = await User.create({ name, email, password });
    invite.usedBy.push(user._id);
    await invite.save();

    res.status(201).json({ token: signToken(user._id), user });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.json({ token: signToken(user._id), user });
  } catch (err) {
    next(err);
  }
});

router.get('/me', protect, (req, res) => {
  res.json({ user: req.user });
});

export default router;
