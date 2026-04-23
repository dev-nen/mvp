# Runtime Real Closure SDD

## Scope Note

Este documento define el plan operativo canonico para cerrar el runtime real ya
integrado en `main`.

Baseline revisada el 23 de abril de 2026.

No implementa nuevas features. Ordena y coordina el cierre funcional real de lo
que ya existe en `main`, con gates `stop/go`, checkpoints humanos explicitos y
tiradas largas de Codex entre checkpoints.

Antecedentes utiles, pero ya no suficientes como artefacto principal:

- [real-db-auth-migration-runbook.md](./real-db-auth-migration-runbook.md)
- [real-db-auth-preview-smoke.md](../tests/manual/real-db-auth-preview-smoke.md)

Este SDD sustituye a esos antecedentes como guia maestra de trabajo para el
esfuerzo actual en `main`.

## Branch Context

- Active branch for this work: `main`
- `main` es la source of truth de implementacion y documentacion para este
  cierre
- Entorno principal objetivo: preview de Vercel
- Produccion no es el entorno primario de este esfuerzo
- `Scout` y `Assisted Publishing Backoffice` quedan fuera de alcance

## Proposito

Este esfuerzo debe cerrar, de forma real y no solo compilada:

- catalogo real
- auth real
- perfil y onboarding
- favoritos remotos
- contacto real
- `api/internal/pvi`
- Draft Inbox
- approved activity lifecycle

Este documento existe para:

- coordinar tus pasos cortos de intervencion humana
- coordinar mis tiradas largas de analisis, validacion y fix pass
- evitar que el cierre dependa de memoria o de chat disperso
- dejar un checklist de smoke facil de marcar durante varios dias

Este documento no es:

- un roadmap
- una lista de tickets
- una spec de Scout
- una spec de observability avanzada

## Como Se Usa

- No se avanza de gate sin cerrar el criterio `stop/go` del gate anterior.
- Cada gate debe dejar evidencia minima.
- Tus checkpoints son los que requieren acceso externo, navegador real o
  validacion operativa.
- Mis checkpoints son los que requieren lectura larga del repo, contraste de
  contratos, agrupacion de fallos y fix pass por tandas.
- Si algo falla, no se fuerza el siguiente gate: se reclasifica como bug del
  repo, gap de datos, drift externo o bloqueo humano.

## Estado Actual Real En `main`

Lo que ya existe hoy:

- catalogo publico contra `catalog_activities_read`
- favoritos remotos contra `user_favorite_activities`
- auth Google + email/password
- onboarding con `ensure_my_profile(...)`
- contacto por `activity_contact_options`
- writes de `activity_view_events` y `activity_contact_events`
- seam privado `GET /api/internal/pvi`
- Draft Inbox interno en rutas, guard, servicios y SQL versionado
- approved activity lifecycle en ruta interna, servicios y SQL versionado

Lo que sigue `Partial`:

- SQL aplicada en un proyecto real de Supabase
- configuracion real de Auth y redirects
- envs y secrets reales de Vercel
- dataset minimo util para smoke completo
- validacion end-to-end real

Deltas importantes frente a artefactos anteriores:

- la ruta publica `/pvi` ya no existe y no debe reaparecer en el smoke
- varios copys tecnicos viejos de perfil/auth ya fueron saneados y no deben
  volver a usarse como expectativa de validacion
- el cierre ya no es solo `real DB/auth`; ahora incluye tambien Draft Inbox y
  approved activity lifecycle porque ya viven en `main`

## Out Of Scope

- `Scout Manual v0`
- conectores Scout
- `Assisted Publishing Backoffice`
- nuevas features de perfil
- observability avanzada
- limpieza general del repo
- produccion-first rollout

## Interfaces Operativas A Validar

### Supabase SQL versionada

- `supabase/sql/2026-04-21_real_db_auth_phase.sql`
- `supabase/sql/2026-04-22_internal_draft_inbox_phase1.sql`
- `supabase/sql/2026-04-22_internal_approved_activity_lifecycle_phase2.sql`

### Contratos runtime en Supabase

- `catalog_activities_read`
- `ensure_my_profile(...)`
- `activity_contact_options`
- `activity_view_events`
- `activity_contact_events`
- `user_favorite_activities`
- `internal_tool_access`
- RPCs de Draft Inbox y approved lifecycle

### Auth y configuracion

