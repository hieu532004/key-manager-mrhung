import clientPromise from "../../../lib/mongodb";
import {
  COLLECTION_NAME,
  DB_NAME,
  effectiveLicenseState,
  signResponse,
  signToken,
  verifyToken,
} from "../../../lib/security";
import { evaluateClientVersion } from "../../../lib/tool-policy";

const PERMIT_TTL_SECONDS = Number(process.env.RUN_PERMIT_TTL_SECONDS || 120);

async function getCollection() {
  const client = await clientPromise;
  return client.db(DB_NAME).collection(COLLECTION_NAME);
}

function fail(res, status, message, extra = {}) {
  const payload = {
    ok: false,
    allowed: false,
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

  const {
    sessionToken,
    machineId,
    stage = "workflow",
    nonce = "",
    metadata = {},
    timestamp = 0,
  } = req.body || {};

  let session;
  try {
    session = verifyToken(sessionToken, "license-session");
  } catch (err) {
    return fail(res, 401, err.message || "Invalid license session");
  }

  const update = await evaluateClientVersion(session.appVersion || "");
  if (update.required) {
    return fail(
      res,
      426,
      `Tool version ${String(session.appVersion || "unknown").trim() || "unknown"} is no longer supported`,
      { update }
    );
  }

  const cleanMachine = String(machineId || "").trim();
  if (!cleanMachine || cleanMachine !== session.machineId) {
    return fail(res, 403, "MachineId mismatch", { update });
  }

  const cleanStage = String(stage || "workflow").trim().slice(0, 80) || "workflow";
  if (!/^[a-z0-9:_-]+$/i.test(cleanStage)) {
    return fail(res, 400, "Stage format is invalid", { update });
  }

  const clientTs = Number(timestamp || 0);
  const nowMs = Date.now();
  if (clientTs && Math.abs(nowMs - clientTs * 1000) > 5 * 60 * 1000) {
    return fail(res, 400, "Clock drift too large", { update });
  }

  const cleanNonce = String(nonce || "").trim();
  if (cleanNonce.length < 16) {
    return fail(res, 400, "Nonce is missing or too short", { update });
  }

  const collection = await getCollection();
  const doc = await collection.findOne({ keyHash: session.keyHash });
  if (!doc) return fail(res, 404, "License not found", { update });

  const state = effectiveLicenseState(doc);
  if (!state.active) {
    await collection.updateOne(
      { keyHash: session.keyHash },
      {
        $set: {
          status: state.statusText,
          active: false,
          updatedAt: new Date(),
          lastPermitDeniedAt: new Date(),
          lastPermitStage: cleanStage,
        },
      }
    );
    return fail(res, 403, state.expired ? "License expired" : "License inactive", { update });
  }

  const permit = signToken(
    {
      type: "run-permit",
      keyHash: session.keyHash,
      machineId: cleanMachine,
      stage: String(stage || "workflow").slice(0, 80),
      nonce: cleanNonce,
    },
    PERMIT_TTL_SECONDS
  );

  await collection.updateOne(
    { keyHash: session.keyHash },
    {
      $set: {
        lastPermitAt: new Date(),
        lastPermitStage: cleanStage,
        lastPermitMetadata: JSON.stringify(metadata || {}).slice(0, 1200),
        lastPermitNonce: cleanNonce,
      },
      $inc: { permitCount: 1 },
    }
  );

  const payload = {
    ok: true,
    allowed: true,
    stage: cleanStage,
    permit,
    expiresAt: Math.floor(Date.now() / 1000) + PERMIT_TTL_SECONDS,
    ttlSeconds: PERMIT_TTL_SECONDS,
    serverTime: new Date().toISOString(),
    update,
  };

  return res.status(200).json({
    ...payload,
    signature: signResponse(payload),
  });
}
