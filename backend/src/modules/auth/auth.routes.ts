import { Router } from "express";
import passport from "passport";
import { env, isGoogleOAuthConfigured } from "../../config/env";
import { authController } from "./auth.controller";
import { validateDto } from "../../shared/midddleware/validate";
import { RegisterDto } from "./dtos/register.dto";
import { LoginDto } from "./dtos/login.dto";
import { authenticate } from "../../shared/midddleware/auth.middleware";
import { ForgotPasswordDto } from "./dtos/forgotPassword.dto";
import { ResetPasswordDto } from "./dtos/resetPassword.dto";

const router = Router();

router.post("/register", validateDto(RegisterDto), authController.register);

router.post(
  "/resend-verification-email",
  authController.resendVerificationEmail,
);

router.get("/verify-email/:token", authController.verifyEmail);

router.post(
  "/forgot-password",
  validateDto(ForgotPasswordDto),
  authController.forgotPassword,
);

router.post(
  "/reset-password/:token",
  validateDto(ResetPasswordDto),
  authController.resetPassword,
);

router.get("/me", authenticate, authController.getMe);

router.post("/login", validateDto(LoginDto), authController.login); //tested

router.post("/refresh-token", authController.refreshToken); //tested

router.post("/logout", authController.logout);

router.get("/google", (req, res, next) => {
  if (!isGoogleOAuthConfigured) {
    res.status(503).json({
      success: false,
      message: "Google sign-in is not configured on this server.",
    });
    return;
  }
  authController.googleAuthStart(req, res, next);
});

router.get(
  "/google/callback",
  (req, res, next) => {
    if (!isGoogleOAuthConfigured) {
      res.status(503).json({
        success: false,
        message: "Google sign-in is not configured on this server.",
      });
      return;
    }
    passport.authenticate("google", {
      session: false,
      failureRedirect: `${env.CLIENT_URL}/login?error=google_auth_failed`,
    })(req, res, next);
  },
  authController.googleAuthCallback,
);

export const authRouter: Router = router;
