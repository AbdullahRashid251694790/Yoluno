import { Resend } from 'resend';

// Lazy getters to avoid ESM import hoisting issues with dotenv
function getFromEmail(): string {
  return process.env.FROM_EMAIL || 'Yoluno <noreply@yoluno.ai>';
}

function getAppUrl(): string {
  return process.env.APP_URL || process.env.FRONTEND_URL || 'https://yoluno.up.railway.app';
}

// Lazy-init to avoid crashing on startup if RESEND_API_KEY is not set
let resend: Resend | null = null;
function getResend(): Resend {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export async function sendVerificationEmail(to: string, token: string): Promise<void> {
  const verifyUrl = `${getAppUrl()}/verify-email?token=${token}`;

  await getResend().emails.send({
    from: getFromEmail(),
    to,
    subject: 'Verify your Yoluno account',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #6366f1;">Welcome to Yoluno!</h2>
        <p>Please verify your email address by clicking the button below:</p>
        <a href="${verifyUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">
          Verify Email
        </a>
        <p style="color: #666; font-size: 14px;">Or copy this link: ${verifyUrl}</p>
        <p style="color: #999; font-size: 12px;">This link expires in 24 hours.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const resetUrl = `${getAppUrl()}/reset-password?token=${token}`;

  await getResend().emails.send({
    from: getFromEmail(),
    to,
    subject: 'Reset your Yoluno password',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #6366f1;">Password Reset</h2>
        <p>You requested a password reset. Click the button below to set a new password:</p>
        <a href="${resetUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">
          Reset Password
        </a>
        <p style="color: #666; font-size: 14px;">Or copy this link: ${resetUrl}</p>
        <p style="color: #999; font-size: 12px;">This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
      </div>
    `,
  });
}
