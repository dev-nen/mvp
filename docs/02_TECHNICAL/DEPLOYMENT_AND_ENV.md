# Deployment and Environment

## Despliegue vigente de mantenimiento

Estado: **Partial**. El código está adaptado en
`feat/publisher-request-flow-phase4`; no se han aplicado SQL ni configuración
Auth ni desplegado esta transición en producción. No se han confirmado los
planes, extras, facturas y cuotas reales de octubre.

Vercel mantiene framework Vite, `dist` y rewrites SPA/API. El build de publicación
es `npm.cmd run build`: compila y exporta catálogo, contactos e imágenes desde las
vistas públicas. Un fallo de exportación aborta el build para conservar el
despliegue anterior. `build:local` sólo compila la interfaz y no sustituye ese
build de publicación.

| Variable | Entorno/uso vigente |
| --- | --- |
| `VITE_SUPABASE_URL` | Pública: cliente, API y build; URL del proyecto. |
| `VITE_SUPABASE_ANON_KEY` | Pública: cliente anónimo y API/build con vistas/permisos; nunca service role. |
| `PUBLIC_CATALOG_DEPLOY_HOOK` | Secreto sólo servidor y Production; hook de la rama aprobada con la adaptación incluida. |

La API de respaldo no necesita `SUPABASE_SERVICE_ROLE_KEY` ni
`INTERNAL_PVI_API_TOKEN`. La API PVI está retirada (410). Revisar usos externos
antes de retirar secretos antiguos de dashboards; no exponerlos.

Orden: revisar vista previa del commit → contrastar/aplicar SQL aditivo →
provisionar **ambas cuentas previas** → deshabilitar altas/revisar redirects Auth →
configurar hook y variables → desplegar commit aprobado → validar producción y
nuevo respaldo confirmado. El hook se liga a una rama del repositorio conectado;
elegir una rama antigua podría publicar código anterior. La vista previa no
puede disparar el hook de producción.

Pasos concretos, SQL de provisión y control de costes:
[runbook](../03_OPERATIONS/MAINTENANCE_RUNBOOK.md).
El contenido restante es **histórico**; sus variables PVI y validaciones de
Analytics no son requisitos de esta transición.

## Referencia anterior (histórica)

## Hosting assumption


El repo está preparado para Vercel:

- `vercel.json` define framework Vite;
- build command: `npm run build`;
- output: `dist`;
- rewrites para API y fallback SPA.

## Required env vars

```txt
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
INTERNAL_PVI_API_TOKEN
```

## Client vs server variables

| Variable | Client/server | Uso |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Client + server | URL pública Supabase. |
| `VITE_SUPABASE_ANON_KEY` | Client | Anon key para browser client. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | API interna/reporting. |
| `INTERNAL_PVI_API_TOKEN` | Server only | Bearer token para `/api/internal/pvi`. |

## Supabase rollout order

1. Aplicar base real DB/auth SQL si falta.
2. Aplicar municipality onboarding SQL.
3. Aplicar DIR3 seed si falta.
4. Aplicar contact read/hardening SQL.
5. Aplicar Draft Inbox SQL.
6. Aplicar approved activity lifecycle SQL.
7. Ejecutar manual checks de `supabase/manual`.

## Vercel rollout order

1. Configurar env vars.
2. Confirmar dominio/canonical `https://nensgo.com`.
3. Configurar Supabase Auth redirects para el dominio.
4. Desplegar frontend.
5. Confirmar sitemap y robots.
6. Confirmar Web Analytics si se usa como señal operativa.
7. Validar `/api/internal/pvi` con bearer token.

## OAuth dashboard

Configurar:

- Authorized redirect URLs.
- Domain/trust pages.
- `/privacidad`.
- `/terminos`.

No documentar como completo sin smoke real.

## Known caveats

- El build Vite usa chunks vendor manuales; monitorizar tamaño de bundle si se añaden dependencias grandes.
- Internal route pageviews no están excluidas explícitamente de Vercel Web Analytics.
- La validación local no prueba RLS live.
- Supabase schema cache puede requerir tiempo tras aplicar vistas/RPCs.
