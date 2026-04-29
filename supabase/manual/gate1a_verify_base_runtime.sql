begin;

-- Gate 1A - Base runtime SQL verification.
select *
from public.catalog_activities_read
limit 5;

select proname
from pg_proc
where proname in (
  'ensure_my_profile',
  'get_internal_pvi_report'
)
order by proname;

-- In the Supabase SQL Editor this may return data because the editor runs with
-- elevated privileges. Browser/anon clients must not be able to execute it.
select public.get_internal_pvi_report();

commit;
