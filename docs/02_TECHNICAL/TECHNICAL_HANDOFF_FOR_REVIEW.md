# Technical Handoff for Review - NensGo

## 1. Resumen ejecutivo técnico

NensGo es una SPA React/Vite conectada a Supabase para catálogo, auth, perfil, favoritos, contacto y eventos de producto. Vercel se usa como hosting, capa de rewrites, función API interna y Web Analytics.

El proyecto está en fase MVP/validación. Hay una base real implementada, pero varias garantías dependen de aplicar SQL, configurar Auth/OAuth, configurar secretos y ejecutar smoke tests live.

## 2. Qué está implementado hoy

- Catálogo público desde `catalog_activities_read`.
- Rutas públicas: `/`, `/sobre-nensgo`, `/para-centros`, `/privacidad`, `/terminos`.
- Rutas protegidas: `/perfil`, `/favoritos`, `/favoritos/:activityId`.
- Rutas internas: `/internal/drafts`, `/internal/drafts/:draftId`, `/internal/activities/:activityId`.
- Auth con Google y email/password.
- Estado de email verification y onboarding requerido.
- Perfil app en `user_profiles`.
- Onboarding por municipio con `municipality_choices_read` y fuente DIR3.
- Favoritos remotos en `user_favorite_activities`.
- Contacto por actividad con `activity_contact_options_read`.
- Eventos en `activity_view_events` y `activity_contact_events`.
- i18n ES/CA/EN para copy estático.
- Legal/trust pages para OAuth y confianza pública.
- Draft Inbox interno y ciclo de actividad aprobada implementados en repo.
- Alta manual interna de nuevas actividades como `activity_drafts`, con descripciÃ³n `plain`/`markdown` y portada por referencia de Storage.
- `/api/internal/pvi` como API interna protegida por bearer token.

## 3. Stack

| Capa | Tecnología |
| --- | --- |
| Frontend | React 18 + Vite |
| Routing | `react-router-dom` |
| Backend producto | Supabase Auth + Postgres |
| Data access | Supabase JS browser client |
| Hosting | Vercel |
| Analytics web | `@vercel/analytics` |
| Estilos | CSS por página/componente |
| Lenguaje | JavaScript |

## 4. Arquitectura de alto nivel

```mermaid
flowchart LR
  User[Usuario] --> Web[React/Vite SPA]
  Web --> SupabaseAuth[Supabase Auth]
  Web --> SupabaseDB[Supabase Postgres / Views / RPC]
  Web --> Vercel[Vercel Hosting / Analytics]
  Google[Google OAuth] --> SupabaseAuth
  Vercel --> InternalApi[/api/internal/pvi]
  InternalApi --> SupabaseAdmin[Supabase service_role RPC]
```

Lectura:

- El navegador usa la anon key de Supabase.
- La seguridad real de datos depende de RLS, grants y RPC checks en Supabase.
- El frontend gating mejora UX, pero no es frontera de seguridad.
- `SUPABASE_SERVICE_ROLE_KEY` sólo debe existir en servidor/Vercel, nunca en cliente.

## 5. Frontend

- `src/App.jsx` define rutas y lazy loading.
- `AuthProvider` resuelve sesión, perfil, onboarding, intención protegida y gate.
- `I18nProvider` resuelve idioma y `<html lang>`.
- `HomePage` combina landing y catálogo.
- `FavoritesPage` y `FavoriteActivityDetailPage` cubren favoritos.
- `InternalToolRoute` protege rutas internas antes de montar páginas.
- `SeoHead` gestiona title, description, robots y canonical desde React.

## 6. Backend / Supabase

Supabase contiene los contratos principales:

- Vistas públicas: `catalog_activities_read`, `activity_contact_options_read`, `municipality_choices_read`.
- Tablas de producto: `activities`, `centers`, `cities`, `user_profiles`, `user_favorite_activities`.
- Eventos: `activity_view_events`, `activity_contact_events`.
- Interno: `activity_drafts`, `internal_tool_access`.
- RPCs: `ensure_my_profile`, `approve_activity_draft`, lifecycle RPCs de actividad aprobada, `get_internal_pvi_report`.

Estado: `Partial`. Los contratos están versionados en `supabase/sql`, pero el entorno live debe aplicar y validar SQL/RLS.

## 7. Auth y usuarios

- Supabase Auth es autoridad de identidad.
- Google OAuth y email/password están implementados en frontend.
- Email verification está contemplada para email/password.
- `user_profiles` es la verdad de usuario app.
- `ensure_my_profile(...)` crea/actualiza perfil desde una sesión autenticada.
- El email se trata como dato no editable en esta fase.
- La app no muestra UUIDs de Supabase al usuario.

Pendiente: configuración externa de Supabase Auth, redirect URLs, OAuth consent/trust pages y smoke live.

## 8. Onboarding por municipio

