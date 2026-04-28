# Gate 4 Runtime Real Smoke

## Proposito

Checklist manual para validar Gate 4 sin depender del chat. Usar despues de
cerrar Gate 1, Gate 2 y Gate 3.

Antes de probar, generar una hoja de sesion actual con:

```powershell
npm.cmd run gate4:prep
```

La hoja generada vive en:

```txt
tests/evidence/gate4-smoke-session-latest.md
```

Ese archivo trae los ids reales disponibles para catalogo, contacto y Draft
Inbox segun el dataset actual.

Para el bloque 5, preparar la hoja especifica con:

```powershell
npm.cmd run gate4:metrics
```

La hoja generada vive en:

```txt
tests/evidence/gate4-block5-internal-metrics-latest.md
```

## Reglas

- Probar por bloques, no todo de una vez.
- Si falla auth, parar antes de favoritos e internos.
- Si falla Draft Inbox, parar antes de approved lifecycle.
- Si falta dataset para 0 contactos o multiples contactos, marcar `Blocked`
  por datos, no inventar casos.
- No pegar tokens ni secretos en evidencia.

## Bloque 1 - Publico

- [ ] Home carga catalogo real
- [ ] Cards muestran imagen real o fallback correcto
- [ ] Busqueda/filtro simple funciona
- [ ] Intentar abrir detail desde anonimo muestra gate de acceso
- [ ] Contacto con 0 vias comunica indisponibilidad o queda `Blocked` por datos
- [ ] Contacto con multiples vias abre chooser o queda `Blocked` por datos
- [ ] No reaparece copy/debug publico viejo

## Bloque 2 - Auth, Perfil, Favoritos

- [ ] Accion protegida abre gate de acceso
- [ ] Login vuelve al host correcto
- [ ] Signup clasico mantiene email verification
- [ ] Onboarding aparece solo cuando corresponde
- [ ] Usuario ready puede usar la app
- [ ] Detail modal abre sin errores ya autenticado
- [ ] Contacto con 1 via funciona ya autenticado
- [ ] Favorito se agrega y persiste tras reload
- [ ] Favorito se quita y persiste tras reload
- [ ] Perfil no muestra copy tecnica vieja

## Bloque 3 - Draft Inbox

- [ ] `/internal/drafts` abre con usuario autorizado
- [ ] Lista muestra drafts seed reales
- [ ] Abrir draft pending_review funciona
- [ ] Guardar revision funciona
- [ ] Rechazar draft funciona
- [ ] Estado rejected queda read-only

## Bloque 4 - Approved Lifecycle

- [ ] Aprobar draft valido crea actividad real
- [ ] Draft aprobado muestra `approved_activity_id`
- [ ] Abrir actividad aprobada funciona
- [ ] Guardar cambio menor funciona
- [ ] Despublicar saca la actividad del catalogo real
- [ ] Republicar devuelve la actividad al catalogo real

## Bloque 5 - Internal Metrics

- [ ] `/pvi` publico no existe y vuelve a Home
- [ ] `/api/internal/pvi` sin token rechaza
- [ ] `/api/internal/pvi` con token responde o queda `Blocked` por Vercel Authentication
- [ ] `get_internal_pvi_report` no queda expuesto al cliente anon de Supabase

## Resumen De Ejecucion

```txt
Fecha:
Branch:
Entorno:
Bloque probado:
Pass:
Fail:
Blocked:
Notas:
```
