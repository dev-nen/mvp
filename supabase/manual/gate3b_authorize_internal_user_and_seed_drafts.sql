begin;

-- Gate 3B - Authorize one internal Draft Inbox user and seed draft examples.
-- Replace <USER_UUID> before running.
insert into public.internal_tool_access (user_id, tool_name)
values ('<USER_UUID>'::uuid, 'draft_inbox')
on conflict (user_id) do update
set tool_name = excluded.tool_name;

select public.seed_activity_draft_examples('<USER_UUID>'::uuid);

commit;
