import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { getMaintenanceImportBatchKey, parseMaintenanceJsonImport } from "../src/helpers/maintenanceJsonImport.js";

// In-memory SQL only. Tables model the prerequisite schema; approval/update and
// contact publication execute the real Phase 4 functions, followed by the real
// maintenance migration. This covers normalization, trigger order and rollback.
const operator = "00000000-0000-0000-0000-000000000001";
const otherReviewer = "00000000-0000-0000-0000-000000000002";
const oldUser = "00000000-0000-0000-0000-000000000003";
const unapprovedReviewer = "00000000-0000-0000-0000-000000000004";
const refs = { centers: [{ id: 20, name: "Centro real", cityName: "Municipio real" }], categories: [{ id: 1, name: "Arte" }], types: [{ id: 1, name: "Taller" }] };
const source = { title: "Pintura", description: "Descripción confirmada", category: "Arte", type: "Taller", center: { name: "Centro real", city: "Municipio real" }, contacts: [{ method: "email", value: "centro@example.test" }], date: "17 de octubre", schedule: "11:00–13:00" };
const pending = parseMaintenanceJsonImport(JSON.stringify({ version: 1, activities: [source] }), refs);
assert.equal(pending[0].payload.activity.center_id, 20);
assert.equal(pending[0].payload.activity.age_rule_type, null);
assert.equal(pending[0].payload.activity.is_free, null);
assert.equal(pending[0].payload.activity.schedule_label, "17 de octubre · 11:00–13:00");
assert.ok(pending[0].warnings.some((warning) => warning.includes("año")));
assert.ok(pending[0].warnings.some((warning) => warning.includes("edad")));
assert.equal(pending[0].payload.contact_options[0].contact_value, "centro@example.test");
assert.throws(() => parseMaintenanceJsonImport("not json"), /JSON válido/);
assert.throws(() => parseMaintenanceJsonImport('{"version":2,"activities":[]}'), /version/);
const duplicateRefs = { ...refs, centers: [...refs.centers, { ...refs.centers[0], id: 2 }] };
assert.equal(parseMaintenanceJsonImport(JSON.stringify({ version: 1, activities: [source] }), duplicateRefs)[0].payload.activity.center_id, null);
const unsafe = parseMaintenanceJsonImport(JSON.stringify({ version: 1, activities: [{ ...source, image_url: "data:image/png;base64,secret", contacts: [{ method: "website", value: "javascript:alert(1)" }] }] }), refs)[0];
assert.equal(unsafe.payload.activity.image_url, null);
assert.deepEqual(unsafe.payload.contact_options, []);
const batchKey = await getMaintenanceImportBatchKey(pending);
assert.match(batchKey, /^[a-f0-9]{64}$/);
assert.equal(await getMaintenanceImportBatchKey(pending), batchKey);

