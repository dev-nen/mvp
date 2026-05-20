# Supabase Model

## Scope

Este documento resume los recursos Supabase relevantes para la revisión técnica. No sustituye una inspección live del proyecto Supabase.

Estado general: `Partial`. Hay SQL versionado en `supabase/sql`; Phase 1 del catálogo interno de actividades tiene smoke live para usuario interno autorizado, pero RLS/grants/datos/RPCs amplios deben seguir validándose en el entorno live.

## Access table

| Resource                                 | Purpose                               | Public/Auth/Internal             | Notes                                                          |
| ---------------------------------------- | ------------------------------------- | -------------------------------- | -------------------------------------------------------------- |
| `catalog_activities_read`                | Read model del catálogo público       | Public                           | Debe exponer sólo actividades publicables/activas.             |
| `activities`                             | Actividades base                      | Internal/write controlled        | Fuente interna; no debe exponerse como contrato público crudo. |
| `centers`                                | Centros/responsables                  | Internal/read model source       | Participa en vistas públicas.                                  |
| `cities`                                 | Municipios/ciudades                   | Public/Auth read parcial         | Usado por catálogo y onboarding; contiene metadata DIR3.       |
| `municipality_choices_read`              | Búsqueda pública de municipios        | Public/Auth                      | Read model preferido para onboarding.                          |
| `user_profiles`                          | Perfil app por usuario auth           | Auth                             | Verdad app; no mostrar UUIDs al usuario.                       |
| `user_favorite_activities`               | Favoritos remotos                     | Auth                             | Debe quedar limitado al usuario propietario por RLS.           |
| `activity_contact_options`               | Contactos por actividad               | Internal                         | Raw table no debe ser public read.                             |
| `activity_contact_options_read`          | Contactos públicos seguros            | Public/Auth                      | Sólo opciones activas para actividades/centros activos.        |
| `activity_view_events`                   | Eventos de vista                      | Auth/Public write según política | Debe validar payload y no exponer reporting crudo.             |
| `activity_contact_events`                | Eventos de contacto                   | Auth/Public write según política | Guarda método/target snapshot.                                 |
| `activity_drafts`                        | Draft Inbox interno                   | Internal                         | Requiere `internal_tool_access`; admite creación manual interna como draft. |
| `internal_tool_access`                   | Autorización de herramientas internas | Internal/Auth self-check         | No sustituye RLS/RPC checks.                                   |
| `ensure_my_profile`                      | Provisioning de perfil app            | Auth RPC                         | Debe validar municipio ES DIR3 activo.                         |
| `approve_activity_draft`                 | Publicación desde draft               | Internal RPC                     | Authenticated + check interno.                                 |
| `list_internal_admin_activities`         | Catálogo interno completo             | Internal RPC                     | Lista actividades no eliminadas, incluidas despublicadas.      |
| `publish_internal_admin_activity`        | Republicar actividad por id           | Internal RPC                     | Toggle seguro por `activity_id`; no cambia drafts.             |
| `unpublish_internal_admin_activity`      | Despublicar actividad por id          | Internal RPC                     | Toggle seguro por `activity_id`; no cambia drafts.             |
| `list_internal_approved_activity_states` | Estados internos de actividades       | Internal RPC                     | Para lifecycle interno.                                        |
| `get_internal_approved_activity`         | Read interno de actividad aprobada    | Internal RPC                     | Para pantalla interna.                                         |
| `update_approved_activity_from_draft`    | Edición interna                       | Internal RPC                     | Phase 4 publica contactos cuando el payload revisado los incluye. |
| `unpublish_approved_activity`            | Despublicar actividad                 | Internal RPC                     | Debe validarse contra catálogo público.                        |
| `republish_approved_activity`            | Republicar actividad                  | Internal RPC                     | Debe validarse contra catálogo público.                        |
| `get_internal_pvi_report`                | Reporting interno                     | Service role                     | Sólo vía `/api/internal/pvi`.                                  |

### Phase 2 Core resources

Phase 2 Core adds or redefines these repo-level Supabase contracts. They remain
`Partial` until the migration is applied manually and live RLS/RPC smoke checks
pass.

