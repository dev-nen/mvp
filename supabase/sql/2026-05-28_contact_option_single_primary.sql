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
  has_primary_option boolean := false;
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

    if resolved_is_primary and has_primary_option then
      resolved_is_primary := false;
    elsif resolved_is_primary then
      has_primary_option := true;
    end if;

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

revoke all on function public.normalize_activity_contact_options(jsonb) from public;
revoke all on function public.normalize_activity_contact_options(jsonb) from anon;
revoke all on function public.normalize_activity_contact_options(jsonb) from authenticated;

comment on function public.normalize_activity_contact_options(jsonb) is
  'Normalizes Phase 4 draft contact_options payloads, preserving optional labels, distinct website/form types and only the first primary option.';

notify pgrst, 'reload schema';

commit;
