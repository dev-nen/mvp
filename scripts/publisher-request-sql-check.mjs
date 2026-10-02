import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";

// No connection strings, environment secrets, disk database or network are used.
// These are minimal prerequisite fixtures, not a copy of the Supabase schema.
const root = fileURLToPath(new URL("../", import.meta.url));
const migrationPath = "supabase/sql/2026-05-30_publisher_request_flow_phase4.sql";
const hardeningPath = "supabase/sql/2026-09-18_publisher_request_review_hardening.sql";
const owner = "00000000-0000-0000-0000-000000000001";
const outsider = "00000000-0000-0000-0000-000000000002";
const reviewer = "00000000-0000-0000-0000-000000000003";
const privateNote = "FIXTURE: internal reviewer note, never for the requester";
const payload = {
  full_name: "Fixture organizer",
  organizer_type: "individual",
  city_id: 1,
  phone: "+34000000000",
  website: "fixture.example",
  activity_description: "Synthetic activity for local regression checks",
};
const fixtureSql = `
  create role anon nologin;
  create role authenticated nologin;
  create schema auth;
  grant usage on schema public, auth to anon, authenticated;
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  create table auth.users (id uuid primary key);
  create table public.user_profiles (
    id uuid primary key references auth.users(id), email text
  );
  create table public.cities (
    id bigint primary key, name text, is_active boolean, place_type text,
    country_code text, municipality_code text, dir3_code text
  );
  create table public.internal_tool_access (user_id uuid, tool_name text);
  create table public.activity_drafts (
    id bigint generated always as identity primary key,
    submitted_by_user_id uuid, source_type text, parent_draft_id bigint,
    edit_activity_id bigint, revision_number integer default 1,
    review_status text default 'pending_review', title text
  );
  insert into auth.users values ('${owner}'), ('${outsider}'), ('${reviewer}');
  insert into public.user_profiles values
    ('${owner}', 'owner@fixture.example'),
    ('${outsider}', 'outsider@fixture.example'),
    ('${reviewer}', 'reviewer@fixture.example');
  insert into public.cities values
    (1, 'Fixture municipality', true, 'municipality', 'ES', '00001', 'L00000001'),
    (2, 'Inactive fixture municipality', false, 'municipality', 'ES', '00002', 'L00000002');
  insert into public.internal_tool_access values ('${reviewer}', 'draft_inbox');
  insert into public.activity_drafts (submitted_by_user_id, source_type, title)
    values ('${outsider}', 'user_submission', 'Historical fixture');

  -- STUB: models only the prerequisite caller-owned INSERT so the real Phase 4
  -- trigger can be exercised as authenticated. It does not test the full Phase 3
  -- RPC, payload validation, catalog/contact writes or existing correction RPCs.
  create function public.create_my_activity_submission(jsonb, text default null)
  returns bigint language plpgsql security definer
  set search_path = public, pg_temp as $$
  declare draft_id bigint;
  begin
    insert into public.activity_drafts (submitted_by_user_id, source_type, title)
      values (auth.uid(), 'user_submission', 'Submission fixture')
      returning id into draft_id;
    return draft_id;
  end;
  $$;
  revoke all on function public.create_my_activity_submission(jsonb, text) from public;
  grant execute on function public.create_my_activity_submission(jsonb, text) to authenticated;
`;

const migrationSql = await readFile(new URL(`../${migrationPath}`, import.meta.url), "utf8");
const hardeningSql = await readFile(new URL(`../${hardeningPath}`, import.meta.url), "utf8");
// Optional one-time reproduction against the actual pre-fix revision. Ordinary
// checks need no git history, so they also run in archives and shallow CI clones.
// Run `npm run check:publisher-sql -- --baseline` when 86a3ef4 is available locally.
const checkOriginal = process.argv.includes("--baseline");
const originalSql = checkOriginal ? execFileSync("git", ["show", `86a3ef4:${migrationPath}`], {
  cwd: root,
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
}) : null;

async function asClient(db, role, userId, action) {
  assert.ok(["anon", "authenticated"].includes(role));
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [userId ?? ""]);
  await db.exec(`set role ${role}`);
  try {
    return await action();
  } finally {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub', '', false)");
  }
}

const rpc = (db, userId, sql, params = []) =>
  asClient(db, "authenticated", userId, () => db.query(sql, params));
const status = async (db, userId) =>
  (await rpc(db, userId, "select * from public.get_my_publisher_status()")).rows[0];
const submit = async (db, userId = owner, data = payload) =>
  (await rpc(db, userId, "select public.submit_my_publisher_request($1) as id", [data])).rows[0].id;
const denied = (action, code, message) => assert.rejects(action, (error) => {
  assert.equal(error.code, code, error.message);
  if (message) assert.match(error.message, message);
  return true;
});

function assertSafeStatus(value) {
  const forbidden = /internal_review_notes|reviewed_by|approved_by|user_id|publisher_request_id/;
  assert.doesNotMatch(JSON.stringify(value), forbidden);
  assert.ok(!JSON.stringify(value).includes(privateNote));
}

