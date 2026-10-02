# Security and Privacy

## Frontera vigente: mantenimiento (octubre de 2026)

Estado: **Partial**. Los cambios están versionados en
`supabase/sql/2026-10-02_maintenance_admin.sql`; no se han aplicado ni validado
en producción en esta transición.

- El público usa lecturas anónimas de catálogo y contactos. La app activa no
  solicita cuentas, favoritos, perfiles ni escrituras de eventos.
- Ambas administradoras previas se provisionan explícitamente en
  `maintenance_operator`. `is_maintenance_operator` exige además su permiso
  existente `internal_tool_access.tool_name = 'draft_inbox'`. La allowlist no
  es singleton ni incorpora automáticamente otras cuentas.
- RLS restrictiva, guards en RPCs internas y políticas de Storage restringen el
  mantenimiento a las cuentas permitidas. Las RPCs de importación y alta de
  centros comprueban autorización; las altas tienen confirmación humana.
- Se revocan accesos a flujos públicos de perfil, favoritos, eventos y publishers
  retirados. Los registros se conservan. Ocultar controles de la UI no sustituye
  aplicar la migración ni deshabilitar altas en Supabase Auth.
- La API de respaldo valida el bearer con `auth.getUser` y ejecuta el RPC de
  permiso con esa identidad. Sólo producción y el dominio canónico pueden
  solicitar el deploy. No devuelve el hook ni usa `service_role`.
- `PUBLIC_CATALOG_DEPLOY_HOOK` es un secreto sólo de servidor. Nunca usar prefijo
  `VITE_`, incluirlo en código cliente, logs o capturas.
- La copia permite exclusivamente datos de las vistas públicas y sus imágenes;
  excluye cuentas, borradores, notas internas y secretos.
- El nombre opcional para WhatsApp/correo sólo vive en el estado del diálogo y se
  descarta al cerrar/cambiar actividad. No se guarda ni se registra como evento.

La retención de datos históricos y los textos legales se revisan al terminar
el proyecto. No se declara cumplimiento legal definitivo. El
[runbook](../03_OPERATIONS/MAINTENANCE_RUNBOOK.md) detalla provisión de ambas
cuentas, configuración y comprobaciones externas.

El resto del documento conserva la **referencia histórica** anterior:
permisos de usuarios/centros, PVI y eventos no son el contrato de mantenimiento.

## Referencia anterior (histórica)

## Security model


La seguridad real del sistema debe vivir en Supabase y en APIs server-side, no en el frontend.

- Frontend gating: UX y reducción de llamadas innecesarias.
- Supabase RLS/grants/RPC checks: frontera de seguridad.
- Vercel serverless: frontera para operaciones con `service_role`.

## Auth

- Supabase Auth gestiona identidad.
- Google OAuth y email/password están implementados.
- Email verification forma parte del flujo.
- `user_profiles` representa el usuario app.

Pendiente: validación live de proveedores, redirects y verification.

## RLS and data access

Expectativas:

- anon lee sólo read models públicos.
- authenticated lee/escribe sólo datos propios donde aplica.
- internal requiere `internal_tool_access`.
- `service_role` sólo se usa server-side.
- RPCs internas verifican `auth.uid()` y permiso interno.
- El alta manual interna crea `activity_drafts`; no escribe directo en `activities` desde el formulario.
- Las subidas de portada internas usan Storage con usuario autenticado y permiso `internal_tool_access`; no exponen `service_role`.

Validar en live antes de considerar cerrado.

## Phase 2 Core publication security

- User publication operations use security-definer RPCs with explicit
  `auth.uid()` ownership checks. Frontend guards are UX only.
- `review_notes` and `internal_review_notes` are internal-only. Normal-user
  RPCs may return only `user_feedback_summary`, `user_feedback_json`, status,
  and sanitized publication/draft fields.
- `unpublish_my_activity` must enforce `activities.owner_user_id = auth.uid()`
  server-side. Users cannot republish directly.
- User correction and edit flows create new `pending_review` drafts and do not
  overwrite old drafts or update live activities directly.
- Admin lifecycle RPCs continue to enforce `internal_tool_access`.
- `source_reference_url` remains draft traceability/correction support and is
  not added to the public activity catalog model in Phase 2 Core.

## Phase 3 Core submission security

- `create_my_activity_submission` is the only Phase 3 normal-user write path.
- The RPC requires `auth.uid()`, runs as `security definer`, and creates only
  the caller's `activity_drafts` row.
- Normal users do not insert/update `public.activities`, publish directly,
  approve, reject, archive, republish, create centers, create contact options,
  or upload images in Phase 3.
- `/perfil/publicaciones/nueva` is protected by `ProtectedRoute`, but the SQL
  RPC remains the security boundary.
- `source_reference_url` is optional draft traceability only and is not public
  catalog data.

## Phase 4 Publisher / Organizador security

- Normal family users are not publishers by default.
- Publisher capability is represented by `publisher_profiles.is_active = true`,
  not by `user_profiles.role_id` or `internal_tool_access`.
- `publisher_requests` and `publisher_profiles` contain private organizer PII
  and contact data. Client roles have no direct table access. Normal users
  read only their own safe fields through `get_my_publisher_status`; internal
  reviewers use the permission-checked internal RPCs. RLS remains enabled.
- User mutations go through `submit_my_publisher_request` and
  `resubmit_my_publisher_request`; they do not create publisher profiles.
