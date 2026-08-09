import type { NextApiRequest, NextApiResponse } from "next";
import MailChecker from "mailchecker";
import { pool } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { EMAIL_RE, USERNAME_RE, isPasswordValid, PASSWORD_HINT, USERNAME_HINT } from "@/lib/validation";
import { verifyTurnstileToken, getClientIp } from "@/lib/turnstile";
import { generateVerificationToken } from "@/lib/verificationToken";
import { sendVerificationEmail } from "@/lib/mailer";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const { email, password, name, turnstileToken } = req.body ?? {};

  if (typeof turnstileToken !== "string" || turnstileToken.length === 0) {
    return res.status(400).json({ error: "Verifikasi captcha wajib diisi" });
  }
  const captchaOk = await verifyTurnstileToken(turnstileToken, getClientIp(req));
  if (!captchaOk) {
    return res.status(400).json({ error: "Verifikasi captcha gagal, coba lagi" });
  }

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

  if (!MailChecker.isValid(normalizedEmail)) {
    return res.status(400).json({ error: "Gunakan alamat email permanen, bukan email sementara" });
  }

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
    const { rawToken, tokenHash, expiresAt } = generateVerificationToken();

    await pool.query(
      `INSERT INTO app_user (email, password_hash, name, email_verified, verification_token, verification_token_expires, verification_sent_at)
       VALUES ($1, $2, $3, false, $4, $5, now())`,
      [normalizedEmail, passwordHash, name, tokenHash, expiresAt]
    );

    // Akun sudah tersimpan di titik ini. Kegagalan kirim email di bawah ini
    // tidak boleh membuat request ini dianggap gagal total (user sudah
    // terdaftar) - cukup dicatat, user bisa pakai "kirim ulang" di halaman login.
    try {
      await sendVerificationEmail(normalizedEmail, name, rawToken);
    } catch (emailErr) {
      console.error("register: gagal mengirim email verifikasi:", emailErr);
    }

    return res.status(201).json({
      message: "Pendaftaran berhasil. Cek email kamu untuk verifikasi sebelum bisa masuk.",
    });
  } catch (err: any) {
    if (err?.code === "23505") {
      return res.status(409).json({ error: "Email atau username sudah dipakai" });
    }
    console.error("register error:", err);
    return res.status(500).json({ error: "Gagal mendaftar" });
  }
}
