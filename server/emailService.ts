import { Resend } from 'resend';

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  previewUrl?: string | false;
  error?: string;
  deliveredTo?: string;
}

let cachedResend: Resend | null = null;

function getResendClient(): Resend | null {
  if (cachedResend) return cachedResend;
  const apiKey = process.env.RESEND_API_KEY || '';
  if (!apiKey) {
    console.warn('[Email Service] RESEND_API_KEY not set — email sending disabled.');
    return null;
  }
  cachedResend = new Resend(apiKey);
  return cachedResend;
}

/**
 * Send real 6-digit verification code to the user's email address via Resend
 */
export async function sendVerificationEmail(
  toEmail: string,
  userName: string,
  verificationCode: string
): Promise<EmailSendResult> {
  const fromAddress = process.env.EMAIL_FROM || '"PipTraderAI" <noreply@piptraderai.com>';
  const cleanName = userName?.trim() || 'Trader';
  const cleanEmail = toEmail.trim().toLowerCase();

  const textBody = `Hello ${cleanName},

Thank you for registering with PipTraderAI.

Your verification code is:

${verificationCode}

Enter this 6-digit code in the application to verify your email address.

This code will expire after 10 minutes.

If you did not create this account, you can ignore this email.

Regards,
PipTraderAI Team
`;

  const htmlBody = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Account</title>
</head>
<body style="margin: 0; padding: 0; background-color: #07080d; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #07080d; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #0d0f1a; border: 1px solid #1f2438; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6);" cellspacing="0" cellpadding="0">

          <tr>
            <td style="padding: 32px 32px 20px 32px; text-align: center; border-bottom: 1px solid #181d2e;">
              <table role="presentation" align="center" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="background: linear-gradient(135deg, #6366f1, #a855f7); width: 36px; height: 36px; border-radius: 10px; text-align: center; vertical-align: middle; color: #ffffff; font-size: 20px; font-weight: bold;">
                    ✦
                  </td>
                  <td style="padding-left: 12px; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">
                    PipTraderAI
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 32px 32px 24px 32px;">
              <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #ffffff; line-height: 1.3;">
                Verify Your Account
              </h1>

              <p style="margin: 0 0 16px 0; font-size: 15px; color: #94a3b8; line-height: 1.6;">
                Hello <strong style="color: #ffffff;">${cleanName}</strong>,
              </p>

              <p style="margin: 0 0 24px 0; font-size: 15px; color: #94a3b8; line-height: 1.6;">
                Thank you for registering. Enter the 6-digit verification code below in the application to verify your email address and activate your account.
              </p>

              <div style="margin: 28px 0; padding: 20px; background-color: #121626; border: 1px solid #28304d; border-radius: 14px; text-align: center;">
                <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; color: #818cf8; font-weight: 700; margin-bottom: 8px;">
                  Your Verification Code
                </div>
                <div style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #38bdf8; text-shadow: 0 0 15px rgba(56, 189, 248, 0.4);">
                  ${verificationCode}
                </div>
                <div style="margin-top: 10px; font-size: 12px; color: #64748b;">
                  Expires in <strong style="color: #cbd5e1;">10 minutes</strong>
                </div>
              </div>

              <p style="margin: 0 0 12px 0; font-size: 13.5px; color: #94a3b8; line-height: 1.5;">
                This code will expire after a limited period. If you did not create this account, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 20px 32px 28px 32px; background-color: #0a0c16; border-top: 1px solid #151928; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 12px; color: #475569;">
                Automated Security Delivery from PipTraderAI Platform
              </p>
              <p style="margin: 0; font-size: 11px; color: #334155;">
                &copy; 2026 PipTraderAI Technologies. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const resend = getResendClient();
  if (!resend) {
    return { success: false, error: 'Email service not configured (missing RESEND_API_KEY)' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: cleanEmail,
      subject: 'Verify Your Account',
      text: textBody,
      html: htmlBody,
    });

    if (error) {
      console.error(`[Email Service Error] Resend rejected email to ${cleanEmail}:`, error);
      return { success: false, error: error.message || 'Resend send failed' };
    }

    console.log(`[Email Service] Verification email dispatched to ${cleanEmail}. MessageId: ${data?.id || 'unknown'}`);
    return { success: true, messageId: data?.id, deliveredTo: cleanEmail };
  } catch (err: any) {
    console.error(`[Email Service Error] Failed to dispatch verification email to ${cleanEmail}:`, err);
    return { success: false, error: err.message || 'Failed to send email verification code' };
  }
}