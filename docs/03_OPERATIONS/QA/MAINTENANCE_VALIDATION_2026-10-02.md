# Mantenimiento NensGo: validación del 2 de octubre de 2026

Rama de implementación: `feat/publisher-request-flow-phase4`, integrada y
publicada en `main` por autorización posterior del usuario. Actualizado el 3 de
octubre. Estado global: **Partial** por cierre de altas a cargo del usuario y
validación interactiva de ambas sesiones y del botón. Implementación, preview,
producción, SQL, permisos reales, hook y planes gratuitos: **Done**. La evidencia
original del 2 de octubre se conserva a continuación; los resultados reales del
3 de octubre al final sustituyen sus pendientes de rollout.

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

## Límites y pendientes al terminar la preview (2 de octubre, históricos)

Las fixtures modelan las tablas necesarias; no sustituyen la validación de RLS,
Storage, Auth y datos en Supabase real. Las pruebas de API usan identidades y
respuestas del hook controladas; no se invocó ningún Deploy Hook ni se cambió
producción. El envío autorizado de la rama sí generó una vista previa de Vercel.

La consulta externa de sólo lectura confirmó las dos cuentas previas con permiso
`draft_inbox`. El usuario decidió conservar ambas. La migración nueva y las RPCs
de mantenimiento aún no están instaladas en el entorno real. No se modificaron
cuentas, datos históricos ni configuración Auth.

Vercel identifica el proyecto existente `mvp-nen` y permite inspeccionar sus
despliegues. No se obtuvo su configuración completa ni hay sesión CLI disponible.
No se ha
confirmado el plan, consumo, extras ni facturación actual de Vercel/Supabase.
No se han cancelado servicios ni declarado coste cero verificado.

Pendiente: revisión visual de la vista previa por el usuario, instalar SQL y
provisionar las dos cuentas, deshabilitar altas, configurar el hook secreto de
la rama aprobada, desplegar, validar ambas sesiones y denegaciones en vivo,
confirmar un nuevo respaldo publicado y comprobar cuotas/facturación.
Los pasos concretos están en [el runbook](../MAINTENANCE_RUNBOOK.md).

## Vista previa de Vercel autorizada

