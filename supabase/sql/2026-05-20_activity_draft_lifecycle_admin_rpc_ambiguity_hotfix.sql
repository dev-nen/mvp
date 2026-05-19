begin;

create or replace function public.request_activity_draft_changes(
  p_draft_id bigint,
  p_reviewed_payload jsonb default null,
  p_user_feedback_summary text default null,
  p_user_feedback_json jsonb default '[]'::jsonb,
  p_internal_review_notes text default null
)
returns table (
  draft_id bigint,
  review_status text,
  user_feedback_summary text,
  user_feedback_json jsonb,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  normalized_user_feedback_summary text := nullif(trim(coalesce(p_user_feedback_summary, '')), '');
  normalized_internal_review_notes text := nullif(trim(coalesce(p_internal_review_notes, '')), '');
  normalized_user_feedback_json jsonb := coalesce(p_user_feedback_json, '[]'::jsonb);
begin
  if auth.uid() is null then
    raise exception 'auth.uid() is required';
  end if;

  if jsonb_typeof(normalized_user_feedback_json) <> 'array' then
    raise exception 'user feedback must be an array';
  end if;

  if not exists (
    select 1
    from public.internal_tool_access
    where user_id = auth.uid()
      and tool_name = 'draft_inbox'
  ) then
    raise exception 'internal draft inbox access is required';
  end if;

  return query
  update public.activity_drafts as drafts
  set
    reviewed_payload_json = coalesce(p_reviewed_payload, drafts.reviewed_payload_json),
    review_status = 'needs_changes',
    user_feedback_summary = normalized_user_feedback_summary,
    user_feedback_json = normalized_user_feedback_json,
    internal_review_notes = normalized_internal_review_notes,
    reviewed_by = auth.uid(),
    updated_at = now()
  where drafts.id = p_draft_id
    and drafts.review_status = 'pending_review'
    and drafts.approved_activity_id is null
  returning
    drafts.id::bigint,
    drafts.review_status::text,
    drafts.user_feedback_summary::text,
    drafts.user_feedback_json::jsonb,
    drafts.updated_at::timestamptz;

  if not found then
    raise exception 'pending activity draft % was not found', p_draft_id;
  end if;
end;
$$;

create or replace function public.reject_activity_draft_with_feedback(
  p_draft_id bigint,
  p_reviewed_payload jsonb default null,
  p_user_feedback_summary text default null,
  p_user_feedback_json jsonb default '[]'::jsonb,
  p_internal_review_notes text default null
)
returns table (
  draft_id bigint,
  review_status text,
  user_feedback_summary text,
  user_feedback_json jsonb,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  normalized_user_feedback_summary text := nullif(trim(coalesce(p_user_feedback_summary, '')), '');
  normalized_internal_review_notes text := nullif(trim(coalesce(p_internal_review_notes, '')), '');
  normalized_user_feedback_json jsonb := coalesce(p_user_feedback_json, '[]'::jsonb);
begin
  if auth.uid() is null then
    raise exception 'auth.uid() is required';
  end if;

  if jsonb_typeof(normalized_user_feedback_json) <> 'array' then
    raise exception 'user feedback must be an array';
  end if;

  if not exists (
    select 1
    from public.internal_tool_access
    where user_id = auth.uid()
      and tool_name = 'draft_inbox'
  ) then
    raise exception 'internal draft inbox access is required';
  end if;

  return query
  update public.activity_drafts as drafts
  set
    reviewed_payload_json = coalesce(p_reviewed_payload, drafts.reviewed_payload_json),
    review_status = 'rejected',
    user_feedback_summary = normalized_user_feedback_summary,
    user_feedback_json = normalized_user_feedback_json,
    internal_review_notes = normalized_internal_review_notes,
    reviewed_by = auth.uid(),
    updated_at = now()
  where drafts.id = p_draft_id
    and drafts.review_status = 'pending_review'
    and drafts.approved_activity_id is null
  returning
    drafts.id::bigint,
    drafts.review_status::text,
    drafts.user_feedback_summary::text,
    drafts.user_feedback_json::jsonb,
    drafts.updated_at::timestamptz;

  if not found then
    raise exception 'pending activity draft % was not found', p_draft_id;
  end if;
end;
$$;

create or replace function public.archive_activity_draft(
  p_draft_id bigint,
  p_internal_review_notes text default null
)
returns table (
  draft_id bigint,
  review_status text,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  normalized_internal_review_notes text := nullif(trim(coalesce(p_internal_review_notes, '')), '');
begin
  if auth.uid() is null then
    raise exception 'auth.uid() is required';
  end if;

  if not exists (
    select 1
    from public.internal_tool_access
    where user_id = auth.uid()
      and tool_name = 'draft_inbox'
  ) then
    raise exception 'internal draft inbox access is required';
  end if;

  return query
  update public.activity_drafts as drafts
  set
    review_status = 'archived',
    internal_review_notes = coalesce(normalized_internal_review_notes, drafts.internal_review_notes),
    reviewed_by = coalesce(drafts.reviewed_by, auth.uid()),
    updated_at = now()
  where drafts.id = p_draft_id
    and drafts.review_status in ('pending_review', 'needs_changes', 'rejected')
    and drafts.approved_activity_id is null
  returning
    drafts.id::bigint,
    drafts.review_status::text,
    drafts.updated_at::timestamptz;

  if not found then
    raise exception 'activity draft % cannot be archived in this phase', p_draft_id;
  end if;
end;
$$;

revoke all on function public.request_activity_draft_changes(bigint, jsonb, text, jsonb, text) from public;
revoke all on function public.request_activity_draft_changes(bigint, jsonb, text, jsonb, text) from anon;
revoke all on function public.request_activity_draft_changes(bigint, jsonb, text, jsonb, text) from authenticated;
grant execute on function public.request_activity_draft_changes(bigint, jsonb, text, jsonb, text) to authenticated;

revoke all on function public.reject_activity_draft_with_feedback(bigint, jsonb, text, jsonb, text) from public;
revoke all on function public.reject_activity_draft_with_feedback(bigint, jsonb, text, jsonb, text) from anon;
revoke all on function public.reject_activity_draft_with_feedback(bigint, jsonb, text, jsonb, text) from authenticated;
grant execute on function public.reject_activity_draft_with_feedback(bigint, jsonb, text, jsonb, text) to authenticated;

revoke all on function public.archive_activity_draft(bigint, text) from public;
revoke all on function public.archive_activity_draft(bigint, text) from anon;
revoke all on function public.archive_activity_draft(bigint, text) from authenticated;
grant execute on function public.archive_activity_draft(bigint, text) to authenticated;

comment on function public.request_activity_draft_changes(bigint, jsonb, text, jsonb, text) is
  'Internal Phase 2 RPC to mark a pending draft as needs_changes with separated public feedback and internal notes.';

comment on function public.reject_activity_draft_with_feedback(bigint, jsonb, text, jsonb, text) is
  'Internal Phase 2 RPC to strongly reject/no aprobar a pending draft with separated public feedback and internal notes.';

comment on function public.archive_activity_draft(bigint, text) is
  'Internal Phase 2 RPC to archive a non-approved draft from the daily queue without deleting history.';

notify pgrst, 'reload schema';

commit;
