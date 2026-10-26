import mongoose from 'mongoose';

const reportOverrideSchema = new mongoose.Schema(
  {
    patientId: { type: String, required: true, index: true },
    reportId: { type: String, required: true, index: true },
    status: { type: String, required: true, default: 'DELETED' },
    testName: { type: String },
    profileName: { type: String },
    deptName: { type: String },
    rate: { type: String },
    deletedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

reportOverrideSchema.index({ patientId: 1, reportId: 1 }, { unique: true });

export const ReportOverride =
  mongoose.models.ReportOverride || mongoose.model('ReportOverride', reportOverrideSchema);
