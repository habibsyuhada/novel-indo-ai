import { randomUUID } from "crypto";
import { serialize, parse } from "cookie";
import type { NextApiRequest, NextApiResponse } from "next";
import { pool } from "@/lib/db";

const ANON_COOKIE = "anon_id";
const ANON_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 2; // 2 tahun

export function readAnonToken(req: NextApiRequest): string | null {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;
  const token = parse(cookieHeader)[ANON_COOKIE];
  return token ?? null;
}

function setAnonCookie(res: NextApiResponse, token: string) {
  res.setHeader(
    "Set-Cookie",
    serialize(ANON_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: ANON_COOKIE_MAX_AGE,
    })
  );
}

// Reads (atau membuat) identitas anonim device/browser ini. Nomor #N yang
// ditampilkan ke user berasal dari id baris anonymous_identity, jadi tetap
// sama selama cookie-nya tersimpan.
export async function getOrCreateAnonymousIdentityId(req: NextApiRequest, res: NextApiResponse): Promise<number> {
  let token = readAnonToken(req);
  if (!token) {
    token = randomUUID();
    setAnonCookie(res, token);
  }

  const result = await pool.query<{ id: number }>(
    `INSERT INTO anonymous_identity (token)
     VALUES ($1)
     ON CONFLICT (token) DO UPDATE SET last_seen_at = now()
     RETURNING id`,
    [token]
  );

  return result.rows[0].id;
}
