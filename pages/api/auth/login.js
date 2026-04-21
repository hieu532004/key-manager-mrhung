import {
  createAdminSession,
  getAdminAccount,
  setAdminCookie,
  verifyAdminPassword,
} from "../../../lib/auth";

export default function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { username, password } = req.body || {};
  if (!verifyAdminPassword(username, password)) {
    return res.status(401).json({ error: "Sai tai khoan hoac mat khau" });
  }

  const account = getAdminAccount(username);
  const token = createAdminSession(username);
  setAdminCookie(res, token);
  return res.status(200).json({
    ok: true,
    username: String(account?.username || username || "").trim(),
    role: String(account?.role || "admin").trim().toLowerCase(),
  });
}
