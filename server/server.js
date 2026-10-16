import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config/config.env.js';
import { connectDB } from './config/config.db.js';
import { errorHandler } from './middleware/middleware.error.js';
import { cacheService } from './services/service.cache.js';

// Route imports
import authRoutes from './routes/route.auth.js';
import patientRoutes from './routes/route.patient.js';
import reportRoutes from './routes/route.report.js';
import billingRoutes from './routes/route.billing.js';
import masterRoutes from './routes/route.master.js';

const app = express();

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, server-to-server) or from allowed list
    if (!origin || config.allowedOrigins.includes(origin) || origin.endsWith('.vercel.app') || origin.includes('localhost')) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive for clinic internal multi-tenant & staging
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'LIS Middleman Proxy Server',
    clinic: 'New Life Care Diagnostic Center',
    upstreamTarget: config.lab.url,
    timestamp: new Date().toISOString(),
    cacheTtlSeconds: config.cacheTtlSeconds,
  });
});

// Mount modular API routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/master', masterRoutes);

// Global Error Handler
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    await connectDB();

    app.listen(config.port, () => {
      console.log(`=======================================================`);
      console.log(`🚀 LIS Middleman Server running on port ${config.port}`);
      console.log(`🏥 Clinic Upstream Target: ${config.lab.url}`);
      console.log(`🔒 RBAC & JWT Authentication active`);
      console.log(`⚡ 24-Hour Master Data Caching enabled`);
      console.log(`=======================================================`);

      // Pre-warm master cache in background
      cacheService.warmAllCaches().catch((err) => {
        console.warn('[Cache] Background warming note:', err.message);
      });
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
