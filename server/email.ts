import nodemailer from "nodemailer";
import { decrypt } from "./auth";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

// Create transporter - uses Gmail SMTP via App Password
const createTransporter = () => {
  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailAppPassword) {
    console.warn("[EMAIL] Gmail credentials not configured. Emails will not be sent.");
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser,
      pass: gmailAppPassword,
    },
  });
};

let transporter: nodemailer.Transporter | null = null;

/**
 * Send email via Gmail SMTP
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    if (!transporter) {
      transporter = createTransporter();
    }

    if (!transporter) {
      console.error("[EMAIL] Gmail transporter not configured");
      return false;
    }

    const decryptedTo = decrypt(options.to);

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: decryptedTo,
      subject: options.subject,
      html: options.html,
    });

    console.log(`[EMAIL] Sent to ${decryptedTo}: ${options.subject}`);
    return true;
  } catch (error) {
    console.error("[EMAIL] Failed to send:", error);
    return false;
  }
}

/**
 * Send verification email
 */
export async function sendVerificationEmail(email: string, verificationCode: string): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: "Ověřte svou e-mailovou adresu",
    html: `
<h2>Ověření e-mailu</h2>
<p>Váš ověřovací kód:</p>
<h1 style="color: #2563eb; font-size: 32px; letter-spacing: 5px;">${verificationCode}</h1>
<p>Tento kód vyprší za 24 hodin.</p>
<p>Pokud jste si nezaregistrovali účet, ignorujte tento e-mail.</p>
`,
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, resetCode: string): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: "Resetování hesla",
    html: `
<h2>Resetování hesla</h2>
<p>Váš reset kód:</p>
<h1 style="color: #2563eb; font-size: 32px; letter-spacing: 5px;">${resetCode}</h1>
<p>Tento kód vyprší za 24 hodin.</p>
<p>Pokud jste nežádali resetování hesla, ignorujte tento e-mail.</p>
`,
  });
}
