// server/src/routes/expense.routes.js
import { Router } from 'express';
import multer from 'multer';
import ExpenseRequest from '../models/ExpenseRequest.js';
import { requireAuth } from '../middleware/auth.js';
import path from 'path';
import fs from 'fs';
import nodemailer from 'nodemailer';

const router = Router();

/* =========================
   SMTP mailer (env-based)
   ========================= */
const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_SECURE,
  EMAIL_FROM = 'Expense App <no-reply@expense.local>',
  NOTIFY_TO = 'ggolan@technion.ac.il',
  PUBLIC_BASE_URL,
} = process.env;

let mailTransporter = null;
if (SMTP_HOST && SMTP_PORT) {
  mailTransporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: String(SMTP_SECURE).toLowerCase() === 'true', // true ל-465 (SSL)
    auth: (SMTP_USER && SMTP_PASS) ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });

  // אופציונלי: בדיקת חיבור (לא חוסם)
  mailTransporter.verify().then(
    () => console.log('[mail] SMTP verify: OK'),
    (e) => console.warn('[mail] SMTP verify failed:', e?.message || e)
  );
} else {
  console.warn('[mail] Missing SMTP_HOST/SMTP_PORT; email notifications are disabled.');
}

/* =========================
   Uploads (multer)
   ========================= */
const uploadsDir = 'uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);                 // ".pdf"
    const base = path.basename(file.originalname, ext);          // שם בלי סיומת
    const uniqueName = `${Date.now()}-${base}${ext}`;            // שומר סיומת
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') return cb(null, true);
    return cb(new Error('Only PDF files allowed'));
  },
});

/* =========================
   Routes
   ========================= */

// ✅ יצירת בקשה חדשה + שליחת מייל בסיום
router.post('/', requireAuth, upload.single('attachment'), async (req, res) => {
  try {
    const { amount, reason, currency } = req.body;

    const newReq = await ExpenseRequest.create({
      employeeId: req.user.id,
      amount,
      currency,
      reason,
      attachmentUrl: req.file ? `uploads/${req.file.filename}` : null,
    });

    // שליחת מייל אסינכרונית (לא חוסם את תגובת ה-API)
    (async () => {
      if (!mailTransporter) return;
      try {
        const populated = await ExpenseRequest.findById(newReq._id)
          .populate('employeeId', 'fullName email')
          .lean();

        const createdAtStr = populated.createdAt
          ? new Date(populated.createdAt).toLocaleString()
          : '';

        const subject = `New Expense Request ${populated._id}`;
        const fileLink = (PUBLIC_BASE_URL && populated.attachmentUrl)
          ? `${PUBLIC_BASE_URL}/${populated.attachmentUrl}`
          : null;

        const text = `
A new expense request was created.

ID: ${populated._id}
Employee: ${populated.employeeId?.fullName || ''} (${populated.employeeId?.email || ''})
Amount: ${populated.amount} ${populated.currency || ''}
Reason: ${populated.reason || ''}
Created At: ${createdAtStr}
Attachment: ${fileLink || populated.attachmentUrl || 'None'}
        `.trim();

        const html = `
          <h3>New Expense Request</h3>
          <p><b>ID:</b> ${populated._id}</p>
          <p><b>Employee:</b> ${populated.employeeId?.fullName || ''} (${populated.employeeId?.email || ''})</p>
          <p><b>Amount:</b> ${populated.amount} ${populated.currency || ''}</p>
          <p><b>Reason:</b> ${populated.reason || ''}</p>
          <p><b>Created At:</b> ${createdAtStr}</p>
          <p><b>Attachment:</b> ${
            fileLink
              ? `<a href="${fileLink}" target="_blank" rel="noreferrer">View PDF2</a>`
              : (populated.attachmentUrl || 'None')
          }</p>
        `;

        await mailTransporter.sendMail({
          from: EMAIL_FROM,
          to: NOTIFY_TO,
          subject,
          text,
          html,
        });

        console.log(`📧 Notification sent to ${NOTIFY_TO} for request ${populated._id}`);
      } catch (mailErr) {
        console.error('Email notification failed:', mailErr?.message || mailErr);
      }
    })();

    res.status(201).json(newReq);
  } catch (err) {
    console.error('Create expense error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

const getFileName = (attachmentUrl) => {
  if (!attachmentUrl) return null;
  const parts = attachmentUrl.split('-');   // חותך לפי '-'
  return parts.length > 1 ? parts.slice(1).join('-') : attachmentUrl;
};

// ✅ שליפת כל הבקשות של העובד המחובר
router.get('/my', requireAuth, async (req, res) => {
  try {
    const requests = await ExpenseRequest.find({ employeeId: req.user.id })
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch requests' });
  }
});

// 📥 צפייה בכל הבקשות (לתקציבנית בלבד)
router.get('/all', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'budget') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const requests = await ExpenseRequest.find(filter)
      .populate('employeeId', 'fullName email')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    console.error('Error fetching all requests:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ שינוי סטטוס של בקשה
router.put('/:id/status', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'budget') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { status } = req.body;
    if (!['approved', 'rejected', 'closed', 'in_progress'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const request = await ExpenseRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    request.status = status;

    // סימולציה/לוג בעת אישור (אפשר להמיר למייל אמיתי בהמשך)
    if (status === 'approved') {
      console.log(`📧 (Simulated) finance email for approved request ${request._id}`);
    }

    if (status === 'rejected') {
      request.budgetManagerId = null;
    }

    await request.save();
    res.json(request);
  } catch (err) {
    console.error('Error updating request status:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
