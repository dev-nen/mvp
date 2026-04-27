import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_PREVIEW_URL =
  "https://mvp-nen-git-main-dibrandons-projects.vercel.app";

const results = [];

function normalizeUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function readDotEnv(relativePath) {
  const envPath = path.join(rootDir, relativePath);

  if (!existsSync(envPath)) {
    return {};
  }

  const parsed = {};
  const content = readFileSync(envPath, "utf8");

  for (const line of content.split(/\r?\n/)) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#") || !trimmedLine.includes("=")) {
      continue;
    }

    const [key, ...rawValueParts] = trimmedLine.split("=");
    const rawValue = rawValueParts.join("=").trim();
    parsed[key.trim()] = rawValue.replace(/^["']|["']$/g, "");
  }

  return parsed;
}

function getArgValue(name) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((item) => item.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : "";
}

function getConfig(name) {
  return (
    process.env[name] ||
    readDotEnv(".env.local")[name] ||
    readDotEnv(".env")[name] ||
    ""
  ).trim();
}

function record(status, name, detail = "") {
  results.push({ status, name, detail });
}

function pass(name, detail = "") {
  record("PASS", name, detail);
}

function warn(name, detail = "") {
  record("WARN", name, detail);
}

function fail(name, detail = "") {
  record("FAIL", name, detail);
}

async function checkFetch(name, url, predicate) {
  try {
    const response = await fetch(url, { redirect: "follow" });
    const body = await response.text();
    const outcome = predicate(response, body);

    if (outcome.ok) {
      pass(name, outcome.detail);
    } else {
      fail(name, outcome.detail);
    }
  } catch (error) {
    fail(name, error.message);
  }
}

const previewUrl = normalizeUrl(
  getArgValue("preview-url") || process.env.NENSGO_PREVIEW_URL || DEFAULT_PREVIEW_URL,
);

await checkFetch("preview home responds", `${previewUrl}/`, (response, body) => ({
  ok: (response.ok && body.includes("NensGo")) || response.status === 401,
  detail:
    response.status === 401
      ? `${response.status} ${response.statusText}; preview is protected by Vercel Authentication.`
      : `${response.status} ${response.statusText}`,
}));

await checkFetch(
  "internal PVI API rejects unauthenticated requests",
  `${previewUrl}/api/internal/pvi`,
  (response) => ({
    ok: response.status === 401 || response.status === 403,
    detail: `${response.status} ${response.statusText}`,
  }),
);

const internalPviToken = getConfig("INTERNAL_PVI_API_TOKEN");

if (internalPviToken) {
  try {
    const response = await fetch(`${previewUrl}/api/internal/pvi`, {
      headers: {
        Authorization: `Bearer ${internalPviToken}`,
      },
    });
    const body = await response.text();

    if (response.ok && body.includes("\"ok\"")) {
      pass("internal PVI API responds with configured token", `${response.status}`);
    } else {
      fail("internal PVI API responds with configured token", `${response.status} ${body.slice(0, 120)}`);
    }
  } catch (error) {
    fail("internal PVI API responds with configured token", error.message);
  }
} else {
  warn(
    "internal PVI token check skipped",
    "Set INTERNAL_PVI_API_TOKEN locally to validate the authorized path.",
  );
}

const supabaseUrl = getConfig("VITE_SUPABASE_URL");
const supabaseAnonKey = getConfig("VITE_SUPABASE_ANON_KEY");

if (!supabaseUrl || !supabaseAnonKey) {
  warn(
    "Supabase anon checks skipped",
    "VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required.",
  );
} else {
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: catalogRows, error: catalogError } = await supabase
    .from("catalog_activities_read")
    .select("id, title, image_url")
    .limit(5);

  if (catalogError) {
    fail("catalog_activities_read anon read", catalogError.message);
  } else if ((catalogRows || []).length === 0) {
    warn("catalog_activities_read anon read", "Query succeeded but returned zero rows.");
  } else {
    pass(
      "catalog_activities_read anon read",
      `${catalogRows.length} row(s), first id=${catalogRows[0].id}`,
    );
  }

  const { data: contactRows, error: contactError } = await supabase
    .from("activity_contact_options")
    .select("activity_id, contact_method, contact_value")
    .eq("is_active", true)
    .eq("is_deleted", false)
    .limit(10);

  if (contactError) {
    fail("activity_contact_options anon read", contactError.message);
  } else if ((contactRows || []).length === 0) {
    warn(
      "activity_contact_options anon read",
      "No active contact rows found; contact smoke will need dataset work.",
    );
  } else {
    pass("activity_contact_options anon read", `${contactRows.length} active row(s).`);
  }

  const { data: pviReport, error: pviRpcError } = await supabase.rpc(
    "get_internal_pvi_report",
  );

  if (pviRpcError) {
    const message = pviRpcError.message || "";

    if (/permission denied|not allowed|not found|Could not find/i.test(message)) {
      pass(
        "get_internal_pvi_report is not exposed to anon client",
        message,
      );
    } else {
      warn("get_internal_pvi_report anon check returned an unexpected error", message);
    }
  } else if (pviReport) {
    fail(
      "get_internal_pvi_report is not exposed to anon client",
      "Anon client received report data; apply the updated revoke/grant SQL before treating PVI as private.",
    );
  } else {
    warn("get_internal_pvi_report anon check", "No error and no data returned.");
  }
}

for (const result of results) {
  const detail = result.detail ? ` - ${result.detail}` : "";
  console.log(`${result.status} ${result.name}${detail}`);
}

const failedCount = results.filter((result) => result.status === "FAIL").length;
const warningCount = results.filter((result) => result.status === "WARN").length;

if (failedCount) {
  console.error(`\n${failedCount} preview readiness check(s) failed.`);
  process.exit(1);
}

console.log(`\nPreview readiness finished with ${warningCount} warning(s).`);
