import { Router } from 'express';
import multer from 'multer';
import ExpenseRequest from '../models/ExpenseRequest.js';
import { requireAuth } from '../middleware/auth.js';
import path from 'path';
import fs from 'fs';

const router = Router();

// ודא שתיקיית uploads קיימת
const uploadsDir = 'uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// הגדרת multer עם שמירה של סיומת ושם קובץ ייחודי
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    const uniqueName = `${Date.now()}-${base}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // עד 5MB לכל קובץ
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files allowed'));
  },
});

// ✅ יצירת בקשה חדשה
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

    // טיפול בקבצים שנשלחו
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
