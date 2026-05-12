-- Run this if the municipality schema migration was applied before
-- the DIR3 seed exposed duplicate municipality names across provinces.

begin;

-- DIR3 has repeated municipality names across provinces, so name alone cannot be unique.
alter table public.cities drop constraint if exists cities_name_uidx;
drop index if exists public.cities_name_uidx;

commit;
