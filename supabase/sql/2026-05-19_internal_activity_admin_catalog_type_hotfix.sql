begin;

create or replace function public.list_internal_admin_activities(
  p_publication_filter text default 'all'
)
returns table (
  activity_id bigint,
  title text,
  center_id bigint,
  center_name text,
  city_id bigint,
  city_name text,
  category_id bigint,
  category_label text,
  type_id bigint,
  type_label text,
  description text,
  short_description text,
  description_format text,
  image_url text,
  age_rule_type text,
  age_min integer,
  age_max integer,
  price_label text,
  is_free boolean,
  schedule_label text,
  venue_name text,
  venue_address_1 text,
  venue_postal_code text,
  is_featured boolean,
  is_published boolean,
  activity_created_at timestamptz,
  activity_updated_at timestamptz,
  draft_id bigint,
  draft_source_type text,
  draft_source_label text,
  draft_review_status text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  normalized_publication_filter text :=
    coalesce(nullif(lower(trim(coalesce(p_publication_filter, 'all'))), ''), 'all');
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

  if normalized_publication_filter not in ('all', 'published', 'unpublished') then
    raise exception 'unsupported publication filter %', p_publication_filter;
  end if;

  return query
  select
    activities.id::bigint as activity_id,
    activities.title::text as title,
    activities.center_id::bigint as center_id,
    centers.name::text as center_name,
    centers.city_id::bigint as city_id,
    cities.name::text as city_name,
    activities.category_id::bigint as category_id,
    categories.name::text as category_label,
    activities.type_id::bigint as type_id,
    type_activity.name::text as type_label,
    activities.description::text as description,
    (
      case
        when length(trim(coalesce(activities.description::text, ''))) <= 180 then
          trim(coalesce(activities.description::text, ''))
        else
          trim(left(coalesce(activities.description::text, ''), 177)) || '...'
      end
    )::text as short_description,
    coalesce(activities.description_format::text, 'plain')::text as description_format,
    activities.image_url::text as image_url,
    activities.age_rule_type::text as age_rule_type,
    activities.age_min::integer as age_min,
    activities.age_max::integer as age_max,
    activities.price_label::text as price_label,
    activities.is_free::boolean as is_free,
    activities.schedule_label::text as schedule_label,
    activities.venue_name::text as venue_name,
    activities.venue_address_1::text as venue_address_1,
    activities.venue_postal_code::text as venue_postal_code,
    activities.is_featured::boolean as is_featured,
    (activities.is_active = true and activities.is_deleted = false)::boolean as is_published,
    activities.created_at::timestamptz as activity_created_at,
    activities.updated_at::timestamptz as activity_updated_at,
    drafts.id::bigint as draft_id,
    drafts.source_type::text as draft_source_type,
    drafts.source_label::text as draft_source_label,
    drafts.review_status::text as draft_review_status
  from public.activities
  left join public.centers
    on centers.id = activities.center_id
  left join public.cities
    on cities.id = centers.city_id
  left join public.categories
    on categories.id = activities.category_id
  left join public.type_activity
    on type_activity.id = activities.type_id
  left join lateral (
    select
      activity_drafts.id,
      activity_drafts.source_type,
      activity_drafts.source_label,
      activity_drafts.review_status
    from public.activity_drafts
    where activity_drafts.approved_activity_id = activities.id
    order by activity_drafts.updated_at desc, activity_drafts.id desc
    limit 1
  ) as drafts on true
  where activities.is_deleted = false
    and (
      normalized_publication_filter = 'all'
      or (
        normalized_publication_filter = 'published'
        and activities.is_active = true
      )
      or (
        normalized_publication_filter = 'unpublished'
        and activities.is_active = false
      )
    )
  order by activities.updated_at desc, activities.id desc;
end;
$$;

revoke all on function public.list_internal_admin_activities(text) from public;
revoke all on function public.list_internal_admin_activities(text) from anon;
revoke all on function public.list_internal_admin_activities(text) from authenticated;
grant execute on function public.list_internal_admin_activities(text) to authenticated;

create or replace function public.publish_internal_admin_activity(
  p_activity_id bigint,
  p_review_notes text default null
)
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
  update public.activities
  set
    is_active = true,
    is_deleted = false,
    updated_at = now(),
    updated_by = 'admin.publish_internal_admin_activity'
  where id = p_activity_id
    and is_deleted = false
  returning
    activities.id::bigint as activity_id,
    (activities.is_active = true and activities.is_deleted = false)::boolean as is_published,
    activities.updated_at::timestamptz as activity_updated_at;

  if not found then
    raise exception 'activity % was not found or is deleted', p_activity_id;
  end if;
end;
$$;

revoke all on function public.publish_internal_admin_activity(bigint, text) from public;
revoke all on function public.publish_internal_admin_activity(bigint, text) from anon;
revoke all on function public.publish_internal_admin_activity(bigint, text) from authenticated;
grant execute on function public.publish_internal_admin_activity(bigint, text) to authenticated;

create or replace function public.unpublish_internal_admin_activity(
  p_activity_id bigint,
  p_review_notes text default null
)
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
  update public.activities
  set
    is_active = false,
    is_deleted = false,
    updated_at = now(),
    updated_by = 'admin.unpublish_internal_admin_activity'
  where id = p_activity_id
    and is_deleted = false
  returning
    activities.id::bigint as activity_id,
    (activities.is_active = true and activities.is_deleted = false)::boolean as is_published,
    activities.updated_at::timestamptz as activity_updated_at;

  if not found then
    raise exception 'activity % was not found or is deleted', p_activity_id;
  end if;
end;
$$;

revoke all on function public.unpublish_internal_admin_activity(bigint, text) from public;
revoke all on function public.unpublish_internal_admin_activity(bigint, text) from anon;
revoke all on function public.unpublish_internal_admin_activity(bigint, text) from authenticated;
grant execute on function public.unpublish_internal_admin_activity(bigint, text) to authenticated;

comment on function public.list_internal_admin_activities(text) is
  'Internal admin read model for all non-deleted activities, including unpublished rows. Casts output columns to the exact RPC contract.';

comment on function public.publish_internal_admin_activity(bigint, text) is
  'Internal admin RPC to publish a non-deleted activity by activity_id.';

comment on function public.unpublish_internal_admin_activity(bigint, text) is
  'Internal admin RPC to unpublish a non-deleted activity by activity_id.';

notify pgrst, 'reload schema';

commit;
