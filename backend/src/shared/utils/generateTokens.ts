import jwt, { SignOptions } from 'jsonwebtoken'
import { env } from "../../config/env"

export const generateTokens = (userId: string) => {
  const payload = { sub: userId }

  const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET as string, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn'],
  })

  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET as string, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'],
  })

  return { accessToken, refreshToken }
}
