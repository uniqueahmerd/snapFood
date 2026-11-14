import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

//local imports
import { env } from "../../config/env";
import { LoginDto } from "./dtos/login.dto";
import { Role } from "../../shared/types/types";
import { RegisterDto } from "./dtos/register.dto";
import { UserRepository } from "../user/user.repo";
import { AppError } from "../../shared/utils/AppError";
import { tokenRepository } from "./token.repo";
import { generateTokens } from "../../shared/utils/generateTokens";
import { EmailService } from "../email/email.service";
import { ResetPasswordDto } from "./dtos/resetPassword.dto";
import { ForgotPasswordDto } from "./dtos/forgotPassword.dto";
import { AUTHPROVIDER, ROLE, TOKENTYPE, USERSTATUS } from "../../shared/enums";
import {
  revokeAllUserTokens,
  storeRefreshToken,
} from "../../shared/utils/redis.utils";
import { GoogleProfile } from "./auth.types";
import { redisClient } from "../../config/redis.config";


export const authService = {
  async getMe(userId: string) {
    const user = await UserRepository.findById(userId)
    if (!user) throw new AppError("User not found", 404)

       return user
  },

  async register(dto: RegisterDto) {
    // 1. Check email not already taken
    const existingEmail = await UserRepository.findByEmail(dto.email);
    if (existingEmail) throw new AppError("Email already registered", 409);

    // 3. Hash the password
    const hashedPassword = await bcrypt.hash(dto.password, 12);

    // 4. Saving the new created user to database
    const newUser = await UserRepository.save({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      password: hashedPassword,
      isAccountVerified: false,
    });

    // 4. generate email verification token and its expiry date
    const verificationToken = jwt.sign(
      { sub: newUser.id, type: "verification_token" },
      env.JWT_ACCESS_SECRET,
      { expiresIn: "15m" },
    );
    const verificationTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // save the verification token in database with expiry date
    await tokenRepository.create(
      newUser.id,
      verificationToken,
      TOKENTYPE.VERIFICATION_TOKEN,
      verificationTokenExpiresAt,
    );

    // 5. Generating both access and refresh tokens
    const tokens = generateTokens(newUser.id);

    await storeRefreshToken(newUser.id, tokens.refreshToken);

    await EmailService.sendVerification(
      newUser.email,
      newUser.firstName,
      `${env.CLIENT_URL}/verify-email/${encodeURIComponent(verificationToken)}`,
    ).catch(() => undefined);

    return {
      ...tokens,
      user: newUser,
    };
  },

  async verifyEmail(token: string) {
    //decoding the token
    let decoded: any;

    try {
      decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    } catch (error) {
      throw new AppError("Invalid or expired token", 400);
    }

    if (!decoded) throw new AppError("Invalid or expired token", 400);

    if (decoded.type !== "verification_token")
      throw new AppError("Invalid token type", 401);

    // find the token record
    const savedToken = await tokenRepository.findByToken(token);
    if (!savedToken) throw new AppError("Invalid or expired token", 404);

    // check expiry
    if (savedToken.expiresAt < new Date()) {
      // cleanup expired token
      await tokenRepository.deleteByToken(token);
      throw new AppError("Verification token expired", 400);
    }

    // fetch the user referenced by the token
    const user = await UserRepository.findById(savedToken.userId);
    if (!user) throw new AppError("User not found", 404);

    // mark user as verified if not already
    if (!user.isAccountVerified) {
      user.isAccountVerified = true;
      await UserRepository.save(user);
    }

    // remove the verification token
    await tokenRepository.deleteByToken(token);

    await EmailService.sendWelcome(user.email, user.firstName).catch(
      () => undefined,
    );

    return user;
  },

  async resendVerificationToken(email: string) {
    const successMessage = {
      message:
        "If this email exists and is unverified, a new link has been sent to your email.",
    };

    // 1. Find user
    const user = await UserRepository.findByEmail(email);

    if (!user) return successMessage;

    // 2. Already verified
    if (user.isAccountVerified) {
      throw new AppError("This email is already verified", 400);
    }

    // 3. Delete existing verification tokens for this user
    await tokenRepository.deleteByUserIdAndType(
      user.id,
      TOKENTYPE.VERIFICATION_TOKEN,
    );

    // 4. generate email verification token and its expiry date
    const verificationToken = jwt.sign(
      { sub: user.id, type: "verification_token" },
      env.JWT_ACCESS_SECRET,
      { expiresIn: "15m" },
    );
    const verificationTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // save the verification token in database with expiry date
    await tokenRepository.create(
      user.id,
      verificationToken,
      TOKENTYPE.VERIFICATION_TOKEN,
      verificationTokenExpiresAt,
    );

    await EmailService.sendVerification(
      user.email,
      user.firstName,
      `${env.CLIENT_URL}/verify-email/${encodeURIComponent(verificationToken)}`,
    ).catch(() => undefined);

    return successMessage;
  },

  async forgotPassword(dto: ForgotPasswordDto) {
    const successMessage = {
      message: "If this email exists you will receive a password reset link.",
      googleMessage: "Please use google sign in option",
    };

    const user = await UserRepository.findByEmail(dto.email);
    if (!user) return successMessage;

    // Google users cannot reset password
    if (user.authProvider === AUTHPROVIDER.GOOGLE)
      return successMessage.googleMessage;

    //   3. Delete existing reset tokens for this user
    await tokenRepository.deleteByUserIdAndType(user.id, TOKENTYPE.RESET_TOKEN);

    const resetToken = jwt.sign(
      { sub: user.id, type: "password_reset_token" },
      env.JWT_ACCESS_SECRET,
      { expiresIn: "15m" },
    );

    const resetTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await tokenRepository.create(
      user.id,
      resetToken,
      TOKENTYPE.RESET_TOKEN,
      resetTokenExpiresAt,
    );

    await EmailService.sendPasswordReset(
      user.email,
      user.firstName,
      `${env.CLIENT_URL}/reset-password/${encodeURIComponent(resetToken)}`,
    ).catch(() => undefined);
    return { message: "Password reset link sent" };
  },

  async resetPassword(dto: ResetPasswordDto, token: string) {
    // 1. Decode JWT
    let decoded: any;

    decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    if (!decoded) throw new AppError("Reset link is invalid or expired", 400);

    // 2. Check token type
    if (decoded.type !== "password_reset_token") {
      throw new AppError("Invalid token type", 400);
    }

    const savedToken = await tokenRepository.findByToken(token);
    if (!savedToken)
      throw new AppError("Reset link has already been used or is invalid", 400);

    if (savedToken.expiresAt < new Date()) {
      await tokenRepository.deleteByToken(token);
      throw new AppError(
        "Reset link has expired. Please request a new one.",
        400,
      );
    }

    const user = await UserRepository.findById(decoded.sub);
    if (!user) throw new AppError("User not found", 404);

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    user.password = hashedPassword;
    await UserRepository.save(user);

    await revokeAllUserTokens(user.id);

    return { message: "Password reset successful" };
  },

  async handleGoogleAuth(profile: GoogleProfile) {
    const firstName = profile.name?.firstName || "User";
    const lastName = profile.name?.lastName || "";
    const email = profile.emails?.[0]?.value;

    if (!email) {
      throw new AppError(
        "Google profile did not include an email address",
        400,
      );
    }

    let user = await UserRepository.findByEmail(email);
    let isNewUser = false;

    if (user) {
      if (user.authProvider !== AUTHPROVIDER.GOOGLE) {
        throw new AppError(
          "This email is registered with a password. Please log in with your password.",
          401,
        );
      }
    } else {
      isNewUser = true;
      await UserRepository.findByEmail(email);
      user = await UserRepository.save({
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: "",
        authProvider: AUTHPROVIDER.GOOGLE,
        role: ROLE.USER as any,
        isAccountVerified: true,
      });
    }

    if (isNewUser) {
      await EmailService.sendWelcome(user.email, user.firstName).catch(
        () => undefined,
      );
    }

    const tokens = generateTokens(user.id);
    await storeRefreshToken(user.id, tokens.refreshToken);

    return {
      ...tokens,
      user,
    };
  },

  async login(dto: LoginDto) {
    // 1. find user with email
    const user = await UserRepository.findByEmail(dto.email);
    if (!user) throw new AppError("User not found with this email", 404);

    if (user.status === USERSTATUS.SUSPENDED) {
      throw new AppError(
        "Your account has been suspended. Please contact support.",
        403,
      );
    }

    // 2. Verifying the password
    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) throw new AppError("Invalid email or password", 401);

    // 4. Generate token and its expiry date
    const tokens = generateTokens(user.id);

    await storeRefreshToken(user.id, tokens.refreshToken);

    // 7. returning the user together with the token
    return {
      ...tokens,
      user,
    };
  },

  async refreshToken(token: string) {
    const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as {
      sub: string;
    };

    if (!payload) {
      throw new AppError("Invalid refresh token ", 401);
    }

    const savedToken = await redisClient.get(`refresh_token:${token}`);
    if (!savedToken)
      throw new AppError(
        "Invalid or expired refresh token. Please log in again.",
        401,
      );

    if (savedToken !== token) {
      throw new AppError("Invalid refresh token. Please log in again.", 401);
    }

    await redisClient.del(`refresh_token:${token}`);

    const { accessToken, refreshToken } = generateTokens(payload.sub);

    await storeRefreshToken(payload.sub, refreshToken);
    return { accessToken, refreshToken };
  },

  async logout(userId: string, token: string) {
    const tokenInRedis = await redisClient.get(`refresh_token:${token}`);
    if (tokenInRedis && tokenInRedis !== token) {
      throw new AppError("Invalid refresh token. Please log in again.", 401);
    }
    await revokeAllUserTokens(userId);
  },
};
