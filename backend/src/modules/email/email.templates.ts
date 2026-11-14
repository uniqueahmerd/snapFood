import { env } from '../../config/env';

export interface RenderedEmail {
  html: string;
  text: string;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[character];
  });
}

function emailFrame(title: string, body: string): string {
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f3f7f4;font-family:Arial,Helvetica,sans-serif;color:#1f2933;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:28px 12px;background:#f3f7f4;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:580px;background:#fff;border:1px solid #e3ebe5;border-radius:10px;overflow:hidden;">
        <tr><td style="padding:22px 28px;background:#176b45;color:#fff;font-size:20px;font-weight:700;">SnapFood</td></tr>
        <tr><td style="padding:30px 28px;">
          <h1 style="margin:0 0 18px;font-size:24px;line-height:1.3;color:#17221b;">${title}</h1>
          ${body}
        </td></tr>
        <tr><td style="padding:18px 28px;background:#f7faf8;color:#66736b;font-size:12px;line-height:1.6;">Need help? <a href="mailto:${escapeHtml(env.SUPPORT_EMAIL)}" style="color:#176b45;">${escapeHtml(env.SUPPORT_EMAIL)}</a><br>© ${new Date().getFullYear()} SnapFood</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function actionLink(label: string, url: string, color: string): string {
  const safeUrl = escapeHtml(url);
  return `<p style="margin:26px 0;text-align:center;"><a href="${safeUrl}" style="display:inline-block;padding:13px 22px;border-radius:7px;background:${color};color:#fff;text-decoration:none;font-weight:700;">${label}</a></p><p style="font-size:13px;line-height:1.6;color:#66736b;">If the button does not work, copy this link into your browser:<br><a href="${safeUrl}" style="color:#176b45;word-break:break-all;">${safeUrl}</a></p>`;
}

export function welcomeEmail(firstName: string): RenderedEmail {
  const name = escapeHtml(firstName || 'there');
  return {
    html: emailFrame(
      'Welcome to SnapFood',
      `<p style="font-size:16px;line-height:1.6;">Hi ${name},</p><p style="font-size:16px;line-height:1.6;color:#4b5a50;">Thanks for joining SnapFood. Verify your email to finish setting up your account and start exploring your nutrition insights.</p>${actionLink('Open SnapFood', env.CLIENT_URL, '#176b45')}`,
    ),
    text: `Hi ${firstName || 'there'}, welcome to SnapFood. Open ${env.CLIENT_URL} to get started.`,
  };
}

export function verificationEmail(
  firstName: string,
  verificationUrl: string,
): RenderedEmail {
  const name = escapeHtml(firstName || 'there');
  return {
    html: emailFrame(
      'Verify your email address',
      `<p style="font-size:16px;line-height:1.6;">Hi ${name},</p><p style="font-size:16px;line-height:1.6;color:#4b5a50;">Confirm that this email belongs to you. This link expires in 15 minutes.</p>${actionLink('Verify email', verificationUrl, '#176b45')}<p style="font-size:13px;color:#66736b;">If you did not create a SnapFood account, you can ignore this message.</p>`,
    ),
    text: `Hi ${firstName || 'there'}, verify your SnapFood email using this link: ${verificationUrl}. It expires in 15 minutes. If you did not create an account, ignore this email.`,
  };
}

export function passwordResetEmail(
  firstName: string,
  resetUrl: string,
): RenderedEmail {
  const name = escapeHtml(firstName || 'there');
  return {
    html: emailFrame(
      'Reset your password',
      `<p style="font-size:16px;line-height:1.6;">Hi ${name},</p><p style="font-size:16px;line-height:1.6;color:#4b5a50;">We received a request to reset your SnapFood password. Use this link within 15 minutes.</p>${actionLink('Reset password', resetUrl, '#bd5417')}<p style="font-size:13px;color:#66736b;">If you did not request a reset, ignore this email. Your password will remain unchanged.</p>`,
    ),
    text: `Hi ${firstName || 'there'}, reset your SnapFood password using this link: ${resetUrl}. It expires in 15 minutes. If you did not request a reset, ignore this email.`,
  };
}
