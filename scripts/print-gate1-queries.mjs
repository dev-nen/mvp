const gate1Queries = String.raw`
-- Gate 1A - Base runtime SQL verification
select * from public.catalog_activities_read limit 5;

select proname
from pg_proc
where proname in (
  'ensure_my_profile',
  'get_internal_pvi_report'
)
order by proname;

select public.get_internal_pvi_report();

-- Expected direct anon behavior after updated SQL:
-- Supabase browser/anon clients should NOT be able to execute
-- get_internal_pvi_report directly. The Vercel API uses service_role.

-- Gate 1B - Draft Inbox SQL verification
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('activity_drafts', 'internal_tool_access')
order by table_name;

select proname
from pg_proc
where proname in (
  'approve_activity_draft',
  'seed_activity_draft_examples'
)
order by proname;

-- Gate 1C - Approved lifecycle SQL verification
select proname
from pg_proc
where proname in (
  'list_internal_approved_activity_states',
  'get_internal_approved_activity',
  'update_approved_activity_from_draft',
  'unpublish_approved_activity',
  'republish_approved_activity'
)
order by proname;
`;

console.log(gate1Queries.trim());
