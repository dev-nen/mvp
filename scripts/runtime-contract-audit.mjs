import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const results = [];

function read(relativePath) {
  return readFileSync(path.join(rootDir, relativePath), "utf8");
}

function pass(name, detail = "") {
  results.push({ ok: true, name, detail });
}

function fail(name, detail = "") {
  results.push({ ok: false, name, detail });
}

function assert(name, condition, detail = "") {
  if (condition) {
    pass(name, detail);
  } else {
    fail(name, detail);
  }
}

function getStringConstValue(source, constName) {
  const pattern = new RegExp(`const\\s+${constName}\\s*=\\s*\\n?\\s*"([^"]+)"`, "m");
  return source.match(pattern)?.[1] || "";
}

function getSupabaseSelects(source) {
  const matches = [...source.matchAll(/\.select\("([^"]+)"\)/g)];
  return matches.map((match) => match[1]);
}

function getRpcCalls(source) {
  const matches = [...source.matchAll(/\.rpc\("([^"]+)"/g)];
  return matches.map((match) => match[1]);
}

function splitSelectColumns(selectValue) {
  return selectValue
    .split(",")
    .map((column) => column.trim())
    .filter(Boolean);
}

function getCatalogReadColumns(sql) {
  const viewBody = sql.match(
    /create or replace view public\.catalog_activities_read as\s*select\s+([\s\S]+?)\s+from public\.activities/i,
  )?.[1];

  if (!viewBody) {
    return new Set();
  }

  return new Set(
    viewBody
      .split(",")
      .map((rawColumn) => rawColumn.trim())
      .map((rawColumn) => {
        const alias = rawColumn.match(/\s+as\s+([a-z0-9_]+)$/i)?.[1];

        if (alias) {
          return alias;
        }

        const directColumn = rawColumn.match(/(?:activities|centers|cities|categories|type_activity)\.([a-z0-9_]+)$/i)?.[1];

        return directColumn || "";
      })
      .filter(Boolean),
  );
}

const realDbSql = read("supabase/sql/2026-04-21_real_db_auth_phase.sql");
const draftSql = read("supabase/sql/2026-04-22_internal_draft_inbox_phase1.sql");
const lifecycleSql = read(
  "supabase/sql/2026-04-22_internal_approved_activity_lifecycle_phase2.sql",
);
const allSql = [realDbSql, draftSql, lifecycleSql].join("\n");

const catalogService = read("src/services/catalogService.js");
const catalogSelect = getStringConstValue(catalogService, "CATALOG_SELECT");
const catalogColumns = splitSelectColumns(catalogSelect);
const catalogReadColumns = getCatalogReadColumns(realDbSql);
const missingCatalogColumns = catalogColumns.filter((column) => {
  const columnName = column.split(/\s+as\s+/i).pop();
  return !catalogReadColumns.has(columnName);
});

assert(
  "catalogService select columns are present in catalog_activities_read SQL",
  missingCatalogColumns.length === 0,
  missingCatalogColumns.join(", "),
);

const contactService = read("src/services/activityContactOptionsService.js");
assert(
  "contact service reads only activity_contact_options as contact source",
  contactService.includes('.from("activity_contact_options")') &&
    !contactService.includes('.from("centers")'),
  "Contact fallback to centers should not return without an explicit decision.",
);

const appUsersService = read("src/services/appUsersService.js");
assert(
  "profile provisioning uses ensure_my_profile RPC",
  appUsersService.includes('.rpc("ensure_my_profile"') &&
    realDbSql.includes("create or replace function public.ensure_my_profile"),
  "Frontend and SQL must agree on profile provisioning.",
);

const pviApi = read("api/internal/pvi.js");
assert(
  "internal PVI API uses service role env and server token",
  pviApi.includes("SUPABASE_SERVICE_ROLE_KEY") &&
    pviApi.includes("INTERNAL_PVI_API_TOKEN") &&
    pviApi.includes('.rpc("get_internal_pvi_report"'),
  "PVI API must stay server-side and bearer-token protected.",
);

const frontendServiceFiles = [
  "src/services/appUsersService.js",
  "src/services/draftApprovalService.js",
  "src/services/internalApprovedActivitiesService.js",
];
const rpcCalls = frontendServiceFiles.flatMap((relativePath) =>
  getRpcCalls(read(relativePath)).map((rpcName) => ({ rpcName, relativePath })),
);
const missingRpcDefinitions = rpcCalls.filter(
  ({ rpcName }) => !allSql.includes(`function public.${rpcName}`),
);

assert(
  "frontend RPC calls are defined in versioned SQL",
  missingRpcDefinitions.length === 0,
  missingRpcDefinitions
    .map(({ rpcName, relativePath }) => `${rpcName} from ${relativePath}`)
    .join(", "),
);

const expectedRpcGrants = [
  "grant execute on function public.ensure_my_profile(text, text, bigint) to authenticated",
  "grant execute on function public.approve_activity_draft(bigint) to authenticated",
  "grant execute on function public.list_internal_approved_activity_states(bigint[]) to authenticated",
  "grant execute on function public.get_internal_approved_activity(bigint) to authenticated",
  "grant execute on function public.update_approved_activity_from_draft(bigint, jsonb, text) to authenticated",
  "grant execute on function public.unpublish_approved_activity(bigint, text) to authenticated",
  "grant execute on function public.republish_approved_activity(bigint, text) to authenticated",
  "grant execute on function public.get_internal_pvi_report() to service_role",
];
const missingGrants = expectedRpcGrants.filter((grant) => !allSql.includes(grant));

assert(
  "versioned SQL grants match runtime RPC access model",
  missingGrants.length === 0,
  missingGrants.join(", "),
);

const favoriteHook = read("src/hooks/useFavorites.js");
assert(
  "favorites use hard delete against user_favorite_activities",
  favoriteHook.includes('.from("user_favorite_activities")') &&
    favoriteHook.includes(".delete()") &&
    !favoriteHook.includes("is_deleted"),
  "Favorites should remain hard-delete in this phase.",
);

const routeMap = read("src/App.jsx");
assert(
  "public wildcard still redirects to home",
  routeMap.includes('path="*"') && routeMap.includes('to="/"'),
  "Unknown public routes should not expose old placeholders.",
);

for (const result of results) {
  const detail = result.detail ? ` - ${result.detail}` : "";
  console.log(`${result.ok ? "PASS" : "FAIL"} ${result.name}${detail}`);
}

const failedResults = results.filter((result) => !result.ok);

if (failedResults.length) {
  console.error(`\n${failedResults.length} contract audit check(s) failed.`);
  process.exit(1);
}

console.log(`\n${results.length} contract audit check(s) passed.`);
