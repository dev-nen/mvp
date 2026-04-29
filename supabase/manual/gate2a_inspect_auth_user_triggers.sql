begin;

-- Gate 2A - Inspect legacy custom triggers on auth.users.
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

select
  procedures.proname,
  pg_get_functiondef(procedures.oid) as function_definition
from pg_trigger triggers
join pg_proc procedures
  on procedures.oid = triggers.tgfoid
where triggers.tgrelid = 'auth.users'::regclass
  and not triggers.tgisinternal
order by procedures.proname;

commit;
