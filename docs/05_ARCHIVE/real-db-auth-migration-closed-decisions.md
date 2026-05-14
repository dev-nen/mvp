# Real DB And Auth Migration Closed Decisions

## Scope Note

Este documento cierra las decisiones abiertas necesarias para avanzar desde
mocks y fallback local hacia uso real de base de datos en Supabase, y para
ampliar auth desde Google-only a Google + sign-up clasico.

No implementa cambios.
Su objetivo es dejar cerradas las decisiones de producto y arquitectura que
habilitan la siguiente fase de implementacion.

## Branch Context

- Branch actual de referencia: `main`
- El estado actual de `main` sigue siendo la verdad de runtime hasta que se
  implemente la siguiente fase
- El esquema compartido de Supabase sigue siendo referencia externa
- Este documento actua como respuesta de PO para cerrar las decisiones abiertas
  de migracion

## Relationship To Existing Migration Docs

- Este documento responde y cierra la hoja abierta en
  [`real-db-auth-migration-open-decisions.md`](./real-db-auth-migration-open-decisions.md)
- El contexto tecnico y de gaps sigue en
  [`real-db-auth-migration-sdd.md`](./real-db-auth-migration-sdd.md)
- El snapshot del esquema y seguridad sigue en
  [`supabase-schema-preview-2026-04-20.md`](./supabase-schema-preview-2026-04-20.md)

## Decision Summary

| ID | Tema | Decision tomada |
| --- | --- | --- |
| D1 | Identidad app | `user_profiles.id = auth.users.id` en relacion 1:1 |
| D2 | Provisioning de perfil | Provisioning controlado del lado servidor |
| D3 | Ciudad obligatoria | El perfil solo es valido cuando ya existe ciudad; sin ciudad no hay acceso normal |
| D4 | Auth clasico | Google + email/password |
| D5 | Verificacion email | Verificacion obligatoria antes de uso real de la app |
| D6 | Cuentas duplicadas | Una sola identidad por email; no se permiten duplicados |
| D7 | Lectura de catalogo | Read model dedicado |
| D8 | Contrato de ciudad | `city_id` como verdad persistida |
| D9 | Contacto | Solo `activity_contact_options` |
| D10 | Favoritos | Hard delete |
| D11 | Migracion favoritos locales | No se migran; se empieza de cero |
| D12 | Analytics | En esta fase solo views y contacts |
| D13 | PVI / metricas | Lectura protegida e interna; sin vista web abierta en esta fase |

## Identity And Auth Decisions

### D1. Identity Rule Between Auth And App Profile

Decision tomada:

- `user_profiles.id` sera exactamente el mismo UUID que `auth.users.id`, en
  una relacion 1:1

Motivo:

- simplifica RLS
- simplifica acceso por fila
- simplifica queries desde cliente
- simplifica manejo de identidad unica por usuario en la app

Consecuencia:

- toda cuenta valida de Auth debera corresponder a un unico perfil de aplicacion

### D2. Provisioning Mechanism For `user_profiles`

Decision tomada:

- `user_profiles` se provisionara mediante un flujo controlado del lado
  servidor tras la autenticacion

Motivo:

- el alta real requiere aplicar reglas de negocio de la app
- el rol inicial obligatorio es `user`
- `city_id` es obligatorio desde creacion
- se deja abierta la capacidad futura de evolucion a otros tipos de cuenta
  mediante un flujo adicional controlado

Consecuencia:

- el frontend no insertara directamente perfiles en `public.user_profiles`
- los cambios de rol no se resolveran desde cliente

Aclaracion funcional importante:

- toda cuenta nace como `user`
- mas adelante podra evolucionar a otro tipo de cuenta
- ese cambio requerira un flujo adicional controlado y no sera libre ni
  automatico desde cliente

### D3. When City Becomes Mandatory In The Real Profile

Decision tomada:

- el perfil real de aplicacion solo se considerara valido y completo cuando la
  ciudad ya haya sido informada

