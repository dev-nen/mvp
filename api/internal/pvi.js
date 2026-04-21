import { createClient } from "@supabase/supabase-js";

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
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  const expectedToken = process.env.INTERNAL_PVI_API_TOKEN;
  const providedToken = readBearerToken(req.headers.authorization);

  if (!expectedToken || providedToken !== expectedToken) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    res.status(500).json({ error: "Missing Supabase server configuration." });
    return;
  }

  const { data, error } = await supabase.rpc("get_internal_pvi_report");

  if (error) {
    res.status(500).json({
      error: error.message || "Could not load internal PVI report.",
    });
    return;
  }

  res.status(200).json({
    ok: true,
    generatedAt: new Date().toISOString(),
    report: data ?? {},
  });
}
