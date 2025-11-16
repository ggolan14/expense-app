import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const ExpenseRequestSchema = new mongoose.Schema(
  {
    // מזהה ייחודי שנוצר אוטומטית לכל בקשה
    requestId: {
      type: String,
      unique: true,
      default: uuidv4,
    },

    // 🏢 פרטי הארגון והעובד
    organization: {
      type: String,
      enum: ['Technion', 'Institute'],
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    idNumber: {
      type: String,
      required: true,
    },
    faculty: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },

    // 💰 פרטי בקשה כספיים
    amount: {
      type: Number,
      required: true,
    },
    budgetNumber: {
      type: String,
      required: true,
    },
    currency: {
      type: String, // 'NIS' | 'USD'
      // required: true,
    },

    // 📝 הערות או תיאור נוסף (לא חובה)
    reason: {
      type: String,
    },

    // 📊 סטטוס הבקשה
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'in_progress', 'closed'],
      default: 'pending',
      index: true, // 💡 מומלץ לאינדוקס פילטור עתידי
    },

    // 👤 מזהה המשתמש שהגיש את הבקשה
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    // 📎 תמיכה בקבצים מרובים
    attachments: [
      {
        type: String, // נתיב יחסי לקובץ (uploads/xxx.pdf)
      },
    ],

    // 🧾 תמיכה לאחור בקובץ יחיד
    attachmentUrl: {
      type: String,
    },
  },
  { timestamps: true }
);

const ExpenseRequest = mongoose.model('ExpenseRequest', ExpenseRequestSchema);
export default ExpenseRequest;
