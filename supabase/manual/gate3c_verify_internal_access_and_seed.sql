begin;

-- Gate 3C - Verify internal access and seeded drafts.
-- Replace <USER_UUID> before running.
select user_id, tool_name, created_at
from public.internal_tool_access
where user_id = '<USER_UUID>'::uuid;

select
  id,
  review_status,
  coalesce(
    reviewed_payload_json #>> '{activity,title}',
    parsed_payload_json #>> '{activity,title}'
  ) as activity_title,
  created_by,
  approved_activity_id,
  created_at
from public.activity_drafts
where created_by = '<USER_UUID>'::uuid
order by created_at desc
limit 20;

commit;
