"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedis = getRedis;
exports.cacheGet = cacheGet;
exports.cacheSet = cacheSet;
exports.cacheDel = cacheDel;
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = __importDefault(require("./logger"));
let redis = null;
function getRedis() {
    if (!process.env.REDIS_URL) {
        return null;
    }
    if (!redis) {
        try {
            redis = new ioredis_1.default(process.env.REDIS_URL, {
                maxRetriesPerRequest: 1,
                lazyConnect: true,
                connectTimeout: 5000,
            });
            redis.on('error', (err) => {
                logger_1.default.warn('Redis error (non-fatal):', err.message);
                redis = null;
            });
        }
        catch (err) {
            logger_1.default.warn('Redis connection failed (non-fatal):', err);
            redis = null;
        }
    }
    return redis;
}
async function cacheGet(key) {
    const r = getRedis();
    if (!r)
        return null;
    try {
        return await r.get(key);
    }
    catch {
        return null;
    }
}
async function cacheSet(key, value, ttlSeconds = 300) {
    const r = getRedis();
    if (!r)
        return;
    try {
        await r.setex(key, ttlSeconds, value);
    }
    catch {
        // non-fatal
    }
}
async function cacheDel(key) {
    const r = getRedis();
    if (!r)
        return;
    try {
        await r.del(key);
    }
    catch {
        // non-fatal
    }
}
//# sourceMappingURL=redis.js.map