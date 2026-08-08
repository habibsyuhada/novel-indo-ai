import type { NextApiRequest, NextApiResponse } from "next";
import { pool } from "@/lib/db";
import { getSessionFromReq } from "@/lib/auth";

type HistoryRow = {
  novel_id: number;
  name: string;
  cover: string | null;
  url: string | null;
  chapter: string;
  updated_at: string;
  total_chapters: number;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method Not Allowed" });

  const session = await getSessionFromReq(req);
  if (!session) return res.status(401).json({ error: "Belum login" });

  try {
    const result = await pool.query<HistoryRow>(
      `SELECT
        n.id AS novel_id,
        n.name,
        n.cover,
        n.url,
        rp.chapter,
        rp.updated_at,
        COUNT(c.id)::int AS total_chapters
      FROM reading_progress rp
      JOIN novel n ON n.id = rp.novel_id
      LEFT JOIN novel_chapter c ON c.novel = n.id
      WHERE rp.user_id = $1
      GROUP BY n.id, rp.chapter, rp.updated_at
      ORDER BY rp.updated_at DESC`,
      [session.sub]
    );

    const data = result.rows.map((row) => ({
      novelId: row.novel_id,
      name: row.name,
      cover: row.cover,
      url: row.url,
      chapter: Number(row.chapter),
      totalChapters: row.total_chapters,
      updatedAt: row.updated_at,
    }));

    return res.status(200).json({ data });
  } catch (err) {
    console.error("reading-progress list error:", err);
    return res.status(500).json({ error: "Gagal mengambil riwayat baca" });
  }
}
