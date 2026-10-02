# Mantenimiento NensGo: validación del 2 de octubre de 2026

Rama: `feat/publisher-request-flow-phase4`. Estado global: **Partial**.
Implementación local y revisión: **Done**. SQL/Auth/despliegue y facturación
real: **Planned**, sin cambios en producción realizados por esta tarea.

## Comprobaciones locales

`npm.cmd run check` completa auditorías estáticas y de contratos, mensajes de
contacto, PostgreSQL local, importación, respaldo y compilación de producción.
`check:preview -- --preview-url=http://127.0.0.1:4173 --local` comprueba que se
sirve una generación coherente con **6 actividades, 8 contactos y 6 imágenes**.
La compilación lee únicamente las vistas públicas con la clave pública.

| Área | Evidencia | Estado |
| --- | --- | --- |
| Catálogo público | Navegador headless propio sobre build local, sin sesión; seis tarjetas, sólo categorías disponibles, selección de Arte y vuelta al catálogo completo | Done |
| Idiomas | ES/CA/EN en catálogo y detalle; nombres, categorías y contactos dinámicos conservan la fuente. Mensajes WhatsApp/email con y sin nombre en los tres idiomas, caracteres `&` y acentos | Done |
| Contacto | WhatsApp único prepara mensaje; La Cala con teléfono/Instagram abre selector con centro y actividad. No se envió ningún mensaje | Done |
| Nombre temporal | Introducir nombre, cerrar y reabrir Kumon devuelve el campo vacío; no se guarda en localStorage | Done |
| Móvil | 390×844: banner visible, categorías, tarjeta, detalle y selector; ancho de documento 390, sin desbordamiento horizontal | Done |
| Respaldo ante fallo | Bloquear todas las peticiones al host Supabase y recargar: seis actividades e imágenes locales cargadas; detalle y selector mantienen los contactos desde la misma generación | Done |
| Acceso anónimo | `/internal/import` redirige a `/usuario`; login sin registro, `noindex, nofollow`; sin enlaces públicos de acceso/favoritos | Done |
| Páginas públicas | Conócenos presenta el proyecto, privacidad traducida, términos; `/para-centros` redirige a Conócenos | Done |
| Importación y permisos | PostgreSQL PGlite ejecuta la migración real y RPCs reales Phase 4 de aprobación/edición, normalización y sustitución de contactos | Done local |
| Ambas administradoras | Importación, publicación, edición, centros y Storage permitidos para las dos identidades aprobadas de la fixture; usuarios ajenos y otro revisor fuera de la lista rechazados | Done local |
| Datos ausentes | Edad/precio desconocidos permanecen pendientes; publicación no revisada y actualización con desconocidos se rechazan con rollback de actividades y contactos | Done local |
| Integridad editorial | Reintento del mismo lote por cualquiera de las dos administradoras no duplica; lote fallido es atómico; centros/entidades requieren datos confirmados; historia y procedencia se conservan | Done local |
| Respaldo y API | Snapshot sin campos privados, paginación completa, generaciones coherentes, protección de imágenes, errores sin sustituir copia anterior; API niega anónimos/terceros/previews y sólo responde pendiente al aceptar el hook | Done local |
| Estadísticas retiradas | Analytics eliminado del montaje y dependencias; helpers antiguos son no-op; API PVI devuelve 410; migración revoca acceso a escrituras retiradas | Done local |

El navegador no registró excepciones JavaScript. Las peticiones abortadas durante
la simulación son intencionadas. Capturas inspeccionadas en la carpeta temporal
local: `nensgo-maintenance-desktop.png`, `nensgo-maintenance-detail.png`,
`nensgo-maintenance-mobile-home.png`, `nensgo-maintenance-mobile-category.png`,
`nensgo-maintenance-mobile-contact.png` y `nensgo-maintenance-private-login.png`.
Chrome del usuario no fue necesario.

La revisión independiente detectó la normalización indebida de edad/precio
desconocidos al editar actividades aprobadas. El fix pack bloquea esos valores
antes de normalizar y conserva `import_review`; las pruebas posteriores con los
RPCs reales cubren el fallo y el flujo válido de ambas administradoras.
No quedaron hallazgos accionables locales pendientes en esa revisión.

La compilación conserva un aviso de un chunk privado del editor de 523 kB
(aproximadamente 171 kB gzip). El editor se carga al entrar en herramientas
internas. No se aumentó el umbral para ocultar el aviso.

## Límites de la evidencia y pendientes externos

Las fixtures modelan las tablas necesarias; no sustituyen la validación de RLS,
Storage, Auth y datos en Supabase real. Las pruebas de API usan identidades y
respuestas del hook controladas; no se disparó ningún despliegue externo.

La consulta externa de sólo lectura confirmó las dos cuentas previas con permiso
`draft_inbox`. El usuario decidió conservar ambas. La migración nueva y las RPCs
de mantenimiento aún no están instaladas en el entorno real. No se modificaron
cuentas, datos históricos ni configuración Auth.

Vercel identifica el proyecto existente `mvp-nen`, pero el conector no permitió
obtener su configuración completa y no hay sesión CLI disponible. No se ha
confirmado el plan, consumo, extras ni facturación actual de Vercel/Supabase.
No se han cancelado servicios ni declarado coste cero verificado.

Pendiente: revisar preview de Vercel del commit aprobado, instalar SQL y
provisionar las dos cuentas, deshabilitar altas, configurar el hook secreto de
la rama aprobada, desplegar, validar ambas sesiones y denegaciones en vivo,
confirmar un nuevo respaldo publicado y comprobar cuotas/facturación.
Los pasos concretos están en [el runbook](../MAINTENANCE_RUNBOOK.md).

## Ilustración del banner

Activo final: `public/maintenance/activities-hero.webp`, 1200×800, 177762 bytes.
Creado con la herramienta integrada `image_gen` (modo built-in); después se
redimensionó y comprimió para la web. No se añadió un servicio de IA a NensGo.
El activo final vive en el repositorio y se inspeccionó en escritorio y móvil.

Prompt final utilizado:

> Use case: illustration-story. Asset type: NensGo website hero, rectangular landscape editorial illustration, 3:2. Primary request: an abstract, warm collage celebrating activities for children and families: football, volleyball, swimming, painting, theatre and music, all visually distinct yet part of one playful composition. Style: polished contemporary cut-paper and softly textured gouache illustration, simple friendly characters of different backgrounds, expressive natural poses, restrained detail. Scene: abstract cream background with rounded organic shapes suggesting a sports court, pool, art table and little theatre stage, no hard panels. Palette: teal, mint, warm coral, sunny ochre, cream, dark teal accents. Composition: image will sit beside existing website text so image itself has NO text, no logos, no letters. Ensure all children have natural readable anatomy. Avoid photo-realism, typography, watermark, screens, business graphics. Website-ready final image.
