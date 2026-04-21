import clientPromise from "../../lib/mongodb";
import { isSupportAdmin, requireAdmin } from "../../lib/auth";
import {
  LEGACY_LICENSE_ROWS,
  LEGACY_LICENSE_SEED_ID,
} from "../../lib/legacy-licenses";
import {
  buildLicenseDoc,
  COLLECTION_NAME,
  DB_NAME,
  effectiveLicenseState,
  licenseKeyHash,
  normalizeLicenseKey,
  normalizeStatus,
  parseExpiration,
  parseImportedRows,
  publicLicenseDoc,
} from "../../lib/security";

let indexesReady = false;
let legacySeedReady = false;
const SUPPORT_TRIAL_MAX_DAYS = 10;

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function errorStatus(err) {
  const status = Number(err?.status || err?.statusCode || 500);
  return status >= 400 && status < 600 ? status : 500;
}

function localDateStringPlus(days) {
  const dt = new Date();
  dt.setDate(dt.getDate() + days);
  const year = dt.getFullYear();
  const month = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function supportTrialLimitDate() {
  return parseExpiration(localDateStringPlus(SUPPORT_TRIAL_MAX_DAYS));
}

function assertSupportCanSave(admin, input, action = "save") {
  if (!isSupportAdmin(admin)) return;

  if (action === "import") {
    throw httpError(403, "Support khong duoc import du lieu hang loat.");
  }
  if (action === "delete") {
    throw httpError(403, "Support khong duoc xoa license.");
  }

  const expiresAt = parseExpiration(input.expiration || input.time || input.expiresAt);
  if (!expiresAt) {
    throw httpError(400, "Support chi duoc kich key dung thu co ngay het han.");
  }

  if (expiresAt.getTime() > supportTrialLimitDate().getTime()) {
    throw httpError(
      403,
      `Support chi duoc kich key dung thu toi da ${SUPPORT_TRIAL_MAX_DAYS} ngay.`
    );
  }

  if (normalizeStatus(input.status || "Active") !== "Active") {
    throw httpError(403, "Support chi duoc kich key dung thu trang thai Active.");
  }
}

async function getCollection() {
  const client = await clientPromise;
  const collection = client.db(DB_NAME).collection(COLLECTION_NAME);
  if (!indexesReady) {
    await collection.createIndex(
      { keyHash: 1 },
      {
        unique: true,
        partialFilterExpression: { keyHash: { $type: "string" } },
      }
    );
    await collection.createIndex({ machineId: 1 });
    await collection.createIndex({ expiresAt: 1 });
    await collection.createIndex({ status: 1 });
    indexesReady = true;
  }
  return collection;
}

async function expireOldLicenses(collection) {
  const now = new Date();
  await collection.updateMany(
    {
      expiresAt: { $type: "date", $lt: now },
      status: "Active",
    },
    {
      $set: {
        status: "Expired",
        active: false,
        updatedAt: now,
      },
    }
  );
}

async function migrateLegacyDocs(collection) {
  const legacyDocs = await collection
    .find({ keyHash: { $exists: false }, key: { $exists: true } })
    .limit(500)
    .toArray();
  for (const legacy of legacyDocs) {
    const key = normalizeLicenseKey(legacy.key);
    if (!key) continue;
    await upsertLicense(collection, {
      licenseKey: key,
      machineId: legacy.machineId || legacy.machineID || "",
      expiration: legacy.time || legacy.expiration || "",
      ownerName: legacy.name || legacy.ownerName || "",
      ownerPhone: legacy.phone || legacy.ownerPhone || "",
      status: legacy.status || "Active",
    });
    await collection.deleteOne({ _id: legacy._id });
  }
}

async function ensureLegacyLicensesSeeded(collection) {
  if (legacySeedReady || process.env.DISABLE_LEGACY_LICENSE_SEED === "1") {
    return { seeded: false, imported: 0, failed: 0 };
  }

  const client = await clientPromise;
  const meta = client.db(DB_NAME).collection(`${COLLECTION_NAME}_meta`);
  const seeded = await meta.findOne({ _id: LEGACY_LICENSE_SEED_ID });
  if (seeded) {
    legacySeedReady = true;
    return { seeded: false, imported: 0, failed: 0 };
  }

  const rows = parseImportedRows(LEGACY_LICENSE_ROWS);
  const errors = [];
  let imported = 0;

  for (const row of rows) {
    try {
      await upsertLicense(collection, row);
      imported += 1;
    } catch (err) {
      errors.push({
        licenseKey: row.licenseKey || row.key || "",
        error: err.message || "Seed failed",
      });
    }
  }

  if (!imported && errors.length) {
    throw new Error(
      `Legacy license seed failed before saving any key: ${errors[0].error}`
    );
  }

  await meta.updateOne(
    { _id: LEGACY_LICENSE_SEED_ID },
    {
      $set: {
        imported,
        failed: errors.length,
        errors: errors.slice(0, 50),
        seededAt: new Date(),
      },
    },
    { upsert: true }
  );
  legacySeedReady = true;
  return { seeded: true, imported, failed: errors.length };
}

async function upsertLicense(collection, input) {
  const licenseKey = normalizeLicenseKey(input.licenseKey || input.key);
  const existing = licenseKey
    ? await collection.findOne({ keyHash: licenseKeyHash(licenseKey) })
    : null;
  const built = buildLicenseDoc(input, existing);
  const now = new Date();
  const state = effectiveLicenseState(built.doc, now);
  const createdAt = existing?.createdAt || built.doc.createdAt || now;
  const doc = {
    ...built.doc,
    status: state.status,
    active: state.active,
    updatedAt: now,
    createdAt,
  };
  const updateDoc = { ...doc };
  delete updateDoc.createdAt;

  await collection.updateOne(
    { keyHash: doc.keyHash },
    {
      $set: updateDoc,
      $setOnInsert: { createdAt },
    },
    { upsert: true }
  );

  const saved = await collection.findOne({ keyHash: doc.keyHash });
  return publicLicenseDoc(saved, true);
}

export default async function handler(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  const collection = await getCollection();

  if (req.method === "GET") {
    try {
      await ensureLegacyLicensesSeeded(collection);
      await migrateLegacyDocs(collection);
      await expireOldLicenses(collection);
      const q = String(req.query.q || "").trim();
      const filter = q
        ? {
            $or: [
              { machineId: { $regex: q, $options: "i" } },
              { ownerName: { $regex: q, $options: "i" } },
              { ownerPhone: { $regex: q, $options: "i" } },
            ],
          }
        : {};
      const docs = await collection.find(filter).sort({ updatedAt: -1 }).toArray();
      return res.status(200).json({
        ok: true,
        total: docs.length,
        items: docs.map((doc) => publicLicenseDoc(doc, true)),
      });
    } catch (err) {
      console.error("GET /api/keys error:", err);
      return res.status(errorStatus(err)).json({ error: err.message || "Failed to load licenses" });
    }
  }

  if (req.method === "POST") {
    try {
      const body = req.body || {};

      if (body.action === "import") {
        assertSupportCanSave(admin, {}, "import");
        const rows = Array.isArray(body.rows)
          ? body.rows
          : parseImportedRows(body.text || "");
        const imported = [];
        const errors = [];
        for (const row of rows) {
          try {
            imported.push(await upsertLicense(collection, row));
          } catch (err) {
            errors.push({
              licenseKey: row.licenseKey || row.key || "",
              error: err.message || "Import failed",
            });
          }
        }
        return res.status(200).json({
          ok: true,
          imported: imported.length,
          failed: errors.length,
          errors,
          items: imported,
        });
      }

      const input = {
        licenseKey: body.licenseKey || body.key || "",
        machineId: body.machineId || "",
        expiration: body.expiration || body.time || "",
        ownerName: body.ownerName || body.name || "",
        ownerPhone: body.ownerPhone || "",
        status: normalizeStatus(body.status || "Active"),
      };
      assertSupportCanSave(admin, input);
      const saved = await upsertLicense(collection, {
        ...input,
      });
      return res.status(201).json({ ok: true, item: saved });
    } catch (err) {
      console.error("POST /api/keys error:", err);
      return res.status(errorStatus(err)).json({ error: err.message || "Failed to save license" });
    }
  }

  if (req.method === "PUT") {
    try {
      const body = req.body || {};
      const licenseKey = normalizeLicenseKey(body.licenseKey || body.key);
      if (!licenseKey) {
        return res.status(400).json({ error: "Missing licenseKey" });
      }
      assertSupportCanSave(admin, body);
      const saved = await upsertLicense(collection, body);
      return res.status(200).json({ ok: true, item: saved });
    } catch (err) {
      console.error("PUT /api/keys error:", err);
      return res.status(errorStatus(err)).json({ error: err.message || "Failed to update license" });
    }
  }

  if (req.method === "DELETE") {
    try {
      assertSupportCanSave(admin, {}, "delete");
      const licenseKey = normalizeLicenseKey(req.query.licenseKey || req.query.key);
      if (!licenseKey) {
        return res.status(400).json({ error: "Missing licenseKey" });
      }
      await collection.deleteOne({ keyHash: licenseKeyHash(licenseKey) });
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error("DELETE /api/keys error:", err);
      return res.status(errorStatus(err)).json({ error: err.message || "Failed to delete license" });
    }
  }

  res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}
