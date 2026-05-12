begin;

do $$
declare
  current_sequence text;
  next_value bigint;
begin
  select pg_get_serial_sequence('public.cities', 'id')
  into current_sequence;

  if current_sequence is null then
    current_sequence := 'public.cities_id_seq';

    execute format('create sequence if not exists %s', current_sequence);
    execute format('alter sequence %s owned by public.cities.id', current_sequence);
    execute format(
      'alter table public.cities alter column id set default nextval(%L)',
      current_sequence
    );
  end if;

  select greatest(coalesce(max(id), 0) + 1, 1)
  into next_value
  from public.cities;

  perform setval(current_sequence::regclass, next_value, false);
end;
$$;

alter table public.cities
  add column if not exists slug text,
  add column if not exists country_code text,
  add column if not exists province_code text,
  add column if not exists province_name text,
  add column if not exists autonomous_community_code text,
  add column if not exists autonomous_community_name text,
  add column if not exists municipality_code text,
  add column if not exists dir3_code text,
  add column if not exists source_name text,
  add column if not exists source_file text,
  add column if not exists name_search text,
  add column if not exists search_text text,
  add column if not exists place_type text,
  add column if not exists is_active boolean,
  add column if not exists updated_at timestamptz;

update public.cities
set
  country_code = coalesce(country_code, 'ES'),
  place_type = coalesce(place_type, 'municipality'),
  is_active = coalesce(is_active, true),
  updated_at = coalesce(updated_at, now())
where
  country_code is null
  or place_type is null
  or is_active is null
  or updated_at is null;

alter table public.cities
  alter column country_code set default 'ES',
  alter column place_type set default 'municipality',
  alter column is_active set default true,
  alter column updated_at set default now();

-- DIR3 has repeated municipality names across provinces, so name alone cannot be unique.
alter table public.cities drop constraint if exists cities_name_uidx;
drop index if exists public.cities_name_uidx;

create unique index if not exists cities_dir3_code_unique_idx
  on public.cities (dir3_code)
  where dir3_code is not null;

create unique index if not exists cities_municipality_code_unique_idx
  on public.cities (municipality_code)
  where municipality_code is not null;

create index if not exists cities_name_search_idx
  on public.cities (name_search);

create index if not exists cities_search_text_idx
  on public.cities (search_text);

create index if not exists cities_place_type_active_idx
  on public.cities (place_type, is_active);

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
grant select on public.cities to anon, authenticated;

alter table public.cities enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'cities'
      and policyname = 'cities_select_active_municipalities'
  ) then
    create policy cities_select_active_municipalities
      on public.cities
      for select
      to anon, authenticated
      using (
        coalesce(is_active, true) = true
        and coalesce(place_type, 'municipality') = 'municipality'
      );
  end if;
end;
$$;

commit;
