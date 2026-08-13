import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth';
import questionsRoutes from './routes/questions';
import attemptsRoutes from './routes/attempts';
import mockExamsRoutes from './routes/mockExams';
import interviewRoutes from './routes/interview';
import profileRoutes from './routes/profile';
import bookmarksRoutes from './routes/bookmarks';
import adminRoutes from './routes/admin';
import supportRoutes from './routes/support';
import enterpriseRoutes from './routes/enterprise';
import screeningRoutes from './routes/screening';
import adsRoutes from './routes/ads';
import logger from './lib/logger';

const app = express();
const PORT = process.env.PORT || 3010;

// Trust reverse proxy (Caddy/Cloudflare on VM, or Northflank's proxy) — MUST be before rate limiters.
// Trust the first proxy hop so express-rate-limit reads the correct client IP from X-Forwarded-For
// without throwing ERR_ERL_UNEXPECTED_X_FORWARDED_FOR.
app.set('trust proxy', 1);

// Security
app.use(helmet({
  contentSecurityPolicy: false, // managed by Caddy
  crossOriginEmbedderPolicy: false,
}));

app.use(
  cors({
    origin: [
      'https://www.psychometriccoach.com',
      'https://psychometriccoach.com',
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'https://zamtelsd-max.github.io',
      /\.github\.io$/,
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Global rate limit — generous for real users, still protects against abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 2000,                  // 2000 req/15min per IP (was 500)
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
  skip: (req) => req.path === '/health', // never rate-limit health checks
});

// Stricter limit for auth routes only
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,                    // 30 auth attempts per 15min (was 20)
  message: { error: 'Too many auth attempts, please try again later' },
});

// Ad serving is read-heavy, allow more
const adServedLimiter = rateLimit({
  windowMs: 60 * 1000,        // 1 min window
  max: 300,                   // 300 ad serves/min per IP
});

app.use(limiter);

// Body parsing
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Compression — gzip all responses > 1KB
app.use(compression({ threshold: 1024 }));

// Logging — skip health checks to keep logs clean
app.use(morgan('combined', {
  skip: (req) => req.path === '/health',
  stream: { write: (msg) => logger.info(msg.trim()) },
}));

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: Math.round(process.uptime()),
    pid: process.pid,
  });
});

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/v1/auth',       authLimiter, authRoutes);
app.use('/api/v1/questions',  questionsRoutes);
app.use('/api/v1/attempts',   attemptsRoutes);
app.use('/api/v1/mock-exams', mockExamsRoutes);
app.use('/api/v1/interview',  interviewRoutes);
app.use('/api/v1/profile',    profileRoutes);
app.use('/api/v1/bookmarks',  bookmarksRoutes);
app.use('/api/v1/admin',      adminRoutes);
app.use('/api/v1/ads',        adServedLimiter, adsRoutes);
app.use('/api/support',       supportRoutes);
app.use('/api/v1/enterprise', enterpriseRoutes);
app.use('/api/v1/screening',  screeningRoutes);

// ── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  logger.info(`PsychometricCoach API running on port ${PORT} (pid ${process.pid})`);
});

export default app;
