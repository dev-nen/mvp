-- Additive, fail-closed maintenance transition. Apply after the existing draft /
-- contact lifecycle migrations, never automatically from the browser or build.
-- No account, legacy draft, favorite or publisher data is deleted.
-- Provision BOTH verified existing admins separately after applying this file:
-- insert into public.maintenance_operator(user_id)
-- select id from public.user_profiles where id in (<verified-admin-uuids>);
-- The provisioning trigger also requires existing draft_inbox authorization.
begin;

create table if not exists public.maintenance_operator (
  user_id uuid primary key references public.user_profiles(id),
  created_at timestamptz not null default now()
);
alter table public.maintenance_operator enable row level security;
revoke all on public.maintenance_operator from public, anon, authenticated;

create or replace function public.validate_maintenance_operator()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not exists (select 1 from public.internal_tool_access where user_id = new.user_id and tool_name = 'draft_inbox') then
    raise exception 'maintenance operator must have existing draft_inbox authorization';
  end if;
  return new;
end;
$$;
revoke all on function public.validate_maintenance_operator() from public, anon, authenticated;
drop trigger if exists validate_maintenance_operator on public.maintenance_operator;
create trigger validate_maintenance_operator before insert or update on public.maintenance_operator
for each row execute function public.validate_maintenance_operator();

create or replace function public.is_maintenance_operator()
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select auth.uid() is not null and exists (
    select 1 from public.maintenance_operator m
    join public.internal_tool_access a on a.user_id = m.user_id and a.tool_name = 'draft_inbox'
    where m.user_id = auth.uid()
  );
$$;
revoke all on function public.is_maintenance_operator() from public, anon;
grant execute on function public.is_maintenance_operator() to authenticated;

create or replace function public.assert_maintenance_operator()
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public.is_maintenance_operator() then raise exception 'maintenance operator access is required' using errcode = '42501'; end if;
end;
$$;
revoke all on function public.assert_maintenance_operator() from public, anon, authenticated;

create or replace function public.assert_maintenance_activity_facts(p_payload jsonb)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare activity jsonb := p_payload -> 'activity';
begin
  if coalesce(activity ->> 'age_rule_type', '') not in ('all', 'range', 'from', 'until')
    or jsonb_typeof(activity -> 'is_free') is distinct from 'boolean' then
    raise exception 'age and price must be confirmed before publication or update';
  end if;
end;
$$;
revoke all on function public.assert_maintenance_activity_facts(jsonb) from public, anon, authenticated;

-- Restrictive policies intersect every legacy permissive policy. SECURITY
-- DEFINER internal RPCs receive the additional operator check below.
drop policy if exists maintenance_operator_only on public.activity_drafts;
create policy maintenance_operator_only on public.activity_drafts as restrictive
for all to authenticated using (public.is_maintenance_operator()) with check (public.is_maintenance_operator());
drop policy if exists maintenance_operator_only on public.internal_tool_access;
create policy maintenance_operator_only on public.internal_tool_access as restrictive
for all to authenticated using (public.is_maintenance_operator()) with check (public.is_maintenance_operator());
drop policy if exists maintenance_activity_storage_writes on storage.objects;
create policy maintenance_activity_storage_writes on storage.objects as restrictive
for insert to authenticated with check (bucket_id <> 'activities' or public.is_maintenance_operator());
drop policy if exists maintenance_activity_storage_updates on storage.objects;
create policy maintenance_activity_storage_updates on storage.objects as restrictive
for update to authenticated using (bucket_id <> 'activities' or public.is_maintenance_operator())
with check (bucket_id <> 'activities' or public.is_maintenance_operator());
drop policy if exists maintenance_activity_storage_deletes on storage.objects;
create policy maintenance_activity_storage_deletes on storage.objects as restrictive
for delete to authenticated using (bucket_id <> 'activities' or public.is_maintenance_operator());

