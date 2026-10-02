# NensGo - Project Brief

## Alcance vigente: mantenimiento gratuito (octubre de 2026)

Estado: **Partial**. La rama `feat/publisher-request-flow-phase4` contiene la
adaptación local; SQL, Auth, facturación y despliegue requieren validación externa.
El servicio se mantiene como prueba de concepto y portfolio, con el dominio
`nensgo.com`, cargas ocasionales y un máximo de un año más.

La experiencia pública es catálogo por categorías, detalle y contactos sin
sesión, con textos ES/CA/EN y una copia pública de respaldo. No hay buscador,
filtros adicionales, registro público, perfil, favoritos, estadísticas ni
publicación autoservicio por centros. Conócenos presenta el proyecto.

Ambas cuentas administradoras anteriores se mantienen. Acceden directamente por
`/usuario` y trabajan con borradores: importar JSON, revisar sin inventar datos,
seleccionar o crear un centro confirmado, publicar/retirar y crear respaldo
manual. La autorización real se verifica en SQL y en la API; la URL privada no
sustituye los permisos. Los datos históricos se preservan sin uso público.

El único coste aceptado es el dominio; los planes, extras y cuotas reales aún
deben comprobarse. No se incorporan servicios de IA ni tareas diarias.
El [runbook vigente](../03_OPERATIONS/MAINTENANCE_RUNBOOK.md) reúne el contrato y
los pasos externos. La documentación que sigue conserva el MVP anterior como
**referencia histórica** y no amplía el alcance del mantenimiento.

## Referencia anterior (histórica)

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
| Bundle | Done | El build local usa chunks vendor manuales y ya no avisa de chunk principal mayor de 500 kB; monitorizar si entran dependencias grandes. |

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
