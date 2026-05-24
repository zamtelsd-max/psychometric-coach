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
const logger_1 = __importDefault(require("./lib/logger"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3010;
// Security
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: [
        process.env.FRONTEND_URL || 'http://localhost:3000',
        'http://localhost:3000',
        'https://zamtelsd-max.github.io',
        /\.github\.io$/,
    ],
    credentials: true,
}));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
});
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: 'Too many auth attempts, please try again later' },
});
app.use(limiter);
// Body parsing + compression
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, compression_1.default)());
// Logging
app.use((0, morgan_1.default)('combined', { stream: { write: (msg) => logger_1.default.info(msg.trim()) } }));
// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});
// API Routes
app.use('/api/v1/auth', authLimiter, auth_1.default);
app.use('/api/v1/questions', questions_1.default);
app.use('/api/v1/attempts', attempts_1.default);
app.use('/api/v1/mock-exams', mockExams_1.default);
app.use('/api/v1/profile', profile_1.default);
app.use('/api/v1/bookmarks', bookmarks_1.default);
app.use('/api/v1/admin', admin_1.default);
// 404
app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
});
// Error handler
app.use((err, _req, res, _next) => {
    logger_1.default.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});
app.listen(PORT, () => {
    logger_1.default.info(`PsychometricCoach API running on port ${PORT}`);
});
exports.default = app;
//# sourceMappingURL=index.js.map