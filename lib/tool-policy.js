import clientPromise from "./mongodb";
import { DB_NAME } from "./security";

const TOOL_POLICY_COLLECTION = process.env.TOOL_POLICY_COLLECTION || "app_settings";
const TOOL_POLICY_DOC_ID = "tool_policy";

function normalizeVersion(value) {
  return String(value || "").trim();
}

function normalizeDownloadUrl(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  try {
    const url = new URL(text);
    if (url.protocol === "https:") return text;
    if (
      url.protocol === "http:" &&
      (url.hostname === "localhost" || url.hostname === "127.0.0.1")
    ) {
      return text;
    }
  } catch (_) {
    return "";
  }
  return "";
}

function normalizeReleaseNotes(value) {
  return String(value || "").trim().slice(0, 2000);
}

function hasOwn(input, key) {
  return Object.prototype.hasOwnProperty.call(input || {}, key);
}

function versionParts(value) {
  const matches = normalizeVersion(value).match(/\d+/g) || [];
  if (!matches.length) return [0];
  return matches.slice(0, 4).map((part) => Number(part) || 0);
}

export function compareVersions(left, right) {
  const a = versionParts(left);
  const b = versionParts(right);
  const size = Math.max(a.length, b.length);
  while (a.length < size) a.push(0);
  while (b.length < size) b.push(0);
  for (let i = 0; i < size; i += 1) {
    if (a[i] < b[i]) return -1;
    if (a[i] > b[i]) return 1;
  }
  return 0;
}

export function getDefaultToolPolicy() {
  const latestVersion = normalizeVersion(
    process.env.TOOL_LATEST_VERSION || process.env.APP_LATEST_VERSION || "V2.3.2"
  );
  const minimumVersion = normalizeVersion(
    process.env.TOOL_MIN_VERSION || process.env.APP_MIN_VERSION || latestVersion || "V2.3.2"
  );
  const downloadUrl = normalizeDownloadUrl(
    process.env.TOOL_DOWNLOAD_URL || process.env.APP_DOWNLOAD_URL || ""
  );
  const releaseNotes = normalizeReleaseNotes(
    process.env.TOOL_RELEASE_NOTES || process.env.APP_RELEASE_NOTES || ""
  );

  return {
    latestVersion,
    minimumVersion,
    downloadUrl,
    releaseNotes,
    source: "env",
    updatedAt: "",
  };
}

function normalizePolicyInput(input = {}, fallback = getDefaultToolPolicy()) {
  const rawLatestVersion = hasOwn(input, "latestVersion") ? input.latestVersion : fallback.latestVersion;
  const latestVersion = normalizeVersion(rawLatestVersion || fallback.latestVersion);
  const rawMinimumVersion = hasOwn(input, "minimumVersion")
    ? input.minimumVersion
    : fallback.minimumVersion;
  const minimumVersion = normalizeVersion(rawMinimumVersion);
  return {
    latestVersion,
    minimumVersion: minimumVersion || latestVersion,
    downloadUrl: normalizeDownloadUrl(
      hasOwn(input, "downloadUrl") ? input.downloadUrl : fallback.downloadUrl || ""
    ),
    releaseNotes: normalizeReleaseNotes(
      hasOwn(input, "releaseNotes") ? input.releaseNotes : fallback.releaseNotes || ""
    ),
  };
}

async function getCollection() {
  const client = await clientPromise;
  return client.db(DB_NAME).collection(TOOL_POLICY_COLLECTION);
}

export async function getToolPolicy() {
  const defaults = getDefaultToolPolicy();
  try {
    const collection = await getCollection();
    const doc = await collection.findOne({ _id: TOOL_POLICY_DOC_ID });
    if (!doc) return defaults;
    const normalized = normalizePolicyInput(doc, defaults);
    return {
      ...normalized,
      source: "database",
      updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : "",
    };
  } catch (_) {
    return defaults;
  }
}

export async function saveToolPolicy(input = {}) {
  const collection = await getCollection();
  const defaults = getDefaultToolPolicy();
  const normalized = normalizePolicyInput(input, defaults);
  const now = new Date();
  await collection.updateOne(
    { _id: TOOL_POLICY_DOC_ID },
    {
      $set: {
        ...normalized,
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: true }
  );
  return {
    ...normalized,
    source: "database",
    updatedAt: now.toISOString(),
  };
}

export async function evaluateClientVersion(currentVersion) {
  const policy = await getToolPolicy();
  const current = normalizeVersion(currentVersion);
  const available = Boolean(
    current && policy.latestVersion && compareVersions(current, policy.latestVersion) < 0
  );
  const blocked = Boolean(
    current && policy.minimumVersion && compareVersions(current, policy.minimumVersion) < 0
  );

  return {
    currentVersion: current,
    latestVersion: policy.latestVersion,
    minimumVersion: policy.minimumVersion,
    downloadUrl: policy.downloadUrl,
    releaseNotes: policy.releaseNotes,
    available,
    blocked,
    required: blocked,
  };
}
