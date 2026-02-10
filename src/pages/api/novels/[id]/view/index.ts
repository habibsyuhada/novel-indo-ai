import type { NextApiRequest, NextApiResponse } from "next";
import { pool } from "@/lib/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.query;
  const novelId = Array.isArray(id) ? id[0] : id;

  if (!novelId) {
    return res.status(400).json({ error: "id tidak valid" });
  }

  try {
    const result = await pool.query(
      `
      UPDATE novel
      SET
        total_view = total_view + 1,
        total_month_view = CASE
          WHEN month_view IS NULL
            OR date_trunc('month', month_view) <> date_trunc('month', now())
            THEN 1
          ELSE total_month_view + 1
        END,
        month_view = CASE
          WHEN month_view IS NULL
            OR date_trunc('month', month_view) <> date_trunc('month', now())
            THEN now()
          ELSE month_view
        END
      WHERE id = $1
      RETURNING id, total_view, total_month_view, month_view;
      `,
      [novelId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Novel tidak ditemukan" });
    }

    const novel = result.rows[0];

    return res.status(200).json({
      id: novel.id,
      total_view: novel.total_view,
      total_month_view: novel.total_month_view,
      month_view: novel.month_view,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Gagal update views" });
  }
}
