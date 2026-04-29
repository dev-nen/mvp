begin;

-- Replace before running:
--   <DRAFT_ID>
--   <APPROVED_ACTIVITY_ID>

select
  id,
  review_status,
  coalesce(
    reviewed_payload_json #>> '{activity,title}',
    parsed_payload_json #>> '{activity,title}'
  ) as activity_title,
  approved_activity_id,
  updated_at
from public.activity_drafts
where id = <DRAFT_ID>;

select
  id,
  title,
  is_active,
  is_deleted,
  updated_at
from public.activities
where id = <APPROVED_ACTIVITY_ID>;

select
  id,
  title,
  city_id,
  category_label
from public.catalog_activities_read
where id = <APPROVED_ACTIVITY_ID>;

commit;