| Resource | Purpose | Access | Notes |
| --- | --- | --- | --- |
| `activity_drafts.submitted_by_user_id` | Owner of user-submitted draft | Auth/Internal via RPC | Nullable; users only access own records through sanitized RPCs. |
| `activity_drafts.parent_draft_id` / `root_draft_id` / `revision_number` | Linked resubmission/versioning | Auth/Internal via RPC | Corrections create a new draft; old draft is preserved. |
| `activity_drafts.user_feedback_summary` | User-visible feedback summary | Auth/Internal via RPC | Spanish public feedback; not internal notes. |
| `activity_drafts.user_feedback_json` | Field-level correction feedback | Auth/Internal via RPC | JSON array for form highlights. |
| `activity_drafts.internal_review_notes` | Admin-only review notes | Internal only | Must never be returned by normal-user RPCs. |
| `activities.owner_user_id` | Responsible app user for activity | Auth/Internal via RPC | Nullable; `null` means no normal-user management. |
| `request_activity_draft_changes` | Mark draft as needs changes | Internal RPC | Saves public feedback and internal notes separately. |
| `reject_activity_draft_with_feedback` | No aprobar draft | Internal RPC | Strong rejection with public feedback and internal notes. |
| `archive_activity_draft` | Archive draft | Internal RPC | Removes from daily queue, retains history. |
| `list_my_activity_publications` | User publications inbox | Auth RPC | Sanitized; no `review_notes`, no `internal_review_notes`, no UUID display. |
| `unpublish_my_activity` | Despublicar own activity | Auth RPC | Enforces `owner_user_id = auth.uid()` server-side. |
| `get_my_activity_draft_for_correction` | Load own correction draft | Auth RPC | Only `needs_changes`, sanitized. |
| `resubmit_my_activity_draft` | Submit linked correction | Auth RPC | Creates new linked `pending_review` draft. |
| `get_my_activity_for_edit` | Load own published activity for edit | Auth RPC | Owner-only, sanitized. |
| `create_my_activity_edit_draft` | Create edit request | Auth RPC | Unpublishes current activity and creates `pending_review` draft. |
| `create_my_activity_submission` | New user activity submission | Auth RPC | Creates `activity_drafts` only with `source_type = 'user_submission'`; no direct `activities` write. |

When `approve_activity_draft` approves a draft with
`submitted_by_user_id`, the created `activities` row must set
`owner_user_id = activity_drafts.submitted_by_user_id`. Existing internal/manual
drafts with `submitted_by_user_id null` may keep `owner_user_id null`.

`source_reference_url` remains draft traceability and user correction support.
It is not part of the public activity catalog model in Phase 2 Core.

### Phase 3 Core user submission resources

Phase 3 adds the first authenticated normal-user flow for submitting a new
activity from scratch. These contracts are repo-versioned only until the SQL is
applied manually and live smoke validation passes.

| Resource | Purpose | Access | Notes |
| --- | --- | --- | --- |
| `create_my_activity_submission` | Create a new user-submitted draft | Auth RPC | Requires `auth.uid()`, validates canonical activity fields, inserts only into `activity_drafts`, and returns the new draft id. |
| `activity_drafts.source_type = 'user_submission'` | Marks Phase 3 user-originated submissions | Auth/Internal via RPC | No separate public submission table in Phase 3. |
| `activity_drafts.source_reference_url` | Optional traceability/reference URL | Auth/Internal via RPC | Empty strings normalize to null; not copied into public catalog data. |

The RPC must not insert or update `public.activities`, approve a draft, publish
an activity, create centers, create contact options, or upload images. Existing
admins review Phase 3 drafts through `/internal/drafts` and the Phase 2
lifecycle.

### Phase 4 Core contact option resources

Phase 4 makes contact options part of the draft lifecycle. These contracts are
repo-versioned only until the SQL is applied manually and live smoke validation
passes.

| Resource | Purpose | Access | Notes |
| --- | --- | --- | --- |
| `reviewed_payload_json.contact_options` | Draft contact payload | Auth/Internal via RPC | User/admin form payload. Contacts stay private until approval. |
| `activity_contact_options.contact_method = 'instagram'` | Instagram public contact method | Internal write, public read model | Stored as a normalized Instagram profile URL in `contact_value`. |
| `approve_activity_draft` | Draft approval | Internal RPC | Publishes contact options to `activity_contact_options` when the reviewed payload explicitly includes `contact_options`. |
| `update_approved_activity_from_draft` | Internal approved edit | Internal RPC | Replaces published contact options when the reviewed payload explicitly includes `contact_options`. |
| `create_my_activity_submission` | User submission | Auth RPC | Accepts contact options in draft payload but still writes only `activity_drafts`. |
| `resubmit_my_activity_draft` | User correction | Auth RPC | Carries corrected contact options in the new pending draft. |
| `create_my_activity_edit_draft` | User edit request | Auth RPC | Stores contact edits in draft and keeps them unpublished until approval. |

