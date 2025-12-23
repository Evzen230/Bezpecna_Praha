import { appendFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

// Email storage directory
const emailDir = join(process.cwd(), "emails");

function ensureEmailDir() {
  if (!existsSync(emailDir)) {
    mkdirSync(emailDir, { recursive: true });
  }
}

/**
 * Send email - currently saves to file for testing
 * Later can be replaced with SMTP provider (Gmail, Mailtrap, etc)
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    ensureEmailDir();

    const timestamp = new Date().toISOString();
    const emailContent = `
================================
TO: ${options.to}
SUBJECT: ${options.subject}
TIME: ${timestamp}
================================
${options.html}
================================

`;

    const logFile = join(emailDir, "emails.log");
    appendFileSync(logFile, emailContent);

    console.log(`[EMAIL] Sent to ${options.to}: ${options.subject}`);
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
