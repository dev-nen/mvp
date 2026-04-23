# ROADMAP MASTER

## Scope Note

Este documento define el mapa maestro actual de NensGo contra el estado real de
`main`.

Baseline revisada el 23 de abril de 2026, despues de absorber en `main` el trabajo
que antes vivia en:

- `feat/real-db-auth-migration`
- `feat/internal-draft-inbox`
- `feature/auth-base-mvp2`
- `feature/nensgo-mvp-2.0`

Si una narrativa historica contradice el repo actual, manda `main`.

## 1. Proposito Del ROADMAP MASTER

Este documento es:

- el mapa maestro estrategico-operativo del proyecto
- la capa superior de direccion para producto, arquitectura y futuras specs SDD
- el lugar donde se separan producto principal, capabilities internas,
  transiciones absorbidas y futuro condicionado

Este documento no es:

- backlog
- lista de tickets
- changelog
- sustituto de una SDD de implementacion

Como debe usarse:

- leer primero este documento para entender la direccion real del proyecto
- usar `ROADMAP_IMPLEMENTATION.md` para el orden operativo cercano
- abrir futuras SDD solo cuando un bloque quede suficientemente maduro aqui

## 2. Principios De Lectura

- La verdad actual del repo en `main` vale mas que la narrativa historica.
- Roadmap principal de producto y tooling interno no son la misma cosa.
- Las transiciones absorbidas deben seguir visibles cuando aun explican
  constraints vigentes, pero no deben seguir tratandose como fases activas.
- El hecho de que algo exista en codigo no significa que este `Done`; puede
  seguir `Partial` si depende de configuracion, validacion o cierre funcional.
- El hecho de que algo exista en docs no lo convierte en fase madura.
- NensGo no debe seguir exponiendo debug, reporting interno o copy de
  diagnostico en superficies publicas.

## 3. Estado Actual Real Del Proyecto

Lectura breve de `main` hoy:

- El producto publico ya no corre sobre mocks como verdad principal.
- Catalogo, favoritos, auth, perfil, contacto y analytics de escritura ya
  estan alineados a contratos reales en Supabase.
- Draft Inbox y approved activity lifecycle ya existen en repo y runtime
  interno, pero siguen `Partial` por dependencia de SQL, permisos y smoke real.
- `Scout` sigue siendo una linea `Planned`; hoy no existe en runtime.
- `Assisted Publishing Backoffice` hoy existe a nivel conceptual en la
  recopilacion externa, no como capability versionada del repo.
- `/pvi` sigue siendo una ruta publica placeholder con copy interna, aunque el
  reporting real ya esta protegido por `/api/internal/pvi`.

Para el snapshot de detalle, ver [PROJECT_STATE.md](./PROJECT_STATE.md).

## 4. Estructura General Del Roadmap Maestro

### A. Roadmap principal de producto

Evolucion principal de NensGo como producto familiar y de descubrimiento.

### B. Workstreams y capabilities internas

Lineas internas reales o proyectadas que soportan operacion, ingesta,
publishing o tooling editorial.

### C. Historial absorbido y transiciones relevantes

Capas ya integradas que no deben seguir tratandose como roadmap abierto, pero
siguen explicando dependencias actuales.

### D. Guardrails transversales de madurez

Reglas que afectan varias fases a la vez y que deben orientar implementacion y
hardening.

## 5. Roadmap Principal Reordenado

### 5.1 Historial absorbido que sigue importando

Estas lineas ya no deben presentarse como fases vivas, pero siguen explicando
por que `main` esta donde esta:

- MVP 1.0 -> MVP 2.0:
  establecio la evolucion desde demo funcional hacia producto con mas
  coherencia, catalogo, detalle, favoritos y validacion privada.
- Auth base MVP 2.0:
  introdujo identidad minima real y dejo de tratar la app como experiencia solo
  anonima.
- Real DB/Auth migration:
  movio el runtime a contratos reales de Supabase y redefinio perfil,
  favoritos, contacto y analytics.

### 5.2 Fase principal actual real

La fase principal actual del producto no es "hacer mas features".

La fase real es:

- consolidacion del runtime ya integrado en `main`
- readiness externa de Supabase Auth, SQL y secrets
- validacion privada integral end-to-end
- hardening de superficies publicas antes de ensenar mas producto

