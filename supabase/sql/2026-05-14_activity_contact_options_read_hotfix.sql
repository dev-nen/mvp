begin;

-- Production hotfix for frontend builds that already read the public-safe
-- contact contract while PostgREST still lacks it in the schema cache.
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

commit;
