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

    // cursor = last seen id (numeric). Uses keyset pagination.
    const cursorRaw = typeof req.query.cursor === "string" ? req.query.cursor : "";
    const cursor = cursorRaw && /^\d+$/.test(cursorRaw) ? cursorRaw : null;

    const sql = cursor
      ? `
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
        LEFT JOIN public.novel_chapter c
          ON c.novel = n.id
        WHERE n.id < $1
        GROUP BY n.id
        ORDER BY n.updated_date DESC
        LIMIT ${limit}
      `
      : `
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
        LEFT JOIN public.novel_chapter c
          ON c.novel = n.id
        GROUP BY n.id
        ORDER BY n.updated_date DESC
        LIMIT ${limit}

      `;

    const result = cursor
      ? await pool.query<NovelRow>(sql, [cursor])
      : await pool.query<NovelRow>(sql);

    const nextCursor = result.rows.length ? result.rows[result.rows.length - 1].id : null;

    return res.status(200).json({
      limit,
      nextCursor,
      data: result.rows,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message ?? "server error", code: err?.code });
  }
}