- Google provider
- email/password
- verificacion por email
- redirect URLs para local, preview y produccion

### Entorno Vercel

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `INTERNAL_PVI_API_TOKEN`

### Reporting privado

- `GET /api/internal/pvi`

## Dependency Readiness Matrix

| Dependencia | Evidencia actual en repo | Estado | Owner principal | Gate afectado |
| --- | --- | --- | --- | --- |
| SQL de real DB/auth versionada | Script versionado y runbook existente | `Done` | Codex | Gate 1 |
| SQL de Draft Inbox Phase 1 versionada | Script y smoke manual versionados | `Done` | Codex | Gate 1 |
| SQL de approved lifecycle versionada | Script y smoke manual versionados | `Done` | Codex | Gate 1 |
| Proyecto Supabase objetivo confirmado | No hay evidencia en repo | `Blocked` | Humano | Gate 0 |
| Acceso operativo a Supabase | No hay evidencia en repo | `Blocked` | Humano | Gate 0 |
| SQL aplicada en Supabase real | No validada desde repo | `Blocked` | Humano | Gate 1 |
| Objetos SQL creados y legibles | Queries esperadas definibles, no ejecutadas aun | `Planned` | Codex + Humano | Gate 1 |
| Google provider configurado | Soportado en codigo, no validado en entorno real | `Blocked` | Humano | Gate 2 |
| Email/password configurado | Soportado en codigo, no validado en entorno real | `Blocked` | Humano | Gate 2 |
| Verificacion por email configurada | Soportada en flujo, no validada en entorno real | `Blocked` | Humano | Gate 2 |
| Redirect URLs completas | Necesarias, no confirmadas | `Blocked` | Humano | Gate 2 |
| Env vars cliente en preview | Requeridas por el repo, no confirmadas | `Blocked` | Humano | Gate 2 |
| Secrets server-side para `api/internal/pvi` | Requeridos por el repo, no confirmados | `Blocked` | Humano | Gate 2 |
| Preview redeployada tras config | Necesaria para smoke real | `Blocked` | Humano | Gate 2 |
| Usuario interno autorizado en `internal_tool_access` | SQL/tabla existen, fila real no confirmada | `Blocked` | Humano | Gate 3 |
| Seed real de drafts | Flujo existe, seed real no confirmada | `Blocked` | Humano | Gate 3 |
| Dataset minimo de catalogo/contacto | Parcialmente inferido por docs viejas; cobertura actual no confirmada | `Partial` | Humano + Codex | Gate 3 |
| Caso con multiples vias de contacto | Historicamente incompleto; no confirmado hoy | `Partial` | Humano + Codex | Gate 3 / 4 |
| Seam privado `api/internal/pvi` | Ruta existe en codigo, entorno no validado | `Partial` | Humano + Codex | Gate 4 |

## Fases Stop/Go

### Gate 0 - Preflight y dependencia externa

**Objetivo**

- Confirmar que el cierre puede arrancar contra un entorno real concreto.

**Owner dominante**

- Humano

**Inputs**

- `main`
- este SDD
- acceso a Supabase y Vercel

**Intervencion humana obligatoria**

- confirmar proyecto Supabase objetivo
- confirmar preview URL de Vercel
- confirmar acceso operativo a:
  - Supabase SQL editor o consola equivalente
  - Supabase Auth settings
  - Vercel env vars
  - Vercel redeploy

**Tirada Codex**

- consolidar la matriz de dependencias del repo
- fijar queries esperadas para validar objetos SQL
- fijar orden exacto de ejecucion de gates

**Outputs**

- entorno objetivo definido
- accesos confirmados
- lista de queries y objetos esperados preparada

**Criterio stop/go**

- no se pasa a Gate 1 si el entorno y los accesos no estan confirmados

**Bloqueos tipicos**

- proyecto Supabase dudoso
- preview URL no fijada
- acceso parcial a paneles externos

### Gate 1 - Aplicacion de SQL real

**Objetivo**

- Aplicar y verificar las tres capas SQL versionadas.

**Owner dominante**

- Humano para apply, Codex para contraste

**Inputs**

- gate 0 cerrado
- scripts SQL versionados

**Intervencion humana obligatoria**

- aplicar SQL en este orden:
  1. `2026-04-21_real_db_auth_phase.sql`
  2. `2026-04-22_internal_draft_inbox_phase1.sql`
  3. `2026-04-22_internal_approved_activity_lifecycle_phase2.sql`
