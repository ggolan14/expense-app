import User from '../models/User.js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import bcrypt from 'bcrypt';

// 📩 בקשת איפוס סיסמה
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      // גם אם לא נמצא משתמש – מחזירים תשובה "חיובית" כדי לא לחשוף אימיילים
      return res.status(200).json({ message: 'If the email exists, reset instructions were sent' });
    }

    // טוקן חד־פעמי
    const token = crypto.randomBytes(32).toString('hex');
    user.resetToken = token;
    user.resetTokenExpiry = Date.now() + 1000 * 60 * 15; // תוקף ל־15 דקות
    await user.save();

    // שליחת מייל
    const transporter = nodemailer.createTransport({
      service: 'gmail', // אפשר גם SMTP אחר
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Password Reset',
      text: `Click here to reset your password: ${resetUrl}`,
    });

    res.json({ message: 'Reset instructions sent' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Error requesting password reset' });
  }
};

// 🔑 איפוס סיסמה בפועל
export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() }, // תוקף עדיין בתוקף
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // עדכון השדה הנכון (passwordHash)
    user.passwordHash = await bcrypt.hash(password, 10);

    // ניקוי הטוקן אחרי שימוש
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;

    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Error resetting password' });
  }
};
