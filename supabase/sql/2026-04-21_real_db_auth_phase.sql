begin;

create sequence if not exists public.activity_view_events_id_seq;
create sequence if not exists public.activity_contact_events_id_seq;
create sequence if not exists public.user_favorite_activities_id_seq;

select setval(
  'public.activity_view_events_id_seq',
  greatest(
    coalesce((select max(id) from public.activity_view_events), 0) + 1,
    1
  ),
  false
);

select setval(
  'public.activity_contact_events_id_seq',
  greatest(
    coalesce((select max(id) from public.activity_contact_events), 0) + 1,
    1
  ),
  false
);

select setval(
  'public.user_favorite_activities_id_seq',
  greatest(
    coalesce((select max(id) from public.user_favorite_activities), 0) + 1,
    1
  ),
  false
);

alter table public.activity_view_events
  alter column id set default nextval('public.activity_view_events_id_seq');

alter table public.activity_contact_events
  alter column id set default nextval('public.activity_contact_events_id_seq');

alter table public.user_favorite_activities
  alter column id set default nextval('public.user_favorite_activities_id_seq');

create unique index if not exists user_profiles_email_unique_idx
  on public.user_profiles (lower(email));

create unique index if not exists user_favorite_activities_user_activity_unique_idx
  on public.user_favorite_activities (user_profile_id, activity_id);

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

create or replace function public.ensure_my_profile(
  profile_name text,
  profile_last_name text,
  profile_city_id bigint
)
returns public.user_profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  auth_user_id uuid := auth.uid();
  auth_email text := nullif(trim(coalesce(auth.jwt() ->> 'email', '')), '');
  trimmed_name text := nullif(trim(coalesce(profile_name, '')), '');
  trimmed_last_name text := nullif(trim(coalesce(profile_last_name, '')), '');
  resolved_role_id bigint;
  resolved_profile public.user_profiles;
begin
  if auth_user_id is null then
    raise exception 'auth.uid() is required';
  end if;

  if auth_email is null then
    raise exception 'authenticated email is required';
  end if;

  if trimmed_name is null then
    raise exception 'profile_name is required';
  end if;

  if profile_city_id is null then
    raise exception 'profile_city_id is required';
  end if;

  if not exists (
    select 1
    from public.cities
    where id = profile_city_id
  ) then
    raise exception 'profile_city_id does not reference an existing city';
  end if;

  select id
  into resolved_role_id
  from public.user_role
  where lower(role) = 'user'
    and is_active = true
  order by id asc
  limit 1;

  if resolved_role_id is null then
    raise exception 'user role is required before provisioning profiles';
  end if;

  insert into public.user_profiles (
    id,
    name,
    last_name,
    email,
    picture_url,
    city_id,
    role_id,
    is_active,
    created_by,
    updated_by,
    is_deleted
  )
  values (
    auth_user_id,
    trimmed_name,
    trimmed_last_name,
    auth_email,
    null,
    profile_city_id,
    resolved_role_id,
    true,
    'auth.ensure_my_profile',
    'auth.ensure_my_profile',
    false
  )
  on conflict (id) do update
  set
    name = excluded.name,
    last_name = excluded.last_name,
    email = excluded.email,
    city_id = excluded.city_id,
    role_id = excluded.role_id,
    is_active = true,
    is_deleted = false,
    deleted_at = null,
    deleted_by = null,
    updated_at = now(),
    updated_by = 'auth.ensure_my_profile';

  select *
  into resolved_profile
  from public.user_profiles
  where id = auth_user_id;

  return resolved_profile;
end;
$$;

grant execute on function public.ensure_my_profile(text, text, bigint) to authenticated;

