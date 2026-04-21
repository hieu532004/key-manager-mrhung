function normalizeVersion(value) {
  return String(value || "").trim();
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

export function getToolPolicy() {
  const latestVersion = normalizeVersion(
    process.env.TOOL_LATEST_VERSION || process.env.APP_LATEST_VERSION || 'V2.3.2'
  );
  const minimumVersion = normalizeVersion(
    process.env.TOOL_MIN_VERSION || process.env.APP_MIN_VERSION || latestVersion || 'V2.3.2'
  );
  const downloadUrl = String(
    process.env.TOOL_DOWNLOAD_URL || process.env.APP_DOWNLOAD_URL || ''
  ).trim();
  const releaseNotes = String(
    process.env.TOOL_RELEASE_NOTES || process.env.APP_RELEASE_NOTES || ''
  )
    .trim()
    .slice(0, 2000);

  return {
    latestVersion,
    minimumVersion,
    downloadUrl,
    releaseNotes,
  };
}

export function evaluateClientVersion(currentVersion) {
  const policy = getToolPolicy();
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