Motivo:

- la ciudad es parte core del producto
- no debe resolverse con valores ficticios
- no debe aceptarse como estado normal un perfil incompleto

Consecuencia:

- no se considerara lista para uso normal una cuenta que no tenga `city_id`
  valido

Nota de resiliencia del onboarding:

- se contempla la posibilidad de fallo parcial entre Auth y provisioning del
  perfil
- si existe usuario autenticado pero no existe `user_profiles`, o existe pero
  falta `city_id`, la app no permitira continuar al flujo normal y debera
  redirigir al onboarding obligatorio hasta completar el perfil

Regla operativa:

- la ausencia de ciudad no se tratara como un estado normal del producto, sino
  como un estado incompleto que debe recuperarse antes de continuar

### D4. What "Classic Sign-Up" Means In This MVP

Decision tomada:

- en este MVP, "sign-up clasico" significa `email + password`

Motivo:

- es la interpretacion mas directa del requerimiento
- mantiene el alcance bajo control

Consecuencia:

- la ampliacion de auth cubrira:
  - Google
  - email/password
- magic link queda fuera de esta fase

### D5. Email Verification Policy For Classic Sign-Up

Decision tomada:

- para el sign-up clasico con email/password se exigira verificacion de email
  antes de considerar la cuenta lista para uso real en la app

Motivo:

- mejora la calidad de la base de usuarios
- reduce cuentas erroneas o basura
- mantiene una base mas fiable para perfiles, favoritos y evolucion futura de
  cuenta

Consecuencia:

- el flujo de email/password debera contemplar envio, reenvio y confirmacion de
  email antes de dejar avanzar al flujo normal de la aplicacion

Relacion entre D5 y D3:

- no deben mezclarse dos validaciones distintas:
  - email verificado
  - perfil valido y completo con ciudad
- ambas pueden bloquear el acceso normal a la app, pero por motivos diferentes

Orden logico de control:

1. verificar email
2. validar si el perfil existe y esta completo
3. si falta perfil o falta `city_id`, forzar onboarding antes de permitir el
   flujo normal

Nota:

- no hace falta cerrar aqui el detalle fino de UX
- si hace falta dejar claro que son dos compuertas separadas

### D6. Duplicate Email And Account Linking Policy

Decision tomada:

- se mantendra una sola identidad de app por email
- no se permitiran duplicados en esta fase

Motivo:

- evita perfiles paralelos
- reduce complejidad en favoritos y soporte
- mantiene el modelo de identidad bajo control en MVP

Consecuencia:

- el linking explicito entre providers queda fuera de esta fase
- podra evaluarse mas adelante si aparece una necesidad real

## Catalog And Content Decisions

### D7. Catalog Read Contract

Decision tomada:

- el frontend consumira el catalogo a traves de un read model dedicado
- no leera directamente las tablas base normalizadas

Motivo:

- reduce acoplamiento entre frontend y modelo interno
- simplifica Home, filtros y detalle
- permite exponer solo el shape necesario para la app

Consecuencia:

- debera definirse un contrato de lectura estable para catalogo antes de
  sustituir el fallback local por datos reales

### D8. City Contract In Frontend

Decision tomada:

- la verdad persistida de ciudad sera `city_id`

Motivo:

- es la clave estable ya presente en el modelo
- simplifica relaciones
- evita depender de un campo de presentacion como slug para persistencia real

Consecuencia:

- el slug queda como capa derivada para routing, presentacion o SEO si hiciera
  falta
- el slug no sera la verdad base de la aplicacion

### D9. Contact Source Priority

Decision tomada:

- la CTA de contacto usara unicamente `activity_contact_options`

Motivo:

- cada actividad debe definir explicitamente sus canales de contacto
- el comportamiento del CTA depende de esa configuracion especifica

Regla funcional:

- si la actividad tiene una sola opcion de contacto activa, el boton ejecuta
  directamente esa accion
