begin;

-- Gate 3A - Find the app user profile id for the internal tester.
-- Replace <USER_EMAIL> before running.
select id, email, name, last_name, city_id, created_at
from public.user_profiles
where lower(email) = lower('<USER_EMAIL>')
limit 5;

commit;
