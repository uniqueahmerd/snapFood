import { NextFunction, Request, Response } from "express";
import passport from "passport";
import { authService } from "./auth.service";
import { AppError } from "../../shared/utils/AppError";
import { catchAsync } from "../../shared/utils/catchAsync";
import {
  clearCookieOption,
  refreshTokenCookieOption,
} from "../../shared/utils/cookieOPtions";
import { env } from "../../config/env";
import type { AuthRequest } from "../../shared/midddleware/auth.middleware";

export const authController: Record<string, any> = {
  register: catchAsync(async (req, res: Response) => {
    const result = await authService.register(req.body);

    res.cookie("refreshToken", result.refreshToken, refreshTokenCookieOption);
    res.status(201).json({
      success: true,
      message: "Registration successful",
      data: {
        accessToken: result.accessToken,
        data: result.user,
      },
    });
  }),

  getMe: catchAsync(async (req, res: Response) => {
    const userId = (req as AuthRequest).user?.userId;
    if (!userId) throw new AppError("Authentication required", 401);
    const result = await authService.getMe(userId);

    res.status(200).json({
      success: true,
      data: result,
    });
  }),

  verifyEmail: catchAsync(async (req, res: Response) => {
    const token = req.params?.token?.toString();

    if (!token) throw new AppError("No verification token", 400);
    const result = await authService.verifyEmail(token);

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
      data: result,
    });
  }),

  resendVerificationEmail: catchAsync(async (req, res: Response) => {
    const result = await authService.resendVerificationToken(req.body.email);
    res
      .status(200)
      .json({
        success: true,
        message: result.message,
      })
      .send();
  }),

  forgotPassword: catchAsync(async (req: Request, res: Response) => {
    const result = await authService.forgotPassword(req.body);

    res
      .status(200)
      .json({
        success: true,
        message: result,
      })
      .send();
  }),

  resetPassword: catchAsync(async (req: Request, res: Response) => {
    const result = await authService.resetPassword(
      req.body,
      (req as any).params.token,
    );

    res
      .status(200)
      .json({
        success: true,
        message: result.message,
      })
      .send();
  }),

  googleAuthStart: (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate("google", { scope: ["profile", "email"] })(
      req,
      res,
      next,
    );
  },

  googleAuthCallback: catchAsync(async (req, res: Response) => {
    const result = req.user as
      | {
          accessToken: string;
          refreshToken: string;
          user: unknown;
        }
      | undefined;

    if (!result) {
      throw new AppError("Google authentication failed", 401);
    }

    res.cookie("refreshToken", result.refreshToken, refreshTokenCookieOption);
    res.redirect(
      `${env.CLIENT_URL}/oauth/callback?accessToken=${result.accessToken}`,
    );
  }),

  handleGoogleLogin: catchAsync(async (req, res: Response) => {
    const result = await authService.handleGoogleAuth(req.body);

    res.cookie("refreshToken", result.refreshToken, refreshTokenCookieOption);
    res
      .status(200)
      .json({
        success: true,
        message: "Login successful",
        data: {
          accessToken: result.accessToken,
          user: result.user,
        },
      })
      .send();
  }),

  login: catchAsync(async (req, res: Response) => {
    const result = await authService.login(req.body);

    res.cookie("refreshToken", result.refreshToken, refreshTokenCookieOption);
    res
      .status(200)
      .json({
        success: true,
        message: "Login successful",
        data: {
          accessToken: result.accessToken,
          user: result.user,
        },
      })
      .send();
  }),

  refreshToken: catchAsync(async (req, res: Response) => {
    const token = req.cookies.refreshToken;

    if (!token) throw new AppError("No refresh token", 401);
    const result = await authService.refreshToken(token);
    // Refresh-token rotation replaces the Redis entry, so the browser must
    // receive the rotated token and a renewed cookie expiry as well.
    res.cookie("refreshToken", result.refreshToken, refreshTokenCookieOption);
    res
      .status(200)
      .json({
        success: "true",
        data: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
      })
      .send();
  }),

  logout: catchAsync(async (req, res: Response) => {
    const token =
      req.cookies?.refreshToken || req.headers.authorization?.split(" ")[1];
    const userId = (req as any).user?.id;

    if (!token && !userId) throw new AppError("No refresh token", 401);

    if (token) {
      await authService.logout(userId || (req as any).user?.id, token);
    } else {
      await authService.logout(userId, "");
    }

    res.clearCookie("refreshToken", clearCookieOption);
    res
      .status(200)
      .json({
        success: true,
        message: "Logout successfully",
      })
      .send();
  }),
};
