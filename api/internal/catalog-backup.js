import { createClient } from "@supabase/supabase-js";
import { validatePublicSupabaseKey } from "../../src/shared/publicCatalogBackupContract.mjs";

function sendJson(res, status, payload) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Vary", "Authorization");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
  res.status(status).json(payload);
}

function readBearer(value) {
  return typeof value === "string" ? /^Bearer ([^\s]+)$/i.exec(value)?.[1] || "" : "";
}

export function validatedDeployHook(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.hostname !== "api.vercel.com" || url.port ||
      url.username || url.password || url.hash ||
      !/^\/v1\/integrations\/deploy\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+$/.test(url.pathname)) {
      return null;
    }
    url.search = "";
    url.searchParams.set("buildCache", "false");
    return url;
  } catch { return null; }
}

export function createCatalogBackupHandler({ environment = process.env, createClientImpl = createClient, fetchImpl = fetch, now = () => new Date() } = {}) {
  return async function handler(req, res) {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      sendJson(res, 405, { ok: false, error: "method_not_allowed" });
      return;
    }
    const token = readBearer(req.headers.authorization);
    if (!token) { sendJson(res, 401, { ok: false, error: "sign_in_required" }); return; }
    // A preview must never be able to rebuild production through an inherited hook.
    const hostname = (req.headers.host || "").toLowerCase().replace(/:\d+$/, "");
    if (environment.VERCEL_ENV !== "production" || !["nensgo.com", "www.nensgo.com"].includes(hostname)) {
      sendJson(res, 409, { ok: false, error: "production_only" });
      return;
    }
    const hook = validatedDeployHook(environment.PUBLIC_CATALOG_DEPLOY_HOOK);
    let publicKey;
    try { publicKey = validatePublicSupabaseKey(environment.VITE_SUPABASE_ANON_KEY); } catch { /* Fail closed. */ }
    const supabaseUrl = environment.VITE_SUPABASE_URL;
    if (!hook || !supabaseUrl || !publicKey) {
      sendJson(res, 503, { ok: false, error: "backup_not_configured" });
      return;
    }
    try {
      const client = createClientImpl(supabaseUrl, publicKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
        global: {
          headers: { Authorization: `Bearer ${token}` },
          fetch: (url, options = {}) => fetchImpl(url, { ...options, signal: AbortSignal.timeout(10_000) }),
        },
      });
      const { data: identity, error: identityError } = await client.auth.getUser(token);
      if (identityError || !identity?.user?.id) {
        sendJson(res, 401, { ok: false, error: "sign_in_required" });
        return;
      }
      const { data: permitted, error: permissionError } = await client.rpc("is_maintenance_operator");
      if (permissionError || permitted !== true) {
        sendJson(res, 403, { ok: false, error: "operator_required" });
        return;
      }
      const requestedAt = now().toISOString();
      const response = await fetchImpl(hook, { method: "POST", redirect: "error", signal: AbortSignal.timeout(15_000) });
      if (!response.ok) {
        sendJson(res, 502, { ok: false, error: "backup_request_failed" });
        return;
      }
      const accepted = await response.json();
      if (typeof accepted?.job?.id !== "string" || !accepted.job.id || accepted.job.state === "ERROR") {
        sendJson(res, 502, { ok: false, error: "backup_request_failed" });
        return;
      }
      // A job acknowledgement is not a published backup. The UI checks its manifest.
      sendJson(res, 202, { ok: true, state: "pending", requestedAt });
    } catch {
      sendJson(res, 502, { ok: false, error: "backup_request_failed" });
    }
  };
}

export default createCatalogBackupHandler();
