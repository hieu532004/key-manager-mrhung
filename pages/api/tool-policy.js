import { isSupportAdmin, requireAdmin } from "../../lib/auth";
import { getToolPolicy, saveToolPolicy } from "../../lib/tool-policy";

function errorStatus(err) {
  const status = Number(err?.status || err?.statusCode || 500);
  return status >= 400 && status < 600 ? status : 500;
}

export default async function handler(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  if (req.method === "GET") {
    try {
      const item = await getToolPolicy();
      return res.status(200).json({ ok: true, item });
    } catch (err) {
      return res
        .status(errorStatus(err))
        .json({ error: err.message || "Khong tai duoc cau hinh update" });
    }
  }

  if (req.method === "PUT") {
    if (isSupportAdmin(admin)) {
      return res.status(403).json({ error: "Support chi duoc xem, khong duoc sua cau hinh update." });
    }

    try {
      const body = req.body || {};
      const item = await saveToolPolicy(body);
      return res.status(200).json({ ok: true, item });
    } catch (err) {
      return res
        .status(errorStatus(err))
        .json({ error: err.message || "Khong luu duoc cau hinh update" });
    }
  }

  res.setHeader("Allow", ["GET", "PUT"]);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}
