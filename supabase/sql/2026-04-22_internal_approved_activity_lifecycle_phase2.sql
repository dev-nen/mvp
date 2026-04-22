begin;

create or replace function public.list_internal_approved_activity_states(
  p_draft_ids bigint[] default null
)
returns table (
  draft_id bigint,
  activity_id bigint,
  is_published boolean
)
language plpgsql
security definer
set search_path = public
as $$
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
  select
    drafts.id as draft_id,
    activities.id as activity_id,
    (activities.is_active = true and activities.is_deleted = false) as is_published
  from public.activity_drafts as drafts
  join public.activities
    on activities.id = drafts.approved_activity_id
  where drafts.review_status = 'approved'
    and drafts.approved_activity_id is not null
    and (
      coalesce(array_length(p_draft_ids, 1), 0) = 0
      or drafts.id = any (p_draft_ids)
    );
end;
$$;

grant execute on function public.list_internal_approved_activity_states(bigint[]) to authenticated;

create or replace function public.get_internal_approved_activity(p_activity_id bigint)
returns table (
  draft_id bigint,
  activity_id bigint,
  source_label text,
  review_status text,
  review_notes text,
  is_published boolean,
  activity_created_at timestamptz,
  activity_updated_at timestamptz,
  activity_payload_json jsonb
)
language plpgsql
security definer
set search_path = public
as $$
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

  if p_activity_id is null then
    raise exception 'p_activity_id is required';
  end if;

  return query
  select
    drafts.id as draft_id,
    activities.id as activity_id,
    drafts.source_label,
    drafts.review_status,
    drafts.review_notes,
    (activities.is_active = true and activities.is_deleted = false) as is_published,
    activities.created_at as activity_created_at,
    activities.updated_at as activity_updated_at,
    jsonb_build_object(
      'activity',
      jsonb_build_object(
        'title', activities.title,
        'description', activities.description,
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
    ) as activity_payload_json
  from public.activity_drafts as drafts
  join public.activities
    on activities.id = drafts.approved_activity_id
  where drafts.review_status = 'approved'
    and drafts.approved_activity_id is not null
    and activities.id = p_activity_id
  limit 1;

  if not found then
    raise exception 'approved activity % is not managed by Draft Inbox', p_activity_id;
  end if;
end;
$$;

grant execute on function public.get_internal_approved_activity(bigint) to authenticated;

create or replace function public.update_approved_activity_from_draft(
  p_draft_id bigint,
  p_reviewed_payload jsonb,
  p_review_notes text default null
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  draft_row public.activity_drafts;
  activity_row public.activities;
  reviewed_payload jsonb := coalesce(p_reviewed_payload, '{}'::jsonb);
  activity_payload jsonb := coalesce(reviewed_payload -> 'activity', '{}'::jsonb);
  normalized_review_notes text := nullif(trim(coalesce(p_review_notes, '')), '');
  resolved_title text;
  resolved_description text;
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

  if draft_row.review_status <> 'approved' then
    raise exception 'activity draft % is not approved', p_draft_id;
  end if;

  if draft_row.approved_activity_id is null then
    raise exception 'activity draft % does not have approved_activity_id', p_draft_id;
  end if;

  select *
  into activity_row
  from public.activities
  where id = draft_row.approved_activity_id
  for update;

  if not found then
    raise exception 'approved activity % was not found', draft_row.approved_activity_id;
  end if;

  resolved_title := nullif(trim(coalesce(activity_payload ->> 'title', '')), '');
  resolved_description := nullif(trim(coalesce(activity_payload ->> 'description', '')), '');

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
    image_url = resolved_image_url,
    age_rule_type = resolved_age_rule_type,
    age_min = resolved_age_min,
    age_max = resolved_age_max,
    price_label = resolved_price_label,
    is_free = resolved_is_free,
    schedule_label = resolved_schedule_label,
    is_deleted = false,
    updated_at = now(),
    updated_by = 'draft.update_approved_activity_from_draft'
  where id = draft_row.approved_activity_id;

  normalized_reviewed_payload := jsonb_build_object(
    'activity',
    jsonb_build_object(
      'title', resolved_title,
      'description', resolved_description,
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
    reviewed_payload_json = normalized_reviewed_payload,
    review_notes = normalized_review_notes,
    updated_at = now()
  where id = p_draft_id;

  return draft_row.approved_activity_id;
end;
$$;

grant execute on function public.update_approved_activity_from_draft(bigint, jsonb, text) to authenticated;

create or replace function public.unpublish_approved_activity(
  p_draft_id bigint,
  p_review_notes text default null
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  draft_row public.activity_drafts;
  normalized_review_notes text := nullif(trim(coalesce(p_review_notes, '')), '');
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

  if draft_row.review_status <> 'approved' then
    raise exception 'activity draft % is not approved', p_draft_id;
  end if;

  if draft_row.approved_activity_id is null then
    raise exception 'activity draft % does not have approved_activity_id', p_draft_id;
  end if;

  update public.activities
  set
    is_active = false,
    is_deleted = false,
    updated_at = now(),
    updated_by = 'draft.unpublish_approved_activity'
  where id = draft_row.approved_activity_id;

  update public.activity_drafts
  set
    review_notes = coalesce(normalized_review_notes, review_notes),
    updated_at = now()
  where id = p_draft_id;

  return draft_row.approved_activity_id;
end;
$$;

grant execute on function public.unpublish_approved_activity(bigint, text) to authenticated;

create or replace function public.republish_approved_activity(
  p_draft_id bigint,
  p_review_notes text default null
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  draft_row public.activity_drafts;
  normalized_review_notes text := nullif(trim(coalesce(p_review_notes, '')), '');
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

  if draft_row.review_status <> 'approved' then
    raise exception 'activity draft % is not approved', p_draft_id;
  end if;

  if draft_row.approved_activity_id is null then
    raise exception 'activity draft % does not have approved_activity_id', p_draft_id;
  end if;

  update public.activities
  set
    is_active = true,
    is_deleted = false,
    updated_at = now(),
    updated_by = 'draft.republish_approved_activity'
  where id = draft_row.approved_activity_id;

  update public.activity_drafts
  set
    review_notes = coalesce(normalized_review_notes, review_notes),
    updated_at = now()
  where id = p_draft_id;

  return draft_row.approved_activity_id;
end;
$$;

grant execute on function public.republish_approved_activity(bigint, text) to authenticated;

comment on function public.list_internal_approved_activity_states(bigint[]) is
  'Internal helper to resolve publication state for approved Draft Inbox rows.';

comment on function public.get_internal_approved_activity(bigint) is
  'Internal helper to read one approved activity managed by Draft Inbox.';

comment on function public.update_approved_activity_from_draft(bigint, jsonb, text) is
  'Internal helper to update the approved activity and keep reviewed_payload_json aligned.';

comment on function public.unpublish_approved_activity(bigint, text) is
  'Internal helper to hide one approved Draft Inbox activity from the public catalog without deleting it.';

comment on function public.republish_approved_activity(bigint, text) is
  'Internal helper to return one approved Draft Inbox activity to the public catalog.';

commit;
