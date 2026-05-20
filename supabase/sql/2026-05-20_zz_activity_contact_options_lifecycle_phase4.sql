begin;

create or replace function public.normalize_activity_contact_options(
  p_contact_options jsonb
)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  contact_option jsonb;
  normalized_options jsonb := '[]'::jsonb;
  resolved_type text;
  raw_value text;
  raw_label text;
  normalized_value text;
  action_url text;
  candidate_url text;
  candidate_handle text;
  resolved_is_primary boolean;
begin
  if p_contact_options is null then
    return '[]'::jsonb;
  end if;

  if jsonb_typeof(p_contact_options) <> 'array' then
    raise exception 'contact_options must be an array';
  end if;

  for contact_option in
    select value
    from jsonb_array_elements(p_contact_options)
  loop
    if jsonb_typeof(contact_option) <> 'object' then
      raise exception 'each contact option must be an object';
    end if;

    resolved_type := lower(trim(coalesce(
      contact_option ->> 'type',
      contact_option ->> 'contact_method',
      ''
    )));
    raw_value := nullif(trim(coalesce(
      contact_option ->> 'raw_value',
      contact_option ->> 'value',
      contact_option ->> 'contact_value',
      contact_option ->> 'url',
      contact_option ->> 'normalized_value',
      ''
    )), '');
    raw_label := nullif(trim(coalesce(contact_option ->> 'label', '')), '');

    if resolved_type = '' and raw_value is null and raw_label is null then
      continue;
    end if;

    if resolved_type in ('web', 'form') then
      resolved_type := 'website';
    end if;

    if resolved_type not in ('whatsapp', 'phone', 'email', 'website', 'instagram') then
      raise exception 'unsupported contact option type %', resolved_type;
    end if;

    if raw_value is null then
      raise exception 'contact option value is required for %', resolved_type;
    end if;

    resolved_is_primary := case
      when jsonb_typeof(contact_option -> 'is_primary') = 'boolean' then
        (contact_option ->> 'is_primary')::boolean
      when lower(trim(coalesce(contact_option ->> 'is_primary', ''))) in ('true', '1', 'yes', 'si') then
        true
      else
        false
    end;

    normalized_value := null;
    action_url := null;

    if resolved_type = 'whatsapp' then
      normalized_value := regexp_replace(raw_value, '[^0-9]', '', 'g');

      if normalized_value !~ '^[0-9]{6,}$' then
        raise exception 'invalid whatsapp contact option';
      end if;

      action_url := 'https://wa.me/' || normalized_value;
    elsif resolved_type = 'phone' then
      normalized_value := regexp_replace(raw_value, '[^0-9+]', '', 'g');

      if regexp_replace(normalized_value, '[^0-9]', '', 'g') !~ '^[0-9]{6,}$' then
        raise exception 'invalid phone contact option';
      end if;

      action_url := 'tel:' || normalized_value;
    elsif resolved_type = 'email' then
      normalized_value := lower(trim(raw_value));

      if normalized_value !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
        raise exception 'invalid email contact option';
      end if;

      action_url := 'mailto:' || normalized_value;
    elsif resolved_type = 'website' then
      if raw_value ~* '^[a-z][a-z0-9+.-]*:' and raw_value !~* '^https?://' then
        raise exception 'unsafe website contact option';
      end if;

      candidate_url := case
        when raw_value ~* '^https?://' then raw_value
        else 'https://' || raw_value
      end;

      if candidate_url !~* '^https?://[^[:space:]/]+\.[^[:space:]]+' then
        raise exception 'invalid website contact option';
      end if;

      normalized_value := candidate_url;
      action_url := candidate_url;
    elsif resolved_type = 'instagram' then
      if raw_value ~* '^https?://' then
        if raw_value !~* '^https?://(www\.)?instagram\.com/[^/?#]+/?([?#].*)?$' then
          raise exception 'invalid instagram contact option';
        end if;

        candidate_handle := regexp_replace(
          raw_value,
          '^https?://(www\.)?instagram\.com/([^/?#]+).*$',
          '\2',
          'i'
        );
      elsif raw_value ~* '^[a-z][a-z0-9+.-]*:' then
        raise exception 'invalid instagram contact option';
      else
        candidate_handle := regexp_replace(trim(raw_value), '^@+', '');
      end if;

      if candidate_handle !~ '^[A-Za-z0-9._]{1,30}$'
        or candidate_handle ~ '^\.'
        or candidate_handle ~ '\.$'
        or candidate_handle ~ '\.\.'
      then
        raise exception 'invalid instagram contact option';
      end if;

      normalized_value := candidate_handle;
      action_url := 'https://www.instagram.com/' || candidate_handle || '/';
    end if;

    normalized_options := normalized_options || jsonb_build_array(
      jsonb_build_object(
        'type', resolved_type,
        'label', coalesce(
          raw_label,
          case resolved_type
            when 'whatsapp' then 'WhatsApp'
            when 'phone' then 'Telefono'
            when 'email' then 'Email'
            when 'website' then 'Web'
            when 'instagram' then 'Instagram'
            else 'Contacto'
          end
        ),
        'raw_value', raw_value,
        'normalized_value', normalized_value,
        'url', action_url,
        'is_primary', resolved_is_primary
      )
    );
  end loop;

  return normalized_options;
