import mongoose from 'mongoose';
import { config } from './config.env.js';

export const connectDB = async () => {
  if (!config.mongodbUri) {
    console.log('[Database] MONGODB_URI not set. Running in stateless middleman proxy & memory-cached mode.');
    return null;
  }

  try {
    const conn = await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[Database] MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.warn(`[Database] MongoDB connection error: ${error.message}. Continuing with in-memory middleman caching.`);
    return null;
  }
};
