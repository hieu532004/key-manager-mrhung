import clientPromise from "../../lib/mongodb";

const DB_NAME = process.env.MONGODB_DB || "minimax";
const COLLECTION_NAME = process.env.MONGODB_COLLECTION || "keys";

export default async function handler(req, res) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const collection = db.collection(COLLECTION_NAME);

  if (req.method === "GET") {
    try {
      const docs = await collection.find({}).sort({ _id: -1 }).toArray();
      // Python tool expects a list of objects with key, time, name
      const data = docs.map(doc => ({
        key: doc.key,
        time: doc.time,
        name: doc.name,
      }));
      return res.status(200).json(data);
    } catch (err) {
      console.error("GET /api/keys error:", err);
      return res.status(500).json({ error: "Failed to load keys" });
    }
  }

  if (req.method === "POST") {
    try {
      const { key, time, name } = req.body || {};
      if (!key || !time) {
        return res.status(400).json({ error: "key và time là bắt buộc" });
      }

      const doc = { key: String(key).trim().toUpperCase(), time: String(time).trim(), name: name ? String(name).trim() : "" };

      await collection.updateOne(
        { key: doc.key },
        { $set: doc },
        { upsert: true }
      );

      return res.status(201).json({ success: true, key: doc });
    } catch (err) {
      console.error("POST /api/keys error:", err);
      return res.status(500).json({ error: "Failed to save key" });
    }
  }

  if (req.method === "PUT") {
    try {
      const { key, time, name } = req.body || {};
      if (!key) {
        return res.status(400).json({ error: "Thiếu key để cập nhật" });
      }

      const update = {};
      if (time !== undefined) update.time = String(time).trim();
      if (name !== undefined) update.name = String(name).trim();

      await collection.updateOne(
        { key: String(key).trim().toUpperCase() },
        { $set: update }
      );

      return res.status(200).json({ success: true });
    } catch (err) {
      console.error("PUT /api/keys error:", err);
      return res.status(500).json({ error: "Failed to update key" });
    }
  }

  if (req.method === "DELETE") {
    try {
      const { key } = req.query;
      if (!key) {
        return res.status(400).json({ error: "Thiếu key để xoá" });
      }

      await collection.deleteOne({ key: String(key).trim().toUpperCase() });
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error("DELETE /api/keys error:", err);
      return res.status(500).json({ error: "Failed to delete key" });
    }
  }

  res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
