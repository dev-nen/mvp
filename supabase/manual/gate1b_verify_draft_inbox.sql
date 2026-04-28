begin;

-- Gate 1B - Draft Inbox SQL verification.
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

commit;
