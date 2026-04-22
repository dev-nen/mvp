begin;

do $$
declare
  target_table text;
  current_sequence text;
  next_value bigint;
begin
  foreach target_table in array array[
    'activities'
  ]
  loop
    select pg_get_serial_sequence(format('public.%I', target_table), 'id')
    into current_sequence;

    if current_sequence is null then
      current_sequence := format('public.%I_id_seq', target_table);

      execute format(
        'create sequence if not exists %s',
        current_sequence
      );

      execute format(
        'alter sequence %s owned by public.%I.id',
        current_sequence,
        target_table
      );

      execute format(
        'alter table public.%I alter column id set default nextval(%L)',
        target_table,
        current_sequence
      );
    end if;

    execute format(
      'select greatest(coalesce(max(id), 0) + 1, 1) from public.%I',
      target_table
    )
    into next_value;

    perform setval(current_sequence::regclass, next_value, false);
  end loop;
end;
$$;

create table if not exists public.activity_drafts (
  id bigint generated always as identity primary key,
  source_type text not null,
  source_label text null,
  source_file_path text null,
  source_file_name text null,
  source_mime_type text null,
  source_reference_url text null,
  raw_extracted_text text null,
  parsed_payload_json jsonb not null default '{}'::jsonb,
  reviewed_payload_json jsonb not null default '{}'::jsonb,
  confidence_score numeric(5, 2) null,
  review_status text not null default 'pending_review',
  review_notes text null,
  reviewed_by uuid null references auth.users(id),
  approved_activity_id bigint null references public.activities(id),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint activity_drafts_review_status_check
    check (review_status in ('pending_review', 'approved', 'rejected'))
);

create table if not exists public.internal_tool_access (
  user_id uuid primary key references public.user_profiles(id),
  tool_name text not null,
  created_at timestamptz not null default now(),
  constraint internal_tool_access_tool_name_check
    check (tool_name = 'draft_inbox')
);

create index if not exists activity_drafts_review_status_created_at_idx
  on public.activity_drafts (review_status, created_at desc);

create index if not exists activity_drafts_created_by_idx
  on public.activity_drafts (created_by, created_at desc);

create index if not exists activity_drafts_approved_activity_id_idx
  on public.activity_drafts (approved_activity_id);

grant select on public.internal_tool_access to authenticated;
grant select, update on public.activity_drafts to authenticated;

alter table public.internal_tool_access enable row level security;
alter table public.activity_drafts enable row level security;

drop policy if exists internal_tool_access_select_own on public.internal_tool_access;
create policy internal_tool_access_select_own
  on public.internal_tool_access
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists activity_drafts_select_internal_reviewers on public.activity_drafts;
create policy activity_drafts_select_internal_reviewers
  on public.activity_drafts
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.internal_tool_access
      where user_id = auth.uid()
        and tool_name = 'draft_inbox'
    )
  );

drop policy if exists activity_drafts_save_pending_review on public.activity_drafts;
create policy activity_drafts_save_pending_review
  on public.activity_drafts
  for update
  to authenticated
  using (
    review_status = 'pending_review'
    and exists (
      select 1
      from public.internal_tool_access
      where user_id = auth.uid()
        and tool_name = 'draft_inbox'
    )
  )
  with check (
    review_status = 'pending_review'
    and approved_activity_id is null
    and (reviewed_by is null or reviewed_by = auth.uid())
    and exists (
      select 1
      from public.internal_tool_access
      where user_id = auth.uid()
        and tool_name = 'draft_inbox'
    )
  );

drop policy if exists activity_drafts_reject_pending_review on public.activity_drafts;
create policy activity_drafts_reject_pending_review
  on public.activity_drafts
  for update
  to authenticated
  using (
    review_status = 'pending_review'
    and exists (
      select 1
      from public.internal_tool_access
      where user_id = auth.uid()
        and tool_name = 'draft_inbox'
    )
  )
  with check (
    review_status = 'rejected'
    and approved_activity_id is null
    and reviewed_by = auth.uid()
    and exists (
      select 1
      from public.internal_tool_access
      where user_id = auth.uid()
        and tool_name = 'draft_inbox'
    )
  );

create or replace function public.approve_activity_draft(p_draft_id bigint)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  draft_row public.activity_drafts;
  reviewed_payload jsonb := '{}'::jsonb;
  activity_payload jsonb := '{}'::jsonb;
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

grant execute on function public.approve_activity_draft(bigint) to authenticated;

