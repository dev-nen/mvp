begin;

create or replace function public.create_my_activity_submission(
  p_reviewed_payload jsonb,
  p_source_reference_url text default null
)
returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  activity_payload jsonb;
  normalized_source_reference_url text := nullif(trim(coalesce(p_source_reference_url, '')), '');
  raw_description_format text;
  raw_age_rule_type text;
  resolved_title text;
  resolved_description text;
  resolved_description_format text;
  resolved_center_id bigint;
  resolved_category_id bigint;
  resolved_type_id bigint;
  resolved_image_url text;
  resolved_age_rule_type text;
  resolved_age_min integer;
  resolved_age_max integer;
  resolved_price_label text;
  resolved_is_free boolean;
  resolved_schedule_label text;
  resolved_venue_name text;
  resolved_venue_address_1 text;
  resolved_venue_postal_code text;
  normalized_payload jsonb;
  resolved_source_label text;
  new_draft_id bigint;
begin
  if auth.uid() is null then
    raise exception 'auth.uid() is required';
  end if;

  if p_reviewed_payload is null or jsonb_typeof(p_reviewed_payload) <> 'object' then
    raise exception 'p_reviewed_payload must be a JSON object';
  end if;

  activity_payload := p_reviewed_payload -> 'activity';

  if activity_payload is null or jsonb_typeof(activity_payload) <> 'object' then
    raise exception 'p_reviewed_payload.activity must be a JSON object';
  end if;

  resolved_title := nullif(trim(coalesce(activity_payload ->> 'title', '')), '');
  resolved_description := nullif(trim(coalesce(activity_payload ->> 'description', '')), '');
  raw_description_format := lower(trim(coalesce(activity_payload ->> 'description_format', '')));
  resolved_description_format := case
    when raw_description_format = 'markdown' then 'markdown'
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
    when lower(trim(coalesce(activity_payload ->> 'is_free', ''))) in ('true', '1', 'si', 'yes', 'free', 'gratis') then
      true
    else
      false
  end;

  if resolved_title is null then
    raise exception 'activity title is required';
  end if;

  if resolved_description is null then
    raise exception 'activity description is required';
  end if;

  if resolved_center_id is null then
    raise exception 'activity center_id is required';
  end if;

  if resolved_category_id is null then
    raise exception 'activity category_id is required';
  end if;

  if resolved_type_id is null then
    raise exception 'activity type_id is required';
  end if;

  if resolved_schedule_label is null then
    raise exception 'activity schedule_label is required';
  end if;

  if not exists (
    select 1
    from public.centers
    where id = resolved_center_id
      and is_active = true
      and is_deleted = false
  ) then
    raise exception 'activity center_id % is invalid', resolved_center_id;
  end if;

  if not exists (
    select 1
    from public.categories
    where id = resolved_category_id
  ) then
    raise exception 'activity category_id % is invalid', resolved_category_id;
  end if;

  if not exists (
    select 1
    from public.type_activity
    where id = resolved_type_id
  ) then
    raise exception 'activity type_id % is invalid', resolved_type_id;
  end if;

  if resolved_age_rule_type = 'range' then
    if resolved_age_min is null or resolved_age_max is null then
      raise exception 'range age_rule_type requires age_min and age_max';
    end if;

    if resolved_age_min > resolved_age_max then
      raise exception 'range age_rule_type requires age_min less than or equal to age_max';
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
    resolved_age_rule_type := 'all';
    resolved_age_min := null;
    resolved_age_max := null;
  end if;

  normalized_payload := jsonb_build_object(
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

  resolved_source_label := case
    when resolved_title is null then 'Envío de usuario'
    else 'Envío de usuario: ' || resolved_title
  end;

  insert into public.activity_drafts (
    source_type,
    source_label,
    source_reference_url,
    raw_extracted_text,
    parsed_payload_json,
    reviewed_payload_json,
    confidence_score,
    review_status,
    review_notes,
    internal_review_notes,
    user_feedback_summary,
    user_feedback_json,
    created_by,
    submitted_by_user_id,
    parent_draft_id,
    root_draft_id,
    revision_number,
    resubmitted_at,
    resubmitted_by,
    edit_activity_id,
    approved_activity_id
  )
  values (
    'user_submission',
    resolved_source_label,
    normalized_source_reference_url,
    null,
    normalized_payload,
    normalized_payload,
    null,
    'pending_review',
    null,
    null,
    null,
    '[]'::jsonb,
    auth.uid(),
    auth.uid(),
    null,
    null,
    1,
    null,
    null,
    null,
    null
  )
  returning id into new_draft_id;

  update public.activity_drafts
  set root_draft_id = new_draft_id
  where id = new_draft_id;

  return new_draft_id;
end;
$$;

revoke all on function public.create_my_activity_submission(jsonb, text) from public;
revoke all on function public.create_my_activity_submission(jsonb, text) from anon;
revoke all on function public.create_my_activity_submission(jsonb, text) from authenticated;
grant execute on function public.create_my_activity_submission(jsonb, text) to authenticated;

comment on function public.create_my_activity_submission(jsonb, text) is
  'Creates a pending_review activity_draft for an authenticated user submission without publishing or writing public.activities.';

notify pgrst, 'reload schema';

commit;
