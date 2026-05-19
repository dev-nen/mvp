begin;

alter table public.activity_drafts
  add column if not exists submitted_by_user_id uuid null references public.user_profiles(id),
  add column if not exists parent_draft_id bigint null references public.activity_drafts(id),
  add column if not exists root_draft_id bigint null references public.activity_drafts(id),
  add column if not exists revision_number integer null,
  add column if not exists resubmitted_at timestamptz null,
  add column if not exists resubmitted_by uuid null references public.user_profiles(id),
  add column if not exists user_feedback_summary text null,
  add column if not exists user_feedback_json jsonb null,
  add column if not exists internal_review_notes text null,
  add column if not exists edit_activity_id bigint null references public.activities(id);

alter table public.activities
  add column if not exists owner_user_id uuid null references public.user_profiles(id);

update public.activity_drafts
set
  revision_number = coalesce(revision_number, 1),
  user_feedback_json = coalesce(user_feedback_json, '[]'::jsonb);

alter table public.activity_drafts
  alter column revision_number set default 1,
  alter column revision_number set not null,
  alter column user_feedback_json set default '[]'::jsonb,
  alter column user_feedback_json set not null;

do $$
declare
  review_status_constraint_name text;
begin
  for review_status_constraint_name in
    select constraints.conname
    from pg_constraint as constraints
    join pg_class as classes
      on classes.oid = constraints.conrelid
    join pg_namespace as namespaces
      on namespaces.oid = classes.relnamespace
    where namespaces.nspname = 'public'
      and classes.relname = 'activity_drafts'
      and constraints.contype = 'c'
      and pg_get_constraintdef(constraints.oid) ilike '%review_status%'
  loop
    execute format(
      'alter table public.activity_drafts drop constraint %I',
      review_status_constraint_name
    );
  end loop;

  alter table public.activity_drafts
    add constraint activity_drafts_review_status_check
    check (
      review_status in (
        'pending_review',
        'needs_changes',
        'approved',
        'rejected',
        'archived'
      )
    );
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'activity_drafts_revision_number_check'
  ) then
    alter table public.activity_drafts
      add constraint activity_drafts_revision_number_check
      check (revision_number >= 1);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'activity_drafts_user_feedback_json_array_check'
  ) then
    alter table public.activity_drafts
      add constraint activity_drafts_user_feedback_json_array_check
      check (jsonb_typeof(user_feedback_json) = 'array');
  end if;
end;
$$;

create index if not exists activity_drafts_submitted_by_status_created_at_idx
  on public.activity_drafts (submitted_by_user_id, review_status, created_at desc);

create index if not exists activity_drafts_root_revision_idx
  on public.activity_drafts (root_draft_id, revision_number);

create index if not exists activity_drafts_parent_draft_id_idx
  on public.activity_drafts (parent_draft_id);

create index if not exists activity_drafts_edit_activity_id_idx
  on public.activity_drafts (edit_activity_id);

create index if not exists activities_owner_user_id_idx
  on public.activities (owner_user_id);

