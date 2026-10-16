import mongoose from 'mongoose';

const cacheSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    data: { type: mongoose.Schema.Types.Mixed, required: true },
    ttlSeconds: { type: Number, default: 86400 }, // 24 hours
    expiresAt: { type: Date, required: true },
    itemCount: { type: Number, default: 0 },
    lastFetchedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Cache = mongoose.models.Cache || mongoose.model('Cache', cacheSchema);
