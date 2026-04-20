# Real DB And Auth Migration Open Decisions

## Scope Note

Este documento recoge las decisiones abiertas que conviene cerrar antes de
pasar de mocks y fallback local a uso real de base de datos en Supabase y antes
de ampliar auth desde Google-only a Google + sign-up clasico.

No implementa nada.
Su objetivo es servir como hoja de revision con PO y como base SDD para la fase
siguiente.

## Branch Context

- Branch activo para esta hoja de decisiones: `main`
- El estado actual del repo en `main` sigue siendo la verdad sobre lo que la app
  hace hoy
- El esquema compartido de Supabase es una referencia externa ya documentada en
  [`supabase-schema-preview-2026-04-20.md`](./supabase-schema-preview-2026-04-20.md)
- El objetivo y los gaps de migracion ya estan documentados en
  [`real-db-auth-migration-sdd.md`](./real-db-auth-migration-sdd.md)

## Como Usar Esta Hoja

- Cada decision incluye contexto, impacto, opciones y recomendacion inicial.
- La recomendacion no es una decision cerrada.
- Si una decision se cierra, conviene reflejarla despues en:
  `docs/DECISIONS_LOG.md`, `docs/real-db-auth-migration-sdd.md` y, si cambia el
  estado real del producto, en los docs maestros correspondientes.

## Decision Summary

| ID | Tema | Pregunta a cerrar | Recomendacion inicial |
| --- | --- | --- | --- |
| D1 | Identidad app | `user_profiles.id` debe ser igual a `auth.users.id`? | Si, 1:1 |
| D2 | Provisioning de perfil | Como se crea `user_profiles`? | Flujo controlado del lado servidor |
| D3 | Ciudad obligatoria | Cuando pasa a ser obligatoria en el perfil real? | No usar ciudad ficticia; onboarding explicito |
| D4 | Auth clasico | Que significa "sign-up clasico" en este MVP? | Email + password |
| D5 | Verificacion email | Cuanto se exige para cuenta clasica? | Exigir verificacion antes de dejar la cuenta lista para la app |
| D6 | Cuentas duplicadas | Como se resuelve Google + clasico con mismo email? | Un solo perfil de app por persona |
| D7 | Lectura de catalogo | Leemos tablas base o creamos un read model? | Read model dedicado |
| D8 | Contrato de ciudad | El frontend sigue usando slug o pasa a id? | `city_id` como verdad persistida |
| D9 | Contacto | La CTA sale de centro o de actividad? | Prioridad a `activity_contact_options` |
| D10 | Favoritos | Hard delete o soft delete? | Hard delete en MVP, salvo necesidad real de restauracion |
| D11 | Migracion de favoritos | Que pasa con favoritos locales al primer login? | Merge una sola vez con deduplicacion |
| D12 | Analytics | Queremos favorite events reales o no en esta fase? | Primero alinear views/contacts; diferir favorite events |
| D13 | PVI | Como se lee analytics real y quien puede verlo? | Read path protegido e interno |

## Identity And Auth Decisions

### D1. Identity Rule Between Auth And App Profile

Contexto:

- La policy actual de `user_profiles` usa `auth.uid() = id`.
- Eso apunta fuerte a una relacion 1:1 entre `auth.users.id` y
  `user_profiles.id`.

Por que importa:

- afecta RLS
- afecta queries desde cliente
- afecta merge entre Google y sign-up clasico

Opciones:

1. `user_profiles.id` es exactamente el mismo UUID que `auth.users.id`
2. `user_profiles` usa un UUID distinto y guarda referencia aparte al usuario auth
3. `user_profiles` no es obligatorio para toda cuenta auth

Recomendacion inicial:

- Elegir la opcion 1.

Razon:

- encaja con las policies ya creadas
- simplifica favorites, profile y acceso por fila
- evita una capa extra de traduccion de identidades

### D2. Provisioning Mechanism For `user_profiles`

Contexto:

- No aparece `INSERT` para `user_profiles` desde cliente autenticado.
- Por tanto, el alta del perfil real no parece resuelta con el frontend actual.

Por que importa:

- sin provisioning no hay perfil real
- sin perfil real no hay una base estable para favorites ni onboarding real

Opciones:

1. Trigger automatico al crear `auth.users`
2. Edge Function o backend path controlado tras auth
3. Insercion desde cliente en primer login
4. Provisioning manual o admin-only

Recomendacion inicial:

