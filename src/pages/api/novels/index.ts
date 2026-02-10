import type { NextApiRequest, NextApiResponse } from "next";
import { pool } from "@/lib/db";

type NovelRow = {
  id: number;
  name: string;
  genre: string;
  tag: string | null;
  status: number;
  cover: string | null;
  url: string | null;
  updated_date: string;
  total_chapters: number;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const limit = 12;

    const pageRaw = typeof req.query.page === "string" ? req.query.page : "1";
    const page = /^\d+$/.test(pageRaw) ? Math.max(parseInt(pageRaw, 10), 1) : 1;

    const offset = (page - 1) * limit;

    const isHiddenRaw = typeof req.query.isHidden === "string" ? req.query.isHidden : "0";
    const isHidden = (isHiddenRaw === "0" || isHiddenRaw === "1") ? isHiddenRaw : "0";

    const sql = `
      SELECT
        n.id,
        n.name,
        n.tag,
        n.genre,
        n.cover,
        n.url,
        n.status,
        n.updated_date,
        COUNT(c.id)::int AS total_chapters
      FROM public.novel n
      LEFT JOIN public.novel_chapter c ON c.novel = n.id
      WHERE n.is_hidden = $1
      GROUP BY n.id
      ORDER BY n.updated_date DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await pool.query<NovelRow>(sql, [isHidden, limit, offset]);

    const hasMore = result.rows.length === limit;
    return res.status(200).json({
      limit,
      page,
      nextPage: hasMore ? page + 1 : null,
      data: result.rows,
    });

  } catch (err: any) {
    return res.status(500).json({ error: err?.message ?? "server error", code: err?.code });
  }
}