const fixture = `
create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
create schema auth; create schema storage;
grant usage on schema public, auth, storage to anon, authenticated;
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create table auth.users(id uuid primary key);
create table public.user_profiles(id uuid primary key references auth.users(id), email text);
create table public.internal_tool_access(user_id uuid primary key references user_profiles(id), tool_name text);
alter table public.internal_tool_access enable row level security;
create policy legacy_permission_read on internal_tool_access for select to authenticated using (user_id = auth.uid());
grant select on internal_tool_access to authenticated;
create table public.cities(id bigint primary key, name text);
create table public.institutions(id bigint primary key, name varchar not null, is_active boolean not null default true, is_deleted boolean not null default false, created_by varchar default 'system', updated_by varchar default 'system');
create table public.centers(id bigint primary key, institution_id bigint not null references institutions(id), name varchar not null, city_id bigint not null references cities(id), address_line_1 varchar not null, postal_code varchar not null, is_active boolean not null default true, is_deleted boolean not null default false, created_by varchar default 'system', updated_by varchar default 'system');
create table public.categories(id bigint primary key);
create table public.type_activity(id bigint primary key);
create table public.activities(
 id bigint generated always as identity primary key, title text, center_id bigint,
 venue_name text, venue_address_1 text, venue_postal_code text, category_id bigint, type_id bigint,
 description text, description_format text, image_url text, age_rule_type text, age_min integer, age_max integer,
 price_label text, is_free boolean, schedule_label text, is_featured boolean, is_active boolean,
 owner_user_id uuid, created_by text, updated_by text, is_deleted boolean, updated_at timestamptz
);
create table public.activity_contact_options(
 id bigint generated always as identity primary key, activity_id bigint, contact_method text,
 contact_value text, contact_label text, is_active boolean, is_deleted boolean,
 deleted_at timestamptz, deleted_by text, updated_at timestamptz, updated_by text, created_by text
);
create table public.user_favorite_activities(id bigint primary key, private_value text);
create table public.activity_view_events(id bigint primary key);
create table public.activity_contact_events(id bigint primary key);
create table storage.objects(id bigint generated always as identity primary key, bucket_id text, name text);
alter table storage.objects enable row level security;
create policy legacy_user_image_insert on storage.objects for insert to authenticated with check (bucket_id = 'activities');
grant insert on storage.objects to authenticated;
grant usage on sequence storage.objects_id_seq to authenticated;
create table public.activity_drafts(
 id bigint generated always as identity primary key, source_type text, source_label text, source_reference_url text,
 parsed_payload_json jsonb not null default '{}', reviewed_payload_json jsonb not null default '{}',
 confidence_score numeric, review_status text not null default 'pending_review', created_by uuid,
 approved_activity_id bigint, reviewed_by uuid, submitted_by_user_id uuid, edit_activity_id bigint,
 user_feedback_summary text, user_feedback_json jsonb, review_notes text, updated_at timestamptz default now()
);
alter table public.activity_drafts enable row level security;
create policy legacy_draft_read on activity_drafts for select to authenticated using (true);
create policy legacy_draft_insert on activity_drafts for insert to authenticated with check (true);
create policy legacy_draft_update on activity_drafts for update to authenticated using (review_status = 'pending_review') with check (review_status = 'pending_review');
grant select, insert, update on activity_drafts to authenticated;
grant usage on sequence activity_drafts_id_seq to authenticated;
grant select, insert, update, delete on user_profiles, user_favorite_activities, activity_view_events, activity_contact_events to authenticated;
create function public.create_my_activity_submission(jsonb) returns bigint language plpgsql security definer as $$
begin
 insert into activity_drafts(source_type,created_by) values('user_submission',auth.uid()); return 1;
end;
$$;
grant execute on function public.create_my_activity_submission(jsonb) to authenticated;
insert into auth.users values('${operator}'),('${otherReviewer}'),('${oldUser}'),('${unapprovedReviewer}');
insert into user_profiles values('${operator}','operator@example.test'),('${otherReviewer}','reviewer@example.test'),('${oldUser}','old@example.test'),('${unapprovedReviewer}','unapproved@example.test');
insert into internal_tool_access values('${operator}','draft_inbox'),('${otherReviewer}','draft_inbox'),('${unapprovedReviewer}','draft_inbox');
insert into cities values(1,'Municipio real');
insert into categories values(1);
insert into type_activity values(1);
insert into institutions(id,name) values(12,'Entidad existente');
insert into centers(id,institution_id,name,city_id,address_line_1,postal_code) values(20,12,'Centro existente',1,'Calle real','00000');
insert into user_favorite_activities values(1,'Preserved legacy data');
insert into activity_drafts(source_type,source_label,created_by) values('user_submission','Historical draft','${oldUser}');
`;
const [phase4, contactLabels, contactPrimary, migration] = await Promise.all([
  "2026-05-20_zz_activity_contact_options_lifecycle_phase4.sql",
  "2026-05-23_contact_option_labels_and_form_type.sql",
  "2026-05-28_contact_option_single_primary.sql",
  "2026-10-02_maintenance_admin.sql",
].map((name) => readFile(new URL(`../supabase/sql/${name}`, import.meta.url), "utf8")));
function realFunction(sql, name) {
  const definition = sql.match(new RegExp(`create or replace function public\\.${name}\\([\\s\\S]*?\\n\\$\\$;`))?.[0];
  assert.ok(definition, `Missing real SQL function: ${name}`);
  return definition;
}
const realLifecycle = [
  realFunction(contactPrimary, "normalize_activity_contact_options"),
  realFunction(contactLabels, "replace_activity_contact_options_from_payload"),
  realFunction(phase4, "approve_activity_draft"),
  realFunction(phase4, "update_approved_activity_from_draft"),
  "revoke all on function public.approve_activity_draft(bigint) from public, anon;",
  "revoke all on function public.update_approved_activity_from_draft(bigint,jsonb,text) from public, anon;",
  "grant execute on function public.approve_activity_draft(bigint) to authenticated;",
  "grant execute on function public.update_approved_activity_from_draft(bigint,jsonb,text) to authenticated;",
].join("\n");
const db = new PGlite();
async function client(role, uid, sql, params = []) {
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [uid ?? ""]);
  await db.exec(`set role ${role}`);
  try { return await db.query(sql, params); }
  finally { await db.exec("reset role"); await db.query("select set_config('request.jwt.claim.sub','',false)"); }
}
const denied = (action) => assert.rejects(action, (failure) => failure.code === "42501");
try {
  await db.exec(fixture);
  await db.exec(realLifecycle);
  await db.exec(migration);
  await db.exec(migration); // additive migration is safe to reapply
  assert.equal((await client("authenticated", operator, "select public.is_maintenance_operator() ok")).rows[0].ok, false);
  await denied(() => client("authenticated", operator, "select public.import_maintenance_drafts($1,$2)", [batchKey, []]));
  await assert.rejects(() => db.query("insert into maintenance_operator(user_id) values($1)", [oldUser]), /existing draft_inbox/);
  await db.query("insert into maintenance_operator(user_id) values($1),($2)", [operator, otherReviewer]);
  assert.equal((await client("authenticated", operator, "select public.is_maintenance_operator() ok")).rows[0].ok, true);
  assert.equal((await client("authenticated", otherReviewer, "select public.is_maintenance_operator() ok")).rows[0].ok, true);
  for (const uid of [operator, otherReviewer]) {
    await client("authenticated", uid, "insert into storage.objects(bucket_id,name) values('activities','confirmed-admin.webp')");
    assert.equal((await client("authenticated", uid, "select * from public.list_maintenance_institutions()")).rows.length, 1);
  }
  await denied(() => client("anon", null, "select public.is_maintenance_operator()"));
  await denied(() => client("anon", null, "select public.approve_activity_draft(1)"));
  await denied(() => client("anon", null, "select public.update_approved_activity_from_draft(1,'{}',null)"));
  for (const uid of [unapprovedReviewer, oldUser]) {
    await denied(() => client("authenticated", uid, "select public.approve_activity_draft(1)"));
    await denied(() => client("authenticated", uid, "select public.update_approved_activity_from_draft(1,'{}',null)"));
    assert.equal((await client("authenticated", uid, "select * from activity_drafts")).rows.length, 0);
    await denied(() => client("authenticated", uid, "insert into activity_drafts(source_type,created_by) values('internal_manual',auth.uid())"));
    await denied(() => client("authenticated", uid, "insert into storage.objects(bucket_id,name) values('activities','user-submissions/private.jpg')"));
    await denied(() => client("authenticated", uid, "select public.create_my_activity_submission('{}')"));
    await denied(() => client("authenticated", uid, "select * from user_favorite_activities"));
    await denied(() => client("authenticated", uid, "select public.list_maintenance_institutions()"));
    await denied(() => client("authenticated", uid, "select public.create_maintenance_center('{}')"));
  }
  const items = pending.map((item) => ({ payload: item.payload, source_label: item.sourceLabel, source_reference_url: item.sourceUrl }));
  const imported = (await client("authenticated", operator, "select * from public.import_maintenance_drafts($1,$2)", [batchKey, items])).rows;
  assert.equal(imported.length, 1);
  assert.deepEqual((await client("authenticated", operator, "select * from public.import_maintenance_drafts($1,$2)", [batchKey, items])).rows, imported);
  assert.deepEqual((await client("authenticated", otherReviewer, "select * from public.import_maintenance_drafts($1,$2)", [batchKey, items])).rows, imported);
  const id = imported[0].draft_id;
  for (const uid of [operator, otherReviewer]) {
    await assert.rejects(() => client("authenticated", uid, "select public.approve_activity_draft($1)", [id]), /age and price must be confirmed/);
  }
  assert.equal((await db.query("select count(*)::integer count from activities")).rows[0].count, 0);
  assert.equal((await db.query("select count(*)::integer count from activity_contact_options")).rows[0].count, 0);
  const reviewed = { ...pending[0].payload, activity: { ...pending[0].payload.activity, age_rule_type: "range", age_min: 5, age_max: 10, is_free: false } };
  await client("authenticated", operator, "update activity_drafts set reviewed_payload_json=$1 where id=$2", [reviewed, id]);
  for (const uid of [operator, otherReviewer]) {
    await assert.rejects(() => client("authenticated", uid, "select public.approve_activity_draft($1)", [id]), /explicitly reviewed/);
  }
  assert.equal((await db.query("select count(*)::integer count from activities")).rows[0].count, 0);
  assert.equal((await db.query("select count(*)::integer count from activity_contact_options")).rows[0].count, 0);
  reviewed.import_review.review_confirmed = true;
  await client("authenticated", operator, "update activity_drafts set reviewed_payload_json=$1 where id=$2", [reviewed, id]);
  await client("authenticated", otherReviewer, "select public.approve_activity_draft($1)", [id]);
  assert.equal((await db.query("select reviewed_payload_json #>> '{import_review,review_confirmed}' confirmed from activity_drafts where id=$1", [id])).rows[0].confirmed, "true");
  assert.equal((await db.query("select contact_value from activity_contact_options where is_deleted=false")).rows[0].contact_value, "centro@example.test");
  // Each admin can approve a complete import through the real publication RPC.
  const secondReviewed = { ...reviewed, activity: { ...reviewed.activity, title: "Otra actividad confirmada", is_free: true } };
  const secondId = (await client("authenticated", otherReviewer, "select * from public.import_maintenance_drafts($1,$2)", ["d".repeat(64), [{ payload: secondReviewed }]])).rows[0].draft_id;
  await client("authenticated", otherReviewer, "update activity_drafts set reviewed_payload_json=$1 where id=$2", [secondReviewed, secondId]);
  await client("authenticated", operator, "select public.approve_activity_draft($1)", [secondId]);
  for (const uid of [operator, otherReviewer]) {
    const validEdit = { ...reviewed, activity: { ...reviewed.activity, description: `Descripción revisada por ${uid}`, is_free: true } };
    await client("authenticated", uid, "select public.update_approved_activity_from_draft($1,$2,$3)", [id, validEdit, "Fuente contrastada"]);
    const beforeDraft = (await db.query("select reviewed_payload_json from activity_drafts where id=$1", [id])).rows[0];
    assert.deepEqual(beforeDraft.reviewed_payload_json.import_review, reviewed.import_review);
    const beforeActivity = (await db.query("select * from activities where id=(select approved_activity_id from activity_drafts where id=$1)", [id])).rows[0];
    assert.equal(beforeActivity.age_rule_type, "range");
    assert.equal(beforeActivity.is_free, true);
    const beforeContacts = (await db.query("select * from activity_contact_options order by id")).rows;
    for (const missingValues of [
      { age_rule_type: null, age_min: null, age_max: null },
      { is_free: null },
      { age_rule_type: null, is_free: null },
    ]) {
      const incomplete = { ...validEdit, activity: { ...validEdit.activity, ...missingValues } };
      await assert.rejects(() => client("authenticated", uid, "select public.update_approved_activity_from_draft($1,$2,null)", [id, incomplete]), /age and price must be confirmed/);
      assert.deepEqual((await db.query("select reviewed_payload_json from activity_drafts where id=$1", [id])).rows[0], beforeDraft);
      assert.deepEqual((await db.query("select * from activities where id=$1", [beforeActivity.id])).rows[0], beforeActivity);
      assert.deepEqual((await db.query("select * from activity_contact_options order by id")).rows, beforeContacts);
    }
  }
  const newPayload = { ...pending[0].payload, center: { mode: "proposed_new", name: "Nuevo centro" } };
  const nextItems = [{ payload: newPayload, source_label: "Centro nuevo" }];
  const nextKey = "b".repeat(64);
  const nextId = (await client("authenticated", otherReviewer, "select * from public.import_maintenance_drafts($1,$2)", [nextKey, nextItems])).rows[0].draft_id;
  const centerRequest = { draft_id: nextId, name: "Nuevo centro", institution_name: "Nueva entidad", city_id: 1, address_line_1: "Calle confirmada 2", postal_code: "00000" };
  await assert.rejects(() => client("authenticated", operator, "select create_maintenance_center($1)", [{ ...centerRequest, postal_code: null }]), /postcode/);
  const centerId = (await client("authenticated", otherReviewer, "select create_maintenance_center($1) id", [centerRequest])).rows[0].id;
  assert.ok(Number(centerId) > 20);
  assert.equal((await db.query("select count(*)::integer count from institutions where name='Nueva entidad'")).rows[0].count, 1);
  assert.equal((await client("authenticated", operator, "select create_maintenance_center($1) id", [centerRequest])).rows[0].id, centerId);
  assert.equal((await db.query("select reviewed_payload_json #>> '{activity,center_id}' center from activity_drafts where id=$1", [nextId])).rows[0].center, String(centerId));
  const before = (await db.query("select count(*)::integer count from activity_drafts")).rows[0].count;
  await assert.rejects(() => client("authenticated", operator, "select import_maintenance_drafts($1,$2)", ["c".repeat(64), [items[0], { payload: null }]]), /invalid activity/);
  assert.equal((await db.query("select count(*)::integer count from activity_drafts")).rows[0].count, before);
  assert.equal((await db.query("select private_value from user_favorite_activities where id=1")).rows[0].private_value, "Preserved legacy data");
  await db.exec(migration);
  for (const uid of [operator, otherReviewer]) assert.equal((await client("authenticated", uid, "select public.is_maintenance_operator() ok")).rows[0].ok, true);
  console.log("Maintenance admin checks passed: real Phase 4 approval/update/contact publication, unknown-value denial and rollback, preserved import review, atomic retries, both admins and denied outsiders, RLS/RPC/storage, retired writes, centers/institutions, legacy preservation.");
} finally { await db.close(); }