- Internal request review RPCs require
  `internal_tool_access.tool_name = 'draft_inbox'`.
- Approving a request creates or updates the active publisher profile. It does
  not approve or publish activities.
- New activity submissions require an active publisher profile server-side.
  Frontend route gating is UX only.
- Existing draft history, corrections and edit requests remain available
  through their existing owner-checked RPCs where product rules allow.

The 2026-09-18 hardening removes the original table-wide SELECT grants and
qualifies review RPC column references to avoid PL/pgSQL output-parameter
ambiguity. Fresh installs use the corrected Phase 4 foundation; existing
installs use `2026-09-18_publisher_request_review_hardening.sql`. Local SQL
regression coverage is available through `npm.cmd run check:publisher-sql`;
it does not replace live Supabase/UI validation.

## Phase 4 Core contact security

- Normal users may submit contact options only inside `activity_drafts`
  payloads. They must not write directly to `activity_contact_options`.
- Contact options become public only when an internal reviewer approves or
  updates an approved activity through the internal lifecycle RPCs.
- `activity_contact_options_read` remains the public read boundary and must
  continue filtering inactive/deleted activities, centers and options.
- `source_reference_url` remains traceability only and must not be treated as a
  contact option.
- Instagram values are normalized and validated as real Instagram profile URLs;
  unsafe protocols such as `javascript:` and `data:` are rejected before
  publication.

## Public read models

- `catalog_activities_read`: catálogo público.
- `activity_contact_options_read`: contacto público filtrado por visibilidad de actividad/centro.
- `municipality_choices_read`: municipios activos para onboarding.

Raw tables sensibles, como `activity_contact_options`, no deben quedar expuestas al cliente público.

## Service role

`SUPABASE_SERVICE_ROLE_KEY`:

- no debe estar en `src/`;
- no debe exponerse con prefijo `VITE_`;
- no debe aparecer en logs de cliente;
- sólo debe existir como secreto server-side, por ejemplo en Vercel;
- se usa para `/api/internal/pvi` y operaciones server-only.

## Data categories

| Categoría | Ejemplos | Nota |
| --- | --- | --- |
| Identidad auth | email, provider, Supabase user id | Gestionado por Supabase Auth. |
| Perfil app | nombre, apellido, municipio | `user_profiles`; no exponer UUIDs. |
| Favoritos | activity ids del usuario | Datos de usuario autenticado. |
| Contact events | actividad, método, target snapshot | Producto/analytics; revisar privacidad. |
| Internal access | permisos internos | No debe exponerse públicamente. |

## Google OAuth trust pages

Las rutas `/privacidad` y `/terminos` existen y usan canonical `https://nensgo.com`. Sirven como páginas públicas de confianza/OAuth. No sustituyen revisión legal.

## Qué no exponer

- Supabase UUIDs al usuario final.
- Errores técnicos crudos.
- RPCs internas como API pública.
- `SUPABASE_SERVICE_ROLE_KEY`.
- `INTERNAL_PVI_API_TOKEN`.
- Raw contact table.
- HTML crudo o Markdown con HTML habilitado en descripciones.
- Imágenes base64 en `activity_drafts` o `activities`.
- Reporting interno en rutas públicas.
- Publisher request PII or internal review notes in public catalog/profile UI.

## Defensive audit items

El hardening del 2026-05-14 documenta:

- revokes/grants explícitos para RPCs sensibles;
- seed helper sólo `service_role`;
- `activity_contact_options_read` como vista pública segura;
- validación de municipio en `ensure_my_profile`;
- wrappers seguros para `localStorage`/`sessionStorage`;
- rutas internas protegidas antes de montar páginas.

Estado: implementado en repo, pendiente de aplicación/validación live donde corresponda.

## Phase 2 Core non-exposure rules

- Do not expose internal notes in `/perfil/publicaciones` or child routes.
- Do not expose raw Supabase UUIDs to normal users.
- Do not add normal-user direct publish, republish, approve, archive, or
  cross-user management actions.
- Do not rely on frontend-only checks for owner or internal permissions.

## Pending live validations

- RLS anon/auth/internal.
- RPC permissions.
- Auth redirects.
- Contact read view.
- Profile provisioning.
- Internal Draft Inbox access.
- Internal admin activity catalog RPCs: internal authorized smoke passed; anon/non-internal denial checks still pending.
- Phase 2 Core SQL/RPCs: pending manual apply and live smoke. Validate
  owner-only reads, owner-only despublicar, admin-only lifecycle actions,
  internal note non-leakage, and negative anon/non-owner/non-internal calls.
- Phase 3 Core SQL/RPC: pending manual apply and live smoke. Validate
  authenticated-only draft creation, draft-only writes, `source_type =
  'user_submission'`, and no direct `public.activities` write.
- Phase 4 Publisher SQL/RPC: pending manual apply and live smoke. Validate
  own-only request/profile reads, normal-user request submit/resubmit, internal
  Draft Inbox approval, active profile creation, non-approved submission
  denial, approved publisher draft creation, and historical draft visibility.
- Phase 4 Core SQL/RPC: pending manual apply and live smoke. Validate contact
  option draft storage, admin approval publication, Instagram normalization,
  and no normal-user direct writes to `activity_contact_options`.
- `/api/internal/pvi` bearer token y noindex headers.
