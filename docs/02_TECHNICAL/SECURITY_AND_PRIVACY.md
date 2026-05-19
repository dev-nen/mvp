# Security and Privacy

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
- `/api/internal/pvi` bearer token y noindex headers.
