import type { NextApiRequest, NextApiResponse } from "next";
import { pool } from "@/lib/db";
import { EMAIL_RE } from "@/lib/validation";
import { generatePasswordResetToken, PASSWORD_RESET_RESEND_COOLDOWN_MS } from "@/lib/passwordResetToken";
import { sendPasswordResetEmail } from "@/lib/mailer";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const { email } = req.body ?? {};
  if (typeof email !== "string" || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: "Email tidak valid" });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const genericResponse = { message: "Kalau email kamu terdaftar, link reset password sudah dikirim." };

  try {
    const result = await pool.query<{
      id: string;
      name: string | null;
      password_reset_sent_at: Date | null;
    }>(
      "SELECT id, name, password_reset_sent_at FROM app_user WHERE email = $1",
      [normalizedEmail]
    );

    const row = result.rows[0];
    if (!row) {
      return res.status(200).json(genericResponse);
    }

    if (row.password_reset_sent_at) {
      const elapsed = Date.now() - new Date(row.password_reset_sent_at).getTime();
      if (elapsed < PASSWORD_RESET_RESEND_COOLDOWN_MS) {
        return res.status(200).json(genericResponse);
      }
    }

    const { rawToken, tokenHash, expiresAt } = generatePasswordResetToken();

    await pool.query(
      `UPDATE app_user
       SET password_reset_token = $1, password_reset_token_expires = $2, password_reset_sent_at = now()
       WHERE id = $3`,
      [tokenHash, expiresAt, row.id]
    );

    await sendPasswordResetEmail(normalizedEmail, row.name, rawToken);

    return res.status(200).json(genericResponse);
  } catch (err) {
    console.error("forgot-password error:", err);
    return res.status(500).json({ error: "Gagal mengirim link reset password" });
  }
}