- Elegir la opcion 2.

Razon:

- permite meter reglas de negocio reales
- maneja mejor Google y sign-up clasico
- evita confiar en un insert directo desde cliente que hoy no esta habilitado

### D3. When City Becomes Mandatory In The Real Profile

Contexto:

- `user_profiles.city_id` hoy aparece como obligatorio en la DB compartida.
- El flujo actual de la app recoge ciudad despues del login.

Por que importa:

- condiciona el alta real del perfil
- condiciona Google login y signup clasico
- condiciona si hace falta cambiar schema o cambiar onboarding

Opciones:

1. Crear perfil solo cuando la ciudad ya fue elegida
2. Permitir `city_id` nulo hasta completar onboarding
3. Usar una ciudad placeholder o ficticia al crear el perfil
4. Pedir ciudad dentro del formulario de sign-up y tambien en primer acceso social

Recomendacion inicial:

- Preferir la opcion 1 o 2.
- Evitar la opcion 3.

Razon:

- una ciudad falsa contamina datos
- el flujo actual ya asume onboarding posterior al login
- la decision correcta depende de si el schema puede relajarse o no

### D4. What "Classic Sign-Up" Means In This MVP

Contexto:

- El objetivo pedido ya no es Google-only.
- Hace falta concretar el segundo camino de alta.

Por que importa:

- cambia UX
- cambia configuracion de Supabase Auth
- cambia mensajes y recovery flows

Opciones:

1. Google + email/password
2. Google + magic link
3. Google + email/password + magic link

Recomendacion inicial:

- Elegir la opcion 1.

Razon:

- es la lectura mas directa de "sign-up clasico"
- mantiene el alcance bajo control
- evita abrir demasiados caminos auth en la primera ampliacion

### D5. Email Verification Policy For Classic Sign-Up

Contexto:

- Sign-up clasico necesita una politica clara de verificacion.

Por que importa:

- afecta onboarding
- afecta seguridad
- afecta soporte y mensajes de error

Opciones:

1. Exigir verificacion antes de permitir uso real de la app
2. Permitir sesion inmediata pero bloquear acciones protegidas hasta verificar
3. No exigir verificacion en esta fase MVP

Recomendacion inicial:

- Elegir la opcion 1 o 2.
- Evitar la opcion 3 salvo decision consciente de riesgo.

Razon:

- reduce cuentas basura
- mantiene una base mas limpia para perfiles y favoritos
- Google normalmente ya llega con email fuerte

### D6. Duplicate Email And Account Linking Policy

Contexto:

- La misma persona podria intentar entrar con Google y tambien crear cuenta
  clasica con el mismo email.

Por que importa:

- puede duplicar perfiles
- puede romper favorites y estado de cuenta
- puede crear deuda dificil de resolver despues

Opciones:

1. Una sola identidad de app por email y se bloquean duplicados
2. Una sola identidad de app por email y se soporta linking explicito
3. Se permiten cuentas paralelas por provider

Recomendacion inicial:

- Elegir la opcion 1 ahora y dejar la 2 para una fase posterior si hace falta.

Razon:

- evita duplicados desde el principio
- es mas simple que soportar linking completo ya
- la opcion 3 complica innecesariamente perfiles, favoritos y soporte

## Catalog And Content Decisions

### D7. Catalog Read Contract

Contexto:

- El frontend actual depende de un shape enriquecido que no coincide 1:1 con
  las tablas normalizadas.

Por que importa:

- afecta Home
- afecta filtros
- afecta detalle
- afecta cuanta logica de join se reparte por frontend

Opciones:

1. Leer tablas base publicas directamente desde React
2. Crear una vista SQL o read model dedicado para catalogo
3. Hacer joins y normalizacion solo en frontend como capa temporal

Recomendacion inicial:

- Elegir la opcion 2.

Razon:

- reduce acoplamiento del frontend a la normalizacion interna
- evita exponer mas columnas crudas de las necesarias
- simplifica futuras evoluciones del modelo

### D8. City Contract In Frontend

Contexto:

- El frontend actual usa `city_slug`.
- La DB compartida solo confirma `cities.id` y `cities.name`.

Por que importa:

- afecta filtros
- afecta onboarding de ciudad
- afecta cualquier futura URL amigable por ciudad

Opciones:

1. Mantener slug como campo persistido real en DB
2. Pasar a `city_id` como verdad persistida y derivar slug solo si hace falta
3. Derivar slug siempre en frontend y no guardarlo nunca

