import mongoose from 'mongoose';

const deletedPatientSchema = new mongoose.Schema(
  {
    patientId: { type: String, required: true, unique: true, index: true },
    patientName: { type: String, default: '' },
    slNo: { type: String, default: '' },
    mobile: { type: String, default: '' },
    deletedBy: {
      userId: { type: String, default: '' },
      loginId: { type: String, default: '' },
      name: { type: String, default: '' },
      role: { type: String, default: '' },
    },
    reason: { type: String, default: '' },
    upstreamResult: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const DeletedPatient =
  mongoose.models.DeletedPatient || mongoose.model('DeletedPatient', deletedPatientSchema);

