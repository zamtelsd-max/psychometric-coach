"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_1 = __importDefault(require("./routes/auth"));
const questions_1 = __importDefault(require("./routes/questions"));
const attempts_1 = __importDefault(require("./routes/attempts"));
const mockExams_1 = __importDefault(require("./routes/mockExams"));
const profile_1 = __importDefault(require("./routes/profile"));
const bookmarks_1 = __importDefault(require("./routes/bookmarks"));
const admin_1 = __importDefault(require("./routes/admin"));
const support_1 = __importDefault(require("./routes/support"));
const ads_1 = __importDefault(require("./routes/ads"));
const logger_1 = __importDefault(require("./lib/logger"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3010;
// Trust Caddy reverse proxy (loopback only) — MUST be before rate limiters
app.set('trust proxy', 'loopback');
// Security
app.use((0, helmet_1.default)({
    contentSecurityPolicy: false, // managed by Caddy
    crossOriginEmbedderPolicy: false,
}));
app.use((0, cors_1.default)({
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
}));
// Global rate limit — generous for real users, still protects against abuse
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 2000, // 2000 req/15min per IP (was 500)
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later' },
    skip: (req) => req.path === '/health', // never rate-limit health checks
});
// Stricter limit for auth routes only
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 30, // 30 auth attempts per 15min (was 20)
    message: { error: 'Too many auth attempts, please try again later' },
});
// Ad serving is read-heavy, allow more
const adServedLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 min window
    max: 300, // 300 ad serves/min per IP
});
app.use(limiter);
// Body parsing
app.use(express_1.default.json({ limit: '2mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Compression — gzip all responses > 1KB
app.use((0, compression_1.default)({ threshold: 1024 }));
// Logging — skip health checks to keep logs clean
app.use((0, morgan_1.default)('combined', {
    skip: (req) => req.path === '/health',
    stream: { write: (msg) => logger_1.default.info(msg.trim()) },
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
app.use('/api/v1/auth', authLimiter, auth_1.default);
app.use('/api/v1/questions', questions_1.default);
app.use('/api/v1/attempts', attempts_1.default);
app.use('/api/v1/mock-exams', mockExams_1.default);
app.use('/api/v1/profile', profile_1.default);
app.use('/api/v1/bookmarks', bookmarks_1.default);
app.use('/api/v1/admin', admin_1.default);
app.use('/api/v1/ads', adServedLimiter, ads_1.default);
app.use('/api/support', support_1.default);
// ── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
});
// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
    logger_1.default.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});
app.listen(PORT, () => {
    logger_1.default.info(`PsychometricCoach API running on port ${PORT} (pid ${process.pid})`);
});
exports.default = app;
//# sourceMappingURL=index.js.map