Recomendacion inicial:

- Elegir la opcion 2.

Razon:

- `city_id` ya existe y es la clave estable
- reduce dependencia de un campo que hoy no esta confirmado
- deja slug como capa de presentacion o SEO, no como verdad base

### D9. Contact Source Priority

Contexto:

- Hoy la app usa un numero fijo de WhatsApp.
- La DB real tiene datos de contacto en `centers` y en
  `activity_contact_options`.

Por que importa:

- afecta CTA de detalle
- afecta precision del contacto
- afecta mantenimiento de datos

Opciones:

1. Usar solo contacto a nivel centro
2. Usar solo `activity_contact_options`
3. Usar `activity_contact_options` con fallback a centro
4. Mantener numero fijo en frontend

Recomendacion inicial:

- Elegir la opcion 3.

Razon:

- permite especificidad por actividad
- conserva fallback razonable
- elimina el acoplamiento al numero fijo hardcodeado

## Favorites And Analytics Decisions

### D10. Delete Semantics For Favorites

Contexto:

- `user_favorite_activities` tiene columnas de soft delete.
- Las policies compartidas hoy exponen `DELETE`, no `UPDATE`.

Por que importa:

- afecta implementacion cliente
- afecta auditoria
- afecta si luego se quiere restaurar favoritos

Opciones:

1. Hard delete real al quitar favorito
2. Soft delete con `is_deleted = true`
3. Soft delete con trigger que transforme deletes

Recomendacion inicial:

- Elegir la opcion 1 para MVP salvo necesidad clara de auditoria o restore.

Razon:

- encaja con la seguridad compartida hoy
- simplifica cliente y queries
- evita abrir un frente extra sin evidencia de necesidad

### D11. Migration Rule For Existing Local Favorites

Contexto:

- Hoy favorites viven en `localStorage`.
- La DB ya tiene tabla real por usuario.

Por que importa:

- afecta experiencia del primer login
- afecta perdida o duplicacion de datos

Opciones:

1. Merge una sola vez al primer login autenticado
2. Ignorar favoritos locales y empezar vacio en remoto
3. Preguntar al usuario que quiere hacer

Recomendacion inicial:

- Elegir la opcion 1.

Razon:

- preserva valor ya creado por el usuario
- evita decision extra en UX
- es la migracion mas amable para MVP si se deduplica por `activity_id`

### D12. Analytics Scope In This Migration

Contexto:

- La DB real compartida confirma `activity_view_events` y
  `activity_contact_events`.
- No se confirmo una tabla real para favorite add/remove events.

Por que importa:

- afecta `/pvi`
- afecta alcance de tracking
- afecta si se redisena analytics o se intenta forzar el contrato viejo

Opciones:

1. En esta fase solo migrar view/contact events
2. Crear tambien favorite events en backend ahora
3. Inferir favoritos desde `user_favorite_activities` y no guardar favorite events

Recomendacion inicial:

- Elegir la opcion 1 ahora.
- Revaluar la 3 para reporting posterior.

Razon:

- alinea la app con lo que hoy existe de verdad
- reduce alcance
- evita inventar analytics que todavia no tienen contrato real

### D13. Real Read Path And Visibility For PVI

Contexto:

- Las tablas de eventos compartidas permiten `INSERT`, pero no `SELECT` desde
  cliente.
- Eso choca con el `/pvi` actual, que lee desde navegador.

Por que importa:

- afecta seguridad
- afecta si `/pvi` puede seguir siendo publico
- afecta la arquitectura del dashboard

Opciones:

1. Abrir `SELECT` directo desde cliente con nuevas policies
2. Mantener lectura protegida mediante backend, vista protegida o read model
3. Posponer `/pvi` y dejar solo tracking sin dashboard

Recomendacion inicial:

- Elegir la opcion 2.

Razon:

- evita exponer tablas de eventos crudas en browser
- encaja mejor con una superficie interna
- deja margen para agregaciones y contratos mas estables

## Suggested Review Order

1. D1, D2, D3
2. D4, D5, D6
3. D7, D8, D9
4. D10, D11
5. D12, D13

## Decisions That Most Directly Block Implementation

- D1
- D2
- D3
- D4
- D7
- D13

## Closure Reading For This Document

- Current runtime behavior: unchanged
- Spec clarity: improved
- Product/technical decision visibility: improved
- Ready for PO review: yes
