# SEO and Public Routes

## Dominio canónico

El dominio canónico documentado es:

```txt
https://nensgo.com
```

## Public routes

| Route | Public/Protected | SEO status | Notes |
| --- | --- | --- | --- |
| `/` | Public | Indexable | Home + catálogo. Canonical `https://nensgo.com/`. |
| `/sobre-nensgo` | Public | Indexable | Página sobre NensGo. |
| `/para-centros` | Public | Indexable | Página para centros/responsables. |
| `/privacidad` | Public | Indexable | Página legal/trust. |
| `/terminos` | Public | Indexable | Página legal/trust. |
| `/perfil` | Protected | Disallowed in robots | No debe indexarse. |
| `/favoritos` | Protected | Disallowed in robots | No debe indexarse. |
| `/favoritos/:activityId` | Protected | Disallowed by parent route pattern intent | No debe indexarse. |
| `/internal/*` | Internal | Disallowed in robots | No debe indexarse ni tratarse como público. |
| `/soporte` | Placeholder | Disallowed in robots | No es soporte real cerrado. |

## SeoHead

`src/components/SeoHead.jsx` gestiona:

- `document.title`;
- meta description;
- meta robots;
- canonical link.

## Sitemap

`public/sitemap.xml` incluye:

- `/`
- `/sobre-nensgo`
- `/para-centros`
- `/privacidad`
- `/terminos`

## Robots

`public/robots.txt`:

- permite rutas públicas;
- bloquea `/internal/`, `/perfil`, `/favoritos` y `/soporte`;
- apunta a `https://nensgo.com/sitemap.xml`.

## i18n y hreflang

No hay `hreflang` actualmente. La app cambia idioma en runtime con estado local, pero las URLs no incorporan idioma. Añadir `hreflang` sin URLs por idioma generaría señales poco claras.

## Legal/OAuth trust pages

`/privacidad` y `/terminos` existen para confianza pública y configuración OAuth. No deben interpretarse como validación de cumplimiento legal completo sin revisión profesional.

## Pendiente

- Revisar metadatos sociales si se prepara lanzamiento público.
- Confirmar dominio final y configuración Vercel.
- Validar sitemap/robots live.
- Decidir si habrá rutas por idioma antes de añadir `hreflang`.
