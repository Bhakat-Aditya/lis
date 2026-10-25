import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    loginId: { type: String, required: true },
    upstreamSid: { type: String, required: true },
    cookieString: { type: String },
    role: { type: String, default: 'Receptionist' },
    branchId: { type: String, default: '1' },
    ip: { type: String },
    userAgent: { type: String },
    terminatedReason: { type: String },
    expiresAt: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Session = mongoose.models.Session || mongoose.model('Session', sessionSchema);