- El onboarding requiere nombre y municipio.
- La búsqueda usa `municipality_choices_read`.
- Durante rollout puede caer a `cities`.
- La fuente esperada es DIR3 para municipios de España.
- Les Roquetes/Roquetas es una excepción temporal: la UI muestra `Les Roquetes (Sant Pere de Ribes)`, pero persiste el `city_id` oficial de Sant Pere de Ribes.
- Esta excepción debe migrar a un modelo formal de localities/areas antes de persistir localidad como entidad propia.

## 9. Catálogo y contacto

- El catálogo lee `catalog_activities_read`.
- La UI deriva aliases como `city_slug`, pero la verdad persistida es `city_id`.
- El detalle sigue dividido entre modal Home y ruta de favoritos.
- `short_description` queda como compatibilidad deprecated del read model; no es campo editorial.
- El contacto lee `activity_contact_options_read`.
- No hay fallback a contacto de centro ni WhatsApp hardcodeado.
- Una opción activa abre acción directa.
- Varias opciones abren selector.
- Cero opciones significa sin CTA operativo.
- Los eventos de contacto se registran en `activity_contact_events` si Supabase está disponible.

## 10. i18n

- Idiomas soportados: ES, CA, EN.
- Idioma por defecto: ES.
- Persistencia: `localStorage` key `nensgo.language`.
- `<html lang>` se actualiza al cambiar idioma.
- Alcance: copy estático de UI.
- No se traducen actividades, centros, ciudades, personas, direcciones, emails, URLs ni valores de contacto.
- `NensGo` no se traduce.
- Las páginas legales cargan copy legal por ruta lazy.

## 11. SEO y rutas públicas

- Dominio canónico documentado: `https://nensgo.com`.
- `SeoHead` define canonical por ruta pública.
- `public/sitemap.xml` incluye `/`, `/sobre-nensgo`, `/para-centros`, `/privacidad`, `/terminos`.
- `public/robots.txt` bloquea rutas internas/protegidas y apunta al sitemap.
- No hay `hreflang` porque el i18n actual no es URL-based.
- Legal/trust pages existen para soporte de OAuth y confianza pública.

## 12. Seguridad, RLS y privacidad

- Frontend route guards son UX, no frontera de seguridad.
- Supabase RLS, grants y RPC checks son la frontera de seguridad.
- `service_role` no debe exponerse al frontend.
- `activity_contact_options_read` evita exponer contactos fuera del catálogo público activo.
- `ensure_my_profile` se hardeneó para aceptar municipios ES activos con DIR3 cuando el SQL está aplicado.
- Funciones internas requieren `internal_tool_access` o `service_role` según el caso.
- No se debe exponer UUIDs, errores técnicos crudos, RPCs internas ni claves de servicio al usuario.

Pendiente: smoke live de RLS/RPC en Supabase real.

## 13. Deploy / entornos

Supuesto operativo actual: Vercel.

Variables esperadas:

```txt
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
INTERNAL_PVI_API_TOKEN
```

Las dos primeras son públicas de frontend. Las dos últimas son server-only y deben vivir en Vercel/env seguro.

Orden recomendado:

1. Aplicar SQL Supabase.
2. Sembrar/validar DIR3 si falta.
3. Configurar Auth/OAuth/redirects.
4. Configurar env vars y secretos Vercel.
5. Desplegar frontend.
6. Ejecutar smoke tests.

## 14. Validación actual

Comandos locales requeridos:

```powershell
npm.cmd run check
npm.cmd run build
git diff --check
```

Antes de commit también:

```powershell
git diff --cached --check
```

Notas:

- `npm.cmd run check` ejecuta auditorías runtime y build.
- El build Vite usa chunks vendor manuales; el build local actual no muestra warning de chunk principal > 500 kB.
- Validación local no sustituye Supabase/Vercel live smoke.

## 15. Riesgos conocidos

- SQL/RLS no debe tratarse como validado live sin evidencia.
- Draft Inbox no está listo para uso amplio sin permisos, seed y smoke real.
- Contact options dependen de calidad de datos.
- i18n no traduce contenido dinámico.
- Legal pages no equivalen a cumplimiento legal completo.
- El tamaño de bundle Vite debe monitorizarse al añadir dependencias grandes.
- Les Roquetes es un hardcode temporal.
- El detalle sigue dividido entre modal y ruta.

## 16. Próximos pasos recomendados

1. Aplicar SQL en entorno Supabase objetivo.
2. Ejecutar smoke de catálogo, auth, onboarding, favoritos y contacto.
3. Validar RLS/RPC con usuarios anon, authenticated, internal y service role.
4. Validar `/api/internal/pvi` en Vercel con bearer token.
5. Validar Draft Inbox y approved activity lifecycle.
6. Corregir cualquier drift entre docs y entorno real.

## 17. Qué debería revisar un líder técnico

- Estabilidad de contratos Supabase.
- Políticas RLS y grants reales en live.
- Separación anon/auth/internal/service_role.
- Manejo de secretos en Vercel.
- Calidad de migraciones y orden de rollout.
- Riesgos de data quality en catálogo/contacto.
- Cobertura de validación manual/automática.
- Tamaño de bundle, split de detalle y modelo de localities.
- Adecuación del backoffice interno al nivel de madurez declarado.