### 5.3 Fase siguiente recomendada del producto principal

Una vez cerrada la consolidacion actual, la siguiente fase logica es:

- endurecer la presentacion publica
- retirar superficies publicas con copy interna o de diagnostico
- dejar una base mas profesional para seguir creciendo sin ambiguedad entre
  producto visible y tooling interno

### 5.4 Fases posteriores

Solo despues del cierre anterior tiene sentido abrir nuevas lineas mayores como:

- evolucion publica y de oferta
- nuevas capacidades del lado publishing
- capas internas mas sofisticadas de ingesta o acompanamiento editorial

## 6. Estado Real Contra Roadmap

| Bloque | Tipo | Estado | Lectura real actual | Donde vive hoy | Prioridad real | Readiness SDD |
| --- | --- | --- | --- | --- | --- | --- |
| MVP 1.0 -> MVP 2.0 baseline publica | Transicion absorbida | `Done` | La base publica del producto ya esta absorbida y ya no debe tratarse como roadmap activo | `main` + docs historicas | Baja como roadmap, alta como contexto | No aplica como nueva SDD |
| Auth base MVP 2.0 | Transicion absorbida | `Done` | La fase base de auth ya fue absorbida; el trabajo activo ya no es "poner login", sino validar y endurecer el modelo real | `main` + `auth-base-mvp2.md` | Baja | No aplica como nueva SDD |
| Runtime real DB/Auth/catalog/favoritos | Roadmap principal | `Partial` | El runtime real ya existe en `main`, pero sigue pendiente de SQL apply, auth config y validacion end-to-end | `main` + docs maestras | Muy alta | Listo para SDD de cierre/hardening |
| Validacion privada integral | Roadmap principal | `In progress` | Ya existen smoke docs y un checkpoint integrado, pero no hay cierre funcional probado contra entorno real | `main` + tests manuales | Muy alta | Listo para SDD corta |
| Hardening publico y madurez de superficies | Roadmap principal | `Planned` | La necesidad es real hoy, especialmente por `/pvi` publico y copy interna visible | `main` + `deployment-hardening-staging.md` | Muy alta | Listo para SDD corta |
| Draft Inbox Phase 1 | Capability interna | `Partial` | Existe en codigo, SQL y rutas internas, pero depende de SQL, permisos, seed y smoke real | `main` + docs Scout/Draft Inbox | Alta | Casi listo; bloqueado por readiness real |
| Approved activity lifecycle | Capability interna | `Partial` | Existe en runtime interno y SQL fase 2, pero sigue sin validacion real contra catalogo publico | `main` + docs lifecycle | Alta | Casi listo; bloqueado por readiness real |
| Scout Manual v0 | Capability interna | `Planned` | Existe en docs y estrategia, no en runtime | Docs versionadas | Media futura | No listo; depende de cerrar Draft Inbox |
| Structured Scout connectors | Capability interna | `Planned` | Solo existe a nivel de estrategia y orden recomendado | Docs versionadas | Media futura | No listo; depende de Manual v0 y metricas |
| Assisted Publishing Backoffice | Capability interna | `Planned` | Definido conceptualmente en Confluence compilado, aun no consolidado en docs canonicas del repo | `.md` externo | Media futura | No listo; requiere cierre funcional previo |

## 7. Linea Interna Draft Inbox / Scout

## Que es cada cosa

- `Draft Inbox`: superficie interna de revision editorial para drafts.
- `Approved activity lifecycle`: capa interna para editar, despublicar y
  republicar actividades ya aprobadas desde Draft Inbox.
- `Scout`: futura capa de ingesta asistida que convierte fuentes externas en
  drafts revisables.

## Que existe hoy de verdad

- Rutas internas en `main` para Draft Inbox y approved activities.
- SQL versionado para `activity_drafts`, `internal_tool_access`,
  `approve_activity_draft(...)` y lifecycle RPCs.
- Servicios, guard, review UI y manual smoke docs.

## Que sigue parcial

- Aplicacion de SQL en Supabase.
- Alta real de usuarios internos autorizados.
- Seed real de drafts.
- Smoke end-to-end contra read model publico.

## Que sigue solo documentado

