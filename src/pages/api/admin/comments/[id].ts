import type { NextApiRequest, NextApiResponse } from "next";
import { pool } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PATCH") return res.status(405).json({ error: "Method Not Allowed" });

  const admin = await requireAdminSession(req);
  if (!admin) return res.status(403).json({ error: "Akses ditolak" });

  const id = typeof req.query.id === "string" ? req.query.id : "";
  if (!/^\d+$/.test(id)) return res.status(400).json({ error: "id tidak valid" });

  const { status } = req.body ?? {};
  if (status !== "approved" && status !== "rejected") {
    return res.status(400).json({ error: "status harus 'approved' atau 'rejected'" });
  }

  try {
    const result = await pool.query(
      `UPDATE comment
       SET status = $1, reviewed_at = now(), reviewed_by = $2
       WHERE id = $3
       RETURNING id`,
      [status, admin.sub, id]
    );

    if ((result.rowCount ?? 0) === 0) {
      return res.status(404).json({ error: "Komentar tidak ditemukan" });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("admin comment update error:", err);
    return res.status(500).json({ error: "Gagal memperbarui komentar" });
  }
}