- guardar evidencia de ejecucion
- correr consultas minimas de existencia/lectura

**Tirada Codex**

- contrastar objetos esperados vs objetos observados
- revisar errores de apply, drift de nombres, grants o firmas RPC
- clasificar cualquier fallo como:
  - bug del SQL versionado
  - drift externo
  - dato faltante
  - bloqueo humano

**Outputs**

- SQL aplicada
- objetos principales comprobados
- clasificacion inicial de fallos si aparecen

**Criterio stop/go**

- no se pasa a Gate 2 si faltan tablas, views o RPCs criticas

**Bloqueos tipicos**

- error de apply
- objeto creado con nombre distinto
- grants faltantes
- secuencias/defaults sin preparar

### Gate 2 - Auth y Vercel config real

**Objetivo**

- Dejar auth y preview realmente configurados para validar.

**Owner dominante**

- Humano

**Inputs**

- gate 1 cerrado
- proyecto Supabase correcto
- proyecto Vercel correcto

**Intervencion humana obligatoria**

- habilitar Google
- habilitar email/password
- activar verificacion por email
- cargar redirect URLs de local, preview y produccion
- configurar env vars y secrets en Vercel
- redeployar preview

**Tirada Codex**

- verificar el contrato de env vars esperado por el repo
- listar sintomas esperables por mala config
- preparar el checklist de validacion auth/env para browser y API

**Outputs**

- preview redeployada con config real
- auth lista para prueba
- checklist auth/env preparado

**Criterio stop/go**

- no se pasa a Gate 3 si preview no esta redeployada con config real

**Bloqueos tipicos**

- redirect URL ausente
- Google mal configurado
- env var cliente ausente
- token server-side ausente

### Gate 3 - Datos minimos, permisos y seed util

**Objetivo**

- Asegurar que el smoke corre sobre datos y permisos reales, no sobre un
  entorno vacio.

**Owner dominante**

- Humano para preparacion, Codex para cobertura de escenarios

**Inputs**

- gate 2 cerrado

**Intervencion humana obligatoria**

- autorizar al menos un usuario real en `internal_tool_access`
- ejecutar seed real de drafts para ese usuario
- asegurar dataset minimo:
  - actividad visible con imagen valida
  - caso sin contacto
  - caso con una sola via de contacto
  - si existe, caso con multiples vias
- confirmar usuarios de prueba para:
  - login Google
  - signup clasico
  - testing interno editorial

**Tirada Codex**

- revisar si el dataset cubre todos los escenarios del smoke
- marcar explicitamente que casos quedan `Blocked` por falta de datos
- preparar expected behavior por caso de contacto y flujo editorial

**Outputs**

- usuario interno operativo
- drafts seed visibles
- mapa de cobertura de dataset

**Criterio stop/go**

- no se pasa a Gate 4 si faltan permisos internos o si el dataset no cubre los
  caminos basicos

**Bloqueos tipicos**

- usuario no autorizado
- seed ligada al usuario equivocado
- read model sin imagen valida
- cobertura incompleta de `activity_contact_options`

### Gate 4 - Smoke end-to-end real en preview

**Objetivo**

- Validar el comportamiento real sobre preview y Supabase real.

**Owner dominante**

- Humano para ejecucion, Codex para analisis

**Inputs**

- gates 0 a 3 cerrados
- checklist de smoke de este documento

**Intervencion humana obligatoria**

- ejecutar el checklist en navegador real
- marcar `Pass/Fail`
- adjuntar evidencia minima por bloque

**Tirada Codex**

- agrupar incidencias por subsistema
- distinguir entre:
  - bug UI/copy
  - bug de flujo/auth
  - bug de contrato/datos
  - bloqueo externo
  - gap de configuracion

**Outputs**

- checklist marcada
- lista de incidencias agrupadas
- clasificacion de bloqueadores

**Criterio stop/go**

- si falla algo bloqueador, no se cierra fase; se pasa a Gate 5

**Bloqueos tipicos**

- logout con loop raro
- onboarding no deja estado `ready`
- favoritos no persisten
- data gap en contacto
- Draft Inbox visible pero no operativa

### Gate 5 - Fix pass por tandas largas de Codex

**Objetivo**

