import type { NextApiRequest, NextApiResponse } from "next";
import { pool } from "@/lib/db";

type ChapterRow = {
  id: number;
  novel: number; // FK column kamu (novel id)
  chapter: number;
  title: string;
  text: string;
  created_at?: string;
  updated_date?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method Not Allowed" });

  const novelId = typeof req.query.id === "string" ? req.query.id : "";
  const chapterNum = typeof req.query.chapter === "string" ? req.query.chapter : "";

  if (!/^\d+$/.test(novelId)) return res.status(400).json({ error: "invalid novel id" });
  if (!/^\d+$/.test(chapterNum)) return res.status(400).json({ error: "invalid chapter" });

  try {
    // current chapter
    const chapterSql = `
      SELECT *
      FROM public.novel_chapter
      WHERE novel = $1 AND chapter = $2
      LIMIT 1
    `;
    const chapterResult = await pool.query<ChapterRow>(chapterSql, [novelId, chapterNum]);
    const chapterData = chapterResult.rows[0];
    if (!chapterData) return res.status(404).json({ error: "not found" });

    // prev/next
    const prevSql = `
      SELECT chapter
      FROM public.novel_chapter
      WHERE novel = $1 AND chapter < $2
      ORDER BY chapter DESC
      LIMIT 1
    `;
    const nextSql = `
      SELECT chapter
      FROM public.novel_chapter
      WHERE novel = $1 AND chapter > $2
      ORDER BY chapter ASC
      LIMIT 1
    `;

    const [prevR, nextR] = await Promise.all([
      pool.query<{ chapter: number }>(prevSql, [novelId, chapterNum]),
      pool.query<{ chapter: number }>(nextSql, [novelId, chapterNum]),
    ]);

    return res.status(200).json({
      chapterData,
      prevChapter: prevR.rows[0]?.chapter ?? null,
      nextChapter: nextR.rows[0]?.chapter ?? null,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message ?? "server error", code: err?.code });
  }
}