- Scout Manual v0.
- Conectores estructurados.
- Conectores semiestructurados.
- OCR o image-first ingestion como fases posteriores.

## Secuencia correcta

1. Validar Draft Inbox y approved activity lifecycle en entorno real.
2. Cerrar una primera lectura estable de su utilidad operativa.
3. Abrir Scout Manual v0.
4. Solo despues abrir conectores estructurados.
5. Dejar OCR y image-first para mas adelante.

## Readiness para futura SDD

| Bloque | Lectura de readiness |
| --- | --- |
| Draft Inbox MVP | Casi listo, pero no debe tratarse como `Done` hasta cerrar SQL, permisos y smoke real |
| Approved activity lifecycle | Casi listo, pero bloqueado por validacion real del desaparecer/reaparecer en catalogo |
| Scout Manual v0 | No listo; depende del cierre operativo de Draft Inbox |
| Structured connectors | No listo; depende de Manual v0 y metricas de utilidad editorial |

## 8. Linea Interna Assisted Publishing Backoffice

## Que problema resuelve

Resolver la carga asistida en vivo cuando el equipo de NensGo esta hablando con
un publicador, centro o institucion y necesita formalizar el alta dentro del
sistema sin improvisar un flujo paralelo.

## Como se diferencia del resto

- `Scout` capta o interpreta fuentes externas.
- `Draft Inbox` revisa drafts.
- `Assisted Publishing Backoffice` acompana y formaliza altas en vivo con
  ownership y validacion posterior.

## Nivel actual de definicion

Lectura actual:

- problema: claro
- usuario inicial: claro
- diferencia frente a Scout y Draft Inbox: clara
- implementacion funcional: no cerrada

Por eso su estado en el roadmap maestro debe ser `Planned`.

## Dependencias minimas antes de una SDD

- decidir si crea draft o actividad real
- definir datos minimos obligatorios
- modelar ownership/asignacion a publicador
- definir consentimiento o validacion posterior
- cerrar reglas de permisos internos

## Readiness para futura SDD

No listo todavia.

La capability ya merece bloque propio en el roadmap maestro, pero todavia no
merece una SDD de implementacion sin antes cerrar el flujo funcional base.

## 9. Politica Transversal De Debug / Observabilidad

## Politica

NensGo no debe seguir exponiendo debug, reporting interno ni copy de
diagnostico en superficies visibles del frontend publico.

## Evidencia actual

- `/pvi` sigue siendo una ruta publica placeholder.
- La copy de esa ruta sigue exponiendo lenguaje de uso interno y diagnostico.
- El reporting real ya vive en `/api/internal/pvi` con proteccion.

## Lectura de roadmap

Esto no es una nota cosmetica.

Debe tratarse como:

- un guardrail transversal permanente
- y una mini-linea urgente de hardening dentro de la fase actual

## Recomendacion razonable

- diagnostico por logs
- rutas y APIs internas protegidas
- reporting privado para PO y DEV
- observability baseline minima, no dashboard publica improvisada

## Urgencia y readiness

- urgencia: alta
- readiness SDD: lista para una futura SDD corta de hardening/cleanup

## 10. Impacto De Decisiones Externas Ya Cerradas

| Decision cerrada | Como cambia el roadmap |
| --- | --- |
| `user_profiles` como verdad de app | Auth deja de ser una fase de login y pasa a depender de perfil valido y provisioning controlado |
| Provisioning controlado servidor | El roadmap actual prioriza readiness y validacion, no expansion ingenua desde cliente |
| `city_id` como verdad persistida | Onboarding y perfil dejan de ser accesorios; son gate real de uso |
| Google + email/password + verificacion de email | La capa de auth ya no es roadmap verde; es cierre operativo y de configuracion |
| Read model dedicado de catalogo | El producto principal ya esta montado sobre runtime real; no toca volver a pensar en mocks como baseline |
| Contacto por `activity_contact_options` | La calidad de datos del backend pasa a afectar directamente la experiencia publica |
| Favoritos con hard delete y sin migracion local | La vieja discusion de migrar favoritos locales queda absorbida; no debe seguir ocupando roadmap principal |
| Analytics solo views/contacts y PVI interna | No tiene sentido abrir ahora un roadmap de dashboard publica; toca endurecer la via interna y retirar lo visible |