create or replace function public.seed_activity_draft_examples(p_internal_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  resolved_center record;
  resolved_category record;
  resolved_type record;
  created_count integer := 0;
begin
  if p_internal_user_id is null then
    raise exception 'p_internal_user_id is required';
  end if;

  if not exists (
    select 1
    from public.user_profiles
    where id = p_internal_user_id
      and is_deleted = false
  ) then
    raise exception 'p_internal_user_id must reference an existing active user_profile';
  end if;

  select id, name, city_id
  into resolved_center
  from public.centers
  where is_active = true
    and is_deleted = false
  order by id asc
  limit 1;

  select id, name
  into resolved_category
  from public.categories
  order by id asc
  limit 1;

  select id, name
  into resolved_type
  from public.type_activity
  order by id asc
  limit 1;

  if resolved_center.id is null then
    raise exception 'at least one active center is required before seeding drafts';
  end if;

  if resolved_category.id is null then
    raise exception 'at least one category is required before seeding drafts';
  end if;

  if resolved_type.id is null then
    raise exception 'at least one type_activity row is required before seeding drafts';
  end if;

  insert into public.internal_tool_access (user_id, tool_name)
  values (p_internal_user_id, 'draft_inbox')
  on conflict (user_id) do update
  set tool_name = excluded.tool_name;

  if not exists (
    select 1
    from public.activity_drafts
    where created_by = p_internal_user_id
      and source_type = 'seed'
      and source_label = 'seed-complete'
  ) then
    insert into public.activity_drafts (
      source_type,
      source_label,
      raw_extracted_text,
      parsed_payload_json,
      reviewed_payload_json,
      confidence_score,
      review_status,
      created_by
    )
    values (
      'seed',
      'seed-complete',
      'Casal creativo para edades de 6 a 10 anos. Horario de miercoles tarde. Centro ya existente y publicable.',
      jsonb_build_object(
        'activity',
        jsonb_build_object(
          'title', 'Casal creativo de prueba',
          'description', 'Actividad de prueba generada para validar el circuito editorial del Draft Inbox.',
          'center_id', resolved_center.id,
          'category_id', resolved_category.id,
          'type_id', resolved_type.id,
          'image_url', '/placeholders/activity-card-placeholder.svg',
          'age_rule_type', 'range',
          'age_min', 6,
          'age_max', 10,
          'price_label', 'Consulta el precio',
          'is_free', false,
          'schedule_label', 'Miercoles de 17:00 a 18:30',
          'venue_name', resolved_center.name,
          'venue_address_1', 'Pendiente de confirmar',
          'venue_postal_code', ''
        )
      ),
      jsonb_build_object(
        'activity',
        jsonb_build_object(
          'title', 'Casal creativo de prueba',
          'description', 'Actividad de prueba generada para validar el circuito editorial del Draft Inbox.',
          'center_id', resolved_center.id,
          'category_id', resolved_category.id,
          'type_id', resolved_type.id,
          'image_url', '',
          'age_rule_type', 'range',
          'age_min', 6,
          'age_max', 10,
          'price_label', 'Consulta el precio',
          'is_free', false,
          'schedule_label', 'Miercoles de 17:00 a 18:30',
          'venue_name', resolved_center.name,
          'venue_address_1', 'Pendiente de confirmar',
          'venue_postal_code', ''
        )
      ),
      0.91,
      'pending_review',
      p_internal_user_id
    );

    created_count := created_count + 1;
  end if;

  if not exists (
    select 1
    from public.activity_drafts
    where created_by = p_internal_user_id
      and source_type = 'seed'
      and source_label = 'seed-incomplete'
  ) then
    insert into public.activity_drafts (
      source_type,
      source_label,
      raw_extracted_text,
      parsed_payload_json,
      reviewed_payload_json,
      confidence_score,
      review_status,
      created_by
    )
    values (
      'seed',
      'seed-incomplete',
      'Actividad detectada en boletin local. Falta confirmar centro, horario exacto y categoria.',
      jsonb_build_object(
        'activity',
        jsonb_build_object(
          'title', 'Actividad incompleta de prueba',
          'description', 'Seed intencionalmente incompleto para validar mensajes y guardado parcial.',
          'center_id', null,
          'category_id', null,
          'type_id', resolved_type.id,
          'image_url', '',
          'age_rule_type', 'all',
          'age_min', null,
          'age_max', null,
          'price_label', '',
          'is_free', true,
          'schedule_label', '',
          'venue_name', '',
          'venue_address_1', '',
          'venue_postal_code', ''
        )
      ),
      '{}'::jsonb,
      0.38,
      'pending_review',
      p_internal_user_id
    );

    created_count := created_count + 1;
  end if;

  if not exists (
    select 1
    from public.activity_drafts
    where created_by = p_internal_user_id
      and source_type = 'seed'
      and source_label = 'seed-ambiguous'
  ) then
    insert into public.activity_drafts (
      source_type,
      source_label,
      raw_extracted_text,
      parsed_payload_json,
      reviewed_payload_json,
      confidence_score,
      review_status,
      created_by
    )
    values (
      'seed',
      'seed-ambiguous',
      'Flyer reenviado por email. No queda claro si es taller puntual o curso. Precio y edades ambiguos.',
      jsonb_build_object(
        'activity',
        jsonb_build_object(
          'title', 'Taller ambiguo de prueba',
          'description', 'Seed de baja confianza para validar correccion humana antes de aprobar.',
          'center_id', resolved_center.id,
          'category_id', resolved_category.id,
          'type_id', resolved_type.id,
          'image_url', '',
          'age_rule_type', 'open',
          'age_min', null,
          'age_max', null,
          'price_label', 'A confirmar',
          'is_free', false,
          'schedule_label', 'Sabado por la manana',
          'venue_name', resolved_center.name,
          'venue_address_1', '',
          'venue_postal_code', ''
        )
      ),
      '{}'::jsonb,
      0.24,
      'pending_review',
      p_internal_user_id
    );

    created_count := created_count + 1;
  end if;

  return jsonb_build_object(
    'seededCount', created_count,
    'internalUserId', p_internal_user_id
  );
end;
$$;

comment on function public.seed_activity_draft_examples(uuid) is
  'Admin-only helper to seed Draft Inbox examples for one existing internal user. Example: select public.seed_activity_draft_examples(''<user-uuid>'');';

commit;
