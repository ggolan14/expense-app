import mongoose from 'mongoose';

const expenseRequestSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  currency: { type: String, enum: ['NIS', '$'], default: 'NIS' },
  amount: { type: Number, required: true },
  reason: { type: String },
  status: {
    type: String,
    enum: ['new', 'in_progress', 'approved', 'rejected', 'closed'],
    default: 'new',
  },
  attachmentUrl: { type: String }, // local file path
}, { timestamps: true });

export default mongoose.model('ExpenseRequest', expenseRequestSchema);
