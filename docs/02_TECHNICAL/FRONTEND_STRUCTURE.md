# Frontend Structure

## App entry

- `src/main.jsx`: entrypoint React.
- `src/App.jsx`: providers, routes, lazy pages y Vercel Analytics.
- `src/App.css`, `src/index.css`, `src/styles/*`: estilos globales.

## Pages

- `HomePage`: landing + catálogo.
- `AboutPage`: página pública sobre NensGo.
- `ParaCentrosPage`: landing para centros.
- `PrivacyPolicyPage`, `TermsOfUsePage`, `LegalPage`: legales.
- `ProfilePage`: perfil protegido.
- `UserPublicationsPage`: inbox protegido de publicaciones propias.
- User publication correction/edit pages: rutas protegidas para corregir
  drafts en `needs_changes` y solicitar edicion de actividad propia publicada.
- User activity submission page: `/perfil/publicaciones/nueva`, ruta protegida
  de Phase 3 para crear un nuevo `activity_draft` desde un formulario de
  usuario autenticado.
- `FavoritesPage`, `FavoriteActivityDetailPage`: favoritos.
- `InternalDraftInboxPage`, `InternalDraftCreatePage`, `InternalDraftDetailPage`, `InternalActivityCatalogPage`, `InternalApprovedActivityPage`: interno.

## Components

- `components/auth`: gates y rutas protegidas.
- `components/catalog`: cards, modal detalle, contact options.
- `components/filters`: toolbar de catálogo.
- `components/i18n`: selector de idioma.
- `components/landing`: bloques de landing pública.
- `components/branding`: marca.
- `components/ui`: componentes pequeños reutilizables.

## Context and hooks

- `context/AuthContext.jsx`: sesión, perfil, onboarding, protected intents.
- `hooks/useCatalog.js`: catálogo.
- `hooks/useFavorites.js`: favoritos remotos.
- `hooks/useActivityContactOptions.js`: contacto.
- `hooks/useInternalToolAccess.js`: acceso interno.

## Services

- `supabaseClient.js`: cliente Supabase y URLs públicas de storage.
- `catalogService.js`: `catalog_activities_read`.
- `municipalityService.js`: municipio/DIR3/Roquetes.
- `appUsersService.js`: `user_profiles` y `ensure_my_profile`.
- `activityContactOptionsService.js`: `activity_contact_options_read`.
- `activityEventsService.js`: eventos vista/contacto.
- Servicios internos: Draft Inbox, admin activity catalog, approved activities, access y subida de portada interna.
- `userPublicationsService.js`: RPCs sanitizadas de Phase 2 Core para
  `/perfil/publicaciones`, despublicar propio, correcciones y solicitudes de
  edicion, y Phase 3 `create_my_activity_submission`.

## Phase 2 Core UI boundaries

- User publication pages are normal protected user pages, not internal tooling.
- User pages may render `user_feedback_summary` and `user_feedback_json` only.
- User pages must not render internal notes, raw UUIDs, direct publish,
  republish, approve, archive, or cross-user management controls.
- Internal draft pages may render internal notes and feedback chip controls
  because they are behind `InternalToolRoute` and internal RPC checks.

## Phase 3 Core UI boundaries

- `/perfil/publicaciones/nueva` is a normal protected user page, not an
  internal tool and not a public anonymous route.
- It reuses the shared draft form helpers where safe, but exposes no internal
  notes, admin controls, direct publish/republish controls, or upload flow.
- It sends `reviewed_payload_json` to `create_my_activity_submission`; the
  backend creates only `activity_drafts` and the user returns to
  `/perfil/publicaciones`.
- The route depends on the Phase 3 SQL migration being manually applied in
  Supabase before live runtime smoke can pass.

## Phase 4 Core contact UI boundaries

- `ScoutDraftReviewForm` owns the shared contact option editor used by
  internal drafts, approved activity edits, user submissions, corrections and
  edit requests.
- Form helpers map `reviewed_payload_json.contact_options` to/from frontend
  form state.
- User forms may edit contact options only as draft data; they do not write
  live `activity_contact_options`.
- Public detail keeps the main CTA label as `Contactar`. One contact option
  opens directly; multiple contact options open the chooser.
- Instagram is a first-class contact option and opens the normalized Instagram
  profile URL.

## Helpers

Helpers de presentación, excerpts plain-text desde `description`, filtros,
búsqueda, slugs, normalización, mensajes de contacto, contact options y mapeo
de drafts viven en `src/helpers`.

## i18n

- Config: `src/i18n/i18nConfig.js`.
- Provider: `src/i18n/I18nProvider.jsx`.
- Locale dictionaries: `src/i18n/locales`.
- Legal dictionaries: `src/i18n/legal`.
