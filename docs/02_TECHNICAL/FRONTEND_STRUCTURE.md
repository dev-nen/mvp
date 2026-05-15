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
- `FavoritesPage`, `FavoriteActivityDetailPage`: favoritos.
- `InternalDraftInboxPage`, `InternalDraftCreatePage`, `InternalDraftDetailPage`, `InternalApprovedActivityPage`: interno.

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
- Servicios internos: Draft Inbox, approved activities, access y subida de portada interna.

## Helpers

Helpers de presentación, excerpts plain-text desde `description`, filtros, búsqueda, slugs, normalización, mensajes de contacto y mapeo de drafts viven en `src/helpers`.

## i18n

- Config: `src/i18n/i18nConfig.js`.
- Provider: `src/i18n/I18nProvider.jsx`.
- Locale dictionaries: `src/i18n/locales`.
- Legal dictionaries: `src/i18n/legal`.
