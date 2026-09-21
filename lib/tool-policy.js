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

const CAMPAIGN_THEMES = new Set([
  "mid_autumn",
  "tet",
  "christmas",
  "new_year",
  "summer",
  "custom",
]);

function normalizeCampaignText(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

function normalizeCampaignDate(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function getDefaultCampaign() {
  return {
    enabled: String(process.env.TOOL_CAMPAIGN_ENABLED || "1") !== "0",
    theme: CAMPAIGN_THEMES.has(String(process.env.TOOL_CAMPAIGN_THEME || "mid_autumn"))
      ? String(process.env.TOOL_CAMPAIGN_THEME || "mid_autumn")
      : "mid_autumn",
    badge: normalizeCampaignText(process.env.TOOL_CAMPAIGN_BADGE || "TRUNG THU SALE", 48),
    message: normalizeCampaignText(
      process.env.TOOL_CAMPAIGN_MESSAGE ||
        "Mừng Trung Thu • Gói 6 tháng giảm 5% • Gói 1 năm giảm 10% • Ưu đãi có hạn",
      320
    ),
    ctaLabel: normalizeCampaignText(process.env.TOOL_CAMPAIGN_CTA || "Xem ưu đãi", 48),
    startAt: normalizeCampaignDate(process.env.TOOL_CAMPAIGN_START || "2026-09-20T00:00:00+07:00"),
    endAt: normalizeCampaignDate(process.env.TOOL_CAMPAIGN_END || "2026-10-02T23:59:59+07:00"),
  };
}

function normalizeCampaign(input = {}, fallback = getDefaultCampaign()) {
  const rawTheme = normalizeCampaignText(
    hasOwn(input, "theme") ? input.theme : fallback.theme,
    32
  );
  return {
    enabled: hasOwn(input, "enabled") ? Boolean(input.enabled) : Boolean(fallback.enabled),
    theme: CAMPAIGN_THEMES.has(rawTheme) ? rawTheme : fallback.theme || "custom",
    badge: normalizeCampaignText(
      hasOwn(input, "badge") ? input.badge : fallback.badge,
      48
    ),
    message: normalizeCampaignText(
      hasOwn(input, "message") ? input.message : fallback.message,
      320
    ),
    ctaLabel: normalizeCampaignText(
      hasOwn(input, "ctaLabel") ? input.ctaLabel : fallback.ctaLabel,
      48
    ),
    startAt: normalizeCampaignDate(
      hasOwn(input, "startAt") ? input.startAt : fallback.startAt
    ),
    endAt: normalizeCampaignDate(
      hasOwn(input, "endAt") ? input.endAt : fallback.endAt
    ),
  };
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
    campaign: getDefaultCampaign(),
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
    campaign: normalizeCampaign(
      hasOwn(input, "campaign") ? input.campaign : fallback.campaign || getDefaultCampaign(),
      fallback.campaign || getDefaultCampaign()
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
    campaign: policy.campaign,
    available,
    blocked,
    required: blocked,
  };
}
