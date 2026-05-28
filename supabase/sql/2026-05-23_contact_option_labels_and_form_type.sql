begin;

alter table public.activity_contact_options
  add column if not exists contact_label text;

create or replace view public.activity_contact_options_read as
select
  activity_contact_options.id,
  activity_contact_options.activity_id,
  activity_contact_options.contact_method,
  activity_contact_options.contact_value,
  activity_contact_options.contact_label
from public.activity_contact_options
join public.activities
  on activities.id = activity_contact_options.activity_id
join public.centers
  on centers.id = activities.center_id
where
  activity_contact_options.is_active = true
  and activity_contact_options.is_deleted = false
  and activities.is_active = true
  and activities.is_deleted = false
  and centers.is_active = true
  and centers.is_deleted = false;

grant select on public.activity_contact_options_read to anon, authenticated;
revoke select on public.activity_contact_options from public;
revoke select on public.activity_contact_options from anon;
revoke select on public.activity_contact_options from authenticated;

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
    raw_label := nullif(trim(coalesce(
      contact_option ->> 'label',
      contact_option ->> 'contact_label',
      ''
    )), '');

    if resolved_type = '' and raw_value is null and raw_label is null then
      continue;
    end if;

    if resolved_type = 'web' then
      resolved_type := 'website';
    end if;

    if resolved_type not in ('whatsapp', 'phone', 'email', 'website', 'form', 'instagram') then
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
    elsif resolved_type in ('website', 'form') then
      if raw_value ~* '^[a-z][a-z0-9+.-]*:' and raw_value !~* '^https?://' then
        raise exception 'unsafe % contact option', resolved_type;
      end if;

      candidate_url := case
        when raw_value ~* '^https?://' then raw_value
        else 'https://' || raw_value
      end;

      if candidate_url !~* '^https?://[^[:space:]/]+\.[^[:space:]]+' then
        raise exception 'invalid % contact option', resolved_type;
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
        'label', raw_label,
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
        'label', nullif(trim(coalesce(activity_contact_options.contact_label, '')), ''),
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
      contact_label,
      is_active,
      created_by,
      updated_by,
      is_deleted
    )
    values (
      p_activity_id,
      contact_option ->> 'type',
      case
        when contact_option ->> 'type' in ('website', 'form', 'instagram') then contact_option ->> 'url'
        else contact_option ->> 'normalized_value'
      end,
      nullif(trim(coalesce(contact_option ->> 'label', '')), ''),
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

revoke all on function public.normalize_activity_contact_options(jsonb) from public;
revoke all on function public.normalize_activity_contact_options(jsonb) from anon;
revoke all on function public.normalize_activity_contact_options(jsonb) from authenticated;

revoke all on function public.build_activity_contact_options_payload(bigint) from public;
revoke all on function public.build_activity_contact_options_payload(bigint) from anon;
revoke all on function public.build_activity_contact_options_payload(bigint) from authenticated;

revoke all on function public.replace_activity_contact_options_from_payload(bigint, jsonb, text) from public;
revoke all on function public.replace_activity_contact_options_from_payload(bigint, jsonb, text) from anon;
revoke all on function public.replace_activity_contact_options_from_payload(bigint, jsonb, text) from authenticated;

comment on column public.activity_contact_options.contact_label is
  'Optional custom public label for this contact option. UI falls back to contact_method label when null.';

comment on function public.normalize_activity_contact_options(jsonb) is
  'Normalizes Phase 4 draft contact_options payloads, preserving optional labels and distinct website/form types.';

comment on function public.build_activity_contact_options_payload(bigint) is
  'Builds a normalized contact_options payload from active live activity_contact_options rows, including optional contact labels.';

comment on function public.replace_activity_contact_options_from_payload(bigint, jsonb, text) is
  'Replaces live activity_contact_options for an approved activity from a reviewed Phase 4 contact_options payload, including optional labels.';

notify pgrst, 'reload schema';

commit;
