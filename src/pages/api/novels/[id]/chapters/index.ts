// src/pages/api/novels/[id]/chapters/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { pool } from "@/lib/db";

type ChapterListItem = {
  id: number;
  chapter: number;
  title: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method Not Allowed" });

  const novelId = typeof req.query.id === "string" ? req.query.id : "";
  if (!/^\d+$/.test(novelId)) return res.status(400).json({ error: "invalid novel id" });

  const pageRaw = typeof req.query.page === "string" ? req.query.page : "1";
  const limitRaw = typeof req.query.limit === "string" ? req.query.limit : "50";

  const page = Math.max(parseInt(pageRaw, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(limitRaw, 10) || 50, 1), 200);
  const offset = (page - 1) * limit;

  try {
    const countSql = `
      SELECT count(*)::int AS count
      FROM public.novel_chapter
      WHERE novel = $1
    `;

    const listSql = `
      SELECT id, chapter, title
      FROM public.novel_chapter
      WHERE novel = $1
      ORDER BY chapter ASC
      LIMIT $2 OFFSET $3
    `;

    const [countResult, listResult] = await Promise.all([
      pool.query<{ count: number }>(countSql, [novelId]),
      pool.query<ChapterListItem>(listSql, [novelId, limit, offset]),
    ]);

    const total = countResult.rows[0]?.count ?? 0;
    const totalPages = Math.max(Math.ceil(total / limit), 1);

    return res.status(200).json({
      page,
      limit,
      total,
      totalPages,
      data: listResult.rows,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message ?? "server error", code: err?.code });
  }
}

// create index if not exists novel_chapter_novel_chapter_idx
// on public.novel_chapter (novel, chapter);