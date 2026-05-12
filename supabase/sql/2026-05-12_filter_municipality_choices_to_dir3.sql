-- Run this if municipality_choices_read was created before it was limited
-- to official DIR3-coded municipality rows.

begin;

create or replace view public.municipality_choices_read as
select
  id,
  name,
  slug,
  province_code,
  province_name,
  autonomous_community_code,
  autonomous_community_name,
  municipality_code,
  dir3_code,
  name_search,
  search_text
from public.cities
where
  coalesce(is_active, true) = true
  and place_type = 'municipality'
  and country_code = 'ES'
  and dir3_code is not null
  and municipality_code is not null;

grant select on public.municipality_choices_read to anon, authenticated;

commit;
