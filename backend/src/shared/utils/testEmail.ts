import { Request, Response } from "express";
import { env } from "../../config/env";
import { EmailService } from "../../modules/email/email.service";

export const testEmail = async (req: Request, res: Response) => {
  try {
    await EmailService.sendWelcome(env.SUPPORT_EMAIL, "SnapFood");

    res.status(200).json({ message: "Test email sent successfully!" });
  } catch (error) {
    console.error("Error sending test email:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res
      .status(500)
      .json({ message: "Failed to send test email", error: errorMessage });
  }
};
