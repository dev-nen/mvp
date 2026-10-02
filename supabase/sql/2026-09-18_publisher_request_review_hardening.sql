begin;

-- Requires the Phase 4 publisher request foundation migration.
-- Safe to reapply: restrict client reads to the existing sanitized RPCs and
-- replace review RPCs without changing request or profile data.
revoke all on table public.publisher_requests from public;
revoke all on table public.publisher_requests from anon;
revoke all on table public.publisher_requests from authenticated;

revoke all on table public.publisher_profiles from public;
revoke all on table public.publisher_profiles from anon;
revoke all on table public.publisher_profiles from authenticated;

create or replace function public.request_internal_publisher_changes(
  p_request_id bigint,
  p_user_feedback_summary text,
  p_user_feedback_json jsonb default '[]'::jsonb,
  p_internal_review_notes text default null
)
returns table (
  request_id bigint,
  review_status text,
  updated_at timestamptz
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
    raise exception 'draft_inbox access is required';
  end if;

  if nullif(trim(coalesce(p_user_feedback_summary, '')), '') is null then
    raise exception 'user feedback summary is required';
  end if;

  if p_user_feedback_json is null or jsonb_typeof(p_user_feedback_json) <> 'array' then
    raise exception 'user feedback must be a JSON array';
  end if;

  return query
  update public.publisher_requests as requests
  set
    review_status = 'needs_changes',
    user_feedback_summary = trim(p_user_feedback_summary),
    user_feedback_json = p_user_feedback_json,
    internal_review_notes = nullif(trim(coalesce(p_internal_review_notes, '')), ''),
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    updated_at = now()
  where requests.id = p_request_id
    and requests.review_status = 'pending_review'
  returning
    requests.id::bigint,
    requests.review_status::text,
    requests.updated_at::timestamptz;
end;
$$;

create or replace function public.reject_internal_publisher_request(
  p_request_id bigint,
  p_user_feedback_summary text,
  p_user_feedback_json jsonb default '[]'::jsonb,
  p_internal_review_notes text default null
)
returns table (
  request_id bigint,
  review_status text,
  updated_at timestamptz
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
    raise exception 'draft_inbox access is required';
  end if;

  if nullif(trim(coalesce(p_user_feedback_summary, '')), '') is null then
    raise exception 'user feedback summary is required';
  end if;

  if p_user_feedback_json is null or jsonb_typeof(p_user_feedback_json) <> 'array' then
    raise exception 'user feedback must be a JSON array';
  end if;

  return query
  update public.publisher_requests as requests
  set
    review_status = 'rejected',
    user_feedback_summary = trim(p_user_feedback_summary),
    user_feedback_json = p_user_feedback_json,
    internal_review_notes = nullif(trim(coalesce(p_internal_review_notes, '')), ''),
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    updated_at = now()
  where requests.id = p_request_id
    and requests.review_status = 'pending_review'
  returning
    requests.id::bigint,
    requests.review_status::text,
    requests.updated_at::timestamptz;
end;
$$;

create or replace function public.approve_internal_publisher_request(
  p_request_id bigint,
  p_internal_review_notes text default null
)
returns table (
  request_id bigint,
  profile_id bigint,
  review_status text,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  request_row public.publisher_requests;
  active_profile_id bigint;
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
    raise exception 'draft_inbox access is required';
  end if;

  select requests.*
  into request_row
  from public.publisher_requests as requests
  where requests.id = p_request_id
    and requests.review_status = 'pending_review'
  for update;

  if request_row.id is null then
    raise exception 'publisher request is not pending review';
  end if;

  select profiles.id
  into active_profile_id
  from public.publisher_profiles as profiles
  where profiles.user_id = request_row.user_id
    and profiles.is_active = true
  order by profiles.approved_at desc, profiles.id desc
  limit 1;

  if active_profile_id is null then
    insert into public.publisher_profiles (
      user_id,
      publisher_request_id,
      is_active,
      organizer_type,
      full_name,
      commercial_name,
      city_id,
      phone,
      instagram,
      website,
      activity_description,
      has_physical_location,
      address_line_1,
      approved_by
    )
    values (
      request_row.user_id,
      request_row.id,
      true,
      request_row.organizer_type,
      request_row.full_name,
      request_row.commercial_name,
      request_row.city_id,
      request_row.phone,
      request_row.instagram,
      request_row.website,
      request_row.activity_description,
      request_row.has_physical_location,
      request_row.address_line_1,
      auth.uid()
    )
    returning id into active_profile_id;
  else
    update public.publisher_profiles as profiles
    set
      publisher_request_id = request_row.id,
      is_active = true,
      organizer_type = request_row.organizer_type,
      full_name = request_row.full_name,
      commercial_name = request_row.commercial_name,
      city_id = request_row.city_id,
      phone = request_row.phone,
      instagram = request_row.instagram,
      website = request_row.website,
      activity_description = request_row.activity_description,
      has_physical_location = request_row.has_physical_location,
      address_line_1 = request_row.address_line_1,
      approved_by = auth.uid(),
      approved_at = now(),
      updated_at = now()
    where profiles.id = active_profile_id;
  end if;

  update public.publisher_requests as requests
  set
    review_status = 'approved',
    user_feedback_summary = null,
    user_feedback_json = '[]'::jsonb,
    internal_review_notes = nullif(trim(coalesce(p_internal_review_notes, '')), ''),
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    updated_at = now()
  where requests.id = request_row.id
  returning
    requests.id,
    requests.review_status,
    requests.updated_at
  into request_row.id, request_row.review_status, request_row.updated_at;

  return query
  select
    request_row.id::bigint,
    active_profile_id::bigint,
    request_row.review_status::text,
    request_row.updated_at::timestamptz;
end;
$$;

revoke all on function public.request_internal_publisher_changes(bigint, text, jsonb, text) from public;
revoke all on function public.request_internal_publisher_changes(bigint, text, jsonb, text) from anon;
revoke all on function public.request_internal_publisher_changes(bigint, text, jsonb, text) from authenticated;
grant execute on function public.request_internal_publisher_changes(bigint, text, jsonb, text) to authenticated;

revoke all on function public.reject_internal_publisher_request(bigint, text, jsonb, text) from public;
revoke all on function public.reject_internal_publisher_request(bigint, text, jsonb, text) from anon;
revoke all on function public.reject_internal_publisher_request(bigint, text, jsonb, text) from authenticated;
grant execute on function public.reject_internal_publisher_request(bigint, text, jsonb, text) to authenticated;

revoke all on function public.approve_internal_publisher_request(bigint, text) from public;
revoke all on function public.approve_internal_publisher_request(bigint, text) from anon;
revoke all on function public.approve_internal_publisher_request(bigint, text) from authenticated;
grant execute on function public.approve_internal_publisher_request(bigint, text) to authenticated;

notify pgrst, 'reload schema';

commit;
