import type {
  AuthResponse,
  ForgotPasswordPayload,
  LoginPayload,
  RegisterPayload,
  ResendVerificationPayload,
  ResetPasswordPayload,
  User,
} from "../types/auth.types";

import { api, unwrapMessage } from './api';
import { normalizeAuthResponse } from './auth.response';

export interface RegisterResult {
  user: User;
  accessToken: string;
  message?: string;
}

export const authService = {
  async register({
    firstName,
    lastName,
    email,
    password,
  }: RegisterPayload): Promise<RegisterResult> {
    const response = await api.post(
      '/auth/register',
      { firstName, lastName, email, password },
      { _skipAuthRefresh: true },
    );

    const session = normalizeAuthResponse(response);
    const message = (response.data as { message?: string } | undefined)?.message;

    return { user: session.user, accessToken: session.accessToken, message };
  },

  async resendVerification(payload: ResendVerificationPayload): Promise<string> {
    const response = await api.post('auth/resend-verification-email', payload, {
      _skipAuthRefresh: true,
    });
    return unwrapMessage(response, 'Verification email sent.');
  },

  async verifyEmail(token: string): Promise<string> {
    const response = await api.get(`auth/verify-email/${encodeURIComponent(token)}`, {
      _skipAuthRefresh: true,
    });
    return unwrapMessage(response, 'Email verified successfully.');
  },

  async forgotPassword(payload: ForgotPasswordPayload): Promise<string> {
    const response = await api.post('auth/forgot-password', payload, { _skipAuthRefresh: true });
    return unwrapMessage(response, 'If that email exists, a reset link is on its way.');
  },

  async resetPassword({ token, password }: ResetPasswordPayload): Promise<string> {
    const response = await api.post(
      `auth/reset-password/${encodeURIComponent(token)}`,
      { password },
      { _skipAuthRefresh: true },
    );
    return unwrapMessage(response, 'Password updated. You can sign in now.');
  },

  async login({ email, password }: LoginPayload): Promise<AuthResponse> {
    const response = await api.post(
      '/auth/login',
      { email, password },
      { _skipAuthRefresh: true },
    );

    return normalizeAuthResponse(response);
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout', undefined, { _skipAuthRefresh: true });
    } catch {
      // A failed logout must never trap the user in the app — the client-side
      // state is cleared regardless.
    }
  },

 
 

 
 


}