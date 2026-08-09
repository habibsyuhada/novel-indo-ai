import type { NextApiRequest, NextApiResponse } from "next";
import { pool } from "@/lib/db";
import { EMAIL_RE } from "@/lib/validation";
import { generateVerificationToken, VERIFICATION_RESEND_COOLDOWN_MS } from "@/lib/verificationToken";
import { sendVerificationEmail } from "@/lib/mailer";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const { email } = req.body ?? {};
  if (typeof email !== "string" || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: "Email tidak valid" });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const genericResponse = { message: "Kalau email kamu terdaftar dan belum diverifikasi, link baru sudah dikirim." };

  try {
    const result = await pool.query<{
      id: string;
      name: string | null;
      email_verified: boolean;
      verification_sent_at: Date | null;
    }>(
      "SELECT id, name, email_verified, verification_sent_at FROM app_user WHERE email = $1",
      [normalizedEmail]
    );

    const row = result.rows[0];
    if (!row || row.email_verified) {
      return res.status(200).json(genericResponse);
    }

    if (row.verification_sent_at) {
      const elapsed = Date.now() - new Date(row.verification_sent_at).getTime();
      if (elapsed < VERIFICATION_RESEND_COOLDOWN_MS) {
        return res.status(429).json({ error: "Tunggu sebentar sebelum mengirim ulang email verifikasi" });
      }
    }

    const { rawToken, tokenHash, expiresAt } = generateVerificationToken();

    await pool.query(
      `UPDATE app_user
       SET verification_token = $1, verification_token_expires = $2, verification_sent_at = now()
       WHERE id = $3`,
      [tokenHash, expiresAt, row.id]
    );

    await sendVerificationEmail(normalizedEmail, row.name, rawToken);

    return res.status(200).json(genericResponse);
  } catch (err) {
    console.error("resend-verification error:", err);
    return res.status(500).json({ error: "Gagal mengirim ulang email verifikasi" });
  }
}
