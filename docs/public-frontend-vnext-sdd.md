# Public Frontend vNext SDD

## Contexto

Este SDD define la primera evolución visual pública de NensGo después del
cierre funcional del runtime real en `main`.

El objetivo no es abrir nuevas features ni cambiar contratos de backend. El
objetivo es dar forma pública coherente a la web:

- catálogo como primera superficie
- navegación clara para familias y ofertantes
- intro actual preservada fuera del primer impacto
- cards, filtros, detail y contacto alineados con los mocks de PO
- runtime real intacto

## Branch Context

- Rama de implementación: `redesing-2-public-frontend`
- Baseline: `main`
- Runtime validado: Supabase catalog read model, auth, favoritos, contacto,
  Draft Inbox, approved lifecycle y reporting interno protegido.

## Decisiones Cerradas

- `/` aterriza directamente en el catálogo.
- La intro actual se mueve a `/sobre-nensgo`.
- `/para-centros` se enlaza desde la navegación pública y no se reimplementa.
- `Ver más` sigue protegido por auth.
- El detail completo no será público para anónimos en esta fase.
- No se cambian Supabase, RPCs, services ni contratos de datos.

## Interpretación Del Diseño De PO

La PO busca una experiencia más catálogo-first, móvil y directa:

- filtros compactos arriba
- cards visuales con imagen dominante
- corazón y share disponibles en card
- CTA `Ver más` claro
- detail tipo teléfono
- contacto por canal con botones visibles

El mock inspira el lenguaje visual, pero no reemplaza las imágenes reales por
placeholders planos. Las imágenes reales del catálogo siguen teniendo prioridad.

## Detail No-Scroll Rule

El detail debe evitar scroll interno por defecto, tomando iPhone XR `414x896`
como viewport objetivo.

Prioridad de información visible:

1. título, categoría y favorito
2. edad, horario, precio, centro/lugar, dirección/ciudad
3. CTA contacto
4. descripción resumida
5. imagen compacta

Si falta espacio, primero se reduce la altura de imagen. Si aún falta espacio,
la descripción se limita a pocas líneas y muestra `Ver más`. Solo al expandir
la descripción se permite scroll interno.

La ficha no debe deformarse: no se comprime tipografía hasta quedar ilegible,
no se rompen botones y no se estira el panel.

## Navegación Contextual

Para usuarios iOS y navegación móvil:

- mantener `Volver` dentro del detail
- mantener cerrar
- controles visibles pero discretos
- no depender únicamente del botón del navegador o del sistema

## Scope

In scope:

- ruta `/sobre-nensgo`
- Home catálogo-first
- navbar pública con `Explorar`, `Sobre NensGo`, `Para centros`
- filtros tipo acordeón
- cards vNext
- detail compacto tipo teléfono
- contact chooser por canal
- smoke checklist

Out of scope:

- detail público para anónimos
- cambios de auth
- cambios de Supabase o SQL
- Scout
- Assisted Publishing Backoffice
- nueva landing B2B
- fixtures nuevas de contacto
- observability

## Test Plan

Comandos:

```powershell
npm.cmd run check
npm.cmd run gate3:audit
npm.cmd run gate4:metrics
```

Smoke manual:

- `/` aterriza en catálogo primero
- `/sobre-nensgo` conserva la intro
- `/para-centros` carga desde navbar
- filtros buscar/ciudad/categorías funcionan
- cards muestran imagen real o fallback correcto
- anónimo en `Ver más` abre auth gate
- logueado en `Ver más` abre modal detail
- detail cabe sin scroll inicial en iPhone XR
- descripción larga muestra `Ver más`
- favoritos agregan/quitan/persisten
- contacto con 1 vía funciona
- multi-contact queda `Blocked` por dataset si no hay fixture
- `/pvi` público no reaparece
- no reaparece copy/debug viejo ni mojibake

