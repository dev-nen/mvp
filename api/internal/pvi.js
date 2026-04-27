import { timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

function setPrivateJsonHeaders(res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Vary", "Authorization");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
}

function sendJson(res, statusCode, payload) {
  setPrivateJsonHeaders(res);
  res.status(statusCode).json(payload);
}

function readBearerToken(authorizationHeader) {
  if (typeof authorizationHeader !== "string") {
    return "";
  }

  const [scheme, token] = authorizationHeader.split(" ");

  if (scheme !== "Bearer") {
    return "";
  }

  return token?.trim() || "";
}

function tokensMatch(expectedToken, providedToken) {
  if (!expectedToken || !providedToken) {
    return false;
  }

  const expected = Buffer.from(expectedToken);
  const provided = Buffer.from(providedToken);

  if (expected.length !== provided.length) {
    return false;
  }

  return timingSafeEqual(expected, provided);
}

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export default async function handler(req, res) {
  setPrivateJsonHeaders(res);

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    sendJson(res, 405, { ok: false, error: "Method not allowed." });
    return;
  }

  const expectedToken = process.env.INTERNAL_PVI_API_TOKEN;
  const providedToken = readBearerToken(req.headers.authorization);

  if (!tokensMatch(expectedToken, providedToken)) {
    sendJson(res, 401, { ok: false, error: "Unauthorized." });
    return;
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    sendJson(res, 500, {
      ok: false,
      error: "Internal report is not configured.",
    });
    return;
  }

  const { data, error } = await supabase.rpc("get_internal_pvi_report");

  if (error) {
    console.error("Internal PVI report load failed", error);
    sendJson(res, 500, {
      ok: false,
      error: "Could not load internal PVI report.",
    });
    return;
  }

  sendJson(res, 200, {
    ok: true,
    generatedAt: new Date().toISOString(),
    report: data ?? {},
  });
}
