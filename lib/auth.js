import crypto from "crypto";
import { signToken, verifyToken } from "./security";
import { ACCOUNTS } from "./accounts";

const COOKIE_NAME = "veo3_admin_session";
const ADMIN_TTL_SECONDS = 60 * 60 * 12;

function parseCookies(req) {
  const header = String(req.headers.cookie || "");
  return Object.fromEntries(
    header
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const idx = part.indexOf("=");
        if (idx === -1) return [part, ""];
        return [part.slice(0, idx), decodeURIComponent(part.slice(idx + 1))];
      })
  );
}

function pbkdf2Hex(password, salt) {
  return crypto
    .pbkdf2Sync(String(password), String(salt), 180000, 32, "sha256")
    .toString("hex");
}

function timingEqualHex(a, b) {
  const left = Buffer.from(String(a || ""), "hex");
  const right = Buffer.from(String(b || ""), "hex");
  if (left.length !== right.length || !left.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function configuredAdminUsers() {
  const json = String(process.env.ADMIN_USERS_JSON || "").trim();
  if (json) {
    try {
      const parsed = JSON.parse(json);
      if (Array.isArray(parsed)) return parsed;
    } catch (_) {
      // Fall through to single-user env.
    }
  }

  const username = String(process.env.ADMIN_USERNAME || "").trim();
  const passwordHash = String(process.env.ADMIN_PASSWORD_HASH || "").trim();
  const passwordSalt = String(process.env.ADMIN_PASSWORD_SALT || "").trim();
  const password = String(process.env.ADMIN_PASSWORD || "").trim();
  if (username && ((passwordHash && passwordSalt) || password)) {
    return [{ username, passwordHash, passwordSalt, password }];
  }

  // Backward-compatible fallback for local development only. Production should
  // use ADMIN_USERNAME + ADMIN_PASSWORD_HASH + ADMIN_PASSWORD_SALT.
  return ACCOUNTS || [];
}

function defaultRoleForUsername(username) {
  return String(username || "").trim().toLowerCase() === "support"
    ? "support"
    : "admin";
}

export function getAdminAccount(username) {
  const normalizedUser = String(username || "").trim().toLowerCase();
  if (!normalizedUser) return null;

  for (const account of configuredAdminUsers()) {
    const accountUser = String(account.username || "").trim().toLowerCase();
    if (accountUser !== normalizedUser) continue;
    return {
      ...account,
      username: String(account.username || "").trim(),
      role: String(account.role || defaultRoleForUsername(account.username)).trim().toLowerCase(),
    };
  }

  return null;
}

export function verifyAdminPassword(username, password) {
  const account = getAdminAccount(username);
  if (!account || !password) return false;

  if (account.passwordHash && account.passwordSalt) {
    const candidate = pbkdf2Hex(password, account.passwordSalt);
    return timingEqualHex(candidate, account.passwordHash);
  }

  if (account.password) {
    const left = Buffer.from(String(account.password));
    const right = Buffer.from(String(password));
    return left.length === right.length && crypto.timingSafeEqual(left, right);
  }

  return false;
}

export function createAdminSession(username) {
  const account = getAdminAccount(username);
  return signToken(
    {
      type: "admin",
      username: String(account?.username || username || "admin").trim(),
      role: String(account?.role || defaultRoleForUsername(username)).trim().toLowerCase(),
    },
    ADMIN_TTL_SECONDS
  );
}

export function getAdminSession(req) {
  const cookies = parseCookies(req);
  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  try {
    return verifyToken(token, "admin");
  } catch (_) {
    return null;
  }
}

export function setAdminCookie(res, token) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=${encodeURIComponent(
      token
    )}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${ADMIN_TTL_SECONDS}${secure}`
  );
}

export function clearAdminCookie(res) {
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  );
}

export function requireAdmin(req, res) {
  const session = getAdminSession(req);
  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  return session;
}

export function isSupportAdmin(session) {
  return String(session?.role || "").trim().toLowerCase() === "support";
}

export { COOKIE_NAME };
