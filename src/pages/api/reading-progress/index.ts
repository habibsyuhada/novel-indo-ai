import type { NextApiRequest, NextApiResponse } from "next";
import { pool } from "@/lib/db";
import { getSessionFromReq } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSessionFromReq(req);
  if (!session) return res.status(401).json({ error: "Belum login" });

  if (req.method === "GET") {
    const novelIdRaw = req.query.novelId;
    const novelId = Array.isArray(novelIdRaw) ? novelIdRaw[0] : novelIdRaw;
    if (!novelId || !/^\d+$/.test(novelId)) {
      return res.status(400).json({ error: "novelId tidak valid" });
    }

    try {
      const result = await pool.query<{ chapter: string }>(
        "SELECT chapter FROM reading_progress WHERE user_id = $1 AND novel_id = $2",
        [session.sub, novelId]
      );
      const chapter = result.rows[0] ? Number(result.rows[0].chapter) : null;
      return res.status(200).json({ chapter });
    } catch (err) {
      console.error("reading-progress GET error:", err);
      return res.status(500).json({ error: "Gagal mengambil progress" });
    }
  }

  if (req.method === "POST") {
    const { novelId, chapter } = req.body ?? {};
    if (!Number.isFinite(Number(novelId)) || !Number.isFinite(Number(chapter))) {
      return res.status(400).json({ error: "novelId/chapter tidak valid" });
    }

    try {
      await pool.query(
        `INSERT INTO reading_progress (user_id, novel_id, chapter)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, novel_id)
         DO UPDATE SET chapter = excluded.chapter, updated_at = now()`,
        [session.sub, Number(novelId), Number(chapter)]
      );
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error("reading-progress POST error:", err);
      return res.status(500).json({ error: "Gagal menyimpan progress" });
    }
  }

  return res.status(405).json({ error: "Method Not Allowed" });
}