- Corregir gaps reales encontrados sin abrir nuevas features.

**Owner dominante**

- Codex

**Inputs**

- incidencias agrupadas del Gate 4

**Intervencion humana obligatoria**

- validar solo los casos impactados por cada tanda
- remarcar checklist parcial
- devolver evidencia de regresion o cierre

**Tirada Codex**

- atacar bugs por lotes coherentes:
  - catalogo/media/fallback
  - auth/perfil/onboarding
  - favoritos remotos
  - contacto y chooser
  - Draft Inbox
  - approved activity lifecycle
  - `api/internal/pvi`
- dejar cada tanda con validacion local y nota de pendiente humano

**Outputs**

- uno o mas lotes de fixes
- lista reducida de pendientes humanos o bloqueos externos

**Criterio stop/go**

- no se pasa a Gate 6 mientras queden bloqueadores del repo sin resolver

**Bloqueos tipicos**

- bug real de contrato
- flow roto solo en preview
- dependencia humana aun no cerrada

### Gate 6 - Cierre funcional y rebaseline documental

**Objetivo**

- Declarar el cierre real solo cuando repo, entorno y smoke cuentan la misma
  historia.

**Owner dominante**

- Codex para docs, Humano para confirmacion final

**Inputs**

- checklist final
- lote final de fixes
- bloqueos reclasificados

**Intervencion humana obligatoria**

- confirmar que el checklist final quedo cerrado
- confirmar que no quedan bloqueos operativos ocultos

**Tirada Codex**

- actualizar docs maestras si el estado cambio materialmente
- dejar closure note con:
  - que quedo cerrado
  - que quedo `Partial`
  - que sigue externo
  - que se valida de verdad

**Outputs**

- estado documental rebaselinado
- cierre funcional explicito

**Criterio de cierre**

- el repo, el entorno y la validacion real quedan alineados

## Checkpoints Humanos

### Gate 0

- [ ] H0.1 Confirmar proyecto Supabase objetivo
  - Evidencia minima: nombre/ref del proyecto
- [ ] H0.2 Confirmar preview URL objetivo
  - Evidencia minima: URL completa
- [ ] H0.3 Confirmar acceso a Supabase Auth, SQL y Vercel env/redeploy
  - Evidencia minima: confirmacion explicita

### Gate 1

- [ ] H1.1 Aplicar `2026-04-21_real_db_auth_phase.sql`
  - Evidencia minima: salida o captura de ejecucion
- [ ] H1.2 Aplicar `2026-04-22_internal_draft_inbox_phase1.sql`
  - Evidencia minima: salida o captura de ejecucion
- [ ] H1.3 Aplicar `2026-04-22_internal_approved_activity_lifecycle_phase2.sql`
  - Evidencia minima: salida o captura de ejecucion
- [ ] H1.4 Ejecutar queries minimas de comprobacion
  - Evidencia minima: resultados o captura

### Gate 2

- [ ] H2.1 Habilitar Google provider
  - Evidencia minima: confirmacion operativa
- [ ] H2.2 Habilitar email/password
  - Evidencia minima: confirmacion operativa
- [ ] H2.3 Activar verificacion por email
  - Evidencia minima: confirmacion operativa
- [ ] H2.4 Cargar redirect URLs correctas
  - Evidencia minima: lista de URLs usadas
- [ ] H2.5 Cargar env vars y secrets en Vercel
  - Evidencia minima: confirmacion operativa
- [ ] H2.6 Redeployar preview
  - Evidencia minima: URL/deployment id o captura

### Gate 3

- [ ] H3.1 Autorizar usuario real en `internal_tool_access`
  - Evidencia minima: id/email del usuario autorizado
- [ ] H3.2 Ejecutar seed de drafts con usuario real
  - Evidencia minima: drafts visibles en preview o en DB
- [ ] H3.3 Confirmar dataset minimo de catalogo/contacto
  - Evidencia minima: ids o titulos de actividades de prueba
- [ ] H3.4 Confirmar usuarios de prueba
  - Evidencia minima: usuario Google, usuario clasico, usuario interno

### Gate 4

- [ ] H4.1 Ejecutar checklist completa en navegador real
  - Evidencia minima: checklist marcada
- [ ] H4.2 Guardar capturas o notas por bloque
  - Evidencia minima: enlaces, capturas o comentario estructurado

### Gate 5