El usuario autorizó el envío de `feat/publisher-request-flow-phase4` el 2 de
octubre. El commit de implementación `db49e55434315208e10f8529e9ee2d208edf6c74`
se publicó en GitHub y generó el despliegue `dpl_S6QBxXDVxBgCRm8xyHEZEUVfzBwZ`,
estado **READY**, `target: null` (preview), sin alias de producción:
[vista previa validada](https://mvp-ldjrjg3su-dibrandons-projects.vercel.app/).

El navegador pasó la autenticación de Vercel usando acceso temporal del conector,
sin sesión de NensGo. No se guardó ese enlace temporal en el repositorio ni se
desactivó la protección del despliegue. La pestaña del navegador de Codex quedó
abierta en la vista previa para revisión.

| Comprobación remota | Evidencia | Estado |
| --- | --- | --- |
| Catálogo e idiomas | Seis tarjetas, navegación reducida y categorías del catálogo; interfaz ES/CA/EN, valores dinámicos conservados | Done |
| Copia publicada | Contrato compartido valida manifiesto y catálogo de la misma generación: 6 actividades, 8 contactos, 6 imágenes; las seis imágenes responden con tipo de imagen | Done |
| Fallo de Supabase | Bloquear el dominio real `auth.nensgo.com` y recargar: seis tarjetas, seis imágenes copiadas cargadas y selector de La Cala con teléfono/Instagram | Done |
| Móvil | 390×844, detalle y selector en inglés desde el respaldo; captura inspeccionada | Done |
| APIs sin sesión de NensGo | `GET /api/internal/pvi` devuelve 410; `POST /api/internal/catalog-backup` devuelve 401 sin solicitar despliegue | Done |
| Navegador | Sin excepciones JavaScript; sin claves de sesión Supabase en localStorage | Done |

Manifiesto confirmado: generación `61ec31e1-e61d-4388-856e-89833f4a922b`,
`generatedAt: 2026-10-02T14:05:05.308Z`, 1732497 bytes de imágenes copiadas.
Capturas temporales inspeccionadas: `nensgo-vercel-maintenance-desktop.png` y
`nensgo-vercel-maintenance-mobile-contact.png`. No se enviaron mensajes de contacto.

La comprobación HTTP sin sesión encuentra la redirección de autenticación de
Vercel y sale con código 1 y una explicación explícita. No representa un fallo
de la aplicación; las comprobaciones remotas anteriores se hicieron en el
navegador autenticado. El mismo script pasa contra la vista previa local.

Antes del merge, producción seguía asociada a `dpl_8cajDXdo4k1kpJNeqF19xxWwkhbo`, rama `main`,
commit `582b635d36c190f4cc3fbfff025a66d8a8503800`; sus alias `nensgo.com` y
`www.nensgo.com` se comprobaron después del envío. Este dato describe el destino
externo anterior al rollout autorizado; no se usó `main` como fuente de implementación.
La copia de preview no valida todavía el ciclo manual de respaldo en producción
ni los permisos administrativos reales tras instalar la migración.

## Producción y configuración real (3 de octubre)

El usuario autorizó integrar en `main`, commit, push y terminar el despliegue.
Merge sin squash ni force `733140b`, seguido de `1431ff5`. El árbol de runtime
conserva exactamente la implementación ya validada; el seguimiento sólo edita
documentación y configura los servicios existentes. No se repitió la suite
completa sin cambios de runtime. Se comprobó `git diff --check`.

| Área real | Evidencia | Estado |
| --- | --- | --- |
| Producción | `nensgo.com` y `www.nensgo.com` asociados a despliegues READY de `main`; `check:preview -- --preview-url=https://nensgo.com` pasa | Done |
| SQL aplicado | Migración `2026-10-02_maintenance_admin.sql`, hash `136876c2eb4dec8f06acc48d7b28a423ace56839f0d2cb7b0be93f6231ae7ee9`, transacción atómica por PostgreSQL con CA oficial y TLS verificado | Done |
| Ambas cuentas | Allowlist exactamente `kairos.sitges@gmail.com` y `morfeoneon2@gmail.com`, con perfil confirmado y permiso previo; contexto RLS real devuelve autorización, ocho borradores y once instituciones para ambas | Done permisos |
| Otros usuarios | Los diecisiete usuarios existentes fuera de la allowlist ven cero borradores/permisos y obtienen `42501` al importar, listar instituciones o crear centro | Done |
| Anónimos y retiradas | Cero borradores anónimos; RPCs privadas denegadas; escrituras históricas y flujos de perfil/publicación revocados; tres políticas restrictivas de Storage | Done |
| Conservación | Perfiles 19, favoritos 5, borradores 8, actividades 26, centros 12, instituciones 11, contactos 37, eventos de vista 487 y de contacto 97, sin cambios tras migración y downgrade | Done |
| URL gratuita | Variable pública estándar en sus mismos ámbitos; build publicado contiene la URL estándar y no `auth.nensgo.com`. Imágenes relativas: cero registros que necesiten sustituir el origen | Done |
| Planes y complemento | API Vercel Hobby activo; instalación y plan del proveedor Supabase `free`, 0 USD/mes y sin complementos. Retirado Custom Domain; dominio público conservado | Done |
| Google | Auth redirige al callback estándar `/auth/v1/callback`; Google llega a su pantalla de acceso sin `redirect_uri_mismatch`. No se completó un login real | Done callback, Partial sesión |
| Hook real | `nensgo-public-maintenance`, rama `main`, secreto sensible sólo Production; POST aceptado 201 y nueva generación publicada comprobada | Done mecanismo |
| Catálogo e idiomas | Navegador propio sin sesión en producción; ES/CA/EN, categoría Arte seleccionada, detalle público y valores dinámicos conservados | Done |
| Base inaccesible | Bloqueado el host estándar sólo en el navegador de prueba; seis tarjetas y seis imágenes locales cargadas desde `/catalog-backup/images/`, detalle y contactos disponibles | Done |
| Contacto y nombre | Nombre temporal introducido en detalle español; al cerrar y reabrir en catalán está vacío. Selector de La Cala ofrece teléfono/Instagram en inglés desde respaldo, sin enviar mensajes | Done |
| Móvil y navegador | 390×844, scrollWidth 390; selector y detalle inspeccionados visualmente, sin excepciones JS, sesión Supabase ni peticiones de estadísticas | Done |
| Acceso privado | Visitante en `/internal/import` redirigido a `/usuario`, login sin registro y meta `noindex, nofollow`; navegador de prueba cerrado después de retirar la simulación | Done |
| Altas Auth | `disable_signup: false`, Email y Google habilitados; el usuario ha elegido cerrar las altas personalmente siguiendo el runbook | Planned usuario |
| Sesiones y botón | Falta entrar realmente con ambas cuentas y confirmar el ciclo del botón protegido desde una sesión. No se fabricaron JWTs ni se crearon actividades ficticias | Partial |

Después de publicar la configuración gratuita se comprobó el catálogo por REST
(200, seis actividades), el acceso PostgreSQL y los conteos. El hook real produjo
`dpl_9RJ1bdceRJR1qXSwHinWtPe77KuC`, READY, commit `1431ff5`, con generación
`36278b5f-dc2c-4a4a-879f-11299e68e3a9`,
`generatedAt: 2026-10-03T08:54:21.552Z`, 6 actividades, 8 contactos, 6 imágenes
y 1732497 bytes copiados. La fecha es posterior a la solicitud; no se confundió
un job PENDING con una copia lista. La prueba directa del hook no representa
la validación completa del botón con una sesión de NensGo.

Cuotas medidas después del cambio: DB 27135123 bytes, Storage 9733979 bytes y
27 objetos, dentro de Free. Egress actual de Supabase no accesible con estas
capacidades; `vercel usage` no da datos de coste y las métricas de transferencia
requieren Observability Plus, que no se contrató. La última factura pagada fue
del 13/09/2026 por 42,58 USD; no hay nueva factura de cierre confirmada y pueden
liquidarse consumos anteriores. Free actual no equivale a consumo cero histórico
ni garantiza tráfico futuro.

Captura temporal inspeccionada:
`C:/Users/kuro/AppData/Local/Temp/nensgo-production-maintenance-mobile-contact.png`.
El bloqueo de red sólo afectó al navegador aislado de prueba, no a producción.
La configuración, las identidades y las credenciales no se expusieron en capturas.

## Ilustración del banner

Activo final: `public/maintenance/activities-hero.webp`, 1200×800, 177762 bytes.
Creado con la herramienta integrada `image_gen` (modo built-in); después se
redimensionó y comprimió para la web. No se añadió un servicio de IA a NensGo.
El activo final vive en el repositorio y se inspeccionó en escritorio y móvil.

Prompt final utilizado:

> Use case: illustration-story. Asset type: NensGo website hero, rectangular landscape editorial illustration, 3:2. Primary request: an abstract, warm collage celebrating activities for children and families: football, volleyball, swimming, painting, theatre and music, all visually distinct yet part of one playful composition. Style: polished contemporary cut-paper and softly textured gouache illustration, simple friendly characters of different backgrounds, expressive natural poses, restrained detail. Scene: abstract cream background with rounded organic shapes suggesting a sports court, pool, art table and little theatre stage, no hard panels. Palette: teal, mint, warm coral, sunny ochre, cream, dark teal accents. Composition: image will sit beside existing website text so image itself has NO text, no logos, no letters. Ensure all children have natural readable anatomy. Avoid photo-realism, typography, watermark, screens, business graphics. Website-ready final image.
