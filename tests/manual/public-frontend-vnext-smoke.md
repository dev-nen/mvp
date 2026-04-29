# Public Frontend vNext Smoke

## Contexto

- Rama objetivo: `redesing-2-public-frontend`
- Baseline funcional: runtime real ya cerrado en `main`
- Scope: frontend público, navegación, catálogo, detail protegido, favoritos y contacto.
- Fuera de scope: Supabase SQL, auth contracts, services, `/internal/*`, Scout y Assisted Publishing.

## Preflight

- [ ] Abrir `/`.
- [ ] Confirmar que el catálogo aparece como primera superficie.
- [ ] Confirmar que no reaparece `/pvi` público.
- [ ] Confirmar que no reaparece copy/debug viejo ni mojibake.

## Navegación pública

- [ ] Navbar muestra `Explorar`.
- [ ] Navbar muestra `Sobre NensGo`.
- [ ] Navbar muestra `Para centros`.
- [ ] `Explorar` navega a `/`.
- [ ] `Sobre NensGo` navega a `/sobre-nensgo`.
- [ ] `Para centros` navega a `/para-centros`.
- [ ] `/sobre-nensgo` conserva la intro/about us anterior.
- [ ] `/para-centros` sigue cargando la landing B2B existente.

## Filtros

- [ ] El bloque `Buscar` está disponible como acordeón.
- [ ] Buscar por texto filtra resultados.
- [ ] El bloque `Ciudad` abre/cierra y filtra resultados.
- [ ] El bloque `Categorías` abre/cierra y filtra por chips.
- [ ] `Limpiar` aparece solo cuando hay filtros activos.
- [ ] `Limpiar` resetea búsqueda, ciudad y categorías.

## Cards

- [ ] Cards muestran imagen real cuando existe.
- [ ] Cards usan fallback correcto si la imagen falla.
- [ ] Cards muestran corazón arriba a la derecha.
- [ ] Corazón anónimo abre auth gate.
- [ ] Corazón logueado agrega/quita favorito.
- [ ] Share no rompe la card.
- [ ] CTA `Ver más` aparece como pill.
- [ ] `Ver más` anónimo abre auth gate.
- [ ] Grid móvil se mantiene legible en iPhone XR.

## Detail Protegido

- [ ] Con usuario logueado, `Ver más` abre modal detail.
- [ ] El modal usa formato compacto tipo teléfono.
- [ ] Botón `Volver` visible y discreto.
- [ ] Botón cerrar visible y discreto.
- [ ] En iPhone XR `414x896`, la ficha no necesita scroll interno al abrir.
- [ ] La información clave visible incluye título, categoría, favorito, facts, ubicación y contacto.
- [ ] La imagen se mantiene compacta y no deforma la ficha.
- [ ] La descripción aparece resumida.
- [ ] `Ver más` de descripción expande el texto.
- [ ] Solo con descripción expandida se acepta scroll interno.
- [ ] `Ver menos` vuelve al estado compacto.

## Favoritos Y Contacto

- [ ] Favorito desde detail agrega/quita correctamente.
- [ ] Favorito persiste tras reload.
- [ ] Contacto con 1 vía ejecuta acción directa.
- [ ] Contacto con múltiples vías abre chooser si hay dataset.
- [ ] Si no hay dataset multi-contact, marcar `Blocked por dataset`.
- [ ] Chooser muestra botones por canal real: WhatsApp, e-mail, Web, Formulario o Llamar.
- [ ] No aparecen canales inventados.
- [ ] 0 contactos muestra indisponibilidad breve si hay dataset para probarlo.

## Resultado

- [ ] Pass
- [ ] Fail
- [ ] Blocked por dataset

## Notas / Evidencia

- Fecha:
- Entorno:
- Usuario:
- Observaciones:
