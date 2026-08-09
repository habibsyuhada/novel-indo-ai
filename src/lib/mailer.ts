import { Resend } from "resend";

function getResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY env var is not set");
  return new Resend(apiKey);
}

function getAppUrl(): string {
  return process.env.APP_URL ?? "http://localhost:3001";
}

export async function sendVerificationEmail(to: string, name: string | null, rawToken: string): Promise<void> {
  const from = process.env.EMAIL_FROM;
  if (!from) throw new Error("EMAIL_FROM env var is not set");

  const verifyUrl = `${getAppUrl()}/api/auth/verify-email?token=${rawToken}`;

  await getResend().emails.send({
    from,
    to,
    subject: "Verifikasi email kamu - Baca Novel Indo",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Halo${name ? ` ${name}` : ""},</h2>
        <p>Terima kasih sudah mendaftar di Baca Novel Indo. Klik tombol di bawah untuk memverifikasi email kamu:</p>
        <p style="margin: 24px 0;">
          <a href="${verifyUrl}" style="background:#4f46e5;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;">
            Verifikasi Email
          </a>
        </p>
        <p>Atau salin link ini ke browser kamu:</p>
        <p><a href="${verifyUrl}">${verifyUrl}</a></p>
        <p>Link ini berlaku selama 24 jam. Kalau kamu tidak merasa mendaftar, abaikan email ini.</p>
      </div>
    `,
  });
}
