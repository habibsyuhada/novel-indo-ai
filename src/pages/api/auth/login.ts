import type { NextApiRequest, NextApiResponse } from "next";
import { pool } from "@/lib/db";
import { verifyPassword, signSession, setSessionCookie } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const { email, password } = req.body ?? {};

  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Email dan password wajib diisi" });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const result = await pool.query<{ id: string; email: string; name: string | null; password_hash: string; email_verified: boolean }>(
      "SELECT id, email, name, password_hash, email_verified FROM app_user WHERE email = $1",
      [normalizedEmail]
    );

    const row = result.rows[0];
    if (!row) {
      return res.status(401).json({ error: "Email atau password salah" });
    }

    const valid = await verifyPassword(password, row.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Email atau password salah" });
    }

    if (!row.email_verified) {
      return res.status(403).json({
        error: "Email belum diverifikasi. Cek inbox kamu atau kirim ulang link verifikasi.",
        code: "EMAIL_NOT_VERIFIED",
      });
    }

    const user = { id: row.id, email: row.email, name: row.name };
    const token = await signSession({ sub: user.id, email: user.email, name: user.name });
    setSessionCookie(res, token);

    return res.status(200).json({ user });
  } catch (err: any) {
    console.error("login error:", err);
    return res.status(500).json({ error: "Gagal masuk" });
  }
}
