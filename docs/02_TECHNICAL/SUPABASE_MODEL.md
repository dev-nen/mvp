# Supabase Model

## Scope

Este documento resume los recursos Supabase relevantes para la revisión técnica. No sustituye una inspección live del proyecto Supabase.

Estado general: `Partial`. Hay SQL versionado en `supabase/sql`, pero RLS, grants, datos y RPCs deben validarse en el entorno live.

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
| `update_approved_activity_from_draft`    | Edición interna                       | Internal RPC                     | No cubre publicación de contactos.                             |
| `unpublish_approved_activity`            | Despublicar actividad                 | Internal RPC                     | Debe validarse contra catálogo público.                        |
| `republish_approved_activity`            | Republicar actividad                  | Internal RPC                     | Debe validarse contra catálogo público.                        |
| `get_internal_pvi_report`                | Reporting interno                     | Service role                     | Sólo vía `/api/internal/pvi`.                                  |

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
- RPCs de lifecycle: editar, despublicar y republicar actividades aprobadas.
- `activities.description` + `activities.description_format`: fuente editorial canónica para descripción larga (`plain` o `markdown`).
- Bucket Storage `activities`: puede alojar portadas de drafts internos bajo paths seguros como `drafts/{draftId}/...`; la base de datos guarda sólo la referencia/path, no binarios ni base64.

Estado: `Partial`. Hay implementación en repo, pero requiere permisos reales, seeds y smoke live.

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
