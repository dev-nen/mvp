import {
  createAnonClient,
  createServiceClient,
  ResultCollector,
} from "./runtime-script-utils.mjs";

const results = new ResultCollector();
const { client: anon, error: anonError } = createAnonClient();

if (!anon) {
  results.fail("Supabase anon client", anonError);
  results.print();
  results.exitIfFailed("Gate 3 data readiness");
}

const { data: catalogRows, error: catalogError } = await anon
  .from("catalog_activities_read")
  .select("id, title, image_url, city_id, category_label")
  .limit(100);

if (catalogError) {
  results.fail("catalog_activities_read dataset", catalogError.message);
} else if (!catalogRows?.length) {
  results.fail("catalog_activities_read dataset", "No public catalog rows found.");
} else {
  const withImage = catalogRows.filter((row) => row.image_url).length;
  results.pass("catalog_activities_read dataset", `${catalogRows.length} row(s), ${withImage} with image_url.`);

  if (withImage > 0) {
    results.pass("catalog image coverage", "At least one public activity has image_url.");
  } else {
    results.warn("catalog image coverage", "No activity has image_url; card image smoke will only cover fallback.");
  }
}

const { data: contactRows, error: contactError } = await anon
  .from("activity_contact_options")
  .select("activity_id, contact_method, contact_value")
  .eq("is_active", true)
  .eq("is_deleted", false)
  .limit(200);

if (contactError) {
  results.fail("activity_contact_options dataset", contactError.message);
} else {
  const contactCountByActivity = new Map();

  for (const row of contactRows || []) {
    contactCountByActivity.set(
      row.activity_id,
      (contactCountByActivity.get(row.activity_id) || 0) + 1,
    );
  }

  const catalogIds = new Set((catalogRows || []).map((row) => row.id));
  const zeroContactIds = [...catalogIds].filter((id) => !contactCountByActivity.has(id));
  const oneContactIds = [...contactCountByActivity.entries()]
    .filter(([activityId, count]) => catalogIds.has(activityId) && count === 1)
    .map(([activityId]) => activityId);
  const multiContactIds = [...contactCountByActivity.entries()]
    .filter(([activityId, count]) => catalogIds.has(activityId) && count > 1)
    .map(([activityId]) => activityId);

  results.pass("activity_contact_options active rows", `${contactRows?.length || 0} active row(s).`);

  if (zeroContactIds.length) {
    results.pass("contact zero-option case", `Activity id(s): ${zeroContactIds.slice(0, 5).join(", ")}`);
  } else {
    results.warn("contact zero-option case", "No public catalog activity without active contact option.");
  }

  if (oneContactIds.length) {
    results.pass("contact one-option case", `Activity id(s): ${oneContactIds.slice(0, 5).join(", ")}`);
  } else {
    results.warn("contact one-option case", "No public catalog activity with exactly one active contact option.");
  }

  if (multiContactIds.length) {
    results.pass("contact multi-option case", `Activity id(s): ${multiContactIds.slice(0, 5).join(", ")}`);
  } else {
    results.warn("contact multi-option case", "No public catalog activity with multiple active contact options.");
  }
}

const { client: service, error: serviceError } = createServiceClient();

if (!service) {
  results.warn("service-role dataset checks skipped", serviceError);
} else {
  const { count: internalAccessCount, error: accessError } = await service
    .from("internal_tool_access")
    .select("*", { count: "exact", head: true });

  if (accessError) {
    results.fail("internal_tool_access count", accessError.message);
  } else if (internalAccessCount > 0) {
    results.pass("internal_tool_access count", `${internalAccessCount} authorized user(s).`);
  } else {
    results.warn("internal_tool_access count", "No authorized internal user yet.");
  }

  const { count: draftCount, error: draftError } = await service
    .from("activity_drafts")
    .select("*", { count: "exact", head: true });

  if (draftError) {
    results.fail("activity_drafts count", draftError.message);
  } else if (draftCount > 0) {
    results.pass("activity_drafts count", `${draftCount} draft row(s).`);
  } else {
    results.warn("activity_drafts count", "No draft rows yet; run seed helper in Gate 3.");
  }
}

results.print();
results.exitIfFailed("Gate 3 data readiness");