- [ ] H5.1 Revalidar solo los casos tocados por cada fix batch
  - Evidencia minima: `Pass/Fail` parcial por tanda

### Gate 6

- [ ] H6.1 Confirmar cierre funcional real
  - Evidencia minima: confirmacion explicita de cierre o reclasificacion final

## Checkpoints Codex

### Gate 0

- [ ] C0.1 Consolidar matriz de dependencias reales del repo
- [ ] C0.2 Preparar queries de validacion SQL y objetos esperados
- [ ] C0.3 Fijar orden exacto de ejecucion y criterio `stop/go`

### Gate 1

- [ ] C1.1 Contrastar objetos esperados vs SQL realmente aplicada
- [ ] C1.2 Revisar fallos de apply, grants y drift
- [ ] C1.3 Clasificar bloqueos externos vs bugs del SQL versionado

### Gate 2

- [ ] C2.1 Verificar contrato de env vars y secrets esperado por el repo
- [ ] C2.2 Preparar checklist de auth/env para preview
- [ ] C2.3 Documentar sintomas tipicos de mala configuracion

### Gate 3

- [ ] C3.1 Evaluar cobertura real del dataset minimo
- [ ] C3.2 Marcar escenarios `Blocked` por falta de datos
- [ ] C3.3 Dejar expected behavior por caso de contacto y editorial flow

### Gate 4

- [ ] C4.1 Agrupar incidencias por subsistema
- [ ] C4.2 Distinguir bug del repo vs bloqueo externo
- [ ] C4.3 Priorizar fix batches

### Gate 5

- [ ] C5.1 Ejecutar fix batch de catalogo/media si aparece gap
- [ ] C5.2 Ejecutar fix batch de auth/perfil/onboarding si aparece gap
- [ ] C5.3 Ejecutar fix batch de favoritos/contacto si aparece gap
- [ ] C5.4 Ejecutar fix batch de Draft Inbox/lifecycle si aparece gap
- [ ] C5.5 Ejecutar fix batch de `api/internal/pvi` si aparece gap

### Gate 6

- [ ] C6.1 Rebaselinar docs maestras si cambia el estado material
- [ ] C6.2 Dejar nota de cierre final y pendientes explicitos

## Queries Minimas De Verificacion Para Gate 1

Usar estas consultas como base de comprobacion tras aplicar SQL:

```sql
select * from public.catalog_activities_read limit 5;

select proname
from pg_proc
where proname in (
  'ensure_my_profile',
  'approve_activity_draft',
  'list_internal_approved_activity_states',
  'get_internal_approved_activity',
  'update_approved_activity_from_draft',
  'unpublish_approved_activity',
  'republish_approved_activity',
  'get_internal_pvi_report'
);

select count(*) from public.activity_drafts;
select count(*) from public.internal_tool_access;

select * from public.get_internal_pvi_report();
```

Consultas de sanity opcionales para datos minimos:

```sql
select id, title, image_url
from public.catalog_activities_read
limit 10;

select activity_id, contact_type, contact_value, is_active
from public.activity_contact_options
where is_active = true
limit 20;
```

## Smoke Test Checklist

## Metadatos Del Smoke

```txt
Fecha:
Proyecto Supabase:
Preview URL:
Tester humano:
Codex batch asociado:
```

### 1. Preflight

#### 1.1 Proyecto y preview confirmados

Accion:

1. Confirmar proyecto Supabase.
2. Confirmar preview URL.

Esperado:

- ambos entornos quedan fijados para todo el cierre

Evidencia minima:

- ref del proyecto y URL completa

Resultado:

- [ ] Pass
- [ ] Fail

Notas:

```txt

```

#### 1.2 Accesos externos disponibles

Accion:

1. Confirmar acceso a Supabase SQL/Auth.
2. Confirmar acceso a Vercel env/redeploy.

Esperado:

- no hay dependencia operativa bloqueada antes de empezar

Evidencia minima:

- confirmacion explicita

Resultado:

- [ ] Pass
- [ ] Fail

Notas:

```txt

```

### 2. Catalogo Publico

#### 2.1 Home carga desde DB real

Accion:

1. Abrir la preview.
2. Esperar la Home.

Esperado:

- se ven actividades reales del read model
- no aparece fallback viejo

Evidencia minima:

- captura de Home o nota con actividades visibles

Resultado:

