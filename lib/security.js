import crypto from "crypto";

const DEFAULT_DB_NAME = "veo3_grok";
const DEFAULT_COLLECTION_NAME = "licenses";

export const DB_NAME = process.env.MONGODB_DB || DEFAULT_DB_NAME;
export const COLLECTION_NAME =
  process.env.MONGODB_COLLECTION || DEFAULT_COLLECTION_NAME;

function requiredSecret(name, fallback = "") {
  const value = String(process.env[name] || fallback || "").trim();
  if (!value) {
    throw new Error(`Missing required server secret: ${name}`);
  }
  return value;
}

function optionalSecret(name, fallback = "") {
  return String(process.env[name] || fallback || "").trim();
}

export function nowSeconds() {
  return Math.floor(Date.now() / 1000);
}

export function base64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function fromBase64url(input) {
  const text = String(input || "").replace(/-/g, "+").replace(/_/g, "/");
  const padded = text + "=".repeat((4 - (text.length % 4)) % 4);
  return Buffer.from(padded, "base64");
}

export function normalizeLicenseKey(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, "")
    .toUpperCase();
}

export function generateLicenseKey(prefix = "VG") {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(20);
  let body = "";
  for (const byte of bytes) {
    body += alphabet[byte % alphabet.length];
  }
  const chunks = body.match(/.{1,5}/g) || [body];
  return `${prefix}-${chunks.slice(0, 4).join("-")}`;
}

export function hmacHex(secret, payload) {
  return crypto
    .createHmac("sha256", secret)
    .update(String(payload), "utf8")
    .digest("hex");
}

export function sha256Hex(payload) {
  return crypto.createHash("sha256").update(String(payload), "utf8").digest("hex");
}

export function licenseKeyHash(licenseKey) {
  const pepper = requiredSecret("LICENSE_KEY_PEPPER");
  return hmacHex(pepper, normalizeLicenseKey(licenseKey));
}

function encryptionKey() {
  const raw =
    optionalSecret("LICENSE_DATA_ENCRYPTION_KEY") ||
    optionalSecret("LICENSE_KEY_PEPPER") ||
    optionalSecret("LICENSE_SERVER_SECRET");
  if (!raw) {
    throw new Error(
      "Missing LICENSE_DATA_ENCRYPTION_KEY or LICENSE_KEY_PEPPER for encryption"
    );
  }
  if (/^[a-f0-9]{64}$/i.test(raw)) {
    return Buffer.from(raw, "hex");
  }
  try {
    const decoded = Buffer.from(raw, "base64");
    if (decoded.length === 32) return decoded;
  } catch (_) {
    // Fall through to KDF.
  }
  return crypto.createHash("sha256").update(raw, "utf8").digest();
}

