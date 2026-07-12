import { Redis } from '@upstash/redis'

// Singleton Redis client dùng Upstash REST API.
// Tương thích với Vercel Serverless và Edge Functions.
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export default redis