-- Revoke retired public/private-user surfaces if installed, including optional
-- publisher phase tables/RPCs. Keeping records is distinct from granting access.
do $$
declare routine record; target text;
begin
  for routine in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = any(array[
      'ensure_my_profile', 'create_my_activity_submission', 'resubmit_my_activity_draft',
      'create_my_activity_edit_draft', 'unpublish_my_activity', 'list_my_activity_publications',
      'get_my_activity_draft_for_correction', 'get_my_activity_for_edit',
      'get_my_publisher_status', 'submit_my_publisher_request', 'resubmit_my_publisher_request',
      'list_internal_publisher_requests', 'get_internal_publisher_request',
      'request_internal_publisher_changes', 'reject_internal_publisher_request', 'approve_internal_publisher_request'
    ])
  loop execute format('revoke all on function %s from public, anon, authenticated', routine.signature); end loop;
  foreach target in array array['user_profiles', 'user_favorite_activities', 'activity_view_events', 'activity_contact_events', 'publisher_requests', 'publisher_profiles']
  loop
    if to_regclass('public.' || target) is not null then
      execute format('revoke all on public.%I from public, anon, authenticated', target);
    end if;
  end loop;
  foreach target in array array['activities', 'centers', 'institutions', 'activity_contact_options']
  loop
    if to_regclass('public.' || target) is not null then execute format('revoke insert, update, delete, truncate, references, trigger on public.%I from public, anon, authenticated', target); end if;
  end loop;
end;
$$;

-- Add a guard to each existing internal lifecycle RPC without duplicating its
-- business logic or assuming one historical function body. This migration is
-- idempotent and aborts if an installed routine has an unrecognised structure.
do $$
declare routine record; original_body text; guarded_body text; definition text;
begin
  for routine in select p.oid, p.proname, p.proargnames, p.oid::regprocedure as signature, p.prosrc, l.lanname
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace join pg_language l on l.oid = p.prolang
    where n.nspname = 'public' and p.proname = any(array[
      'approve_activity_draft', 'list_internal_approved_activity_states', 'get_internal_approved_activity',
      'update_approved_activity_from_draft', 'unpublish_approved_activity', 'republish_approved_activity',
      'request_activity_draft_changes', 'reject_activity_draft_with_feedback', 'archive_activity_draft',
      'list_internal_admin_activities', 'publish_internal_admin_activity', 'unpublish_internal_admin_activity'
    ])
  loop
    execute format('revoke all on function %s from public, anon', routine.signature);
    if routine.lanname <> 'plpgsql' then raise exception 'unsupported maintenance RPC language: %', routine.signature; end if;
    original_body := routine.prosrc;
    guarded_body := original_body;
    if position('-- maintenance-operator-guard' in guarded_body) = 0 then
      guarded_body := regexp_replace(original_body, '(^|\n)(begin[[:space:]]*\n)', E'\\1\\2  perform public.assert_maintenance_operator(); -- maintenance-operator-guard\n', 'i');
      if guarded_body = original_body then raise exception 'cannot safely guard maintenance RPC: %', routine.signature; end if;
    end if;
    if routine.proname = 'update_approved_activity_from_draft' and position('-- maintenance-review-payload-guard' in guarded_body) = 0 then
      if not coalesce('p_reviewed_payload' = any(routine.proargnames), false) then
        raise exception 'unsupported maintenance update payload argument: %', routine.signature;
      end if;
      guarded_body := replace(guarded_body,
        'perform public.assert_maintenance_operator(); -- maintenance-operator-guard',
        E'perform public.assert_maintenance_operator(); -- maintenance-operator-guard\n  perform public.assert_maintenance_activity_facts(p_reviewed_payload); -- maintenance-review-payload-guard');
      if position('-- maintenance-review-payload-guard' in guarded_body) = 0 then
        raise exception 'cannot safely guard maintenance update payload: %', routine.signature;
      end if;
    end if;
    if guarded_body = original_body then continue; end if;
    definition := replace(pg_get_functiondef(routine.oid), original_body, guarded_body);
    execute definition;
  end loop;
end;
$$;