create or replace function public.request_activity_draft_changes(
  p_draft_id bigint,
  p_reviewed_payload jsonb default null,
  p_user_feedback_summary text default null,
  p_user_feedback_json jsonb default '[]'::jsonb,
  p_internal_review_notes text default null
)
returns table (
  draft_id bigint,
  review_status text,
  user_feedback_summary text,
  user_feedback_json jsonb,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  normalized_user_feedback_summary text := nullif(trim(coalesce(p_user_feedback_summary, '')), '');
  normalized_internal_review_notes text := nullif(trim(coalesce(p_internal_review_notes, '')), '');
  normalized_user_feedback_json jsonb := coalesce(p_user_feedback_json, '[]'::jsonb);
begin
  if auth.uid() is null then
    raise exception 'auth.uid() is required';
  end if;

  if jsonb_typeof(normalized_user_feedback_json) <> 'array' then
    raise exception 'user feedback must be an array';
  end if;

  if not exists (
    select 1
    from public.internal_tool_access
    where user_id = auth.uid()
      and tool_name = 'draft_inbox'
  ) then
    raise exception 'internal draft inbox access is required';
  end if;

  return query
  update public.activity_drafts
  set
    reviewed_payload_json = coalesce(p_reviewed_payload, reviewed_payload_json),
    review_status = 'needs_changes',
    user_feedback_summary = normalized_user_feedback_summary,
    user_feedback_json = normalized_user_feedback_json,
    internal_review_notes = normalized_internal_review_notes,
    reviewed_by = auth.uid(),
    updated_at = now()
  where id = p_draft_id
    and review_status = 'pending_review'
    and approved_activity_id is null
  returning
    activity_drafts.id::bigint,
    activity_drafts.review_status::text,
    activity_drafts.user_feedback_summary::text,
    activity_drafts.user_feedback_json::jsonb,
    activity_drafts.updated_at::timestamptz;

  if not found then
    raise exception 'pending activity draft % was not found', p_draft_id;
  end if;
end;
$$;

create or replace function public.reject_activity_draft_with_feedback(
  p_draft_id bigint,
  p_reviewed_payload jsonb default null,
  p_user_feedback_summary text default null,
  p_user_feedback_json jsonb default '[]'::jsonb,
  p_internal_review_notes text default null
)
returns table (
  draft_id bigint,
  review_status text,
  user_feedback_summary text,
  user_feedback_json jsonb,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  normalized_user_feedback_summary text := nullif(trim(coalesce(p_user_feedback_summary, '')), '');
  normalized_internal_review_notes text := nullif(trim(coalesce(p_internal_review_notes, '')), '');
  normalized_user_feedback_json jsonb := coalesce(p_user_feedback_json, '[]'::jsonb);
begin
  if auth.uid() is null then
    raise exception 'auth.uid() is required';
  end if;

  if jsonb_typeof(normalized_user_feedback_json) <> 'array' then
    raise exception 'user feedback must be an array';
  end if;

  if not exists (
    select 1
    from public.internal_tool_access
    where user_id = auth.uid()
      and tool_name = 'draft_inbox'
  ) then
    raise exception 'internal draft inbox access is required';
  end if;

  return query
  update public.activity_drafts
  set
    reviewed_payload_json = coalesce(p_reviewed_payload, reviewed_payload_json),
    review_status = 'rejected',
    user_feedback_summary = normalized_user_feedback_summary,
    user_feedback_json = normalized_user_feedback_json,
    internal_review_notes = normalized_internal_review_notes,
    reviewed_by = auth.uid(),
    updated_at = now()
  where id = p_draft_id
    and review_status = 'pending_review'
    and approved_activity_id is null
  returning
    activity_drafts.id::bigint,
    activity_drafts.review_status::text,
    activity_drafts.user_feedback_summary::text,
    activity_drafts.user_feedback_json::jsonb,
    activity_drafts.updated_at::timestamptz;

  if not found then
    raise exception 'pending activity draft % was not found', p_draft_id;
  end if;
end;
$$;

create or replace function public.archive_activity_draft(
  p_draft_id bigint,
  p_internal_review_notes text default null
)
returns table (
  draft_id bigint,
  review_status text,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  normalized_internal_review_notes text := nullif(trim(coalesce(p_internal_review_notes, '')), '');
begin
  if auth.uid() is null then
    raise exception 'auth.uid() is required';
  end if;

  if not exists (
    select 1
    from public.internal_tool_access
    where user_id = auth.uid()
      and tool_name = 'draft_inbox'
  ) then
    raise exception 'internal draft inbox access is required';
  end if;

  return query
  update public.activity_drafts
  set
    review_status = 'archived',
    internal_review_notes = coalesce(normalized_internal_review_notes, internal_review_notes),
    reviewed_by = coalesce(reviewed_by, auth.uid()),
    updated_at = now()
  where id = p_draft_id
    and review_status in ('pending_review', 'needs_changes', 'rejected')
    and approved_activity_id is null
  returning
    activity_drafts.id::bigint,
    activity_drafts.review_status::text,
    activity_drafts.updated_at::timestamptz;

  if not found then
    raise exception 'activity draft % cannot be archived in this phase', p_draft_id;
  end if;
end;
$$;

create or replace function public.approve_activity_draft(p_draft_id bigint)
returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  draft_row public.activity_drafts;
  reviewed_payload jsonb := '{}'::jsonb;
  activity_payload jsonb := '{}'::jsonb;
  target_activity_row public.activities;
  resolved_title text;
  resolved_description text;
  resolved_description_format text;
  resolved_center_id bigint;
  resolved_category_id bigint;
  resolved_type_id bigint;
  resolved_image_url text;
  raw_age_rule_type text;
  resolved_age_rule_type text;
  resolved_age_min integer;
  resolved_age_max integer;
  resolved_price_label text;
  resolved_is_free boolean;
  resolved_schedule_label text;
  resolved_venue_name text;
  resolved_venue_address_1 text;
  resolved_venue_postal_code text;
  normalized_reviewed_payload jsonb;
  resolved_approved_activity_id bigint;
begin
  if auth.uid() is null then
    raise exception 'auth.uid() is required';
  end if;

  if not exists (
    select 1
    from public.internal_tool_access
    where user_id = auth.uid()
      and tool_name = 'draft_inbox'
  ) then
    raise exception 'internal draft inbox access is required';
  end if;

  select *
  into draft_row
  from public.activity_drafts
  where id = p_draft_id
  for update;

  if not found then
    raise exception 'activity draft % was not found', p_draft_id;
  end if;

  if draft_row.review_status <> 'pending_review' then
    raise exception 'activity draft % is not pending_review', p_draft_id;
  end if;

  reviewed_payload := coalesce(draft_row.reviewed_payload_json, '{}'::jsonb);
  activity_payload := coalesce(reviewed_payload -> 'activity', '{}'::jsonb);

  resolved_title := nullif(trim(coalesce(activity_payload ->> 'title', '')), '');
  resolved_description := nullif(trim(coalesce(activity_payload ->> 'description', '')), '');
  resolved_description_format := case
    when lower(trim(coalesce(activity_payload ->> 'description_format', 'plain'))) = 'markdown' then 'markdown'
    else 'plain'
  end;

  if (activity_payload ->> 'center_id') ~ '^\d+$' then
    resolved_center_id := (activity_payload ->> 'center_id')::bigint;
  end if;

  if (activity_payload ->> 'category_id') ~ '^\d+$' then
    resolved_category_id := (activity_payload ->> 'category_id')::bigint;
  end if;

  if (activity_payload ->> 'type_id') ~ '^\d+$' then
    resolved_type_id := (activity_payload ->> 'type_id')::bigint;
  end if;

  resolved_image_url := nullif(trim(coalesce(activity_payload ->> 'image_url', '')), '');
  raw_age_rule_type := lower(trim(coalesce(activity_payload ->> 'age_rule_type', '')));

  resolved_age_rule_type := case
    when raw_age_rule_type in ('range', 'from', 'until', 'all') then raw_age_rule_type
    when raw_age_rule_type = 'open' then 'all'
    else 'all'
  end;

  if (activity_payload ->> 'age_min') ~ '^-?\d+$' then
    resolved_age_min := (activity_payload ->> 'age_min')::integer;
  end if;

  if (activity_payload ->> 'age_max') ~ '^-?\d+$' then
    resolved_age_max := (activity_payload ->> 'age_max')::integer;
  end if;

  resolved_price_label := nullif(trim(coalesce(activity_payload ->> 'price_label', '')), '');
  resolved_schedule_label := nullif(trim(coalesce(activity_payload ->> 'schedule_label', '')), '');
  resolved_venue_name := nullif(trim(coalesce(activity_payload ->> 'venue_name', '')), '');
  resolved_venue_address_1 := nullif(trim(coalesce(activity_payload ->> 'venue_address_1', '')), '');
  resolved_venue_postal_code := nullif(trim(coalesce(activity_payload ->> 'venue_postal_code', '')), '');

  resolved_is_free := case
    when jsonb_typeof(activity_payload -> 'is_free') = 'boolean' then
      (activity_payload ->> 'is_free')::boolean
    when lower(trim(coalesce(activity_payload ->> 'is_free', ''))) in ('true', '1', 'si', 'yes') then
      true
    else
      false
  end;

  if resolved_title is null then
    raise exception 'reviewed activity title is required';
  end if;

  if resolved_description is null then
    raise exception 'reviewed activity description is required';
  end if;

  if resolved_center_id is null then
    raise exception 'reviewed activity center_id is required';
  end if;

  if resolved_category_id is null then
    raise exception 'reviewed activity category_id is required';
  end if;

  if resolved_type_id is null then
    raise exception 'reviewed activity type_id is required';
  end if;

  if resolved_schedule_label is null then
    raise exception 'reviewed activity schedule_label is required';
  end if;

  if not exists (
    select 1
    from public.centers
    where id = resolved_center_id
      and is_active = true
      and is_deleted = false
  ) then
    raise exception 'reviewed activity center_id % is invalid', resolved_center_id;
  end if;

  if not exists (
    select 1
    from public.categories
    where id = resolved_category_id
  ) then
    raise exception 'reviewed activity category_id % is invalid', resolved_category_id;
  end if;

  if not exists (
    select 1
    from public.type_activity
    where id = resolved_type_id
  ) then
    raise exception 'reviewed activity type_id % is invalid', resolved_type_id;
  end if;

  if resolved_age_rule_type = 'range' then
    if resolved_age_min is null or resolved_age_max is null then
      raise exception 'range age_rule_type requires age_min and age_max';
    end if;
  elsif resolved_age_rule_type = 'from' then
    if resolved_age_min is null then
      raise exception 'from age_rule_type requires age_min';
    end if;
    resolved_age_max := null;
  elsif resolved_age_rule_type = 'until' then
    if resolved_age_max is null then
      raise exception 'until age_rule_type requires age_max';
    end if;
    resolved_age_min := null;
  else
    resolved_age_min := null;
    resolved_age_max := null;
  end if;

  if resolved_image_url is null then
    resolved_image_url := '/placeholders/activity-card-placeholder.svg';
  end if;

  if draft_row.edit_activity_id is not null then
    select *
    into target_activity_row
    from public.activities
    where id = draft_row.edit_activity_id
      and is_deleted = false
    for update;

    if not found then
      raise exception 'edit activity % was not found', draft_row.edit_activity_id;
    end if;

    if draft_row.submitted_by_user_id is not null
      and target_activity_row.owner_user_id is distinct from draft_row.submitted_by_user_id then
      raise exception 'edit draft owner does not own the target activity';
    end if;

    update public.activities
    set
      title = resolved_title,
      center_id = resolved_center_id,
      venue_name = resolved_venue_name,
      venue_address_1 = resolved_venue_address_1,
      venue_postal_code = resolved_venue_postal_code,
      category_id = resolved_category_id,
      type_id = resolved_type_id,
      description = resolved_description,
      description_format = resolved_description_format,
      image_url = resolved_image_url,
      age_rule_type = resolved_age_rule_type,
      age_min = resolved_age_min,
      age_max = resolved_age_max,
      price_label = resolved_price_label,
      is_free = resolved_is_free,
      schedule_label = resolved_schedule_label,
      is_active = true,
      is_deleted = false,
      owner_user_id = coalesce(owner_user_id, draft_row.submitted_by_user_id),
      updated_at = now(),
      updated_by = 'draft.approve_activity_draft'
    where id = draft_row.edit_activity_id
    returning id into resolved_approved_activity_id;
  else
    insert into public.activities (
      title,
      center_id,
      venue_name,
      venue_address_1,
      venue_postal_code,
      category_id,
      type_id,
      description,
      description_format,
      image_url,
      age_rule_type,
      age_min,
      age_max,
      price_label,
      is_free,
      schedule_label,
      is_featured,
      is_active,
      owner_user_id,
      created_by,
      updated_by,
      is_deleted
    )
    values (
      resolved_title,
      resolved_center_id,
      resolved_venue_name,
      resolved_venue_address_1,
      resolved_venue_postal_code,
      resolved_category_id,
      resolved_type_id,
      resolved_description,
      resolved_description_format,
      resolved_image_url,
      resolved_age_rule_type,
      resolved_age_min,
      resolved_age_max,
      resolved_price_label,
      resolved_is_free,
      resolved_schedule_label,
      false,
      true,
      draft_row.submitted_by_user_id,
      'draft.approve_activity_draft',
      'draft.approve_activity_draft',
      false
    )
    returning id
    into resolved_approved_activity_id;
  end if;

  normalized_reviewed_payload := jsonb_build_object(
    'activity',
    jsonb_build_object(
      'title', resolved_title,
      'description', resolved_description,
      'description_format', resolved_description_format,
      'center_id', resolved_center_id,
      'category_id', resolved_category_id,
      'type_id', resolved_type_id,
      'image_url', resolved_image_url,
      'age_rule_type', resolved_age_rule_type,
      'age_min', resolved_age_min,
      'age_max', resolved_age_max,
      'price_label', resolved_price_label,
      'is_free', resolved_is_free,
      'schedule_label', resolved_schedule_label,
      'venue_name', resolved_venue_name,
      'venue_address_1', resolved_venue_address_1,
      'venue_postal_code', resolved_venue_postal_code
    )
  );

  update public.activity_drafts
  set
    review_status = 'approved',
    reviewed_by = auth.uid(),
    approved_activity_id = resolved_approved_activity_id,
    reviewed_payload_json = normalized_reviewed_payload,
    user_feedback_summary = null,
    user_feedback_json = '[]'::jsonb,
    updated_at = now()
  where id = p_draft_id;

  return resolved_approved_activity_id;
end;
$$;

create or replace function public.list_my_activity_publications()
returns table (
  item_kind text,
  draft_id bigint,
  activity_id bigint,
  title text,
  review_status text,
  user_status text,
  is_published boolean,
  user_feedback_summary text,
  user_feedback_json jsonb,
  revision_number integer,
  created_at timestamptz,
  updated_at timestamptz,
  can_correct boolean,
  can_unpublish boolean,
  can_request_edit boolean
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'auth.uid() is required';
  end if;

  return query
  with owned_drafts as (
    select
      drafts.id,
      drafts.approved_activity_id,
      coalesce(nullif(trim(drafts.reviewed_payload_json #>> '{activity,title}'), ''), nullif(trim(drafts.parsed_payload_json #>> '{activity,title}'), ''), drafts.source_label, 'Publicacion') as title,
      drafts.review_status,
      case
        when drafts.review_status = 'pending_review' then 'in_review'
        when drafts.review_status = 'needs_changes' then 'needs_changes'
        when drafts.review_status = 'rejected' then 'rejected'
        when drafts.review_status = 'archived' then 'archived'
        when drafts.review_status = 'approved'
          and activities.id is not null
          and activities.is_active = true
          and activities.is_deleted = false then 'published'
        when drafts.review_status = 'approved'
          and activities.id is not null then 'unpublished'
        else drafts.review_status
      end as user_status,
      (activities.id is not null and activities.is_active = true and activities.is_deleted = false) as is_published,
      drafts.user_feedback_summary,
      drafts.user_feedback_json,
      drafts.revision_number,
      drafts.created_at,
      drafts.updated_at,
      (drafts.review_status = 'needs_changes') as can_correct,
      (
        drafts.review_status = 'approved'
        and activities.id is not null
        and activities.owner_user_id = auth.uid()
        and activities.is_active = true
        and activities.is_deleted = false
      ) as can_unpublish,
      (
        drafts.review_status = 'approved'
        and activities.id is not null
        and activities.owner_user_id = auth.uid()
        and activities.is_deleted = false
      ) as can_request_edit
    from public.activity_drafts as drafts
    left join public.activities
      on activities.id = drafts.approved_activity_id
    where drafts.submitted_by_user_id = auth.uid()
  ),
  owned_activities_without_draft as (
    select
      activities.id,
      activities.title,
      (activities.is_active = true and activities.is_deleted = false) as is_published,
      activities.created_at,
      activities.updated_at
    from public.activities
    where activities.owner_user_id = auth.uid()
      and activities.is_deleted = false
      and not exists (
        select 1
        from public.activity_drafts as drafts
        where drafts.approved_activity_id = activities.id
          and drafts.submitted_by_user_id = auth.uid()
      )
  )
  select
    'draft'::text as item_kind,
    owned_drafts.id::bigint as draft_id,
    owned_drafts.approved_activity_id::bigint as activity_id,
    owned_drafts.title::text,
    owned_drafts.review_status::text,
    owned_drafts.user_status::text,
    owned_drafts.is_published::boolean,
    owned_drafts.user_feedback_summary::text,
    owned_drafts.user_feedback_json::jsonb,
    owned_drafts.revision_number::integer,
    owned_drafts.created_at::timestamptz,
    owned_drafts.updated_at::timestamptz,
    owned_drafts.can_correct::boolean,
    owned_drafts.can_unpublish::boolean,
    owned_drafts.can_request_edit::boolean
  from owned_drafts
  union all
  select
    'activity'::text as item_kind,
    null::bigint as draft_id,
    owned_activities_without_draft.id::bigint as activity_id,
    owned_activities_without_draft.title::text,
    'approved'::text as review_status,
    case
      when owned_activities_without_draft.is_published then 'published'
      else 'unpublished'
    end::text as user_status,
    owned_activities_without_draft.is_published::boolean,
    null::text as user_feedback_summary,
    '[]'::jsonb as user_feedback_json,
    1::integer as revision_number,
    owned_activities_without_draft.created_at::timestamptz,
    owned_activities_without_draft.updated_at::timestamptz,
    false::boolean as can_correct,
    owned_activities_without_draft.is_published::boolean as can_unpublish,
    true::boolean as can_request_edit
  from owned_activities_without_draft
  order by updated_at desc, created_at desc;
end;
$$;

create or replace function public.unpublish_my_activity(p_activity_id bigint)
returns table (
  activity_id bigint,
  is_published boolean,
  activity_updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'auth.uid() is required';
  end if;

  if p_activity_id is null then
    raise exception 'p_activity_id is required';
  end if;

  return query
  update public.activities
  set
    is_active = false,
    is_deleted = false,
    updated_at = now(),
    updated_by = 'user.unpublish_my_activity'
  where id = p_activity_id
    and owner_user_id = auth.uid()
    and is_deleted = false
  returning
    activities.id::bigint,
    (activities.is_active = true and activities.is_deleted = false)::boolean,
    activities.updated_at::timestamptz;

  if not found then
    raise exception 'activity % was not found for current user', p_activity_id;
  end if;
end;
$$;

create or replace function public.get_my_activity_draft_for_correction(p_draft_id bigint)
returns table (
  draft_id bigint,
  title text,
  source_reference_url text,
  reviewed_payload_json jsonb,
  user_feedback_summary text,
  user_feedback_json jsonb,
  revision_number integer
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'auth.uid() is required';
  end if;

  return query
  select
    drafts.id::bigint,
    coalesce(nullif(trim(drafts.reviewed_payload_json #>> '{activity,title}'), ''), nullif(trim(drafts.parsed_payload_json #>> '{activity,title}'), ''), drafts.source_label, 'Publicacion')::text as title,
    drafts.source_reference_url::text,
    drafts.reviewed_payload_json::jsonb,
    drafts.user_feedback_summary::text,
    drafts.user_feedback_json::jsonb,
    drafts.revision_number::integer
  from public.activity_drafts as drafts
  where drafts.id = p_draft_id
    and drafts.submitted_by_user_id = auth.uid()
    and drafts.review_status = 'needs_changes'
  limit 1;

  if not found then
    raise exception 'activity draft % is not available for correction', p_draft_id;
  end if;
end;
$$;

create or replace function public.resubmit_my_activity_draft(
  p_draft_id bigint,
  p_reviewed_payload jsonb
)
returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  draft_row public.activity_drafts;
  resolved_root_draft_id bigint;
  next_revision_number integer;
  new_draft_id bigint;
begin
  if auth.uid() is null then
    raise exception 'auth.uid() is required';
  end if;

  select *
  into draft_row
  from public.activity_drafts
  where id = p_draft_id
    and submitted_by_user_id = auth.uid()
    and review_status = 'needs_changes'
  for update;

  if not found then
    raise exception 'activity draft % is not available for correction', p_draft_id;
  end if;

  resolved_root_draft_id := coalesce(draft_row.root_draft_id, draft_row.id);

  select coalesce(max(revision_number), 1) + 1
  into next_revision_number
  from public.activity_drafts
  where coalesce(root_draft_id, id) = resolved_root_draft_id;

  insert into public.activity_drafts (
    source_type,
    source_label,
    source_file_path,
    source_file_name,
    source_mime_type,
    source_reference_url,
    raw_extracted_text,
    parsed_payload_json,
    reviewed_payload_json,
    confidence_score,
    review_status,
    created_by,
    submitted_by_user_id,
    parent_draft_id,
    root_draft_id,
    revision_number,
    resubmitted_at,
    resubmitted_by,
    edit_activity_id
  )
  values (
    'user_resubmission',
    draft_row.source_label,
    draft_row.source_file_path,
    draft_row.source_file_name,
    draft_row.source_mime_type,
    draft_row.source_reference_url,
    draft_row.raw_extracted_text,
    draft_row.parsed_payload_json,
    coalesce(p_reviewed_payload, '{}'::jsonb),
    draft_row.confidence_score,
    'pending_review',
    auth.uid(),
    auth.uid(),
    draft_row.id,
    resolved_root_draft_id,
    next_revision_number,
    now(),
    auth.uid(),
    draft_row.edit_activity_id
  )
  returning id into new_draft_id;

  return new_draft_id;
end;
$$;

create or replace function public.get_my_activity_for_edit(p_activity_id bigint)
returns table (
  activity_id bigint,
  title text,
  source_reference_url text,
  activity_payload_json jsonb
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'auth.uid() is required';
  end if;

  return query
  select
    activities.id::bigint,
    activities.title::text,
    null::text as source_reference_url,
    jsonb_build_object(
      'activity',
      jsonb_build_object(
        'title', activities.title,
        'description', activities.description,
        'description_format', coalesce(activities.description_format, 'plain'),
        'center_id', activities.center_id,
        'category_id', activities.category_id,
        'type_id', activities.type_id,
        'image_url', activities.image_url,
        'age_rule_type', activities.age_rule_type,
        'age_min', activities.age_min,
        'age_max', activities.age_max,
        'price_label', activities.price_label,
        'is_free', activities.is_free,
        'schedule_label', activities.schedule_label,
        'venue_name', activities.venue_name,
        'venue_address_1', activities.venue_address_1,
        'venue_postal_code', activities.venue_postal_code
      )
    )::jsonb
  from public.activities
  where activities.id = p_activity_id
    and activities.owner_user_id = auth.uid()
    and activities.is_deleted = false
  limit 1;

  if not found then
    raise exception 'activity % is not available for current user', p_activity_id;
  end if;
end;
$$;

create or replace function public.create_my_activity_edit_draft(
  p_activity_id bigint,
  p_reviewed_payload jsonb,
  p_source_reference_url text default null
)
returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  activity_row public.activities;
  normalized_source_reference_url text := nullif(trim(coalesce(p_source_reference_url, '')), '');
  new_draft_id bigint;
begin
  if auth.uid() is null then
    raise exception 'auth.uid() is required';
  end if;

  select *
  into activity_row
  from public.activities
  where id = p_activity_id
    and owner_user_id = auth.uid()
    and is_deleted = false
  for update;

  if not found then
    raise exception 'activity % is not available for current user', p_activity_id;
  end if;

  update public.activities
  set
    is_active = false,
    is_deleted = false,
    updated_at = now(),
    updated_by = 'user.create_my_activity_edit_draft'
  where id = p_activity_id;

  insert into public.activity_drafts (
    source_type,
    source_label,
    source_reference_url,
    parsed_payload_json,
    reviewed_payload_json,
    confidence_score,
    review_status,
    created_by,
    submitted_by_user_id,
    revision_number,
    edit_activity_id
  )
  values (
    'user_activity_edit',
    activity_row.title,
    normalized_source_reference_url,
    jsonb_build_object(
      'activity',
      jsonb_build_object(
        'title', activity_row.title,
        'description', activity_row.description,
        'description_format', coalesce(activity_row.description_format, 'plain'),
        'center_id', activity_row.center_id,
        'category_id', activity_row.category_id,
        'type_id', activity_row.type_id,
        'image_url', activity_row.image_url,
        'age_rule_type', activity_row.age_rule_type,
        'age_min', activity_row.age_min,
        'age_max', activity_row.age_max,
        'price_label', activity_row.price_label,
        'is_free', activity_row.is_free,
        'schedule_label', activity_row.schedule_label,
        'venue_name', activity_row.venue_name,
        'venue_address_1', activity_row.venue_address_1,
        'venue_postal_code', activity_row.venue_postal_code
      )
    ),
    coalesce(p_reviewed_payload, '{}'::jsonb),
    null,
    'pending_review',
    auth.uid(),
    auth.uid(),
    1,
    activity_row.id
  )
  returning id into new_draft_id;

  update public.activity_drafts
  set root_draft_id = new_draft_id
  where id = new_draft_id;

  return new_draft_id;
end;
$$;

revoke all on function public.request_activity_draft_changes(bigint, jsonb, text, jsonb, text) from public;
revoke all on function public.request_activity_draft_changes(bigint, jsonb, text, jsonb, text) from anon;
revoke all on function public.request_activity_draft_changes(bigint, jsonb, text, jsonb, text) from authenticated;
grant execute on function public.request_activity_draft_changes(bigint, jsonb, text, jsonb, text) to authenticated;

revoke all on function public.reject_activity_draft_with_feedback(bigint, jsonb, text, jsonb, text) from public;
revoke all on function public.reject_activity_draft_with_feedback(bigint, jsonb, text, jsonb, text) from anon;
revoke all on function public.reject_activity_draft_with_feedback(bigint, jsonb, text, jsonb, text) from authenticated;
grant execute on function public.reject_activity_draft_with_feedback(bigint, jsonb, text, jsonb, text) to authenticated;

revoke all on function public.archive_activity_draft(bigint, text) from public;
revoke all on function public.archive_activity_draft(bigint, text) from anon;
revoke all on function public.archive_activity_draft(bigint, text) from authenticated;
grant execute on function public.archive_activity_draft(bigint, text) to authenticated;

revoke all on function public.approve_activity_draft(bigint) from public;
revoke all on function public.approve_activity_draft(bigint) from anon;
revoke all on function public.approve_activity_draft(bigint) from authenticated;
grant execute on function public.approve_activity_draft(bigint) to authenticated;

revoke all on function public.list_my_activity_publications() from public;
revoke all on function public.list_my_activity_publications() from anon;
revoke all on function public.list_my_activity_publications() from authenticated;
grant execute on function public.list_my_activity_publications() to authenticated;

revoke all on function public.unpublish_my_activity(bigint) from public;
revoke all on function public.unpublish_my_activity(bigint) from anon;
revoke all on function public.unpublish_my_activity(bigint) from authenticated;
grant execute on function public.unpublish_my_activity(bigint) to authenticated;

revoke all on function public.get_my_activity_draft_for_correction(bigint) from public;
revoke all on function public.get_my_activity_draft_for_correction(bigint) from anon;
revoke all on function public.get_my_activity_draft_for_correction(bigint) from authenticated;
grant execute on function public.get_my_activity_draft_for_correction(bigint) to authenticated;

revoke all on function public.resubmit_my_activity_draft(bigint, jsonb) from public;
revoke all on function public.resubmit_my_activity_draft(bigint, jsonb) from anon;
revoke all on function public.resubmit_my_activity_draft(bigint, jsonb) from authenticated;
grant execute on function public.resubmit_my_activity_draft(bigint, jsonb) to authenticated;

revoke all on function public.get_my_activity_for_edit(bigint) from public;
revoke all on function public.get_my_activity_for_edit(bigint) from anon;
revoke all on function public.get_my_activity_for_edit(bigint) from authenticated;
grant execute on function public.get_my_activity_for_edit(bigint) to authenticated;

revoke all on function public.create_my_activity_edit_draft(bigint, jsonb, text) from public;
revoke all on function public.create_my_activity_edit_draft(bigint, jsonb, text) from anon;
revoke all on function public.create_my_activity_edit_draft(bigint, jsonb, text) from authenticated;
grant execute on function public.create_my_activity_edit_draft(bigint, jsonb, text) to authenticated;

comment on function public.request_activity_draft_changes(bigint, jsonb, text, jsonb, text) is
  'Internal Phase 2 RPC to mark a pending draft as needs_changes with separated public feedback and internal notes.';

comment on function public.reject_activity_draft_with_feedback(bigint, jsonb, text, jsonb, text) is
  'Internal Phase 2 RPC to strongly reject/no aprobar a pending draft with separated public feedback and internal notes.';

comment on function public.archive_activity_draft(bigint, text) is
  'Internal Phase 2 RPC to archive a non-approved draft from the daily queue without deleting history.';

comment on function public.list_my_activity_publications() is
  'Sanitized Phase 2 user inbox read model for the authenticated user only.';

comment on function public.unpublish_my_activity(bigint) is
  'Owner-only Phase 2 RPC to hide a user-owned activity from the public catalog without allowing republish.';

comment on function public.resubmit_my_activity_draft(bigint, jsonb) is
  'Owner-only Phase 2 RPC that creates a new linked pending_review correction draft.';

comment on function public.create_my_activity_edit_draft(bigint, jsonb, text) is
  'Owner-only Phase 2 RPC that unpublishes a user-owned activity and creates a pending_review edit draft.';

notify pgrst, 'reload schema';

commit;
