import type { NextApiRequest, NextApiResponse } from "next";
import { pool } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { isPasswordValid, PASSWORD_HINT } from "@/lib/validation";
import { hashPasswordResetToken } from "@/lib/passwordResetToken";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const { token, password } = req.body ?? {};

  if (typeof token !== "string" || token.length === 0) {
    return res.status(400).json({ error: "Token reset tidak valid" });
  }
  if (typeof password !== "string" || !isPasswordValid(password)) {
    return res.status(400).json({ error: `Password tidak memenuhi syarat. ${PASSWORD_HINT}` });
  }

  const tokenHash = hashPasswordResetToken(token);

  try {
    const passwordHash = await hashPassword(password);

    const result = await pool.query(
      `UPDATE app_user
       SET password_hash = $1, password_reset_token = NULL, password_reset_token_expires = NULL
       WHERE password_reset_token = $2 AND password_reset_token_expires > now()
       RETURNING id`,
      [passwordHash, tokenHash]
    );

    if ((result.rowCount ?? 0) === 0) {
      return res.status(400).json({ error: "Link reset password tidak valid atau sudah kedaluwarsa" });
    }

    return res.status(200).json({ message: "Password berhasil diubah. Silakan masuk dengan password baru." });
  } catch (err) {
    console.error("reset-password error:", err);
    return res.status(500).json({ error: "Gagal mereset password" });
  }
}
