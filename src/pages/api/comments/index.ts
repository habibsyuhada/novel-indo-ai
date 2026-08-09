import type { NextApiRequest, NextApiResponse } from "next";
import { pool } from "@/lib/db";
import { getSessionFromReq } from "@/lib/auth";
import { getOrCreateAnonymousIdentityId, readAnonToken } from "@/lib/anonymousIdentity";
import { COMMENT_MIN_LENGTH, COMMENT_MAX_LENGTH } from "@/lib/validation";

type CommentRow = {
  id: number;
  body: string;
  status: string;
  created_at: string;
  author_name: string;
  is_own: boolean;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") return handleList(req, res);
  if (req.method === "POST") return handleCreate(req, res);
  return res.status(405).json({ error: "Method Not Allowed" });
}

async function handleList(req: NextApiRequest, res: NextApiResponse) {
  const chapterId = typeof req.query.chapterId === "string" ? req.query.chapterId : "";
  if (!/^\d+$/.test(chapterId)) {
    return res.status(400).json({ error: "chapterId tidak valid" });
  }

  const page = Math.max(1, parseInt(typeof req.query.page === "string" ? req.query.page : "1", 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(typeof req.query.limit === "string" ? req.query.limit : "20", 10) || 20));
  const offset = (page - 1) * limit;

  const session = await getSessionFromReq(req);
  const anonToken = readAnonToken(req);

  try {
    const result = await pool.query<CommentRow>(
      `SELECT
         c.id,
         c.body,
         c.status,
         c.created_at,
         COALESCE(u.name, 'Anonim #' || ai.id) AS author_name,
         COALESCE(c.user_id = $2, false) OR COALESCE(ai.token = $3, false) AS is_own
       FROM comment c
       LEFT JOIN app_user u ON u.id = c.user_id
       LEFT JOIN anonymous_identity ai ON ai.id = c.anonymous_identity_id
       WHERE c.chapter_id = $1
         AND (c.status = 'approved' OR c.user_id = $2 OR ai.token = $3)
       ORDER BY c.created_at DESC
       LIMIT $4 OFFSET $5`,
      [chapterId, session?.sub ?? null, anonToken, limit, offset]
    );

    const countResult = await pool.query<{ count: string }>(
      `SELECT COUNT(*) FROM comment c
       LEFT JOIN anonymous_identity ai ON ai.id = c.anonymous_identity_id
       WHERE c.chapter_id = $1
         AND (c.status = 'approved' OR c.user_id = $2 OR ai.token = $3)`,
      [chapterId, session?.sub ?? null, anonToken]
    );

    return res.status(200).json({
      page,
      limit,
      total: parseInt(countResult.rows[0].count, 10),
      data: result.rows,
    });
  } catch (err) {
    console.error("comments list error:", err);
    return res.status(500).json({ error: "Gagal mengambil komentar" });
  }
}

async function handleCreate(req: NextApiRequest, res: NextApiResponse) {
  const { chapterId, body } = req.body ?? {};

  if (typeof chapterId !== "number" && typeof chapterId !== "string") {
    return res.status(400).json({ error: "chapterId tidak valid" });
  }
  if (!/^\d+$/.test(String(chapterId))) {
    return res.status(400).json({ error: "chapterId tidak valid" });
  }

  const trimmedBody = typeof body === "string" ? body.trim() : "";
  if (trimmedBody.length < COMMENT_MIN_LENGTH || trimmedBody.length > COMMENT_MAX_LENGTH) {
    return res.status(400).json({ error: `Komentar harus ${COMMENT_MIN_LENGTH}-${COMMENT_MAX_LENGTH} karakter` });
  }

  try {
    const chapterExists = await pool.query("SELECT id FROM novel_chapter WHERE id = $1", [chapterId]);
    if ((chapterExists.rowCount ?? 0) === 0) {
      return res.status(404).json({ error: "Chapter tidak ditemukan" });
    }

    const session = await getSessionFromReq(req);

    if (session) {
      await pool.query(
        `INSERT INTO comment (chapter_id, user_id, body) VALUES ($1, $2, $3)`,
        [chapterId, session.sub, trimmedBody]
      );
    } else {
      const anonymousIdentityId = await getOrCreateAnonymousIdentityId(req, res);
      await pool.query(
        `INSERT INTO comment (chapter_id, anonymous_identity_id, body) VALUES ($1, $2, $3)`,
        [chapterId, anonymousIdentityId, trimmedBody]
      );
    }

    return res.status(201).json({ message: "Komentar terkirim, menunggu review admin" });
  } catch (err) {
    console.error("comments create error:", err);
    return res.status(500).json({ error: "Gagal mengirim komentar" });
  }
}
