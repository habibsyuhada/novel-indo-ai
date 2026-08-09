import type { NextApiRequest } from "next";
import { pool } from "@/lib/db";
import { getSessionFromReq, SessionPayload } from "@/lib/auth";

// is_admin hanya diubah langsung lewat database, jadi selalu dicek live ke DB
// (bukan dari klaim JWT) supaya perubahan langsung berlaku tanpa perlu re-login.
export async function requireAdminSession(req: NextApiRequest): Promise<SessionPayload | null> {
  const session = await getSessionFromReq(req);
  if (!session) return null;

  const result = await pool.query<{ is_admin: boolean }>("SELECT is_admin FROM app_user WHERE id = $1", [session.sub]);
  if (!result.rows[0]?.is_admin) return null;

  return session;
}
