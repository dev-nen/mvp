# Runtime Real Closure - PO Brief

## Para Que Existe Este Documento

Este documento resume, en lenguaje operativo, que estamos cerrando en NensGo y
que intervenciones manuales hicimos o estamos haciendo en Supabase/Vercel.

No es un backlog ni una especificacion tecnica completa. Es una lectura corta
para entender por que hubo pasos manuales y que riesgo reducen.

## Contexto

NensGo ya no esta funcionando como un MVP solo con datos locales. El runtime
actual usa Supabase para catalogo, auth, perfiles, favoritos, contacto,
metricas de uso y herramientas internas como Draft Inbox.

Eso implica que el cierre funcional no depende solo de compilar codigo. Tambien
hay que cerrar:

- SQL aplicada en Supabase
- providers de autenticacion
- redirect URLs
- secretos de Vercel
- permisos internos
- datos minimos de prueba
- smoke real en navegador

## Que Cerramos Hasta Ahora

### Gate 1 - SQL base

Se aplicaron y verificaron las capas SQL versionadas para:

- catalogo real
- perfil/onboarding
- PVI interno
- Draft Inbox
- approved activity lifecycle

Los bloques manuales de verificacion viven en `supabase/manual/`.

### Gate 2 - Auth/config

Se valido:

- email/password activo
- confirmacion de email activa
- Google activo
- redirect URLs para local y preview
- token interno de PVI presente

Tambien encontramos y corregimos un drift historico: existia un trigger viejo
sobre `auth.users` que intentaba crear `user_profiles` automaticamente durante
el signup. Ese trigger ya no corresponde al modelo actual porque el perfil se
crea despues del onboarding con `ensure_my_profile(...)`.

Fix versionado:

```txt
supabase/sql/2026-04-28_disable_legacy_auth_profile_trigger.sql
```

Resultado: el signup clasico ya crea usuario y envia email de confirmacion.

### Gate 3 - Datos internos iniciales

Se creo un usuario real de app y se autorizo para Draft Inbox mediante:

- `internal_tool_access`
- seed de drafts de prueba

Se confirmaron drafts reales en estado `pending_review`.

## Que Sigue Parcial

El dataset publico actual permite validar:

- catalogo real
- imagenes reales
- contacto con una sola via

Todavia faltan datos para validar completamente:

- actividad publica con 0 contactos activos
- actividad publica con multiples contactos activos

Esto no bloquea Draft Inbox, pero si deja incompleto el smoke de contacto.

## Regla Nueva Para SQL Manual

Desde ahora:

- las queries que requieren intervencion humana no viven en scripts
- viven como archivos `.sql` independientes en `supabase/manual/`
- los scripts solo hacen auditorias automaticas
- los bloques que escriben datos usan `begin;` y `commit;`

Esto reduce el riesgo de ejecutar medio bloque, perder trazabilidad o depender
de memoria de chat.

## Lectura De Estado

- Gate 1: cerrado
- Gate 2: cerrado funcionalmente, con PVI autorizado bloqueado para CLI por
  Vercel Authentication en preview
- Gate 3: cerrado para usuario interno y seed; parcial para cobertura completa
  de contacto
- Gate 4: pendiente de smoke real por bloques

## Siguiente Paso Operativo

Validar en navegador:

1. `/internal/drafts` carga con usuario autorizado
2. aparecen los drafts seed
3. guardar/rechazar un draft
4. aprobar un draft
5. validar approved lifecycle

El smoke publico de contacto completo queda pendiente de completar dataset.