export function encryptText(value) {
  const text = String(value || "");
  if (!text) return "";
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${base64url(iv)}.${base64url(tag)}.${base64url(encrypted)}`;
}

export function decryptText(value) {
  const text = String(value || "");
  if (!text) return "";
  const parts = text.split(".");
  if (parts.length !== 4 || parts[0] !== "v1") return text;
  const [, ivRaw, tagRaw, encryptedRaw] = parts;
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    fromBase64url(ivRaw)
  );
  decipher.setAuthTag(fromBase64url(tagRaw));
  return Buffer.concat([
    decipher.update(fromBase64url(encryptedRaw)),
    decipher.final(),
  ]).toString("utf8");
}

export function parseExpiration(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;

  let year;
  let month;
  let day;

  let match = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (match) {
    year = Number(match[1]);
    month = Number(match[2]);
    day = Number(match[3]);
  } else {
    match = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (match) {
      day = Number(match[1]);
      month = Number(match[2]);
      year = Number(match[3]);
    }
  }

  if (!year || !month || !day) {
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
  }

  const dt = new Date(Date.UTC(year, month - 1, day, 23, 59, 59));
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

export function formatExpiration(value) {
  const dt = value instanceof Date ? value : parseExpiration(value);
  if (!dt) return "";
  return dt.toISOString().slice(0, 10);
}

export function normalizeStatus(value) {
  const text = String(value || "Active").trim().toLowerCase();
  if (["active", "enabled", "true", "1", "on"].includes(text)) return "Active";
  if (["expired", "het han", "hết hạn"].includes(text)) return "Expired";
  return "Inactive";
}

export function effectiveLicenseState(doc, at = new Date()) {
  const expiresAt = doc?.expiresAt ? new Date(doc.expiresAt) : null;
  const expired = Boolean(expiresAt && expiresAt.getTime() < at.getTime());
  const configuredStatus = normalizeStatus(doc?.status);
  const active = configuredStatus === "Active" && !expired;
  return {
    active,
    expired,
    status: expired ? "Expired" : configuredStatus,
    statusText: active ? "Active" : expired ? "Expired" : "Inactive",
    expiresAt,
    expiration: expiresAt ? formatExpiration(expiresAt) : "",
  };
}

export function buildLicenseDoc(input, existing = null) {
  const licenseKey = normalizeLicenseKey(
    input.licenseKey || input.key || existing?.licenseKey || generateLicenseKey()
  );
  const expiresAt = parseExpiration(input.expiration || input.time || input.expiresAt);
  const status = normalizeStatus(input.status);
  const base = {
    licenseKeyEnc: encryptText(licenseKey),
    keyHash: licenseKeyHash(licenseKey),
    machineId: String(input.machineId || input.machineID || "").trim(),
    ownerName: String(input.ownerName || input.name || "").trim(),
    ownerPhone: String(input.ownerPhone || input.phone || "").trim(),
    expiresAt,
    expiration: expiresAt ? formatExpiration(expiresAt) : "",
    status,
    active: status === "Active" && !(expiresAt && expiresAt.getTime() < Date.now()),
    updatedAt: new Date(),
  };
  if (!existing?.createdAt) base.createdAt = new Date();
  return { licenseKey, doc: base };
}

export function publicLicenseDoc(doc, includeKey = true) {
  const state = effectiveLicenseState(doc);
  let licenseKey = "";
  if (includeKey) {
    try {
      licenseKey = decryptText(doc.licenseKeyEnc || "");
    } catch (_) {
      licenseKey = "";
    }
  }
  return {
    id: String(doc._id || ""),
    licenseKey,
    keyHash: doc.keyHash || "",
    machineId: doc.machineId || "",
    expiration: state.expiration,
    expiresAt: state.expiresAt ? state.expiresAt.toISOString() : "",
    ownerName: doc.ownerName || "",
    ownerPhone: doc.ownerPhone || "",
    status: state.statusText,
    active: state.active,
    expired: state.expired,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : "",
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : "",
    lastCheckAt: doc.lastCheckAt ? new Date(doc.lastCheckAt).toISOString() : "",
    checkCount: Number(doc.checkCount || 0),
  };
}

export function signToken(payload, ttlSeconds) {
  const secret = requiredSecret("LICENSE_SERVER_SECRET");
  const body = {
    ...payload,
    iat: nowSeconds(),
    exp: nowSeconds() + Number(ttlSeconds || 300),
    jti: crypto.randomUUID(),
  };
  const encoded = base64url(JSON.stringify(body));
  const sig = hmacHex(secret, encoded);
  return `${encoded}.${sig}`;
}

export function verifyToken(token, expectedType = "") {
  const secret = requiredSecret("LICENSE_SERVER_SECRET");
  const [encoded, sig] = String(token || "").split(".");
  if (!encoded || !sig) throw new Error("Invalid token");
  const expected = hmacHex(secret, encoded);
  if (
    expected.length !== sig.length ||
    !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))
  ) {
    throw new Error("Invalid token signature");
  }
  const payload = JSON.parse(fromBase64url(encoded).toString("utf8"));
  if (expectedType && payload.type !== expectedType) {
    throw new Error("Invalid token type");
  }
  if (!payload.exp || Number(payload.exp) < nowSeconds()) {
    throw new Error("Token expired");
  }
  return payload;
}

export function signResponse(payload) {
  const secret = requiredSecret("LICENSE_SERVER_SECRET");
  const canonical = JSON.stringify(payload, Object.keys(payload).sort());
  return hmacHex(secret, canonical);
}

export function parseImportedRows(text) {
  const rawLines = String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (!rawLines.length) return [];

  const splitLine = (line) => {
    if (line.includes("\t")) return line.split("\t");
    return line.split(",").map((part) => part.trim().replace(/^"|"$/g, ""));
  };

  const header = splitLine(rawLines[0]).map((x) => x.trim().toLowerCase());
  const hasHeader = header.some((x) => x.includes("license")) || header.some((x) => x.includes("machine"));
  const lines = hasHeader ? rawLines.slice(1) : rawLines;

  return lines
    .map((line) => {
      const cols = splitLine(line);
      return {
        licenseKey: cols[0] || "",
        machineId: cols[1] || "",
        expiration: cols[2] || "",
        ownerName: cols[3] || "",
        ownerPhone: cols[4] || "",
        status: cols[5] || "Active",
      };
    })
    .filter((row) => normalizeLicenseKey(row.licenseKey));
}
