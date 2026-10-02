# Organizador / Publisher Request Flow Spec

Status: Implemented in repository on `feat/publisher-request-flow-phase4`.
Pending manual Supabase SQL apply and live QA.

Pack: 4.

Scope: SQL/RPC foundation, user request UI, internal Draft Inbox review tab,
and new-submission gating. No live SQL apply, deploy, public organizer
profiles, or direct publishing is included.

## Summary

NensGo should not treat every normal authenticated user as ready to publish
activities. Normal family users can use the product as families. Users who
offer activities for children or families can request to become an
Organizador. After internal approval, they can submit activity drafts.

The public product term is Organizador. The internal technical naming for this
capability is publisher.

Approving a publisher request only enables the user to submit activity drafts.
It does not publish activities directly. Activity submissions still go through
the existing Draft Inbox review flow.

## Implementation Status

Phase 4 is implemented in code and SQL migration files but remains `Partial`
until the SQL is applied manually and Supabase/RLS/UI smoke checks pass.

Implemented repository pieces:

- SQL migration:
  `supabase/sql/2026-05-30_publisher_request_flow_phase4.sql`.
- User hub: `/perfil/publicaciones`.
- User request route: `/perfil/organizador/solicitud`.
- Internal review location: `/internal/drafts`, tab label
  `Alta de Publicadores`.
- New activity route gate: `/perfil/publicaciones/nueva` requires approved
  publisher status in the frontend and is enforced server-side by an
  `activity_drafts` trigger on new user submissions.
- Existing publication history, correction, and edit-request flows remain
  available through their existing RPCs and routes where product rules allow.

No SQL has been applied live by this implementation task.

## Baseline Before Implementation

Repository behavior before Pack 4 implementation:

- Any authenticated, verified, onboarded user can open
  `/perfil/publicaciones/nueva`.
- Any such user can submit an activity draft.
- Submissions do not publish directly. They create `activity_drafts` with
  `review_status = pending_review`.
- There is no existing safe publisher or organizer lifecycle model.
- `user_profiles.role_id` exists but is not used as a publication gate and
  should not store the full organizer request lifecycle.
- `internal_tool_access` is for internal/admin tools and must not become the
  publisher model.

## Locked Product Decisions

- Visible user-facing role name: Organizador.
- Internal technical naming: publisher.
- Normal users with previous drafts are not automatically approved or
  grandfathered as publishers.
- Users with previous drafts keep access to view their existing submitted
  drafts and publication history.
- Users should not gain new submission access unless they become approved
  publishers.
- Approved publishers can submit activity drafts.
- Activity drafts still require internal review.
- No organizer form publishes directly.
- Organizer data is internal-only in v1 and is not exposed as a public
  organizer profile.
- The organizer request form should not ask for email. It should use the
  authenticated user's email and show it read-only if needed.

## User States

The publisher request lifecycle uses these states:

- `not_requested`: the user has not requested publisher access.
- `pending_review`: the user submitted a request and is waiting for internal
  review.
- `needs_changes`: internal review asked the user to correct or complete the
  request.
- `approved`: the user is allowed to submit new activity drafts.
- `rejected`: the request was rejected. The user can reapply.

## Organizer Request Fields

V1 request fields:

- `full_name`: required. Visible copy: Nombre completo.
- `organizer_type`: required. Values:
  - `individual`: visible copy Particular.
  - `company_or_entity`: visible copy Empresa, centro, club o entidad.
- `commercial_name`: required for `company_or_entity`, optional/conditional
  for `individual`. Visible copy: Nombre de la empresa, centro, club o
  actividad.
- `municipality_id` or `city_id`: required. Use the existing municipality
  source or autocomplete when implemented.
- `phone`: required.
  Visible copy: Teléfono de contacto.
- `instagram`: optional.
- `website`: optional.
- `activity_description`: required. Visible copy: Cuéntanos brevemente qué
  actividades ofreces.
- `address_line_1`: required only for company/entity organizers with a physical
  location. Do not require exact address from individual or no-company
  organizers. Visible copy: Dirección del centro o entidad, si aplica.
- Authenticated user email: sourced from the current user, not editable.
- Admin feedback and review notes: internal/admin only.

## Implemented Data Model Direction

Do not store the whole lifecycle inside `user_profiles`.

Use `publisher_requests` for the request lifecycle and submitted organizer
data. Conceptual fields:

- `id`
- `user_id`
- `review_status`
- `organizer_type`
- `full_name`
- `commercial_name`
- `city_id`
- `phone`
- `instagram`
- `website`
- `activity_description`
- `has_physical_location`
- `address_line_1`
- `user_feedback_summary`
- `user_feedback_json`
- `internal_review_notes`
- `reviewed_by`
- `reviewed_at`
- `created_at`
- `updated_at`
- `submitted_at`

Use `publisher_profiles` for active approved publisher state. Conceptual
fields:

- `id`
- `user_id`
- `publisher_request_id`
- `status` or `is_active`
- `organizer_type`
- `full_name`
- `commercial_name`
- `city_id`
- `phone`
- `instagram`
- `website`
- `activity_description`
- `has_physical_location`
- `address_line_1`
- `approved_at`
- `approved_by`
- `created_at`
- `updated_at`

Rationale:

