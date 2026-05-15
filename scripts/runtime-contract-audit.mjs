import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const results = [];

function read(relativePath) {
  return readFileSync(path.join(rootDir, relativePath), "utf8");
}

function readSqlDirectory(relativePath) {
  return readdirSync(path.join(rootDir, relativePath))
    .filter((fileName) => fileName.endsWith(".sql"))
    .sort()
    .map((fileName) => read(path.join(relativePath, fileName)));
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
  const viewMatches = [
    ...sql.matchAll(
      /create or replace view public\.catalog_activities_read as\s*select\s+([\s\S]+?)\s+from public\.activities/gi,
    ),
  ];
  const viewBody = viewMatches.at(-1)?.[1];

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
const allSql = readSqlDirectory("supabase/sql").join("\n");

const catalogService = read("src/services/catalogService.js");
const activityPresentation = read("src/helpers/activityPresentation.js");
const catalogSearch = read("src/helpers/catalogSearch.js");
const catalogArea = read("src/helpers/catalogArea.js");
const catalogSelect = getStringConstValue(catalogService, "CATALOG_SELECT");
const catalogColumns = splitSelectColumns(catalogSelect);
const catalogReadColumns = getCatalogReadColumns(allSql);
const missingCatalogColumns = catalogColumns.filter((column) => {
  const columnName = column.split(/\s+as\s+/i).pop();
  return !catalogReadColumns.has(columnName);
});

assert(
  "catalogService select columns are present in catalog_activities_read SQL",
  missingCatalogColumns.length === 0,
  missingCatalogColumns.join(", "),
);

assert(
  "short_description is compatibility-only in frontend logic",
  activityPresentation.includes("getPlainActivityDescription") &&
    activityPresentation.includes("getActivityDescriptionExcerpt") &&
    activityPresentation.includes("short_description` queda") &&
    catalogSearch.includes("getPlainActivityDescription(activity)") &&
    catalogArea.includes("getPlainActivityDescription(activity)") &&
    !read("src/helpers/mapDraftPayloadToFormState.js").includes("shortDescription") &&
    !read("src/helpers/mapFormStateToDraftPayload.js").includes("short_description") &&
    !read("src/features/scout-drafts/ScoutDraftReviewForm.jsx").includes("short_description"),
  "Draft forms and payload mappers must not reintroduce short_description as an editorial field.",
);

const contactService = read("src/services/activityContactOptionsService.js");
assert(
  "contact service reads only activity_contact_options_read as contact source",
  contactService.includes('.from("activity_contact_options_read")') &&
    !contactService.includes('.from("activity_contact_options")') &&
    !contactService.includes('.from("centers")'),
  "Public contact reads must go through the safe published-activity view.",
);

assert(
  "contact options read view follows public catalog visibility",
  allSql.includes("create or replace view public.activity_contact_options_read") &&
    allSql.includes("join public.activities") &&
    allSql.includes("join public.centers") &&
    allSql.includes("activity_contact_options.is_active = true") &&
    allSql.includes("activities.is_active = true") &&
    allSql.includes("centers.is_active = true"),
  "Public contact options must be scoped to active options, activities, and centers.",
);

assert(
  "contact options read view reloads PostgREST schema cache",
  allSql.includes("notify pgrst, 'reload schema'"),
  "Contact-view rollout must refresh PostgREST so the REST endpoint is visible.",
);

assert(
  "seed helper execute privilege is service-role only",
  allSql.includes("revoke all on function public.seed_activity_draft_examples(uuid) from public") &&
    allSql.includes("revoke all on function public.seed_activity_draft_examples(uuid) from anon") &&
    allSql.includes("revoke all on function public.seed_activity_draft_examples(uuid) from authenticated") &&
    allSql.includes("grant execute on function public.seed_activity_draft_examples(uuid) to service_role") &&
    !allSql.includes("grant execute on function public.seed_activity_draft_examples(uuid) to authenticated"),
  "Draft Inbox seed helper can grant internal access and must not be callable by normal roles.",
);

assert(
  "ensure_my_profile validates active DIR3 ES municipalities",
  allSql.includes("profile_city_id must reference an active ES municipality") &&
    allSql.includes("place_type = 'municipality'") &&
    allSql.includes("country_code = 'ES'") &&
    allSql.includes("municipality_code is not null") &&
    allSql.includes("dir3_code is not null"),
  "Profile city ids must be limited to onboarding-valid municipality rows.",
);

const municipalityService = read("src/services/municipalityService.js");
const municipalityNameSearchIndex = municipalityService.indexOf(
  '.ilike("name_search", prefixPattern)',
);
const municipalityMetadataSearchIndex = municipalityService.indexOf(
  '.ilike("search_text", ilikePattern)',
);

assert(
  "municipality search prioritizes names before metadata",
  municipalityNameSearchIndex >= 0 &&
    municipalityMetadataSearchIndex >= 0 &&
    municipalityNameSearchIndex < municipalityMetadataSearchIndex &&
    municipalityService.includes("getMunicipalityChoiceRank") &&
    municipalityService.includes("normalizedDisplayName === normalizedQuery") &&
    municipalityService.includes("normalizedProvinceName === normalizedQuery"),
  "Onboarding search must not let province/search_text matches hide exact municipality names.",
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
const routeMap = read("src/App.jsx");
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

assert(
  "internal draft creation route is protected and writes drafts only",
  routeMap.includes('path="/internal/drafts/new"') &&
    routeMap.includes("<InternalDraftCreatePage />") &&
    routeMap.includes("<InternalToolRoute>") &&
    read("src/services/internalDraftsService.js").includes('.from("activity_drafts")') &&
    read("src/services/internalDraftsService.js").includes(".insert({") &&
    !read("src/pages/InternalDraftCreatePage.jsx").includes('.from("activities")') &&
    !read("src/pages/InternalDraftCreatePage.jsx").includes("activity_contact_options"),
  "The internal create form must remain inside Draft Inbox and create activity_drafts.",
);

assert(
  "versioned SQL allows draft insert only for internal Draft Inbox users",
  allSql.includes("grant insert on public.activity_drafts to authenticated") &&
    allSql.includes("create policy activity_drafts_insert_internal_reviewers") &&
    allSql.includes("created_by = auth.uid()") &&
    allSql.includes("tool_name = 'draft_inbox'"),
  "Draft insert RLS must require internal_tool_access.",
);

assert(
  "description_format is preserved through draft approval lifecycle",
  allSql.includes("add column if not exists description_format") &&
    allSql.includes("activities.description_format") &&
    allSql.includes("'description_format', resolved_description_format") &&
    allSql.includes("description_format = resolved_description_format"),
  "Approved activities must preserve description_format.",
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
