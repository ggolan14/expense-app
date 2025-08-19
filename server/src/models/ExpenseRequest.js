// src/models/ExpenseRequest.js
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const ExpenseRequestSchema = new mongoose.Schema({
  reason: { 
    type: String, 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  currency: { 
    type: String, 
    required: true 
  },

  // מזהה ייחודי לכל בקשה
  requestId: {
    type: String,
    unique: true,
    default: uuidv4
  },

  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'in_progress', 'closed'],
    default: 'pending'
  },

  employeeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },

  attachmentUrl: { 
    type: String 
  },

}, { timestamps: true });

// כאן חייב להיות export default
const ExpenseRequest = mongoose.model('ExpenseRequest', ExpenseRequestSchema);
export default ExpenseRequest;