## 11. Esfuerzo Humano Estimado

Estas estimaciones son prudentes.

- Sin IA/Codex: lectura de esfuerzo humano clasico con documentacion y
  scaffolding manual.
- Con IA/Codex: lectura de esfuerzo asistido para consolidacion, documentacion,
  scaffolding y parte del desarrollo guiado.
- Ninguna de las dos lecturas elimina validacion humana, QA real, decisiones
  externas ni cierre con PO.

| Bloque | Objetivo | Incertidumbre | Sin IA / Codex | Con IA / Codex | Factor principal de coste | Dependencia externa principal |
| --- | --- | --- | --- | --- | --- | --- |
| Consolidacion y validacion privada del runtime real | Cerrar readiness de `main` y validar catalogo, auth, favoritos y gates | Media | `M-L` (`1.5-3 semanas`) | `S-M` (`1-2 semanas`) | Configuracion + QA manual | Supabase Auth, SQL y Vercel secrets |
| Hardening publico y observability baseline minima | Retirar superficies publicas con copy interna y dejar diagnostico profesional minimo | Media | `S-M` (`3-6 dias`) | `S` (`2-4 dias`) | Definir el recorte correcto sin romper review interna | Decisiones de PO sobre visibilidad publica |
| Cierre funcional de Draft Inbox + approved lifecycle | Pasar de codigo integrado a workflow real validado | Media-alta | `M-L` (`1.5-3 semanas`) | `M` (`1-2 semanas`) | SQL, permisos, smoke y ajustes de cierre | Supabase SQL, usuarios internos reales |
| Scout Manual v0 | Crear la primera carga manual asistida hacia drafts | Media | `M` (`1-2 semanas`) | `S-M` (`4-8 dias`) | Ajustar el landing zone sin sobreabrir alcance | Draft Inbox ya validado |
| Primer conector Scout estructurado | Validar una primera fuente reutilizable de baja ambiguedad | Media | `S-M` (`4-8 dias`) | `XS-S` (`2-5 dias`) | Normalizacion y limpieza del contrato comun | Disponibilidad y estabilidad de la fuente |
| Assisted Publishing Backoffice MVP | Formalizar alta asistida, ownership y consentimiento posterior | Alta | `L` (`2-4 semanas`) | `M-L` (`1.5-3 semanas`) | Cierre funcional y de permisos, no scaffolding | Reglas de publicador, consentimiento y modelo de asignacion |

## 12. Readiness Para SDD De Implementacion

| Bloque | Readiness | Bloqueado por |
| --- | --- | --- |
| Consolidacion y hardening de `main` | Listo para SDD | No bloqueado a nivel conceptual; solo requiere bajar alcance correcto |
| Validacion privada integral | Listo para SDD | No bloqueado a nivel conceptual; depende de entorno y checklist |
| Draft Inbox + approved lifecycle | Casi listo para SDD de cierre | SQL apply, permisos internos, seed y smoke real |
| Scout Manual v0 | No listo | Cierre operativo previo de Draft Inbox |
| Structured Scout connectors | No listo | Manual v0 y metricas de utilidad editorial |
| Assisted Publishing Backoffice | No listo | Falta cerrar el flujo funcional y sus reglas base |

## 13. Riesgos De Coherencia

- seguir leyendo el roadmap viejo como si `main` no hubiera absorbido el trabajo
- mezclar producto familiar visible con tooling interno como si fueran una sola
  fase
- tratar Draft Inbox como fase cerrada cuando todavia sigue `Partial`
- abrir Scout demasiado pronto por entusiasmo documental
- dejar Assisted Publishing Backoffice como nota lateral en vez de capability
  interna diferenciada
- tolerar copy interna o de diagnostico visible en frontend publico

## 14. Siguiente Fase Logica Recomendada

### Recomendacion principal

Abrir una SDD corta de consolidacion y hardening de `main` que agrupe:

- readiness externa pendiente
- validacion privada end-to-end
- cierre de Draft Inbox y approved lifecycle en entorno real
- retiro de superficies publicas con copy interna o de diagnostico

### Recomendacion secundaria

Solo despues de ese cierre, abrir Scout Manual v0 como siguiente capability
interna con sentido operativo.