create or replace function public.get_internal_pvi_report()
returns jsonb
language sql
security definer
set search_path = public
as $$
with event_stream as (
  select
    activity_view_events.id,
    'activity_view'::text as event_type,
    activity_view_events.activity_id,
    activity_view_events.user_profile_id,
    activity_view_events.city_snapshot_id,
    cities.name as city_name_snapshot,
    activities.title as activity_title_snapshot,
    activity_view_events.source,
    null::text as contact_method,
    null::text as contact_target_snapshot,
    activity_view_events.viewed_at as created_at
  from public.activity_view_events
  left join public.activities
    on activities.id = activity_view_events.activity_id
  left join public.cities
    on cities.id = activity_view_events.city_snapshot_id
  union all
  select
    activity_contact_events.id,
    'activity_contact'::text as event_type,
    activity_contact_events.activity_id,
    activity_contact_events.user_profile_id,
    activity_contact_events.city_snapshot_id,
    cities.name as city_name_snapshot,
    activities.title as activity_title_snapshot,
    activity_contact_events.source,
    activity_contact_events.contact_method,
    activity_contact_events.contact_target_snapshot,
    activity_contact_events.clicked_at as created_at
  from public.activity_contact_events
  left join public.activities
    on activities.id = activity_contact_events.activity_id
  left join public.cities
    on cities.id = activity_contact_events.city_snapshot_id
),
totals as (
  select
    count(*) filter (where event_type = 'activity_view') as view_count,
    count(*) filter (where event_type = 'activity_contact') as contact_count,
    count(*) filter (
      where created_at >= now() - interval '7 days'
    ) as last_seven_days_count
  from event_stream
),
top_activities as (
  select
    activity_id,
    coalesce(activity_title_snapshot, 'Actividad sin titulo') as activity_title,
    coalesce(city_name_snapshot, 'Sin ciudad') as city_name,
    count(*) filter (where event_type = 'activity_view') as view_count,
    count(*) filter (where event_type = 'activity_contact') as contact_count,
    case
      when count(*) filter (where event_type = 'activity_view') = 0 then null
      else
        (
          count(*) filter (where event_type = 'activity_contact')::numeric
          /
          count(*) filter (where event_type = 'activity_view')::numeric
        )
    end as conversion_rate
  from event_stream
  group by 1, 2, 3
  order by contact_count desc, view_count desc, activity_title asc
  limit 20
),
source_breakdown as (
  select
    coalesce(source, 'unknown') as source,
    count(*) filter (where event_type = 'activity_view') as view_count,
    count(*) filter (where event_type = 'activity_contact') as contact_count,
    case
      when count(*) filter (where event_type = 'activity_view') = 0 then null
      else
        (
          count(*) filter (where event_type = 'activity_contact')::numeric
          /
          count(*) filter (where event_type = 'activity_view')::numeric
        )
    end as conversion_rate
  from event_stream
  group by 1
  order by source asc
),
recent_events as (
  select
    id,
    event_type,
    activity_id,
    coalesce(activity_title_snapshot, 'Actividad sin titulo') as activity_title_snapshot,
    coalesce(city_name_snapshot, 'Sin ciudad') as city_name_snapshot,
    coalesce(source, 'unknown') as source,
    contact_method,
    contact_target_snapshot,
    created_at
  from event_stream
  order by created_at desc
  limit 20
)
select jsonb_build_object(
  'totals',
  (
    select jsonb_build_object(
      'viewCount', totals.view_count,
      'contactCount', totals.contact_count,
      'conversionRate',
      case
        when totals.view_count = 0 then null
        else totals.contact_count::numeric / totals.view_count::numeric
      end,
      'lastSevenDaysCount', totals.last_seven_days_count
    )
    from totals
  ),
  'topActivities',
  coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'activityId', top_activities.activity_id,
          'activityTitle', top_activities.activity_title,
          'cityName', top_activities.city_name,
          'viewCount', top_activities.view_count,
          'contactCount', top_activities.contact_count,
          'conversionRate', top_activities.conversion_rate
        )
        order by top_activities.contact_count desc, top_activities.view_count desc, top_activities.activity_title asc
      )
      from top_activities
    ),
    '[]'::jsonb
  ),
  'sourceBreakdown',
  coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'source', source_breakdown.source,
          'viewCount', source_breakdown.view_count,
          'contactCount', source_breakdown.contact_count,
          'conversionRate', source_breakdown.conversion_rate
        )
        order by source_breakdown.source asc
      )
      from source_breakdown
    ),
    '[]'::jsonb
  ),
  'recentEvents',
  coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'id', recent_events.id,
          'eventType', recent_events.event_type,
          'activityId', recent_events.activity_id,
          'activityTitleSnapshot', recent_events.activity_title_snapshot,
          'cityNameSnapshot', recent_events.city_name_snapshot,
          'source', recent_events.source,
          'contactMethod', recent_events.contact_method,
          'contactTargetSnapshot', recent_events.contact_target_snapshot,
          'createdAt', recent_events.created_at
        )
        order by recent_events.created_at desc
      )
      from recent_events
    ),
    '[]'::jsonb
  )
);
$$;

commit;
