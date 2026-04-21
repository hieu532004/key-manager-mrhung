import clientPromise from "../../../lib/mongodb";
import {
  COLLECTION_NAME,
  DB_NAME,
  effectiveLicenseState,
  signResponse,
  signToken,
  verifyToken,
} from "../../../lib/security";

const PERMIT_TTL_SECONDS = Number(process.env.RUN_PERMIT_TTL_SECONDS || 120);

async function getCollection() {
  const client = await clientPromise;
  return client.db(DB_NAME).collection(COLLECTION_NAME);
}

function fail(res, status, message) {
  const payload = {
    ok: false,
    allowed: false,
    error: message,
    serverTime: new Date().toISOString(),
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
  } = req.body || {};

  let session;
  try {
    session = verifyToken(sessionToken, "license-session");
  } catch (err) {
    return fail(res, 401, err.message || "Invalid license session");
  }

  const cleanMachine = String(machineId || "").trim();
  if (!cleanMachine || cleanMachine !== session.machineId) {
    return fail(res, 403, "MachineId mismatch");
  }

  const collection = await getCollection();
  const doc = await collection.findOne({ keyHash: session.keyHash });
  if (!doc) return fail(res, 404, "License not found");

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
          lastPermitStage: String(stage || ""),
        },
      }
    );
    return fail(res, 403, state.expired ? "License expired" : "License inactive");
  }

  const permit = signToken(
    {
      type: "run-permit",
      keyHash: session.keyHash,
      machineId: cleanMachine,
      stage: String(stage || "workflow").slice(0, 80),
      nonce: String(nonce || ""),
    },
    PERMIT_TTL_SECONDS
  );

  await collection.updateOne(
    { keyHash: session.keyHash },
    {
      $set: {
        lastPermitAt: new Date(),
        lastPermitStage: String(stage || ""),
        lastPermitMetadata: JSON.stringify(metadata || {}).slice(0, 1200),
      },
      $inc: { permitCount: 1 },
    }
  );

  const payload = {
    ok: true,
    allowed: true,
    stage: String(stage || "workflow"),
    permit,
    expiresAt: Math.floor(Date.now() / 1000) + PERMIT_TTL_SECONDS,
    ttlSeconds: PERMIT_TTL_SECONDS,
    serverTime: new Date().toISOString(),
  };

  return res.status(200).json({
    ...payload,
    signature: signResponse(payload),
  });
}
