begin;

create or replace function public.list_activity_publication_form_options()
returns table (
  option_kind text,
  id bigint,
  name text,
  label text,
  city_id bigint,
  city_name text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'auth.uid() is required';
  end if;

  return query
  select *
  from (
    select
      'center'::text as option_kind,
      centers.id::bigint,
      centers.name::text,
      case
        when nullif(trim(coalesce(cities.name, '')), '') is null then centers.name
        else centers.name || ' (' || cities.name || ')'
      end::text as label,
      centers.city_id::bigint,
      cities.name::text as city_name
    from public.centers
    left join public.cities
      on cities.id = centers.city_id
    where centers.is_active = true
      and centers.is_deleted = false
    union all
    select
      'category'::text as option_kind,
      categories.id::bigint,
      categories.name::text,
      categories.name::text as label,
      null::bigint as city_id,
      null::text as city_name
    from public.categories
    union all
    select
      'type'::text as option_kind,
      type_activity.id::bigint,
      type_activity.name::text,
      type_activity.name::text as label,
      null::bigint as city_id,
      null::text as city_name
    from public.type_activity
  ) as options
  order by options.option_kind asc, options.label asc, options.id asc;
end;
$$;

drop function if exists public.resubmit_my_activity_draft(bigint, jsonb);

create or replace function public.resubmit_my_activity_draft(
  p_draft_id bigint,
  p_reviewed_payload jsonb,
  p_source_reference_url text default null
)
returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  draft_row public.activity_drafts;
  resolved_root_draft_id bigint;
  next_revision_number integer;
  new_draft_id bigint;
  resolved_source_reference_url text;
begin
  if auth.uid() is null then
    raise exception 'auth.uid() is required';
  end if;

  select *
  into draft_row
  from public.activity_drafts
  where id = p_draft_id
    and submitted_by_user_id = auth.uid()
    and review_status = 'needs_changes'
  for update;

  if not found then
    raise exception 'activity draft % is not available for correction', p_draft_id;
  end if;

  resolved_root_draft_id := coalesce(draft_row.root_draft_id, draft_row.id);
  resolved_source_reference_url := case
    when p_source_reference_url is null then draft_row.source_reference_url
    else nullif(trim(p_source_reference_url), '')
  end;

  select coalesce(max(revision_number), 1) + 1
  into next_revision_number
  from public.activity_drafts
  where coalesce(root_draft_id, id) = resolved_root_draft_id;

  insert into public.activity_drafts (
    source_type,
    source_label,
    source_file_path,
    source_file_name,
    source_mime_type,
    source_reference_url,
    raw_extracted_text,
    parsed_payload_json,
    reviewed_payload_json,
    confidence_score,
    review_status,
    created_by,
    submitted_by_user_id,
    parent_draft_id,
    root_draft_id,
    revision_number,
    resubmitted_at,
    resubmitted_by,
    edit_activity_id
  )
  values (
    'user_resubmission',
    draft_row.source_label,
    draft_row.source_file_path,
    draft_row.source_file_name,
    draft_row.source_mime_type,
    resolved_source_reference_url,
    draft_row.raw_extracted_text,
    draft_row.parsed_payload_json,
    coalesce(p_reviewed_payload, '{}'::jsonb),
    draft_row.confidence_score,
    'pending_review',
    auth.uid(),
    auth.uid(),
    draft_row.id,
    resolved_root_draft_id,
    next_revision_number,
    now(),
    auth.uid(),
    draft_row.edit_activity_id
  )
  returning id into new_draft_id;

  return new_draft_id;
end;
$$;

revoke all on function public.list_activity_publication_form_options() from public;
revoke all on function public.list_activity_publication_form_options() from anon;
revoke all on function public.list_activity_publication_form_options() from authenticated;
grant execute on function public.list_activity_publication_form_options() to authenticated;

revoke all on function public.resubmit_my_activity_draft(bigint, jsonb, text) from public;
revoke all on function public.resubmit_my_activity_draft(bigint, jsonb, text) from anon;
revoke all on function public.resubmit_my_activity_draft(bigint, jsonb, text) from authenticated;
grant execute on function public.resubmit_my_activity_draft(bigint, jsonb, text) to authenticated;

comment on function public.list_activity_publication_form_options() is
  'Returns sanitized center/category/type options for authenticated user publication correction and edit forms.';

comment on function public.resubmit_my_activity_draft(bigint, jsonb, text) is
  'Creates a linked pending_review correction draft for the authenticated submitter without overwriting the previous needs_changes draft.';

notify pgrst, 'reload schema';

commit;