- si la actividad tiene mas de una opcion de contacto activa, se mostrara un
  modal con todas las opciones disponibles
- si la actividad no tiene ninguna opcion activa, la actividad no tendra CTA de
  contacto operativa

Comportamiento por tipo de contacto:

- `whatsapp` -> abrir WhatsApp con texto predeterminado
- `email` -> abrir cliente de correo con datos predefinidos
- `phone` -> abrir pantalla de llamada con numero precargado
- `form` -> redirigir al formulario
- `web` -> redirigir a la web correspondiente

Consecuencia:

- no habra fallback a centro
- no habra numero fijo hardcodeado
- el read model y la UI deberan contemplar cantidad y tipo de opciones de
  contacto por actividad

## Favorites And Analytics Decisions

### D10. Delete Semantics For Favorites

Decision tomada:

- al quitar un favorito se realizara hard delete real sobre
  `user_favorite_activities`

Motivo:

- simplifica implementacion
- simplifica queries
- simplifica seguridad en una funcionalidad que no requiere por ahora
  restauracion ni historial operativo

Consecuencia:

- no se tratara en esta fase como una entidad con ciclo de vida recuperable
- si mas adelante aparece una necesidad real de restore o reporting historico,
  podra reevaluarse

### D11. Migration Rule For Existing Local Favorites

Decision tomada:

- no se migraran favoritos locales al primer login

Motivo:

- esta fase se considera un arranque limpio
- no se prioriza conservar estado local previo

Consecuencia:

- la persistencia remota de favoritos comenzara desde cero
- no se implementara logica de merge desde `localStorage` en esta fase

### D12. Analytics Scope In This Migration

Decision tomada:

- en esta fase solo se alinearan los analytics reales ya confirmados para:
  - `activity_view_events`
  - `activity_contact_events`

Motivo:

- reduce alcance
- adapta la app a lo que hoy existe realmente en backend
- evita introducir contratos nuevos de analytics para favoritos en esta
  migracion

Consecuencia:

- los eventos de favoritos quedan fuera de esta fase
- podran reevaluarse mas adelante si aparece una necesidad real de reporting o
  analisis de comportamiento

### D13. Real Read Path And Visibility For PVI

Decision tomada:

- la lectura de analytics se realizara mediante un path protegido e interno
- no habra `SELECT` directo desde cliente sobre tablas de eventos
- no se habilitara una vista web abierta de metricas en esta fase

Motivo:

- evita exponer datos crudos en browser
- permite construir reporting controlado
- encaja con una superficie interna de uso restringido

Alcance real en esta fase:

- las metricas seran de uso exclusivo de PO y DEV
- no se habilitara acceso a otras cuentas
- no se abrira una vista web de metricas para usuarios finales
- hasta que existan usuarios tipo empresa con permisos reales de publicacion,
  no se expondra ninguna superficie web de metricas para terceros

Consecuencia:

- en esta etapa solo interesa poder extraer informacion para reporting interno
- no se habilitara un dashboard abierto a otras cuentas
- cualquier futura visibilidad externa de metricas debera tratarse como una
  decision posterior, ligada a la existencia de usuarios empresa y permisos
  asociados

## Suggested Implementation Priorities Derived From These Decisions

Orden logico recomendado para la siguiente fase:

1. cerrar identidad y provisioning real de perfil: D1, D2, D3
2. ampliar auth a Google + email/password con verificacion: D4, D5, D6
3. definir read model estable de catalogo y contrato de ciudad/contacto: D7,
   D8, D9
4. conectar favoritos persistidos con hard delete: D10, D11
5. alinear analytics reales y preparar read path interno para reporting: D12,
   D13

## Decisions That Most Directly Block Implementation

Las decisiones ya cerradas que mas directamente desbloquean implementacion son:

- D1
- D2
- D3
- D4
- D7
- D13

## Closure Note

- Current runtime behavior: unchanged
- Spec clarity: improved
- Product/technical decision visibility: improved
- Ready for implementation planning: yes