- [ ] Pass
- [ ] Fail

Notas:

```txt

```

#### 2.2 Cards muestran imagen real o fallback correcto

Accion:

1. Revisar varias cards visibles.

Esperado:

- imagen real si existe
- placeholder correcto si no existe
- sin layouts rotos

Evidencia minima:

- captura de cards

Resultado:

- [ ] Pass
- [ ] Fail

Notas:

```txt

```

#### 2.3 Filtros por ciudad y categoria funcionan

Accion:

1. Usar busqueda.
2. Cambiar ciudad.
3. Cambiar categorias.

Esperado:

- la lista responde al filtro sin errores visibles

Evidencia minima:

- captura o nota de ids/titulos que cambian

Resultado:

- [ ] Pass
- [ ] Fail

Notas:

```txt

```

#### 2.4 Detail modal abre sin errores

Accion:

1. Abrir una actividad desde Home.

Esperado:

- modal abre
- no hay crash
- facts/location/contact se renderizan

Evidencia minima:

- captura del modal

Resultado:

- [ ] Pass
- [ ] Fail

Notas:

```txt

```

#### 2.5 No reaparece copy/debug publico degradado

Accion:

1. Revisar Home, detail y estados vacios/error visibles.

Esperado:

- no reaparecen labels o copy tecnica vieja

Evidencia minima:

- confirmacion explicita

Resultado:

- [ ] Pass
- [ ] Fail

Notas:

```txt

```

### 3. Auth Y Perfil

#### 3.1 Accion protegida abre gate correcto

Accion:

1. Desde anonimo, intentar guardar favorito o abrir una accion protegida.

Esperado:

- se abre gate de acceso
- ofrece Google y email/password

Evidencia minima:

- captura del gate

Resultado:

- [ ] Pass
- [ ] Fail

Notas:

```txt

```

#### 3.2 Google vuelve al mismo host de preview

Accion:

1. Iniciar login con Google.
2. Completar login.

Esperado:

- vuelves al mismo host de preview
- no caes en produccion ni en otro host

Evidencia minima:

- URL final tras login

Resultado:

- [ ] Pass
- [ ] Fail

Notas:

```txt

```

#### 3.3 Signup clasico envia email de verificacion

Accion:

1. Crear cuenta clasica nueva.

Esperado:

- aparece mensaje correcto
- se envia email de verificacion

Evidencia minima:

- captura del mensaje o confirmacion

Resultado:

- [ ] Pass
- [ ] Fail

Notas:

```txt

```

#### 3.4 Usuario verificado cae en onboarding cuando corresponde

Accion:

1. Usar usuario clasico verificado sin perfil completo.

Esperado:

- la app exige onboarding
- no entra en flujo normal todavia

Evidencia minima:

- captura del estado

Resultado:

- [ ] Pass
- [ ] Fail

Notas:

```txt

```

#### 3.5 `ensure_my_profile(...)` deja estado `ready`

Accion:

1. Completar onboarding con nombre y ciudad.

Esperado:

- la app deja al usuario en `ready`
- navegacion normal disponible

Evidencia minima:

- captura del estado final en perfil o Home

Resultado:

- [ ] Pass
- [ ] Fail

Notas:

```txt

```

#### 3.6 Logout no deja loops raros ni re-login inesperado

Accion:

1. Hacer logout desde perfil.
2. Confirmar navegacion y estado posterior.

Esperado:

- no hay loop raro
- no relanza Google automaticamente
- la salida deja un estado navegable coherente

Evidencia minima:

- captura o nota precisa del comportamiento

Resultado:

- [ ] Pass
- [ ] Fail

Notas:

```txt

```

#### 3.7 Perfil no muestra copy tecnica vieja

Accion:

1. Revisar `/perfil` autenticado.

Esperado:

- no reaparece copy tecnica del primer MVP
- la pantalla se lee como producto, no como debug

Evidencia minima:

- captura de perfil

Resultado:

- [ ] Pass
- [ ] Fail

Notas:

```txt

```

### 4. Favoritos Y Contacto

#### 4.1 Anadir favorito persiste

Accion:

1. Anadir una actividad a favoritos.

Esperado:

- el estado cambia correctamente

Evidencia minima:

- captura antes/despues

Resultado:

- [ ] Pass
- [ ] Fail

Notas:

```txt

```

#### 4.2 Quitar favorito persiste

