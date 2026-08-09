import type { NextApiRequest, NextApiResponse } from "next";
import { pool } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin";

type AdminCommentRow = {
  id: number;
  body: string;
  status: string;
  created_at: string;
  author_name: string;
  novel_id: number;
  novel_name: string;
  novel_url: string | null;
  chapter: string;
};

const ALLOWED_STATUSES = ["pending", "approved", "rejected"];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method Not Allowed" });

  const admin = await requireAdminSession(req);
  if (!admin) return res.status(403).json({ error: "Akses ditolak" });

  const status = typeof req.query.status === "string" && ALLOWED_STATUSES.includes(req.query.status)
    ? req.query.status
    : "pending";

  const page = Math.max(1, parseInt(typeof req.query.page === "string" ? req.query.page : "1", 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(typeof req.query.limit === "string" ? req.query.limit : "20", 10) || 20));
  const offset = (page - 1) * limit;

  try {
    const result = await pool.query<AdminCommentRow>(
      `SELECT
         c.id,
         c.body,
         c.status,
         c.created_at,
         COALESCE(u.name, 'Anonim #' || ai.id) AS author_name,
         n.id AS novel_id,
         n.name AS novel_name,
         n.url AS novel_url,
         nc.chapter
       FROM comment c
       JOIN novel_chapter nc ON nc.id = c.chapter_id
       JOIN novel n ON n.id = nc.novel
       LEFT JOIN app_user u ON u.id = c.user_id
       LEFT JOIN anonymous_identity ai ON ai.id = c.anonymous_identity_id
       WHERE c.status = $1
       ORDER BY c.created_at ASC
       LIMIT $2 OFFSET $3`,
      [status, limit, offset]
    );

    const countResult = await pool.query<{ count: string }>("SELECT COUNT(*) FROM comment WHERE status = $1", [status]);

    return res.status(200).json({
      page,
      limit,
      total: parseInt(countResult.rows[0].count, 10),
      data: result.rows,
    });
  } catch (err) {
    console.error("admin comments list error:", err);
    return res.status(500).json({ error: "Gagal mengambil komentar" });
  }
}
