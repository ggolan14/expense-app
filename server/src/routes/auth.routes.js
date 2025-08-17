import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = Router();

// ✅ רישום משתמש חדש
router.post('/register', async (req, res) => {
  try {
    const { email, fullName, nationalId, password, role } = req.body;

    if (!email || !fullName || !nationalId || !password) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      email,
      fullName,
      nationalId,
      passwordHash,
      role: role || 'employee',
    });

    return res.status(201).json({ id: user._id });
  } catch (err) {
    console.error("❌ Error in /register:", err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// ✅ התחברות משתמש
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email, isActive: true });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { sub: user._id.toString(), role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      }
    });
  } catch (err) {
    console.error("❌ Error in /login:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ בדיקה אם המשתמש מחובר
import { requireAuth } from '../middleware/auth.js';

router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.user.id).select('-passwordHash');
  res.json({ user });
});

export default router;