end;
$$;

create or replace function public.build_activity_contact_options_payload(
  p_activity_id bigint
)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  payload jsonb;
begin
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'type', lower(trim(activity_contact_options.contact_method)),
        'label', null,
        'raw_value', activity_contact_options.contact_value,
        'is_primary', false
      )
      order by activity_contact_options.id asc
    ),
    '[]'::jsonb
  )
  into payload
  from public.activity_contact_options
  where activity_contact_options.activity_id = p_activity_id
    and activity_contact_options.is_active = true
    and activity_contact_options.is_deleted = false;

  return public.normalize_activity_contact_options(payload);
end;
$$;

create or replace function public.replace_activity_contact_options_from_payload(
  p_activity_id bigint,
  p_contact_options jsonb,
  p_updated_by text default 'draft.contact_options'
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  normalized_options jsonb := public.normalize_activity_contact_options(p_contact_options);
  contact_option jsonb;
  normalized_updated_by text := nullif(trim(coalesce(p_updated_by, '')), '');
begin
  if p_activity_id is null then
    raise exception 'p_activity_id is required';
  end if;

  normalized_updated_by := coalesce(normalized_updated_by, 'draft.contact_options');

  if not exists (
    select 1
    from public.activities
    where id = p_activity_id
      and is_deleted = false
  ) then
    raise exception 'activity % was not found for contact option publication', p_activity_id;
  end if;

  update public.activity_contact_options
  set
    is_active = false,
    is_deleted = true,
    deleted_at = now(),
    deleted_by = normalized_updated_by,
    updated_at = now(),
    updated_by = normalized_updated_by
  where activity_id = p_activity_id
    and is_deleted = false;

  for contact_option in
    select value
    from jsonb_array_elements(normalized_options)
  loop
    insert into public.activity_contact_options (
      activity_id,
      contact_method,
      contact_value,
      is_active,
      created_by,
      updated_by,
      is_deleted
    )
    values (
      p_activity_id,
      contact_option ->> 'type',
      case
        when contact_option ->> 'type' in ('website', 'instagram') then contact_option ->> 'url'
        else contact_option ->> 'normalized_value'
      end,
      true,
      normalized_updated_by,
      normalized_updated_by,
      false
    );
  end loop;
end;
$$;

revoke select, insert, update, delete on public.activity_contact_options from public;
revoke select, insert, update, delete on public.activity_contact_options from anon;
revoke select, insert, update, delete on public.activity_contact_options from authenticated;

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
  payload_has_contact_options boolean := false;
  normalized_contact_options jsonb := '[]'::jsonb;
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
  payload_has_contact_options := reviewed_payload ? 'contact_options';

  if payload_has_contact_options then
    normalized_contact_options := public.normalize_activity_contact_options(
      reviewed_payload -> 'contact_options'
    );
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

  if payload_has_contact_options then
    normalized_reviewed_payload := normalized_reviewed_payload || jsonb_build_object(
      'contact_options',
      normalized_contact_options
    );

    perform public.replace_activity_contact_options_from_payload(
      resolved_approved_activity_id,
      normalized_contact_options,
      'draft.approve_activity_draft'
    );
  end if;

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
    drafts.id::bigint as draft_id,
    activities.id::bigint as activity_id,
    drafts.source_label::text,
    drafts.review_status::text,
    drafts.review_notes::text,
    (activities.is_active = true and activities.is_deleted = false)::boolean as is_published,
    activities.created_at::timestamptz as activity_created_at,
    activities.updated_at::timestamptz as activity_updated_at,
    (
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
      ) || jsonb_build_object(
        'contact_options',
        public.build_activity_contact_options_payload(activities.id)
      )
    )::jsonb as activity_payload_json
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
  payload_has_contact_options boolean := false;
  normalized_contact_options jsonb := '[]'::jsonb;
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

  payload_has_contact_options := reviewed_payload ? 'contact_options';

  if payload_has_contact_options then
    normalized_contact_options := public.normalize_activity_contact_options(
      reviewed_payload -> 'contact_options'
    );
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

  if payload_has_contact_options then
    normalized_reviewed_payload := normalized_reviewed_payload || jsonb_build_object(
      'contact_options',
      normalized_contact_options
    );

    perform public.replace_activity_contact_options_from_payload(
      draft_row.approved_activity_id,
      normalized_contact_options,
      'draft.update_approved_activity_from_draft'
    );
  end if;

  update public.activity_drafts
  set
    reviewed_payload_json = normalized_reviewed_payload,
    review_notes = normalized_review_notes,
    updated_at = now()
  where id = p_draft_id;

  return draft_row.approved_activity_id;