- Keeps family user profile data simple.
- Avoids overloading `user_profiles`.
- Separates request lifecycle from active approved publisher state.
- Gives publication gating a single approved publisher state to check.

Implementation choices:

- Municipality uses `city_id` against active ES municipalities.
- Address is required only when the request declares a physical location.
- Resubmission creates a new `pending_review` row linked by
  `supersedes_request_id`; rejected users can reapply.

## Implemented RPC Direction

User-side RPCs:

- `get_my_publisher_status()`
- `submit_my_publisher_request(payload jsonb)`
- `resubmit_my_publisher_request(request_id, payload jsonb)`

Internal/admin RPCs:

- `list_internal_publisher_requests(status)`
- `get_internal_publisher_request(request_id)`
- `request_internal_publisher_changes(request_id, feedback, notes)`
- `reject_internal_publisher_request(request_id, feedback, notes)`
- `approve_internal_publisher_request(request_id, notes)`

Publication gating:

- `create_my_activity_submission` inserts are gated server-side by
  `activity_drafts_require_approved_publisher_for_submission`.
- The gate applies only to new first-version user submissions.
- Preserve access to historical user drafts.
- Frontend gating alone is not enough; server/RPC enforcement is required.

## Route And Surface Model

Keep `/perfil/publicaciones` as the user publication hub.

Expected behavior:

- Normal user: shows an invitation to become Organizador.
- `pending_review`: shows request status.
- `needs_changes`: shows feedback and a correction action.
- `rejected`: shows feedback and a reapply option.
- Approved publisher: shows the publication panel/list and Enviar actividad.

Add `/perfil/organizador/solicitud` for the user request form.

Internal review for v1 lives inside the existing Draft Inbox area:

- Route: `/internal/drafts`
- Tabs:
  - Actividades
  - Alta de Publicadores

The internal tab label must be exactly: Alta de Publicadores.

This tab receives requests from existing users who want to change their user
level/type so they can publish activity drafts. These are not manual
admin-created publishers.

Recommended tab copy:

- Title: Solicitudes de alta de publicadores
- Description: Revisa las solicitudes de usuarios que quieren publicar
  actividades en NensGo.

Internal review actions:

- Aprobar
- Pedir cambios
- Rechazar

Statuses shown in the internal tab:

- `pending_review`
- `needs_changes`
- `approved`
- `rejected`

## Backward Compatibility

- Users with previous drafts are not automatically organizers.
- Previous drafts remain visible to the submitting user.
- Correction of existing drafts should remain possible where product rules
  allow.
- New activity submission should become gated only after the publisher request
  and review path exists.
- Existing internal activity draft review should continue to work.

## Security And Privacy

- Organizer request data contains PII and contact data.
- Request data must be private to the requesting user and internal reviewers.
- The public catalog must not expose publisher profile data in v1.
- Do not introduce broad grants.
- Do not add direct unaudited user role escalation.
- Do not rely only on frontend gates.
- Server/RPC logic must enforce approved publisher status before allowing new
  activity submissions.
- `internal_tool_access` remains the internal/admin access mechanism and is not
  the publisher lifecycle model.

## Implementation Phases

The phase implementation below is confirmed in repository code only. SQL apply
and live QA remain pending.

### 4A — Spec/docs only

- Status: Done.
- Created this specification.

### 4B — SQL/RPC foundation

- Add `publisher_requests`.
- Add `publisher_profiles`.
- Add RLS and grants.
- Add user-side and internal/admin RPCs.
- Avoid UI gating unless it is safe and the request/review path exists.
- Status: Confirmed in code. Pending SQL apply and live QA.

### 4C — User request UI

- Add the invitation on `/perfil/publicaciones`.
- Add `/perfil/organizador/solicitud`.
- Add status states for pending, needs changes, approved, and rejected.
- Status: Confirmed in code. Pending SQL apply and live QA.

### 4D — Internal review UI

- Add the Alta de Publicadores tab inside `/internal/drafts`.
- Add internal request list/detail review.
- Support Aprobar, Pedir cambios, and Rechazar.
- Status: Confirmed in code. Pending SQL apply and live QA.

### 4E — Gate new activity submission

- Require approved publisher status for `/perfil/publicaciones/nueva`.
- Enforce approved publisher status in `create_my_activity_submission`.
- Keep historical drafts visible.
- Preserve correction access where product rules allow.
- Status: Confirmed in code. Pending SQL apply and live QA.

### 4F — Smoke/hardening

- Smoke RLS and RPC permissions.
- Smoke publisher status transitions.
- Smoke existing draft access.
- Smoke UI states.
- Update QA handoff.
- Status: Pending QA.

## Deferred Questions

- Should an approved publisher later appear publicly as an organizer profile?
- Should approved publisher data become editable through a self-service profile
  flow?
- Should `needs_changes` feedback become fully field-level in the public form?
- Exact final Catalan and English copy for all request/status states.

## Out Of Scope For Phase 4 Implementation

- SQL live apply.
- Deployment.
- Direct publishing by organizers.
- Public organizer profiles.
- Contact option model changes beyond existing draft payload support.
- Day/date/schedule model changes.
- Conócenos content.
- FAQ.
- Report problem form.
- Mobile polish and broader copy audit.
