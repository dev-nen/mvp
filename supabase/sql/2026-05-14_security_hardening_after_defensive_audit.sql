begin;

-- The Draft Inbox seed helper can grant internal access, so it must only be
-- callable through an admin/service-role path.
alter function public.seed_activity_draft_examples(uuid)
  set search_path = public, pg_temp;

revoke all on function public.seed_activity_draft_examples(uuid) from public;
revoke all on function public.seed_activity_draft_examples(uuid) from anon;
revoke all on function public.seed_activity_draft_examples(uuid) from authenticated;
grant execute on function public.seed_activity_draft_examples(uuid) to service_role;

-- Normalize security-definer RPC privileges. Internal RPCs stay callable by
-- authenticated clients only, and each function still enforces
-- internal_tool_access before reading or mutating internal data.
alter function public.approve_activity_draft(bigint)
  set search_path = public, pg_temp;
revoke all on function public.approve_activity_draft(bigint) from public;
revoke all on function public.approve_activity_draft(bigint) from anon;
revoke all on function public.approve_activity_draft(bigint) from authenticated;
grant execute on function public.approve_activity_draft(bigint) to authenticated;

alter function public.list_internal_approved_activity_states(bigint[])
  set search_path = public, pg_temp;
revoke all on function public.list_internal_approved_activity_states(bigint[]) from public;
revoke all on function public.list_internal_approved_activity_states(bigint[]) from anon;
revoke all on function public.list_internal_approved_activity_states(bigint[]) from authenticated;
grant execute on function public.list_internal_approved_activity_states(bigint[]) to authenticated;

alter function public.get_internal_approved_activity(bigint)
  set search_path = public, pg_temp;
revoke all on function public.get_internal_approved_activity(bigint) from public;
revoke all on function public.get_internal_approved_activity(bigint) from anon;
revoke all on function public.get_internal_approved_activity(bigint) from authenticated;
grant execute on function public.get_internal_approved_activity(bigint) to authenticated;

alter function public.update_approved_activity_from_draft(bigint, jsonb, text)
  set search_path = public, pg_temp;
revoke all on function public.update_approved_activity_from_draft(bigint, jsonb, text) from public;
revoke all on function public.update_approved_activity_from_draft(bigint, jsonb, text) from anon;
revoke all on function public.update_approved_activity_from_draft(bigint, jsonb, text) from authenticated;
grant execute on function public.update_approved_activity_from_draft(bigint, jsonb, text) to authenticated;

alter function public.unpublish_approved_activity(bigint, text)
  set search_path = public, pg_temp;
revoke all on function public.unpublish_approved_activity(bigint, text) from public;
revoke all on function public.unpublish_approved_activity(bigint, text) from anon;
revoke all on function public.unpublish_approved_activity(bigint, text) from authenticated;
grant execute on function public.unpublish_approved_activity(bigint, text) to authenticated;

alter function public.republish_approved_activity(bigint, text)
  set search_path = public, pg_temp;
revoke all on function public.republish_approved_activity(bigint, text) from public;
revoke all on function public.republish_approved_activity(bigint, text) from anon;
revoke all on function public.republish_approved_activity(bigint, text) from authenticated;
grant execute on function public.republish_approved_activity(bigint, text) to authenticated;

alter function public.get_internal_pvi_report()
  set search_path = public, pg_temp;
revoke all on function public.get_internal_pvi_report() from public;
revoke all on function public.get_internal_pvi_report() from anon;
revoke all on function public.get_internal_pvi_report() from authenticated;
grant execute on function public.get_internal_pvi_report() to service_role;

-- Public contact reads must follow the same publication boundary as the public
-- catalog: active contact option, active activity, and active center.
create or replace view public.activity_contact_options_read as
select
  activity_contact_options.id,
  activity_contact_options.activity_id,
  activity_contact_options.contact_method,
  activity_contact_options.contact_value
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
notify pgrst, 'reload schema';

create or replace function public.ensure_my_profile(
  profile_name text,
  profile_last_name text,
  profile_city_id bigint
)
returns public.user_profiles
language plpgsql
security definer
set search_path = public, pg_temp
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
      and is_active = true
      and place_type = 'municipality'
      and country_code = 'ES'
      and municipality_code is not null
      and dir3_code is not null
  ) then
    raise exception 'profile_city_id must reference an active ES municipality';
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

revoke all on function public.ensure_my_profile(text, text, bigint) from public;
revoke all on function public.ensure_my_profile(text, text, bigint) from anon;
revoke all on function public.ensure_my_profile(text, text, bigint) from authenticated;
grant execute on function public.ensure_my_profile(text, text, bigint) to authenticated;

commit;
