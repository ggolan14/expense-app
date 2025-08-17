import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    fullName: { type: String, required: true, trim: true },
    nationalId: { type: String, required: true, trim: true }, // אימות ספרת ביקורת בהמשך
    role: { type: String, enum: ['employee', 'budget', 'admin'], default: 'employee' },
    passwordHash: { type: String, required: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

userSchema.index({ email: 1 }, { unique: true });

export default mongoose.model('User', userSchema);
