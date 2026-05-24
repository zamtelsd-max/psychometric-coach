import IORedis from 'ioredis';
export declare function getRedis(): IORedis | null;
export declare function cacheGet(key: string): Promise<string | null>;
export declare function cacheSet(key: string, value: string, ttlSeconds?: number): Promise<void>;
export declare function cacheDel(key: string): Promise<void>;
//# sourceMappingURL=redis.d.ts.map