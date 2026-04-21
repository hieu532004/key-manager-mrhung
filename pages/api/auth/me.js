import { getAdminSession } from "../../../lib/auth";

export default function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
  const session = getAdminSession(req);
  if (!session) return res.status(401).json({ ok: false });
  return res.status(200).json({
    ok: true,
    username: session.username,
    role: String(session.role || "admin").trim().toLowerCase(),
  });
}
