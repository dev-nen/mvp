begin;

-- The current runtime creates app profiles only after verified users complete
-- onboarding through public.ensure_my_profile(...). A legacy auth.users insert
-- trigger can break Supabase Auth signup because public.user_profiles now
-- requires app-specific fields such as city_id and role_id.
drop trigger if exists on_auth_user_created on auth.users;

-- Keep the existing update sync trigger, if present. It is not part of signup
-- profile provisioning and should be assessed separately before changing it.

select
  triggers.tgname,
  triggers.tgenabled,
  pg_get_triggerdef(triggers.oid) as trigger_definition,
  procedures.proname as function_name
from pg_trigger triggers
join pg_proc procedures
  on procedures.oid = triggers.tgfoid
where triggers.tgrelid = 'auth.users'::regclass
  and not triggers.tgisinternal
order by triggers.tgname;

commit;