Accion:

1. Quitar la misma actividad de favoritos.

Esperado:

- deja de figurar como favorita

Evidencia minima:

- captura antes/despues

Resultado:

- [ ] Pass
- [ ] Fail

Notas:

```txt

```

#### 4.3 Favoritos sobreviven a reload

Accion:

1. Anadir favorito.
2. Recargar.
3. Quitar favorito.
4. Recargar.

Esperado:

- persiste el estado remoto en ambos sentidos

Evidencia minima:

- nota del comportamiento tras reload

Resultado:

- [ ] Pass
- [ ] Fail

Notas:

```txt

```

#### 4.4 Detail con 0 contactos comunica indisponibilidad

Accion:

1. Abrir una actividad sin contactos activos.

Esperado:

- no aparece CTA falsa
- la UI comunica indisponibilidad sin crash

Evidencia minima:

- captura del estado

Resultado:

- [ ] Pass
- [ ] Fail

Notas:

```txt

```

#### 4.5 Detail con 1 contacto abre accion directa

Accion:

1. Abrir una actividad con una sola via de contacto.
2. Accionar CTA.

Esperado:

- abre la accion directa correcta
- registra el contacto si corresponde

Evidencia minima:

- captura o nota del canal usado

Resultado:

- [ ] Pass
- [ ] Fail

Notas:

```txt

```

#### 4.6 Detail con multiples contactos abre chooser

Accion:

1. Abrir una actividad con multiples vias activas.

Esperado:

- aparece chooser de contacto

Evidencia minima:

- captura del chooser

Resultado:

- [ ] Pass
- [ ] Fail
- [ ] Blocked por dataset

Notas:

```txt

```

#### 4.7 Se escriben eventos de view/contact

Accion:

1. Abrir detail.
2. Accionar contacto.
3. Verificar tablas o reporting segun acceso disponible.

Esperado:

- se escriben `activity_view_events`
- se escriben `activity_contact_events`

Evidencia minima:

- query o confirmacion operativa

Resultado:

- [ ] Pass
- [ ] Fail

Notas:

```txt

```

### 5. Draft Inbox

#### 5.1 Ruta interna abre con usuario autorizado

Accion:

1. Entrar con usuario interno autorizado.
2. Abrir `/internal/drafts`.

Esperado:

- la ruta carga
- no bloquea por permisos si la fila existe

Evidencia minima:

- captura de la lista

Resultado:

- [ ] Pass
- [ ] Fail

Notas:

```txt

```

#### 5.2 Lista muestra drafts seed reales

Accion:

1. Revisar Draft Inbox tras la seed.

Esperado:

- hay drafts visibles y consistentes

Evidencia minima:

- captura de drafts visibles

Resultado:

- [ ] Pass
- [ ] Fail

Notas:

```txt

```

#### 5.3 Guardar revision funciona

Accion:

1. Abrir draft.
2. Editar payload revisable.
3. Guardar.

Esperado:

- guarda sin romper flujo

Evidencia minima:

- captura del feedback o estado persistido

Resultado:

- [ ] Pass
- [ ] Fail

Notas:

```txt

```

#### 5.4 Rechazar funciona

Accion:

1. Rechazar un draft pendiente.

Esperado:

- cambia el estado
- el feedback es coherente

Evidencia minima:

- captura del estado rechazado

Resultado:

- [ ] Pass
- [ ] Fail

Notas:

```txt

```

#### 5.5 Aprobar crea actividad real

Accion:

1. Aprobar un draft pendiente.

Esperado:

- se crea actividad real
- queda vinculo con draft

Evidencia minima:

- id creada o captura del handoff

Resultado:

- [ ] Pass
- [ ] Fail

Notas:

```txt

```

### 6. Approved Activity Lifecycle

#### 6.1 Abrir actividad aprobada vinculada funciona

Accion:

1. Desde un draft aprobado, abrir la actividad vinculada.

Esperado:

- carga la pagina interna de actividad aprobada

Evidencia minima:

- captura de la pagina cargada

Resultado:

- [ ] Pass
- [ ] Fail

Notas:

```txt

```

#### 6.2 Editar y guardar funciona

Accion:

1. Editar actividad aprobada.
2. Guardar cambios.

Esperado:

- los cambios se guardan sin romper el vinculo editorial

Evidencia minima:

- feedback de guardado o relectura correcta

