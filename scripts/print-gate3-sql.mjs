import { getArgValue } from "./runtime-script-utils.mjs";

function sqlLiteral(value) {
  return String(value).replaceAll("'", "''");
}

const userId = sqlLiteral(getArgValue("user-id") || "<USER_UUID>");
const userEmail = sqlLiteral(getArgValue("email") || "<USER_EMAIL>");

const sql = String.raw`
-- Gate 3 - Inspect recent app users
select id, email, name, last_name, city_id, created_at
from public.user_profiles
order by created_at desc
limit 20;

-- Gate 3 - Find one app user by email
select id, email, name, last_name, city_id, created_at
from public.user_profiles
where lower(email) = lower('${userEmail}')
limit 5;

-- Gate 3 - Authorize one internal Draft Inbox user
insert into public.internal_tool_access (user_id, tool_name)
values ('${userId}'::uuid, 'draft_inbox')
on conflict (user_id) do update
set tool_name = excluded.tool_name;

-- Gate 3 - Seed Draft Inbox examples for that internal user
select public.seed_activity_draft_examples('${userId}'::uuid);

-- Gate 3 - Verify internal access and seeded drafts
select user_id, tool_name, created_at
from public.internal_tool_access
where user_id = '${userId}'::uuid;

select id, review_status, title, created_by, approved_activity_id, created_at
from public.activity_drafts
where created_by = '${userId}'::uuid
order by created_at desc
limit 20;

-- Gate 3 - Public catalog/contact coverage for smoke planning
with public_catalog as (
  select id, title, image_url
  from public.catalog_activities_read
),
active_contacts as (
  select activity_id, count(*) as active_contact_count
  from public.activity_contact_options
  where is_active = true
    and is_deleted = false
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
`;

console.log(sql.trim());