-- Approval must never silently turn unknown imported ages into all-ages or an
-- unknown price into paid. The trigger also checks the explicit review step.
create or replace function public.check_maintenance_draft_approval()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.review_status = 'approved' and old.review_status is distinct from 'approved' then
    perform public.assert_maintenance_operator();
    perform public.assert_maintenance_activity_facts(old.reviewed_payload_json);
    if old.parsed_payload_json ? 'import_review' and coalesce((old.reviewed_payload_json #>> '{import_review,review_confirmed}')::boolean, false) <> true then
      raise exception 'imported draft must be explicitly reviewed before approval';
    end if;
  end if;
  -- Legacy lifecycle RPCs rebuild the payload and omit import provenance. Keep
  -- it during both first approval and subsequent edits of approved activities.
  if new.review_status = 'approved' and old.reviewed_payload_json ? 'import_review' then
    new.reviewed_payload_json := jsonb_set(new.reviewed_payload_json, '{import_review}', old.reviewed_payload_json -> 'import_review');
  end if;
  return new;
end;
$$;
revoke all on function public.check_maintenance_draft_approval() from public, anon, authenticated;
drop trigger if exists check_maintenance_draft_approval on public.activity_drafts;
create trigger check_maintenance_draft_approval before update on public.activity_drafts
for each row execute function public.check_maintenance_draft_approval();

create table if not exists public.maintenance_import_batches (
  batch_key text primary key check (batch_key ~ '^[a-f0-9]{64}$'),
  created_by uuid not null references auth.users(id),
  draft_ids bigint[] not null,
  created_at timestamptz not null default now()
);
alter table public.maintenance_import_batches enable row level security;
revoke all on public.maintenance_import_batches from public, anon, authenticated;

create or replace function public.import_maintenance_drafts(p_batch_key text, p_items jsonb)
returns table(draft_id bigint, title text) language plpgsql security definer set search_path = public, pg_temp as $$
declare item jsonb; ids bigint[]; new_id bigint; payload jsonb;
begin
  perform public.assert_maintenance_operator();
  if p_batch_key is null or p_batch_key !~ '^[a-f0-9]{64}$' then raise exception 'invalid import batch key'; end if;
  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) not between 1 and 100 or octet_length(p_items::text) > 1048576 then raise exception 'invalid import batch'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_batch_key, 0));
  select b.draft_ids into ids from public.maintenance_import_batches b where b.batch_key = p_batch_key;
  if not found then
    ids := array[]::bigint[];
    for item in select value from jsonb_array_elements(p_items) loop
      payload := item -> 'payload';
      if jsonb_typeof(payload) is distinct from 'object' or jsonb_typeof(payload -> 'activity') is distinct from 'object' then raise exception 'invalid activity payload'; end if;
      payload := jsonb_set(payload, '{import_review}', coalesce(payload -> 'import_review', '{}'::jsonb) || jsonb_build_object('requires_confirmation', true, 'review_confirmed', false));
      insert into public.activity_drafts(source_type, source_label, source_reference_url, parsed_payload_json, reviewed_payload_json, confidence_score, review_status, created_by)
      values ('internal_manual', nullif(trim(item ->> 'source_label'), ''),
        case when item ->> 'source_reference_url' ~ '^https?://' then item ->> 'source_reference_url' else null end,
        payload, payload, null, 'pending_review', auth.uid()) returning id into new_id;
      ids := array_append(ids, new_id);
    end loop;
    insert into public.maintenance_import_batches(batch_key, created_by, draft_ids) values (p_batch_key, auth.uid(), ids);
  end if;
  return query select d.id, coalesce(nullif(d.reviewed_payload_json #>> '{activity,title}', ''), d.source_label, 'Actividad pendiente') from public.activity_drafts d where d.id = any(ids) order by array_position(ids, d.id);
end;
$$;
revoke all on function public.import_maintenance_drafts(text, jsonb) from public, anon;
grant execute on function public.import_maintenance_drafts(text, jsonb) to authenticated;

-- Foundation IDs were manually supplied. Configure sequences only when none
-- already exists, under the migration transaction and table lock.
do $$
declare target text; sequence_name text; next_id bigint;
begin
  foreach target in array array['institutions', 'centers'] loop
    execute format('lock table public.%I in share row exclusive mode', target);
    sequence_name := pg_get_serial_sequence(format('public.%I', target), 'id');
    if sequence_name is null then
      sequence_name := format('public.%I_maintenance_id_seq', target);
      execute format('create sequence if not exists %s', sequence_name);
      execute format('alter sequence %s owned by public.%I.id', sequence_name, target);
      execute format('alter table public.%I alter column id set default nextval(%L)', target, sequence_name);
      execute format('select greatest(coalesce(max(id), 0) + 1, 1) from public.%I', target) into next_id;
      perform setval(sequence_name::regclass, next_id, false);
    end if;
  end loop;
end;
$$;

create or replace function public.list_maintenance_institutions()
returns table(id bigint, name text) language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform public.assert_maintenance_operator();
  return query select i.id::bigint, i.name::text from public.institutions i where i.is_active = true and i.is_deleted = false order by i.name;
end;
$$;
revoke all on function public.list_maintenance_institutions() from public, anon;
grant execute on function public.list_maintenance_institutions() to authenticated;

create or replace function public.create_maintenance_center(p_payload jsonb)
returns bigint language plpgsql security definer set search_path = public, pg_temp as $$
declare center_name text; institution_name text; address text; postcode text; city bigint; institution bigint; draft bigint; new_center bigint; draft_row public.activity_drafts;
begin
  perform public.assert_maintenance_operator();
  if jsonb_typeof(p_payload) is distinct from 'object' then raise exception 'invalid center payload'; end if;
  center_name := nullif(trim(p_payload ->> 'name'), ''); institution_name := nullif(trim(p_payload ->> 'institution_name'), '');
  address := nullif(trim(p_payload ->> 'address_line_1'), ''); postcode := nullif(trim(p_payload ->> 'postal_code'), '');
  if p_payload ->> 'city_id' ~ '^[0-9]+$' then city := (p_payload ->> 'city_id')::bigint; end if;
  if p_payload ->> 'institution_id' ~ '^[0-9]+$' then institution := (p_payload ->> 'institution_id')::bigint; end if;
  if p_payload ->> 'draft_id' ~ '^[0-9]+$' then draft := (p_payload ->> 'draft_id')::bigint; end if;
  if center_name is null or address is null or postcode is null or city is null or draft is null then raise exception 'confirmed center name, address, postcode, city and draft are required'; end if;
  if char_length(center_name) > 250 or char_length(address) > 500 or char_length(postcode) > 20 or char_length(coalesce(institution_name, '')) > 250 then raise exception 'center values are too long'; end if;
  select * into draft_row from public.activity_drafts d where d.id = draft for update;
  if not found or draft_row.review_status <> 'pending_review' then raise exception 'pending draft is required'; end if;
  if draft_row.reviewed_payload_json #>> '{center,mode}' = 'existing' and draft_row.reviewed_payload_json #>> '{activity,center_id}' ~ '^[0-9]+$' then
    return (draft_row.reviewed_payload_json #>> '{activity,center_id}')::bigint;
  end if;
  if not exists (select 1 from public.cities c where c.id = city) then raise exception 'valid city is required'; end if;
  perform pg_advisory_xact_lock(hashtextextended(lower(center_name) || ':' || city::text, 0));
  if exists (select 1 from public.centers c where lower(trim(c.name)) = lower(center_name) and c.city_id = city and c.is_deleted = false) then raise exception 'a center with this name and city already exists'; end if;
  if institution is not null then
    if not exists (select 1 from public.institutions i where i.id = institution and i.is_active = true and i.is_deleted = false) then raise exception 'valid institution is required'; end if;
  else
    if institution_name is null then raise exception 'confirmed institution name is required'; end if;
    perform pg_advisory_xact_lock(hashtextextended('institution:' || lower(institution_name), 0));
    if exists (select 1 from public.institutions i where lower(trim(i.name)) = lower(institution_name) and i.is_deleted = false) then raise exception 'institution already exists; select it explicitly'; end if;
    insert into public.institutions(name, created_by, updated_by) values(institution_name, auth.uid()::text, auth.uid()::text) returning id into institution;
  end if;
  insert into public.centers(institution_id, name, city_id, address_line_1, postal_code, created_by, updated_by)
  values(institution, center_name, city, address, postcode, auth.uid()::text, auth.uid()::text) returning id into new_center;
  update public.activity_drafts set reviewed_payload_json = jsonb_set(jsonb_set(reviewed_payload_json, '{activity,center_id}', to_jsonb(new_center)), '{center}', jsonb_build_object('mode', 'existing', 'center_id', new_center)), updated_at = now() where id = draft;
  update public.activity_drafts set reviewed_payload_json = jsonb_set(reviewed_payload_json, '{import_review,review_confirmed}', 'false'::jsonb) where id = draft and reviewed_payload_json ? 'import_review';
  return new_center;
end;
$$;
revoke all on function public.create_maintenance_center(jsonb) from public, anon;
grant execute on function public.create_maintenance_center(jsonb) to authenticated;

commit;
