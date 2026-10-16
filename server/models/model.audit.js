import mongoose from 'mongoose';

const auditSchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entityId: { type: String },
    performedBy: {
      userId: { type: String },
      loginId: { type: String },
      name: { type: String },
      role: { type: String },
    },
    ipAddress: { type: String },
    details: { type: mongoose.Schema.Types.Mixed },
    status: { type: String, enum: ['SUCCESS', 'FAILED'], default: 'SUCCESS' },
  },
  { timestamps: true }
);

export const Audit = mongoose.models.Audit || mongoose.model('Audit', auditSchema);
