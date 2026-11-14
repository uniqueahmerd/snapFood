import Redis from 'ioredis'
import { env } from './env'

export const redisClient = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
})

redisClient.on('connect', () => {
  console.log('✅ Redis connected successfully')
})

redisClient.on('error', (error: any) => {
  console.error('❌ Redis connection error:', error)
})
