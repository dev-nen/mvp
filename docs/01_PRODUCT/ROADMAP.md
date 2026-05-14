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
- Mantener visible la deuda técnica y no presentar el proyecto como production-ready.

## Siguiente

- Cerrar smoke tests live de Supabase, RLS y RPC.
- Revisar calidad de datos del catálogo y contact options.
- Reducir riesgo del chunk principal Vite si empieza a afectar performance real.
- Formalizar modelo de localities/areas para sustituir el hardcode de Les Roquetes.
- Fortalecer reporting interno y lectura de eventos.
- Mejorar checklist de release y evidencias de validación.

## Luego

- Modelo de expiración de actividades.
- Búsqueda por fechas.
- Mejor cuenta/perfil de usuario.
- Mini-formularios o alta asistida para centros.
- Backoffice asistido para publicación.
- Scout Manual v0 para crear drafts desde fuentes simples.
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
