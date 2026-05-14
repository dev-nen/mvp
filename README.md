# NensGo

NensGo es una plataforma web para descubrir actividades infantiles y familiares cerca de ti.

El proyecto está en fase MVP/validación. Combina catálogo público, autenticación, onboarding por municipio, favoritos remotos y contacto con centros o responsables de actividades.

## Qué es

NensGo ayuda a familias a encontrar actividades culturales, deportivas, educativas y de ocio sin tener que revisar múltiples webs, redes sociales o conversaciones sueltas.

## Estado actual

- Catálogo público conectado a Supabase mediante `catalog_activities_read`.
- Autenticación con Google y email/password.
- Onboarding de usuario con municipio basado en datos DIR3.
- Favoritos persistidos en Supabase.
- Contacto con actividades mediante opciones configuradas en `activity_contact_options_read`.
- Interfaz pública con base i18n ES/CA/EN.
- Rutas públicas para presentación, centros, privacidad y términos.
- Rutas protegidas para perfil y favoritos.
- Backoffice interno/Draft Inbox implementado en repo, pendiente de validación live completa.

## Stack resumido

- React + Vite
- Supabase Auth + Postgres
- Vercel
- JavaScript y CSS

## Rutas principales

- Públicas: `/`, `/sobre-nensgo`, `/para-centros`, `/privacidad`, `/terminos`
- Protegidas: `/perfil`, `/favoritos`, `/favoritos/:activityId`
- Internas: `/internal/drafts`, `/internal/drafts/:draftId`, `/internal/activities/:activityId`

## Documentación

La documentación principal está en [`docs/README.md`](docs/README.md).

Para una revisión técnica rápida:

- [`docs/00_START/PROJECT_BRIEF.md`](docs/00_START/PROJECT_BRIEF.md)
- [`docs/02_TECHNICAL/TECHNICAL_HANDOFF_FOR_REVIEW.md`](docs/02_TECHNICAL/TECHNICAL_HANDOFF_FOR_REVIEW.md)
- [`docs/02_TECHNICAL/ARCHITECTURE.md`](docs/02_TECHNICAL/ARCHITECTURE.md)
- [`docs/02_TECHNICAL/SUPABASE_MODEL.md`](docs/02_TECHNICAL/SUPABASE_MODEL.md)
- [`docs/02_TECHNICAL/SECURITY_AND_PRIVACY.md`](docs/02_TECHNICAL/SECURITY_AND_PRIVACY.md)
- [`docs/03_OPERATIONS/VALIDATION_CHECKLIST.md`](docs/03_OPERATIONS/VALIDATION_CHECKLIST.md)

## Cómo ejecutar en local

```powershell
npm install
npm.cmd run dev
```

Variables necesarias, sin valores en repo:

```txt
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
INTERNAL_PVI_API_TOKEN=
```

## Validación

```powershell
npm.cmd run check
npm.cmd run build
git diff --check
```

`npm.cmd` es la forma recomendada en PowerShell cuando el shim `npm` queda bloqueado por la política de ejecución.

## Contacto

El contacto operativo público del proyecto aparece en la ruta `/para-centros`. No se documentan datos societarios, fiscales o legales no verificados en este repositorio.
