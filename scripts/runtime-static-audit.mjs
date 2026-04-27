import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const checks = [];

function readRepoFile(relativePath) {
  return readFileSync(path.join(rootDir, relativePath), "utf8");
}

function collectFiles(relativeDir, extensions) {
  const startDir = path.join(rootDir, relativeDir);

  if (!existsSync(startDir)) {
    return [];
  }

  const files = [];
  const pending = [startDir];

  while (pending.length) {
    const currentDir = pending.pop();
    const entries = readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        pending.push(entryPath);
        continue;
      }

      if (extensions.includes(path.extname(entry.name))) {
        files.push(entryPath);
      }
    }
  }

  return files;
}

function relative(filePath) {
  return path.relative(rootDir, filePath).replaceAll("\\", "/");
}

function pass(name, detail = "") {
  checks.push({ ok: true, name, detail });
}

function fail(name, detail = "") {
  checks.push({ ok: false, name, detail });
}

function assert(name, condition, detail = "") {
  if (condition) {
    pass(name, detail);
  } else {
    fail(name, detail);
  }
}

function findMatches(files, pattern) {
  const matches = [];

  for (const filePath of files) {
    const content = readFileSync(filePath, "utf8");

    if (pattern.test(content)) {
      matches.push(relative(filePath));
    }
  }

  return matches;
}

const appSource = readRepoFile("src/App.jsx");

assert(
  "public /pvi route stays retired",
  !appSource.includes('path="/pvi"') && !appSource.includes("PviPage"),
  "src/App.jsx should not expose the old public PVI route.",
);

assert(
  "PviPage files stay removed",
  !existsSync(path.join(rootDir, "src/pages/PviPage.jsx")) &&
    !existsSync(path.join(rootDir, "src/pages/PviPage.css")),
  "src/pages/PviPage.* should not return.",
);

assert(
  "runtime routes include internal editorial surfaces",
  appSource.includes('path="/internal/drafts"') &&
    appSource.includes('path="/internal/drafts/:draftId"') &&
    appSource.includes('path="/internal/activities/:activityId"'),
  "Draft Inbox and approved activity routes should remain wired.",
);

const runtimeFiles = [
  ...collectFiles("src", [".js", ".jsx", ".css"]),
  ...collectFiles("api", [".js"]),
];
const mojibakeMatches = findMatches(runtimeFiles, /Ã|Â|�/u);

assert(
  "runtime text has no mojibake markers",
  mojibakeMatches.length === 0,
  mojibakeMatches.join(", "),
);

const jsxFiles = collectFiles("src", [".jsx"]);
const publicCopyMatches = findMatches(
  jsxFiles,
  /CATALOGO ACTIVO|TU BUSQUEDA EMPIEZA AQUI|\bEXPLORACION\b|Cuenta autenticada en Supabase|MVP 2\.0/u,
);

assert(
  "old debug-like public copy stays out of JSX",
  publicCopyMatches.length === 0,
  publicCopyMatches.join(", "),
);

const sqlExpectations = [
  {
    file: "supabase/sql/2026-04-21_real_db_auth_phase.sql",
    tokens: [
      "create or replace view public.catalog_activities_read",
      "create or replace function public.ensure_my_profile",
      "create or replace function public.get_internal_pvi_report",
      "revoke all on function public.get_internal_pvi_report() from public, anon, authenticated",
      "grant execute on function public.get_internal_pvi_report() to service_role",
    ],
  },
  {
    file: "supabase/sql/2026-04-22_internal_draft_inbox_phase1.sql",
    tokens: [
      "create table if not exists public.activity_drafts",
      "create table if not exists public.internal_tool_access",
      "create or replace function public.approve_activity_draft",
      "create or replace function public.seed_activity_draft_examples",
    ],
  },
  {
    file: "supabase/sql/2026-04-22_internal_approved_activity_lifecycle_phase2.sql",
    tokens: [
      "create or replace function public.list_internal_approved_activity_states",
      "create or replace function public.get_internal_approved_activity",
      "create or replace function public.update_approved_activity_from_draft",
      "create or replace function public.unpublish_approved_activity",
      "create or replace function public.republish_approved_activity",
    ],
  },
];

for (const expectation of sqlExpectations) {
  const sql = readRepoFile(expectation.file);
  const missingTokens = expectation.tokens.filter((token) => !sql.includes(token));

  assert(
    `${expectation.file} exposes expected Gate 1 objects`,
    missingTokens.length === 0,
    missingTokens.join(", "),
  );
}

const envExample = readRepoFile(".env.example");
const requiredEnvVars = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "INTERNAL_PVI_API_TOKEN",
];
const missingEnvVars = requiredEnvVars.filter(
  (envVarName) => !envExample.includes(`${envVarName}=`),
);

assert(
  ".env.example documents runtime env contract",
  missingEnvVars.length === 0,
  missingEnvVars.join(", "),
);

for (const check of checks) {
  const status = check.ok ? "PASS" : "FAIL";
  const detail = check.detail ? ` - ${check.detail}` : "";
  console.log(`${status} ${check.name}${detail}`);
}

const failedChecks = checks.filter((check) => !check.ok);

if (failedChecks.length) {
  console.error(`\n${failedChecks.length} static audit check(s) failed.`);
  process.exit(1);
}

console.log(`\n${checks.length} static audit check(s) passed.`);
