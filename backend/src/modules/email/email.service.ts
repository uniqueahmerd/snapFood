import transporter from '../../config/Nodemailer';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import {
  passwordResetEmail,
  verificationEmail,
  welcomeEmail,
} from './email.templates';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

async function sendEmail(options: SendEmailOptions): Promise<void> {
  try {
    const result = await transporter.sendMail({
      from: env.SENDER_EMAIL,
      ...options,
    });
    logger.info('Email sent', { messageId: result.messageId, to: options.to, subject: options.subject });
  } catch (error) {
    logger.error('Email delivery failed', {
      to: options.to,
      subject: options.subject,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export const EmailService = {
  sendWelcome(to: string, firstName: string): Promise<void> {
    const email = welcomeEmail(firstName);
    return sendEmail({ to, subject: 'Welcome to SnapFood', ...email });
  },

  sendVerification(
    to: string,
    firstName: string,
    verificationUrl: string,
  ): Promise<void> {
    const email = verificationEmail(firstName, verificationUrl);
    return sendEmail({ to, subject: 'Verify your SnapFood email', ...email });
  },

  sendPasswordReset(
    to: string,
    firstName: string,
    resetUrl: string,
  ): Promise<void> {
    const email = passwordResetEmail(firstName, resetUrl);
    return sendEmail({ to, subject: 'Reset your SnapFood password', ...email });
  },
};
