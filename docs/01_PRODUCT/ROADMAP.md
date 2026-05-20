# Product Roadmap

Este roadmap resume el orden de producto desde el estado actual. No sustituye al roadmap maestro histórico en [05_ARCHIVE/ROADMAP_MASTER.md](../05_ARCHIVE/ROADMAP_MASTER.md), pero ofrece una lectura más directa para revisión externa.

## Ahora

- Consolidar la base MVP existente.
- Aplicar y validar SQL Supabase en el entorno objetivo.
- Validar Auth Google + email/password + email verification.
- Validar onboarding por municipio con datos DIR3.
- Validar favoritos remotos.
- Validar contacto por `activity_contact_options_read`.
- Validar rutas legales/trust y configuración OAuth.
- Validar Draft Inbox e internal approved activity lifecycle con usuario interno real.
- Documentar Phase 3 como implementada en repo cuando exista la migracion SQL
  y la ruta `/perfil/publicaciones/nueva`, pero no live-validada hasta aplicar
  SQL manualmente.
- Mantener registrada la evidencia de Phase 1: `/internal/activities` está implementado y live-smoke validado para catálogo interno y publicar/despublicar.
- Mantener visible la deuda técnica y no presentar el proyecto como production-ready.

### Phase 2 Core update

- Implementar Phase 2 Core en repo: lifecycle de drafts ampliado, ownership,
  feedback publico separado, `/perfil/publicaciones`, despublicar propio,
  correcciones y solicitudes de edicion con revision.
- Mantener Phase 2 Core como `Partial` hasta aplicar SQL manualmente y validar
  Supabase/RLS en vivo.
- Provider/center ownership y alta publica autoservicio quedan para fases
  posteriores; Phase 2 Core solo modela ownership por usuario que envia.

## Siguiente

- Cerrar smoke tests live de Supabase, RLS y RPC.
- Revisar calidad de datos del catálogo y contact options.
- Monitorizar tamaño del bundle Vite si se añaden dependencias grandes o vuelve el warning.
- Formalizar modelo de localities/areas para sustituir el hardcode de Les Roquetes.
- Fortalecer reporting interno y lectura de eventos.
- Mejorar checklist de release y evidencias de validación.
- Seguir con la fase 2 de [Activity Admin Panel and User Submissions Spec](./ACTIVITY_ADMIN_AND_SUBMISSIONS_SPEC.md): aclaración de lifecycle de drafts (`needs_changes`, rechazo, archivado y reglas de resubmission).

### Siguiente: Phase 2 Core validation

- Completar smoke tests de Phase 2 Core despues de aplicar la migracion SQL:
  admin lifecycle, inbox de usuario, feedback publico, ownership, despublicar
  propio, correcciones y edicion de actividad publicada.
- No marcar Phase 2 Core como validado live hasta comprobar permisos negativos
  anon/no-owner/no-internal y flujos positivos admin/user.

### Phase 3 Core: user activity submissions

- Implementar el MVP visible para usuarios autenticados:
  `/perfil/publicaciones` -> `Enviar actividad` ->
  `/perfil/publicaciones/nueva`.
- La submission crea solo `activity_drafts` mediante
  `create_my_activity_submission`; no publica directo y no escribe en
  `public.activities`.
- Usar `source_type = 'user_submission'` y
  `submitted_by_user_id = auth.uid()` para que el inbox muestre `En revision`.
- Mantener fuera de alcance: `/sugerir-actividad`, anonimo/publico,
  provider/center ownership, creacion de centro, contact options e imagenes
  subidas por usuarios normales.
- Mantener Phase 3 como `Partial` hasta aplicar la migracion SQL y completar
  smoke Supabase/RLS.

## Luego

- Modelo de expiración de actividades.
- Búsqueda por fechas.
- Mejor cuenta/perfil de usuario.
- Mini-formularios o alta asistida para centros.
- Backoffice asistido para publicación.
- Scout Manual v0 para crear drafts desde fuentes simples.
- Extensiones futuras a submissions de usuarios logueados despues del MVP:
  mas trazabilidad, entrada publica si se decide, o integracion con ownership
  provider/center.
- Analytics/insights más fuertes para producto y operación.

## Diferido

- App móvil/React Native, salvo que se abra una línea específica fuera de este repo.
- Conectores Scout complejos.
- OCR o ingesta image-first.
- Marketplace completo de centros.
- Pagos o monetización.
- Sistema legal/compliance final sin revisión profesional.

## Regla de lectura

`Implementado` no significa `validado live`. Las áreas que dependen de Supabase, Vercel, OAuth, permisos internos o datos reales deben mantenerse como `Partial` hasta tener evidencia.
