import clientPromise from "../../../lib/mongodb";
import {
  COLLECTION_NAME,
  DB_NAME,
  effectiveLicenseState,
  licenseKeyHash,
  normalizeLicenseKey,
  signResponse,
  signToken,
} from "../../../lib/security";
import { evaluateClientVersion } from "../../../lib/tool-policy";

const SESSION_TTL_SECONDS = Number(process.env.RUN_SESSION_TTL_SECONDS || 900);

async function getCollection() {
  const client = await clientPromise;
  return client.db(DB_NAME).collection(COLLECTION_NAME);
}

function fail(res, status, message, extra = {}) {
  const payload = {
    ok: false,
    active: false,
    error: message,
    serverTime: new Date().toISOString(),
    ...extra,
  };
  return res.status(status).json({
    ...payload,
    signature: signResponse(payload),
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { licenseKey, machineId, appVersion = "", nonce = "", timestamp = 0 } = req.body || {};
  const update = evaluateClientVersion(appVersion);

  const cleanKey = normalizeLicenseKey(licenseKey);
  const cleanMachine = String(machineId || "").trim();
  if (!cleanKey || !cleanMachine) {
    return fail(res, 400, "Missing licenseKey or machineId", { update });
  }

  const clientTs = Number(timestamp || 0);
  const nowMs = Date.now();
  if (clientTs && Math.abs(nowMs - clientTs * 1000) > 5 * 60 * 1000) {
    return fail(res, 400, "Clock drift too large", { update });
  }
  if (String(nonce || "").trim().length < 16) {
    return fail(res, 400, "Nonce is missing or too short", { update });
  }

  if (update.required) {
    return fail(
      res,
      426,
      `Tool version ${String(appVersion || "unknown").trim() || "unknown"} is no longer supported`,
      { update }
    );
  }

  const collection = await getCollection();
  const keyHash = licenseKeyHash(cleanKey);
  const doc = await collection.findOne({ keyHash });
  if (!doc) {
    return fail(res, 404, "License key does not exist", { update });
  }

  const state = effectiveLicenseState(doc);
  if (!state.active) {
    await collection.updateOne(
      { keyHash },
      {
        $set: {
          status: state.statusText,
          active: false,
          updatedAt: new Date(),
          lastCheckAt: new Date(),
        },
        $inc: { checkCount: 1 },
      }
    );
    return fail(res, 403, state.expired ? "License expired" : "License inactive", {
      status: state.statusText,
      expiration: state.expiration,
      update,
    });
  }

  const currentMachineId = String(doc.machineId || "").trim();
  const autoBind = String(process.env.AUTO_BIND_MACHINE_ON_VERIFY || "1") !== "0";
  if (currentMachineId && currentMachineId !== cleanMachine) {
    await collection.updateOne(
      { keyHash },
      {
        $set: {
          lastRejectedMachineId: cleanMachine,
          lastCheckAt: new Date(),
        },
        $inc: { checkCount: 1 },
      }
    );
    return fail(res, 403, "License is already bound to another machine", { update });
  }

  const bindUpdate = currentMachineId ? {} : autoBind ? { machineId: cleanMachine } : {};

  if (!currentMachineId && !autoBind) {
    return fail(res, 403, "License has no machineId yet", {
      machineId: cleanMachine,
      update,
    });
  }

  const sessionToken = signToken(
    {
      type: "license-session",
      keyHash,
      machineId: cleanMachine,
      appVersion: String(appVersion || ""),
    },
    SESSION_TTL_SECONDS
  );

  await collection.updateOne(
    { keyHash },
    {
      $set: {
        ...bindUpdate,
        status: "Active",
        active: true,
        lastCheckAt: new Date(),
        lastAppVersion: String(appVersion || ""),
        lastNonce: String(nonce || ""),
      },
      $inc: { checkCount: 1 },
    }
  );

  const payload = {
    ok: true,
    active: true,
    status: "Active",
    licenseKey: cleanKey,
    machineId: cleanMachine,
    ownerName: doc.ownerName || "",
    ownerPhone: doc.ownerPhone || "",
    expiresAt: state.expiresAt ? Math.floor(state.expiresAt.getTime() / 1000) : 0,
    expiration: state.expiration,
    serverTime: new Date().toISOString(),
    nonce: String(nonce || ""),
    session: {
      token: sessionToken,
      expiresAt: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
      ttlSeconds: SESSION_TTL_SECONDS,
    },
    features: {
      account: doc.ownerName || cleanKey,
      account_type: "Veo3_Grok",
      name: doc.ownerName || "",
      sdt: doc.ownerPhone || "",
    },
    update,
  };

  return res.status(200).json({
    ...payload,
    signature: signResponse(payload),
  });
}
