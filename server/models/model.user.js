import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true },
    loginId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    mobile: { type: String, trim: true },
    role: {
      type: String,
      enum: ['Super', 'Receptionist', 'Technician', 'Doctor', 'Branch', 'Office'],
      default: 'Receptionist',
    },
    accessPermission: {
      accessType: { type: String, default: 'Office' },
      canRegisterPatient: { type: Boolean, default: true },
      canEnterResults: { type: Boolean, default: false },
      canVerifyReport: { type: Boolean, default: false },
      canApproveReport: { type: Boolean, default: false },
      canManageMaster: { type: Boolean, default: false },
      canManageUsers: { type: Boolean, default: false },
    },
    branchId: { type: String, default: '1' },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    status2FA: { type: String, default: 'DISABLED' },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

// Fallback if mongoose is not connected
export const User = mongoose.models.User || mongoose.model('User', userSchema);
