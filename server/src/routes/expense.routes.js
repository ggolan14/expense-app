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

  // ✅ בדיקת חיבור לשרת SMTP
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
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    const uniqueName = `${Date.now()}-${base}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') return cb(null, true);
    return cb(new Error('Only PDF files allowed'));
  },
});

/* =========================
   Routes
   ========================= */

// ✅ יצירת בקשה חדשה + שליחת מייל
router.post('/', requireAuth, upload.array('attachments', 10), async (req, res) => {
  try {
    const {
      organization,
      date,
      fullName,
      idNumber,
      faculty,
      phone,
      amount,
      budgetNumber,
      currency,
      reason
    } = req.body;

    const attachments = (req.files || []).map(f => `uploads/${f.filename}`);

    const newReq = await ExpenseRequest.create({
      organization,
      date,
      fullName,
      idNumber,
      faculty,
      phone,
      amount,
      budgetNumber,
      currency,
      reason,
      employeeId: req.user.id,
      attachments,
    });

    // שליחת מייל (אם הוגדר SMTP)
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

        const links = (populated.attachments || []).map(
          (a) => (PUBLIC_BASE_URL ? `${PUBLIC_BASE_URL}/${a}` : a)
        );

        const text = `
A new expense request was created.

ID: ${populated._id}
Organization: ${populated.organization}
Employee: ${populated.employeeId?.fullName || ''} (${populated.employeeId?.email || ''})
Amount: ${populated.amount} ${populated.currency || ''}
Reason: ${populated.reason || ''}
Created At: ${createdAtStr}
Attachments:
${links.length ? links.join('\n') : 'None'}
`.trim();

        const html = `
          <h3>New Expense Request</h3>
          <p><b>Organization:</b> ${populated.organization}</p>
          <p><b>ID:</b> ${populated._id}</p>
          <p><b>Employee:</b> ${populated.employeeId?.fullName || ''} (${populated.employeeId?.email || ''})</p>
          <p><b>Amount:</b> ${populated.amount} ${populated.currency || ''}</p>
          <p><b>Reason:</b> ${populated.reason || ''}</p>
          <p><b>Created At:</b> ${createdAtStr}</p>
          <p><b>Attachments:</b><br>
          ${
            links.length
              ? links.map(l => `<a href="${l}" target="_blank">${l.split('/').pop()}</a>`).join('<br>')
              : 'None'
          }
          </p>
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
    console.error('❌ Error creating expense request:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ שליפת כל הבקשות של העובד המחובר
router.get('/my', requireAuth, async (req, res) => {
  try {
    const requests = await ExpenseRequest.find({ employeeId: req.user.id })
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    console.error('❌ Error fetching user requests:', err);
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
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const requests = await ExpenseRequest.find(filter)
      .populate('employeeId', 'fullName email')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    console.error('❌ Error fetching all requests:', err);
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

    if (!['approved', 'rejected', 'closed', 'in_progress', 'pending'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const request = await ExpenseRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    request.status = status;
    await request.save();

    res.json(request);
  } catch (err) {
    console.error('❌ Error updating request status:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
