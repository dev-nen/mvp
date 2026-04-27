import {
  getArgValue,
  getConfig,
  normalizeUrl,
  ResultCollector,
} from "./runtime-script-utils.mjs";

const DEFAULT_PREVIEW_URL =
  "https://mvp-nen-git-main-dibrandons-projects.vercel.app";
const results = new ResultCollector();

function mask(value) {
  if (!value) {
    return "";
  }

  if (value.length <= 10) {
    return "***";
  }

  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

async function checkFetch(name, url, predicate) {
  try {
    const response = await fetch(url, { redirect: "follow" });
    const body = await response.text();
    const outcome = predicate(response, body);

    if (outcome.ok) {
      results.pass(name, outcome.detail);
    } else {
      results.fail(name, outcome.detail);
    }
  } catch (error) {
    results.fail(name, error.message);
  }
}

const previewUrl = normalizeUrl(
  getArgValue("preview-url") || process.env.NENSGO_PREVIEW_URL || DEFAULT_PREVIEW_URL,
);
const supabaseUrl = getConfig("VITE_SUPABASE_URL");
const supabaseAnonKey = getConfig("VITE_SUPABASE_ANON_KEY");
const serviceRoleKey = getConfig("SUPABASE_SERVICE_ROLE_KEY");
const internalPviToken = getConfig("INTERNAL_PVI_API_TOKEN");

if (!supabaseUrl) {
  results.fail("VITE_SUPABASE_URL is configured", "Missing local value.");
} else if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(supabaseUrl)) {
  results.warn("VITE_SUPABASE_URL shape", `Unexpected shape: ${supabaseUrl}`);
} else {
  results.pass("VITE_SUPABASE_URL is configured", supabaseUrl);
}

if (!supabaseAnonKey) {
  results.fail("VITE_SUPABASE_ANON_KEY is configured", "Missing local value.");
} else {
  results.pass("VITE_SUPABASE_ANON_KEY is configured", mask(supabaseAnonKey));
}

if (!serviceRoleKey) {
  results.warn(
    "SUPABASE_SERVICE_ROLE_KEY local value",
    "Missing locally; Vercel can still be configured, but authorized API checks will be skipped.",
  );
} else {
  results.pass("SUPABASE_SERVICE_ROLE_KEY local value", mask(serviceRoleKey));
}

if (!internalPviToken) {
  results.warn(
    "INTERNAL_PVI_API_TOKEN local value",
    "Missing locally; authorized /api/internal/pvi path cannot be checked.",
  );
} else {
  results.pass("INTERNAL_PVI_API_TOKEN local value", mask(internalPviToken));
}

results.pass("Preview URL selected", previewUrl);

await checkFetch("preview home responds", `${previewUrl}/`, (response, body) => ({
  ok: (response.ok && body.includes("NensGo")) || response.status === 401,
  detail:
    response.status === 401
      ? `${response.status} ${response.statusText}; protected by Vercel Authentication.`
      : `${response.status} ${response.statusText}`,
}));

await checkFetch("internal PVI rejects without token", `${previewUrl}/api/internal/pvi`, (response) => ({
  ok: response.status === 401 || response.status === 403,
  detail: `${response.status} ${response.statusText}`,
}));

if (internalPviToken) {
  try {
    const response = await fetch(`${previewUrl}/api/internal/pvi`, {
      headers: {
        Authorization: `Bearer ${internalPviToken}`,
      },
      redirect: "follow",
    });
    const body = await response.text();

    if (response.ok && body.includes("\"ok\"")) {
      results.pass("internal PVI accepts configured token", `${response.status}`);
    } else {
      results.fail("internal PVI accepts configured token", `${response.status} ${body.slice(0, 100)}`);
    }
  } catch (error) {
    results.fail("internal PVI accepts configured token", error.message);
  }
}

results.warn(
  "Supabase Auth dashboard settings",
  "Human check required: Google provider, email/password, email verification, and redirect URLs.",
);
results.warn(
  "Vercel environment dashboard settings",
  "Human check required: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, INTERNAL_PVI_API_TOKEN, then redeploy.",
);

results.print();
results.exitIfFailed("Gate 2 config");