Phase 4 uses the existing raw table shape (`contact_method`, `contact_value`,
`is_active`, `is_deleted`). Normal users must not receive direct write grants
to `activity_contact_options`. Public users keep reading only
`activity_contact_options_read`.

The draft payload contact shape is:

```json
{
  "contact_options": [
    {
      "type": "instagram",
      "label": "Instagram",
      "raw_value": "@usuario",
      "normalized_value": "usuario",
      "url": "https://www.instagram.com/usuario/",
      "is_primary": false
    }
  ]
}
```

If a reviewed payload omits `contact_options`, existing published contacts are
preserved. If it includes an empty array, the approved activity has no active
contact options after approval/update.

## Public read models

### `catalog_activities_read`

Contrato principal del catálogo. El frontend lo consume desde `catalogService.js` y espera campos como título, centro, ciudad, categoría, tipo, descripción, `description_format`, imagen, edad, precio, horario y venue.

`short_description` queda como salida de compatibilidad deprecated en el read model. No es un campo editorial. Los formularios internos nuevos no deben escribirlo ni gestionarlo. Los resúmenes de UI, búsqueda o detección deben generarse desde la `description` canónica con helpers plain-text conscientes de Markdown.

### `activity_contact_options_read`

Vista pública segura para contacto. Debe filtrar por:

- opción activa;
- opción no eliminada;
- actividad activa;
- actividad no eliminada;
- centro activo;
- centro no eliminado.

Phase 4 keeps this as the only public contact read boundary. The CTA label in
the public UI remains `Contactar`; one contact opens directly and multiple
contacts open the chooser.

### `municipality_choices_read`

Vista de municipios para onboarding. Debe limitarse a municipios activos, `place_type = 'municipality'`, `country_code = 'ES'` y códigos DIR3/municipality presentes.

## Auth/profile resources

- `auth.users`: autoridad de identidad Supabase.
- `user_profiles`: perfil app.
- `ensure_my_profile(...)`: provisioning controlado para nombre, apellido y municipio.

## Internal resources

- `activity_drafts`: revisión editorial y alta manual interna de nuevas actividades.
- `internal_tool_access`: permiso para herramientas internas.
- `list_internal_admin_activities(...)`: read model interno para `/internal/activities`; incluye publicadas y despublicadas, excluye soft-deleted y no debe sustituir a `catalog_activities_read`.
- `publish_internal_admin_activity(...)` / `unpublish_internal_admin_activity(...)`: RPCs internas por `activity_id`; actualizan la visibilidad técnica (`activities.is_active`) sin cambiar estados de draft.
- `supabase/sql/2026-05-19_internal_activity_admin_catalog_type_hotfix.sql`: hotfix aplicado tras error PostgREST `42804`; las columnas devueltas por RPC deben castear exactamente a los tipos declarados en `RETURNS TABLE`.
- RPCs de lifecycle: editar, despublicar y republicar actividades aprobadas.
- `activities.description` + `activities.description_format`: fuente editorial canónica para descripción larga (`plain` o `markdown`).
- Bucket Storage `activities`: puede alojar portadas de drafts internos bajo paths seguros como `drafts/{draftId}/...`; la base de datos guarda sólo la referencia/path, no binarios ni base64.

Estado: `Partial`. Phase 1 de `/internal/activities` está implementada y live-smoke validada para un usuario interno autorizado; permisos negativos anon/non-internal y otras áreas Supabase siguen necesitando evidencia específica.

### Phase 2 Core RLS expectations

- Normal users can list/read only their own publication rows.
- Normal users can see `user_feedback_summary` and `user_feedback_json`.
- Normal users cannot see `review_notes` or `internal_review_notes`.
- Normal users cannot approve, archive, publish, republish, or manage another
  user's records.
- Owner-only unpublish is enforced by SQL/RPC ownership checks, not frontend
  guards.
- Admin/internal RPCs keep using `internal_tool_access`.

## RLS validation needed

Validar en live:

- anon puede leer sólo vistas públicas esperadas;
- anon no puede leer raw contact table;
- authenticated sólo ve/escribe sus favoritos;
- authenticated no autorizado no accede a Draft Inbox;
- internal autorizado puede crear y revisar drafts;
- internal autorizado puede ejecutar RPCs internas esperadas;
- las portadas de draft sólo pueden subirse desde usuarios internos autorizados;
- `service_role` se limita a server-side;
- errores técnicos no se filtran al usuario final.
