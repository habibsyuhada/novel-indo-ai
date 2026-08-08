import type { NextApiRequest, NextApiResponse } from "next";
import { pool } from "@/lib/db";
import { hashPassword, signSession, setSessionCookie } from "@/lib/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const { email, password } = req.body ?? {};

  if (typeof email !== "string" || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: "Email tidak valid" });
  }
  if (typeof password !== "string" || password.length < 6) {
    return res.status(400).json({ error: "Password minimal 6 karakter" });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const existing = await pool.query("SELECT id FROM app_user WHERE email = $1", [normalizedEmail]);
    if ((existing.rowCount ?? 0) > 0) {
      return res.status(409).json({ error: "Email sudah terdaftar" });
    }

    const passwordHash = await hashPassword(password);

    const result = await pool.query<{ id: string; email: string; name: string | null }>(
      "INSERT INTO app_user (email, password_hash) VALUES ($1, $2) RETURNING id, email, name",
      [normalizedEmail, passwordHash]
    );

    const user = result.rows[0];
    const token = await signSession({ sub: user.id, email: user.email, name: user.name });
    setSessionCookie(res, token);

    return res.status(201).json({ user });
  } catch (err: any) {
    console.error("register error:", err);
    return res.status(500).json({ error: "Gagal mendaftar" });
  }
}