end;
$$;

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
  payload_has_contact_options boolean := false;
  normalized_contact_options jsonb := '[]'::jsonb;
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

  payload_has_contact_options := p_reviewed_payload ? 'contact_options';

  if payload_has_contact_options then
    normalized_contact_options := public.normalize_activity_contact_options(
      p_reviewed_payload -> 'contact_options'
    );
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

  if payload_has_contact_options then
    normalized_payload := normalized_payload || jsonb_build_object(
      'contact_options',
      normalized_contact_options
    );
  end if;

  resolved_source_label := case
    when resolved_title is null then 'Envio de usuario'
    else 'Envio de usuario: ' || resolved_title
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

create or replace function public.resubmit_my_activity_draft(
  p_draft_id bigint,
  p_reviewed_payload jsonb,
  p_source_reference_url text default null
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
  resolved_source_reference_url text;
  normalized_reviewed_payload jsonb := coalesce(p_reviewed_payload, '{}'::jsonb);
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

  if jsonb_typeof(normalized_reviewed_payload) <> 'object' then
    raise exception 'p_reviewed_payload must be a JSON object';
  end if;

  if normalized_reviewed_payload ? 'contact_options' then
    normalized_reviewed_payload := (normalized_reviewed_payload - 'contact_options') ||
      jsonb_build_object(
        'contact_options',
        public.normalize_activity_contact_options(
          normalized_reviewed_payload -> 'contact_options'
        )
      );
  end if;

  resolved_root_draft_id := coalesce(draft_row.root_draft_id, draft_row.id);
  resolved_source_reference_url := case
    when p_source_reference_url is null then draft_row.source_reference_url
    else nullif(trim(p_source_reference_url), '')
  end;

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
    resolved_source_reference_url,
    draft_row.raw_extracted_text,
    draft_row.parsed_payload_json,
    normalized_reviewed_payload,
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
    (
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
      ) || jsonb_build_object(
        'contact_options',
        public.build_activity_contact_options_payload(activities.id)
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
  current_activity_payload jsonb;
  normalized_reviewed_payload jsonb := coalesce(p_reviewed_payload, '{}'::jsonb);
begin
  if auth.uid() is null then
    raise exception 'auth.uid() is required';
  end if;

  if jsonb_typeof(normalized_reviewed_payload) <> 'object' then
    raise exception 'p_reviewed_payload must be a JSON object';
  end if;

  if normalized_reviewed_payload ? 'contact_options' then
    normalized_reviewed_payload := (normalized_reviewed_payload - 'contact_options') ||
      jsonb_build_object(
        'contact_options',
        public.normalize_activity_contact_options(
          normalized_reviewed_payload -> 'contact_options'
        )
      );
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

  current_activity_payload := jsonb_build_object(
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
  ) || jsonb_build_object(
    'contact_options',
    public.build_activity_contact_options_payload(activity_row.id)
  );

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
    current_activity_payload,
    normalized_reviewed_payload,
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

revoke all on function public.normalize_activity_contact_options(jsonb) from public;
revoke all on function public.normalize_activity_contact_options(jsonb) from anon;
revoke all on function public.normalize_activity_contact_options(jsonb) from authenticated;

revoke all on function public.build_activity_contact_options_payload(bigint) from public;
revoke all on function public.build_activity_contact_options_payload(bigint) from anon;
revoke all on function public.build_activity_contact_options_payload(bigint) from authenticated;

revoke all on function public.replace_activity_contact_options_from_payload(bigint, jsonb, text) from public;
revoke all on function public.replace_activity_contact_options_from_payload(bigint, jsonb, text) from anon;
revoke all on function public.replace_activity_contact_options_from_payload(bigint, jsonb, text) from authenticated;

revoke all on function public.approve_activity_draft(bigint) from public;
revoke all on function public.approve_activity_draft(bigint) from anon;
revoke all on function public.approve_activity_draft(bigint) from authenticated;
grant execute on function public.approve_activity_draft(bigint) to authenticated;

revoke all on function public.get_internal_approved_activity(bigint) from public;
revoke all on function public.get_internal_approved_activity(bigint) from anon;
revoke all on function public.get_internal_approved_activity(bigint) from authenticated;
grant execute on function public.get_internal_approved_activity(bigint) to authenticated;

revoke all on function public.update_approved_activity_from_draft(bigint, jsonb, text) from public;
revoke all on function public.update_approved_activity_from_draft(bigint, jsonb, text) from anon;
revoke all on function public.update_approved_activity_from_draft(bigint, jsonb, text) from authenticated;
grant execute on function public.update_approved_activity_from_draft(bigint, jsonb, text) to authenticated;

revoke all on function public.create_my_activity_submission(jsonb, text) from public;
revoke all on function public.create_my_activity_submission(jsonb, text) from anon;
revoke all on function public.create_my_activity_submission(jsonb, text) from authenticated;
grant execute on function public.create_my_activity_submission(jsonb, text) to authenticated;

revoke all on function public.resubmit_my_activity_draft(bigint, jsonb, text) from public;
revoke all on function public.resubmit_my_activity_draft(bigint, jsonb, text) from anon;
revoke all on function public.resubmit_my_activity_draft(bigint, jsonb, text) from authenticated;
grant execute on function public.resubmit_my_activity_draft(bigint, jsonb, text) to authenticated;

revoke all on function public.get_my_activity_for_edit(bigint) from public;
revoke all on function public.get_my_activity_for_edit(bigint) from anon;
revoke all on function public.get_my_activity_for_edit(bigint) from authenticated;
grant execute on function public.get_my_activity_for_edit(bigint) to authenticated;

revoke all on function public.create_my_activity_edit_draft(bigint, jsonb, text) from public;
revoke all on function public.create_my_activity_edit_draft(bigint, jsonb, text) from anon;
revoke all on function public.create_my_activity_edit_draft(bigint, jsonb, text) from authenticated;
grant execute on function public.create_my_activity_edit_draft(bigint, jsonb, text) to authenticated;

comment on function public.normalize_activity_contact_options(jsonb) is
  'Normalizes Phase 4 draft contact_options payloads, including Instagram profile URLs.';

comment on function public.build_activity_contact_options_payload(bigint) is
  'Builds a normalized contact_options payload from active live activity_contact_options rows.';

comment on function public.replace_activity_contact_options_from_payload(bigint, jsonb, text) is
  'Replaces live activity_contact_options for an approved activity from a reviewed Phase 4 contact_options payload.';

comment on function public.approve_activity_draft(bigint) is
  'Internal RPC to approve a pending activity draft, publish/update the activity, and publish reviewed contact options when present.';

comment on function public.get_internal_approved_activity(bigint) is
  'Internal read model for approved activity editing, including current contact_options payload.';

comment on function public.update_approved_activity_from_draft(bigint, jsonb, text) is
  'Internal RPC to update an approved activity and replace reviewed contact options when present.';

comment on function public.create_my_activity_submission(jsonb, text) is
  'Creates a pending_review activity_draft for an authenticated user submission without publishing or writing public.activities.';

comment on function public.resubmit_my_activity_draft(bigint, jsonb, text) is
  'Creates a linked pending_review correction draft for the authenticated submitter without publishing contact options.';

comment on function public.get_my_activity_for_edit(bigint) is
  'Owner-only sanitized activity edit read model including reviewed contact_options payload.';

comment on function public.create_my_activity_edit_draft(bigint, jsonb, text) is
  'Owner-only RPC that unpublishes a user-owned activity and creates a pending_review edit draft with contact options kept unpublished.';

notify pgrst, 'reload schema';

commit;
