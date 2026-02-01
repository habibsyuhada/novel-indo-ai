import type { NextApiRequest, NextApiResponse } from "next";
import { pool } from "@/lib/db";

type NovelRow = {
  id: number;
  name: string;
  description: string;
  year: number;
  genre: string;
  tag: string | null;
  status: number;
  cover: string | null;
  url: string | null;
  updated_date: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method Not Allowed" });

  const id = typeof req.query.id === "string" ? req.query.id : "";
  // if (!/^\d+$/.test(id)) return res.status(400).json({ error: "invalid id" });

  try {
    const sql = `
      SELECT 
        n.id,
        n.name,
        n.description,
        n.year,
        n.tag,
        n.genre,
        n.cover,
        n.url,
        n.status,
        n.updated_date
      FROM public.novel n
      WHERE url = $1
      LIMIT 1
    `;
    const result = await pool.query<NovelRow>(sql, [id]);
    if (!result.rows[0]) return res.status(404).json({ error: "not found" });

    return res.status(200).json(result.rows[0]);
  } catch (err: any) {
    return res.status(500).json({ error: err?.message ?? "server error", code: err?.code });
  }
}