Resultado:

- [ ] Pass
- [ ] Fail

Notas:

```txt

```

#### 6.3 Despublicar saca la actividad del catalogo real

Accion:

1. Despublicar actividad aprobada.
2. Volver al catalogo publico.

Esperado:

- la actividad desaparece del catalogo real

Evidencia minima:

- captura antes/despues o query

Resultado:

- [ ] Pass
- [ ] Fail

Notas:

```txt

```

#### 6.4 Republicar devuelve la actividad al catalogo real

Accion:

1. Republicar la misma actividad.
2. Volver al catalogo publico.

Esperado:

- la actividad reaparece

Evidencia minima:

- captura antes/despues o query

Resultado:

- [ ] Pass
- [ ] Fail

Notas:

```txt

```

### 7. Internal Metrics

#### 7.1 `api/internal/pvi` rechaza sin token

Accion:

1. Hacer request sin bearer token valido.

Esperado:

- devuelve `401` o `403`

Evidencia minima:

- respuesta o captura

Resultado:

- [ ] Pass
- [ ] Fail

Notas:

```txt

```

#### 7.2 `api/internal/pvi` responde con token valido

Accion:

1. Hacer request con bearer token valido.

Esperado:

- devuelve payload estructurado

Evidencia minima:

- respuesta o captura

Resultado:

- [ ] Pass
- [ ] Fail

Notas:

```txt

```

#### 7.3 No reaparece el viejo `/pvi` publico

Accion:

1. Abrir `/pvi` en preview.

Esperado:

- no existe superficie publica operativa en `/pvi`

Evidencia minima:

- URL final o captura

Resultado:

- [ ] Pass
- [ ] Fail

Notas:

```txt

```

## Fix-Pass Protocol

### Clasificacion obligatoria de incidencias

Cada incidencia detectada en Gate 4 debe quedar clasificada como una de estas:

- **Bug del repo**
  - el entorno y los datos son correctos, pero el comportamiento de `main` no
    coincide con el contrato esperado
- **Gap de datos**
  - el codigo parece correcto, pero el dataset no permite validar un caso
- **Bloqueo externo**
  - falta config, acceso, permiso o apply fuera del repo
- **Drift externo**
  - el entorno real no coincide con lo versionado en repo
- **Regresion de copy o UX**
  - la funcionalidad existe, pero reaparece una degradacion visible

### Orden de ataque de fix batches

1. catalogo que no carga, media rota o fallback incorrecto
2. auth, onboarding, logout o loops de sesion
3. favoritos remotos y contacto real
4. Draft Inbox y approved lifecycle
5. `api/internal/pvi`

### Cuando vuelve a humano

Una incidencia vuelve a checkpoint humano si requiere:

- tocar paneles externos
- recrear dataset
- dar permisos en `internal_tool_access`
- reconfigurar Auth
- redeployar preview

### Cuando se considera `Blocked`

Se considera `Blocked` y no bug del repo cuando:

- el entorno correcto todavia no esta configurado
- falta acceso operativo
- el dataset minimo no existe aun
- no hay evidencia suficiente para decidir si el fallo es del repo o del entorno

## Closure Criteria

El cierre funcional real solo puede declararse cuando:

- Gates 0 a 4 quedaron cerrados o reclasificados de forma explicita
- no quedan bugs bloqueadores del repo en:
  - catalogo publico
  - auth/onboarding/logout
  - favoritos remotos
  - contacto real
  - Draft Inbox
  - approved lifecycle
  - `api/internal/pvi`
- cualquier caso `Blocked` restante esta documentado como externo y no oculta un
  bug del repo
- el checklist final refleja la realidad del entorno
- `main` y las docs cuentan la misma historia

## Supuestos Y Defaults Fijados

- artefacto final: un solo documento maestro
- ubicacion: `docs/runtime-real-closure-sdd.md`
- entorno principal: preview de Vercel
- baseline: `main`
- scope: incluye tambien Draft Inbox y approved lifecycle
- coordinacion: gates `stop/go`
- tus pasos: checkpoints humanos cortos, navegador real, evidencia
- mis pasos: analisis largo, preparacion tecnica, agrupacion de gaps, fix pass y
  cierre documental
- no se abre Scout
- no se abre Assisted Publishing Backoffice
- no se trata produccion como entorno principal hasta cerrar preview real