const reviewCalls = (id) => [
  ["select * from public.list_internal_publisher_requests(null)", []],
  ["select * from public.get_internal_publisher_request($1)", [id]],
  ["select * from public.request_internal_publisher_changes($1, $2, $3, $4)", [id, "Fix phone", [], privateNote]],
  ["select * from public.reject_internal_publisher_request($1, $2, $3, $4)", [id, "Not eligible", [], privateNote]],
  ["select * from public.approve_internal_publisher_request($1, $2)", [id, privateNote]],
];

async function assertPermissions(db, requestId) {
  const calls = [
    ["select * from public.get_my_publisher_status()", []],
    ["select public.submit_my_publisher_request($1)", [payload]],
    ["select public.resubmit_my_publisher_request($1, $2)", [requestId, payload]],
    ...reviewCalls(requestId),
  ];
  for (const [sql, params] of calls) {
    await denied(() => asClient(db, "anon", null, () => db.query(sql, params)), "42501");
    await denied(() => rpc(db, null, sql, params), "P0001", /auth.uid\(\) is required/);
  }
  for (const [sql, params] of reviewCalls(requestId)) {
    await denied(() => rpc(db, owner, sql, params), "P0001", /draft_inbox access is required/);
  }
  await denied(() => rpc(db, outsider,
    "select public.resubmit_my_publisher_request($1, $2)", [requestId, payload]),
  "P0001", /not available for current user/);
  for (const [role, uid] of [["anon", null], ["authenticated", owner], ["authenticated", outsider], ["authenticated", reviewer]]) {
    for (const table of ["publisher_requests", "publisher_profiles"]) {
      for (const sql of [
        `select * from public.${table}`,
        `insert into public.${table} default values`,
        `update public.${table} set full_name = 'forbidden'`,
        `delete from public.${table}`,
      ]) {
        await denied(() => asClient(db, role, uid, () => db.query(sql)), "42501");
      }
    }
  }
  await denied(() => rpc(db, owner, "select * from public.normalize_publisher_request_payload($1)", [payload]), "42501");
}

async function lifecycle(db, existingRequestId) {
  if (!existingRequestId) {
    const initial = await status(db, owner);
    assert.equal(initial.status, "not_requested");
    assert.equal(initial.can_request, true);
    assert.equal(initial.can_submit_activities, false);
    assert.equal(initial.latest_request, null);
    await denied(() => submit(db, owner, { ...payload, city_id: 2 }), "P0001", /active ES municipality/);
  }
  const firstId = existingRequestId ?? await submit(db);
  let current = await status(db, owner);
  assert.equal(current.status, "pending_review");
  assert.equal(current.latest_request.website, "https://fixture.example");
  assert.equal(current.can_request, false);
  assert.equal(current.can_resubmit, false);
  assertSafeStatus(current);
  assert.equal((await status(db, outsider)).latest_request, null);
  await assertPermissions(db, firstId);
  await denied(() => submit(db), "P0001", /cannot be submitted in current status/);
  await denied(() => rpc(db, owner, "select public.create_my_activity_submission('{}', null)"),
    "P0001", /approved publisher status is required/);

  const changes = await rpc(db, reviewer, reviewCalls(firstId)[2][0], reviewCalls(firstId)[2][1]);
  assert.equal(changes.rows[0].review_status, "needs_changes");
  current = await status(db, owner);
  assert.equal(current.status, "needs_changes");
  assert.equal(current.can_resubmit, true);
  assert.equal(current.user_feedback_summary, "Fix phone");
  assertSafeStatus(current);
  const internal = await rpc(db, reviewer, "select * from public.get_internal_publisher_request($1)", [firstId]);
  assert.equal(internal.rows[0].internal_review_notes, privateNote);
  assert.equal(internal.rows[0].user_email, "owner@fixture.example");

  const secondId = (await rpc(db, owner, "select public.resubmit_my_publisher_request($1, $2) as id", [firstId, payload])).rows[0].id;
  assert.notEqual(secondId, firstId);
  await denied(() => rpc(db, owner, "select public.resubmit_my_publisher_request($1, $2)", [firstId, payload]),
    "P0001", /already pending review/);
  const rejected = await rpc(db, reviewer, reviewCalls(secondId)[3][0], reviewCalls(secondId)[3][1]);
  assert.equal(rejected.rows[0].review_status, "rejected");
  current = await status(db, owner);
  assert.equal(current.status, "rejected");
  assert.equal(current.can_request, true);
  assert.equal(current.can_resubmit, true);
  assertSafeStatus(current);

  const thirdId = await submit(db);
  const approved = await rpc(db, reviewer, reviewCalls(thirdId)[4][0], reviewCalls(thirdId)[4][1]);
  assert.equal(approved.rows[0].review_status, "approved");
  current = await status(db, owner);
  assert.equal(current.status, "approved");
  assert.equal(current.can_submit_activities, true);
  assert.equal(current.can_request, false);
  assert.equal(current.can_resubmit, false);
  assert.equal(current.user_feedback_summary, null);
  assert.ok(current.active_profile);
  assertSafeStatus(current);
  assert.equal((await status(db, outsider)).active_profile, null);
  await denied(() => submit(db), "P0001", /already approved/);
  await denied(() => rpc(db, reviewer, reviewCalls(thirdId)[4][0], reviewCalls(thirdId)[4][1]),
    "P0001", /not pending review/);

  const history = (await db.query("select id, supersedes_request_id, review_status from public.publisher_requests where user_id = $1 order by id", [owner])).rows;
  assert.deepEqual(history.map((row) => row.review_status), ["needs_changes", "rejected", "approved"]);
  assert.equal(history[1].supersedes_request_id, firstId);
  assert.equal(history[2].supersedes_request_id, secondId);
  const pending = (await rpc(db, reviewer, "select * from public.list_internal_publisher_requests('pending_review')")).rows;
  assert.equal(pending.length, 0);

  // The fixture RPC exercises the actual INSERT trigger, not Phase 3 validation.
  const draftId = (await rpc(db, owner, "select public.create_my_activity_submission('{}', null) as id")).rows[0].id;
  const draft = (await db.query("select * from public.activity_drafts where id = $1", [draftId])).rows[0];
  assert.equal(draft.submitted_by_user_id, owner);
  assert.equal(draft.source_type, "user_submission");
  assert.equal(draft.review_status, "pending_review");
  await denied(() => rpc(db, outsider, "select public.create_my_activity_submission('{}', null)"),
    "P0001", /approved publisher status is required/);
  await denied(() => rpc(db, null, "select public.create_my_activity_submission('{}', null)"),
    "P0001", /auth.uid\(\) is required/);
  await denied(() => rpc(db, outsider, "insert into public.activity_drafts (source_type) values ('internal')"), "42501");

  // Owner-level inserts isolate the trigger's exceptions. These do NOT assert
  // that the full correction/edit RPC ownership rules or UI were exercised.
  await db.query(`insert into public.activity_drafts
    (submitted_by_user_id, source_type, parent_draft_id, edit_activity_id, revision_number)
    values ($1, 'user_submission', 1, null, 2),
      ($1, 'user_submission', null, 123, 1), ($1, 'internal', null, null, 1)`, [outsider]);
  assert.equal((await db.query("select count(*)::int as count from public.activity_drafts where title = 'Historical fixture'")).rows[0].count, 1);
  await assertPermissions(db, thirdId);
}

