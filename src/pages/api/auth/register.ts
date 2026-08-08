import type { NextApiRequest, NextApiResponse } from "next";
import { pool } from "@/lib/db";
import { hashPassword, signSession, setSessionCookie } from "@/lib/auth";
import { EMAIL_RE, USERNAME_RE, isPasswordValid, PASSWORD_HINT, USERNAME_HINT } from "@/lib/validation";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const { email, password, name } = req.body ?? {};

  if (typeof email !== "string" || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: "Email tidak valid" });
  }
  if (typeof name !== "string" || !USERNAME_RE.test(name)) {
    return res.status(400).json({ error: `Username tidak valid. ${USERNAME_HINT}` });
  }
  if (typeof password !== "string" || !isPasswordValid(password)) {
    return res.status(400).json({ error: `Password tidak memenuhi syarat. ${PASSWORD_HINT}` });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const existingEmail = await pool.query("SELECT id FROM app_user WHERE email = $1", [normalizedEmail]);
    if ((existingEmail.rowCount ?? 0) > 0) {
      return res.status(409).json({ error: "Email sudah terdaftar" });
    }

    const existingName = await pool.query("SELECT id FROM app_user WHERE name = $1", [name]);
    if ((existingName.rowCount ?? 0) > 0) {
      return res.status(409).json({ error: "Username sudah dipakai" });
    }

    const passwordHash = await hashPassword(password);

    const result = await pool.query<{ id: string; email: string; name: string | null }>(
      "INSERT INTO app_user (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name",
      [normalizedEmail, passwordHash, name]
    );

    const user = result.rows[0];
    const token = await signSession({ sub: user.id, email: user.email, name: user.name });
    setSessionCookie(res, token);

    return res.status(201).json({ user });
  } catch (err: any) {
    if (err?.code === "23505") {
      return res.status(409).json({ error: "Email atau username sudah dipakai" });
    }
    console.error("register error:", err);
    return res.status(500).json({ error: "Gagal mendaftar" });
  }
}
