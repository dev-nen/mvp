# NensGo - Project Brief

## Qué es NensGo

NensGo es una plataforma web para descubrir actividades infantiles y familiares cerca de la familia usuaria.

El producto combina una experiencia pública de catálogo con autenticación, favoritos, onboarding por municipio y contacto con actividades. El proyecto está en fase MVP/validación: ya hay contratos reales con Supabase, pero no debe presentarse como producto plenamente endurecido o validado live.

## Problema que resuelve

Las familias suelen encontrar actividades para niños en fuentes fragmentadas: webs de centros, redes sociales, mensajes, buscadores, ayuntamientos o recomendaciones informales. Esto hace difícil comparar opciones por ubicación, edad, precio, horario y contacto.

NensGo busca ofrecer una superficie clara para explorar actividades y decidir el siguiente paso sin fricción innecesaria.

## Usuarios

| Usuario | Necesidad |
| --- | --- |
| Familias | Descubrir actividades cercanas, comparar opciones y guardar favoritas. |
| Centros / responsables de actividades | Dar visibilidad a actividades y recibir contactos cualificados. |
| Equipo interno de NensGo | Revisar, aprobar y mantener contenido antes de publicarlo. |
| PO / dirección | Validar utilidad, calidad del catálogo y capacidad operativa. |

## Implementado actualmente

- Catálogo público en `/`, alimentado por la vista Supabase `catalog_activities_read`.
- Página pública de marca/producto en `/sobre-nensgo`.
- Página pública para centros en `/para-centros`.
- Páginas legales/trust en `/privacidad` y `/terminos`.
- Autenticación con Google y email/password mediante Supabase Auth.
- Estado de verificación de email y onboarding requerido.
- Perfil de aplicación en `user_profiles`.
- Onboarding por municipio basado en `cities` y `municipality_choices_read`.
- Fuente municipal DIR3 para municipios de España.
- Excepción temporal Les Roquetes/Roquetas que persiste Sant Pere de Ribes.
- Favoritos remotos en `user_favorite_activities`.
- Contacto por actividad mediante `activity_contact_options_read`.
- Eventos de vista y contacto en `activity_view_events` y `activity_contact_events`.
- Base i18n para ES/CA/EN en copy estático.
- Rutas internas de Draft Inbox y ciclo de actividades aprobadas.
- API interna `/api/internal/pvi` protegida por bearer token para reporting privado.

## Parcial o pendiente de validación live

- Aplicación y validación real de SQL Supabase en el entorno objetivo.
- Configuración de Supabase Auth, Google OAuth, redirects y verificación de email.
- Smoke live de favoritos remotos, onboarding, contacto y eventos.
- Smoke live de Draft Inbox, permisos internos y RPCs de ciclo de actividad aprobada.
- Validación de secretos Vercel para `/api/internal/pvi`.
- Confirmación de Vercel Web Analytics en dashboard y entorno real.
- Revisión final de RLS/RPC en Supabase live.

## Intencionalmente no implementado aún

- Sistema completo de cuentas de empresa/centro.
- Alta pública autoservicio de actividades.
- Búsqueda por fecha como contrato de producto cerrado.
- Expiración automática completa de actividades.
- Traducción de contenido dinámico de actividades.
- Modelo formal de localities/areas que sustituya el hardcode temporal de Les Roquetes.
- App móvil o React Native dentro de este repo.
- Backoffice productizado para uso amplio fuera del equipo interno.

## Stack técnico actual

- React 18 + Vite.
- React Router.
- CSS plano por páginas/componentes.
- Supabase Auth y Supabase Postgres.
- Vistas y RPCs Supabase para contratos de lectura/escritura.
- Vercel para hosting, rewrites, función API interna y Web Analytics.
- `@vercel/analytics` montado en la app.

## Alcance de producto actual

El alcance actual cubre un MVP web para:

- Explorar catálogo público.
- Registrarse o acceder.
- Completar perfil mínimo con municipio.
- Guardar favoritos.
- Abrir detalle y contactar actividades.
- Mantener contenido desde herramientas internas parcialmente validadas.

## Riesgos y validaciones pendientes

| Área | Estado | Riesgo |
| --- | --- | --- |
| Supabase SQL | Partial | El repo contiene SQL, pero el entorno live debe tenerlo aplicado y validado. |
| RLS/RPC | Partial | La seguridad real depende de políticas y checks server-side, no del frontend. |
| Auth/OAuth | Partial | Google y email dependen de configuración externa. |
| Draft Inbox | Partial | Hay código y SQL, pero requiere permisos, seeds y smoke live. |
| Contacto | Partial | El flujo depende de calidad de datos en `activity_contact_options_read`. |
| i18n | Partial | Sólo traduce UI estática; contenido dinámico no está traducido. |
| Legal | Partial | Hay rutas legales, pero no se debe inferir cumplimiento legal completo. |
| Bundle | In progress | Vite puede seguir avisando de chunk principal mayor de 500 kB. |

## Cómo revisar el repo

1. Leer el README raíz.
2. Leer [docs/README.md](../README.md).
3. Leer este brief.
4. Leer [TECHNICAL_HANDOFF_FOR_REVIEW.md](../02_TECHNICAL/TECHNICAL_HANDOFF_FOR_REVIEW.md).
5. Revisar [ARCHITECTURE.md](../02_TECHNICAL/ARCHITECTURE.md) y [SUPABASE_MODEL.md](../02_TECHNICAL/SUPABASE_MODEL.md).
6. Revisar [SECURITY_AND_PRIVACY.md](../02_TECHNICAL/SECURITY_AND_PRIVACY.md).
7. Ejecutar checks locales y contrastar con [VALIDATION_CHECKLIST.md](../03_OPERATIONS/VALIDATION_CHECKLIST.md).

## Contexto para revisión asistida por IA

Si analizas este repositorio con una IA, revisa primero:

1. `README.md`
2. `docs/README.md`
3. `docs/00_START/PROJECT_BRIEF.md`
4. `docs/02_TECHNICAL/TECHNICAL_HANDOFF_FOR_REVIEW.md`
5. `docs/02_TECHNICAL/ARCHITECTURE.md`
6. `docs/02_TECHNICAL/SECURITY_AND_PRIVACY.md`

La app está en fase MVP/validación. No asumir que todas las piezas internas están productizadas o validadas en vivo.
