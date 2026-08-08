import type { NextApiRequest, NextApiResponse } from "next";
import { pool } from "@/lib/db";
import { hashVerificationToken } from "@/lib/verificationToken";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method Not Allowed" });

  const { token } = req.query;
  if (typeof token !== "string" || token.length === 0) {
    return res.redirect(302, "/login?verify=invalid");
  }

  const tokenHash = hashVerificationToken(token);

  try {
    const result = await pool.query(
      `UPDATE app_user
       SET email_verified = true, verification_token = NULL, verification_token_expires = NULL
       WHERE verification_token = $1 AND verification_token_expires > now() AND email_verified = false
       RETURNING id`,
      [tokenHash]
    );

    if ((result.rowCount ?? 0) === 0) {
      return res.redirect(302, "/login?verify=invalid");
    }

    return res.redirect(302, "/login?verify=success");
  } catch (err) {
    console.error("verify-email error:", err);
    return res.redirect(302, "/login?verify=error");
  }
}
