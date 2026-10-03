# NensGo

NensGo es una plataforma web para descubrir actividades infantiles y familiares cerca de ti.

`main` está publicado en `nensgo.com` para mantenimiento gratuito como prueba
de concepto y portfolio, con cargas ocasionales y un horizonte máximo de un año
desde octubre de 2026. Vercel Hobby y Supabase Free están confirmados. Estado
general: **Partial** por el cierre de altas que el usuario realizará en Auth
y la validación interactiva de ambas sesiones y del botón de respaldo.

## Qué es

NensGo ayuda a familias a encontrar actividades culturales, deportivas, educativas y de ocio sin tener que revisar múltiples webs, redes sociales o conversaciones sueltas.

## Estado actual

- Catálogo y detalle sin sesión, con categorías disponibles y textos ES/CA/EN.
- Contactos directos o selector según los canales existentes; nombre opcional,
  temporal y sin almacenamiento para preparar mensajes de WhatsApp/correo.
- Copia pública del catálogo, contactos e imágenes generada en cada build de
  publicación, utilizada si falla la consulta a Supabase.
- Administración privada en `/usuario`, conservando ambas cuentas anteriores,
  con comprobación de sesión y permisos en servidor.
- Importación JSON de una o varias actividades como borradores; revisión humana,
  creación protegida de centros y publicación desde el editor existente.
- Respaldo manual solicitado por una API protegida y confirmado mediante el
  manifiesto realmente publicado; no hay tareas diarias.
- Registro, perfiles públicos, favoritos, publicación por centros y estadísticas
  retirados de la aplicación activa. Los datos históricos se conservan.

El SQL está aplicado y ambas cuentas previas están provisionadas. Los permisos
reales y el Deploy Hook de `main` se comprobaron; una copia nueva quedó publicada
tras pasar a Free. Los datos históricos se conservaron. Las pruebas RLS no
sustituyen un inicio de sesión interactivo: véanse los pendientes del runbook.

## Stack resumido

- React + Vite
- Supabase Auth + Postgres
- Vercel
- JavaScript y CSS

## Rutas principales

- Públicas: `/`, `/sobre-nensgo`, `/privacidad`, `/terminos`.
- Acceso privado: `/usuario`, sin enlace en navegación pública.
- Administración: `/internal/import`, `/internal/drafts`,
  `/internal/drafts/new`, `/internal/drafts/:draftId`, `/internal/activities`,
  `/internal/activities/:activityId`.
- `/para-centros` redirige a Conócenos; las rutas retiradas o desconocidas van a `/`.

## Documentación

La documentación principal está en [`docs/README.md`](docs/README.md).
La rutina operativa y la preparación externa están en
[`MAINTENANCE_RUNBOOK.md`](docs/03_OPERATIONS/MAINTENANCE_RUNBOOK.md):
**importar → revisar → publicar/retirar → crear respaldo**.

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
# Sólo servidor y Production; nunca con prefijo VITE_:
PUBLIC_CATALOG_DEPLOY_HOOK=
```

## Validación

```powershell
npm.cmd run check
npm.cmd run build
git diff --check
```

`npm.cmd` es la forma recomendada en PowerShell cuando el shim `npm` queda bloqueado por la política de ejecución.
`build` necesita acceso a las vistas públicas de Supabase y genera la copia del
catálogo. Para trabajar sólo en la interfaz sin exportar datos existe
`npm.cmd run build:local`; no es el build de producción.

## Contacto

Los contactos de cada actividad se muestran en su detalle cuando existen canales
confirmados. No se documentan datos societarios, fiscales o legales no verificados
en este repositorio.
