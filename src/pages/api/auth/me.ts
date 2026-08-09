import type { NextApiRequest, NextApiResponse } from "next";
import { pool } from "@/lib/db";
import { getSessionFromReq } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method Not Allowed" });

  const session = await getSessionFromReq(req);
  if (!session) return res.status(200).json({ user: null });

  const result = await pool.query<{ is_admin: boolean }>("SELECT is_admin FROM app_user WHERE id = $1", [session.sub]);
  const isAdmin = result.rows[0]?.is_admin ?? false;

  return res.status(200).json({
    user: { id: session.sub, email: session.email, name: session.name, isAdmin },
  });
}
