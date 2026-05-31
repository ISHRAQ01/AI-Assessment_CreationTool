import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redisClient = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  retryStrategy: (times) => {
    if (times > 3) {
      console.error('Redis connection failed after 3 retries');
      return null;
    }
    return Math.min(times * 100, 3000);
  },
});

redisClient.on('connect', async () => {
  console.log('✅ Redis connected');
  
  // Fix eviction policy
  try {
    await redisClient.config('SET', 'maxmemory-policy', 'noeviction');
    console.log('✅ Redis eviction policy set to noeviction');
  } catch (err: any) {
    console.warn('⚠️ Could not set eviction policy:', err.message);
  }
});

redisClient.on('error', (err: Error) => console.error('Redis error:', err.message));

export default redisClient;
