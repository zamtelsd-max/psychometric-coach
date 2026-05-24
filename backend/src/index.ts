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
import profileRoutes from './routes/profile';
import bookmarksRoutes from './routes/bookmarks';
import adminRoutes from './routes/admin';
import logger from './lib/logger';

const app = express();
const PORT = process.env.PORT || 3010;

// Security
app.use(helmet());
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'https://zamtelsd-max.github.io',
      /\.github\.io$/,
    ],
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many auth attempts, please try again later' },
});
app.use(limiter);

// Body parsing + compression
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(compression());

// Logging
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// API Routes
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/questions', questionsRoutes);
app.use('/api/v1/attempts', attemptsRoutes);
app.use('/api/v1/mock-exams', mockExamsRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/bookmarks', bookmarksRoutes);
app.use('/api/v1/admin', adminRoutes);

// 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  logger.info(`PsychometricCoach API running on port ${PORT}`);
});

export default app;
