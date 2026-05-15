begin;

alter table public.activities
  add column if not exists description_format text not null default 'plain';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'activities_description_format_check'
  ) then
    alter table public.activities
      add constraint activities_description_format_check
      check (description_format in ('plain', 'markdown'));
  end if;
end;
$$;

grant insert on public.activity_drafts to authenticated;

drop policy if exists activity_drafts_insert_internal_reviewers on public.activity_drafts;
create policy activity_drafts_insert_internal_reviewers
  on public.activity_drafts
  for insert
  to authenticated
  with check (
    review_status = 'pending_review'
    and approved_activity_id is null
    and created_by = auth.uid()
    and exists (
      select 1
      from public.internal_tool_access
      where user_id = auth.uid()
        and tool_name = 'draft_inbox'
    )
  );

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'activities',
  'activities',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = true;

drop policy if exists activity_images_public_read on storage.objects;
create policy activity_images_public_read
  on storage.objects
  for select
  to public
  using (bucket_id = 'activities');

drop policy if exists activity_images_internal_draft_cover_insert on storage.objects;
create policy activity_images_internal_draft_cover_insert
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'activities'
    and name like 'drafts/%'
    and exists (
      select 1
      from public.internal_tool_access
      where user_id = auth.uid()
        and tool_name = 'draft_inbox'
    )
  );

create or replace view public.catalog_activities_read as
select
  activities.id,
  activities.title,
  activities.center_id,
  centers.name as center_name,
  centers.city_id,
  cities.name as city_name,
  activities.category_id,
  categories.name as category_label,
  activities.type_id,
  type_activity.name as type_label,
  activities.description,
  activities.description_format,
  case
    when length(trim(activities.description)) <= 180 then trim(activities.description)
    else trim(left(activities.description, 177)) || '...'
  end as short_description,
  activities.image_url,
  activities.age_rule_type,
  activities.age_min,
  activities.age_max,
  activities.price_label,
  activities.is_free,
  activities.schedule_label,
  activities.venue_name,
  activities.venue_address_1,
  activities.venue_postal_code,
  activities.is_featured,
  activities.created_at
from public.activities
join public.centers
  on centers.id = activities.center_id
join public.cities
  on cities.id = centers.city_id
join public.categories
  on categories.id = activities.category_id
join public.type_activity
  on type_activity.id = activities.type_id
where
  activities.is_active = true
  and activities.is_deleted = false
  and centers.is_active = true
  and centers.is_deleted = false;

grant select on public.catalog_activities_read to anon, authenticated;

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
  new_activity_id bigint;
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
    'draft.approve_activity_draft',
    'draft.approve_activity_draft',
    false
  )
  returning id
  into new_activity_id;

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
    approved_activity_id = new_activity_id,
    reviewed_payload_json = normalized_reviewed_payload,
    updated_at = now()
  where id = p_draft_id;

  return new_activity_id;
end;
$$;

revoke all on function public.approve_activity_draft(bigint) from public;
revoke all on function public.approve_activity_draft(bigint) from anon;
revoke all on function public.approve_activity_draft(bigint) from authenticated;
grant execute on function public.approve_activity_draft(bigint) to authenticated;

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
set search_path = public, pg_temp
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

revoke all on function public.get_internal_approved_activity(bigint) from public;
revoke all on function public.get_internal_approved_activity(bigint) from anon;
revoke all on function public.get_internal_approved_activity(bigint) from authenticated;
grant execute on function public.get_internal_approved_activity(bigint) to authenticated;

create or replace function public.update_approved_activity_from_draft(
  p_draft_id bigint,
  p_reviewed_payload jsonb,
  p_review_notes text default null
)
returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  draft_row public.activity_drafts;
  activity_row public.activities;
  reviewed_payload jsonb := coalesce(p_reviewed_payload, '{}'::jsonb);
  activity_payload jsonb := coalesce(reviewed_payload -> 'activity', '{}'::jsonb);
  normalized_review_notes text := nullif(trim(coalesce(p_review_notes, '')), '');
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
    is_deleted = false,
    updated_at = now(),
    updated_by = 'draft.update_approved_activity_from_draft'
  where id = draft_row.approved_activity_id;

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
    reviewed_payload_json = normalized_reviewed_payload,
    review_notes = normalized_review_notes,
    updated_at = now()
  where id = p_draft_id;

  return draft_row.approved_activity_id;
end;
$$;

revoke all on function public.update_approved_activity_from_draft(bigint, jsonb, text) from public;
revoke all on function public.update_approved_activity_from_draft(bigint, jsonb, text) from anon;
revoke all on function public.update_approved_activity_from_draft(bigint, jsonb, text) from authenticated;
grant execute on function public.update_approved_activity_from_draft(bigint, jsonb, text) to authenticated;

notify pgrst, 'reload schema';

commit;
