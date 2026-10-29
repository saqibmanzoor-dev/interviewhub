import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/errorHandler.js';
import { ensureDBConnected } from './config/db.js';

import passport, { configurePassport } from './config/passport.js';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import interviewRoutes from './routes/interviewRoutes.js';
import challengeRoutes from './routes/challengeRoutes.js';
import codeExecutionRoutes from './routes/codeExecutionRoutes.js';
import evaluationRoutes from './routes/evaluationRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import eventTypeRoutes from './routes/eventTypeRoutes.js';
import availabilityRoutes from './routes/availabilityRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

configurePassport();

const app = express();

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS Configuration - dynamically accept any localhost, Vercel deployment/preview domains, or custom domains
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(passport.initialize());

// URL Normalizer for Vercel Serverless Function rewrites:
// In Vercel, requests to /api/v1/xyz may arrive as /v1/xyz or /xyz
app.use((req, res, next) => {
  if (req.url.startsWith('/v1/')) {
    req.url = '/api' + req.url;
  }
  next();
});

// Auth rate limiter to prevent brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Too many requests from this IP. Please try again after 15 minutes.' }
});

// Ensure MongoDB connection is active before processing database operations
app.use('/api/v1', ensureDBConnected);
app.use('/v1', ensureDBConnected);

// Helper to mount all routes on both /api/v1 and /v1
function mountApiRoutes(prefix) {
  app.use(`${prefix}/auth`, authLimiter, authRoutes);
  app.use(`${prefix}/users`, userRoutes);
  app.use(`${prefix}/interviews`, interviewRoutes);
  app.use(`${prefix}/event-types`, eventTypeRoutes);
  app.use(`${prefix}/availability`, availabilityRoutes);
  app.use(`${prefix}/bookings`, bookingRoutes);
  app.use(`${prefix}/admin`, adminRoutes);
  app.use(`${prefix}/challenges`, challengeRoutes);
  app.use(`${prefix}/code-executions`, codeExecutionRoutes);
  app.use(`${prefix}/evaluations`, evaluationRoutes);
  app.use(`${prefix}/analytics`, analyticsRoutes);
  app.use(`${prefix}/notifications`, notificationRoutes);
}

mountApiRoutes('/api/v1');
mountApiRoutes('/v1');

// Health check endpoint
app.get(['/health', '/api/health', '/api/v1/health'], (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'InterviewHub API', 
    environment: process.env.NODE_ENV || 'production',
    isServerless: Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME),
    timestamp: new Date().toISOString() 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Central error handler
app.use(errorHandler);

export default app;
