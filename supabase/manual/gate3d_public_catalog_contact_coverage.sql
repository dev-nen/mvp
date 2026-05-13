begin;

-- Gate 3D - Public catalog/contact coverage for smoke planning.
with public_catalog as (
  select id, title, image_url
  from public.catalog_activities_read
),
active_contacts as (
  select activity_id, count(*) as active_contact_count
  from public.activity_contact_options_read
  group by activity_id
)
select
  public_catalog.id,
  public_catalog.title,
  public_catalog.image_url is not null as has_image,
  coalesce(active_contacts.active_contact_count, 0) as active_contact_count
from public_catalog
left join active_contacts
  on active_contacts.activity_id = public_catalog.id
order by active_contact_count asc, public_catalog.id asc;

commit;
