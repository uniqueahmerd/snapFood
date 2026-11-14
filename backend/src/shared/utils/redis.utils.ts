import { redisClient } from "../../config/redis.config"

export const storeRefreshToken = async (
  userId: string,
  refreshToken: string,
) => {
  await redisClient.set(
    `refresh_token:${refreshToken}`,
    refreshToken,
    'EX',
    7 * 24 * 60 * 60,
  )
  await redisClient.sadd(`user_refresh_tokens:${userId}`, refreshToken)
}

export const removeRefreshToken = async (
  userId: string,
  refreshToken: string,
) => {
  await redisClient.del(`refresh_token:${refreshToken}`)
  await redisClient.srem(`user_refresh_tokens:${userId}`, refreshToken)
}

export const revokeAllUserTokens = async (userId: string) => {
  const refreshTokens = await redisClient.smembers(
    `user_refresh_tokens:${userId}`,
  )

  if (refreshTokens.length > 0) {
    const pipeline = redisClient.pipeline()
    refreshTokens.forEach((refreshToken: any) => {
      pipeline.del(`refresh_token:${refreshToken}`)
    })
    pipeline.del(`user_refresh_tokens:${userId}`)
    await pipeline.exec()
  } else {
    await redisClient.del(`user_refresh_tokens:${userId}`)
  }
}
