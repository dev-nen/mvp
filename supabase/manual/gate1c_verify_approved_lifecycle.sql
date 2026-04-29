begin;

-- Gate 1C - Approved lifecycle SQL verification.
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

commit;