async function snapshot(db) {
  return (await db.query(`select
    (select jsonb_agg(to_jsonb(r) order by id) from public.publisher_requests r) as requests,
    (select jsonb_agg(to_jsonb(p) order by id) from public.publisher_profiles p) as profiles,
    (select jsonb_agg(to_jsonb(d) order by id) from public.activity_drafts d) as drafts`)).rows[0];
}

async function checkRerun(db) {
  const before = await snapshot(db);
  await db.exec(migrationSql);
  await db.exec(hardeningSql);
  await db.exec(hardeningSql);
  assert.deepEqual(await snapshot(db), before);
  await assertPermissions(db, before.requests.at(-1).id);
  assert.equal((await db.query(`select count(*)::int as count from pg_trigger
    where tgname = 'activity_drafts_require_approved_publisher_for_submission'`)).rows[0].count, 1);
}

async function scenario(name, run) {
  const db = await PGlite.create();
  try {
    await db.exec(fixtureSql);
    await run(db);
    console.log(`PASS ${name}`);
  } finally {
    await db.close();
  }
}

await scenario("fresh migration: lifecycle, safe status, role denials, publisher gate, rerun", async (db) => {
  await db.exec(migrationSql);
  await lifecycle(db);
  await checkRerun(db);
});

await scenario(`${checkOriginal ? "original defects reproduced; " : ""}additive upgrade: lifecycle, permissions, existing data and rerun`, async (db) => {
  await db.exec(originalSql ?? migrationSql);
  const requestId = await submit(db);
  await db.query("update public.publisher_requests set internal_review_notes = $1 where id = $2", [privateNote, requestId]);
  if (checkOriginal) {
    const leaked = await rpc(db, owner, "select internal_review_notes from public.publisher_requests where id = $1", [requestId]);
    assert.equal(leaked.rows[0].internal_review_notes, privateNote);
    for (const [sql, params] of reviewCalls(requestId).slice(2)) {
      await denied(() => rpc(db, reviewer, sql, params), "42702", /review_status.*ambiguous/);
    }
  }
  const before = await snapshot(db);
  await db.exec(hardeningSql);
  assert.deepEqual(await snapshot(db), before);
  await lifecycle(db, requestId);
  await checkRerun(db);
});

console.log("Local PostgreSQL checks passed. Fixtures/stub only: live Supabase, full submission/correction RPCs, OAuth and browser flows remain separate validation.");
