import type { NextApiRequest, NextApiResponse } from "next";
import { getSessionFromReq } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method Not Allowed" });

  const session = await getSessionFromReq(req);
  if (!session) return res.status(200).json({ user: null });

  return res.status(200).json({
    user: { id: session.sub, email: session.email, name: session.name },
  });
}
