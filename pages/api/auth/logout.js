import { clearAdminCookie } from "../../../lib/auth";

export default function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
  clearAdminCookie(res);
  return res.status(200).json({ ok: true });
}
