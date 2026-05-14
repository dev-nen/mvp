# Deployment and Environment

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

- Vite puede avisar de chunk principal > 500 kB.
- Internal route pageviews no están excluidas explícitamente de Vercel Web Analytics.
- La validación local no prueba RLS live.
- Supabase schema cache puede requerir tiempo tras aplicar vistas/RPCs.
