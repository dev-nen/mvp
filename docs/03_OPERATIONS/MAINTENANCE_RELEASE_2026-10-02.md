# NensGo: integración y publicación en main, 2 de octubre de 2026

## Contexto inicial (2 de octubre)

Tamaño **L** por publicación de cambios de acceso/datos y configuración externa.
Estado inicial: **In progress**. El usuario autoriza expresamente merge a `main`,
commit y push para terminar la transición. `main` es ahora el destino solicitado,
no una referencia supuesta. Fuente de implementación: la rama validada
`feat/publisher-request-flow-phase4`, commit `4494ff6`.

Al iniciar el release, tras actualizar las referencias, `origin/main` estaba en
`582b635` y era ancestro de la rama fuente. Su vista previa estaba READY y validada;
las nueve revisiones podían integrarse sin divergencia. Las pruebas completas y
revisión independiente ya constaban en QA. Supabase SQL/Auth, hook y costes reales
aún no estaban confirmados. Se acordó conservar ambas cuentas administradoras.
Los resultados actuales figuran al final de este documento.

## Objetivo

Integrar sin perder historial, publicar en `main` y comprobar `nensgo.com`.
Completar la configuración externa del contrato de mantenimiento donde los
accesos existentes permitan hacerlo; describir bloqueos concretos restantes,
sin declarar permisos o facturación verificados por el mero éxito del build.

## Archivos y sistemas previstos

- Git: `main`, rama fuente y `origin/main`; merge explícito sin squash ni force.
- `docs/03_OPERATIONS/MAINTENANCE_RELEASE_2026-10-02.md` (plan y resultado).
- `docs/03_OPERATIONS/MAINTENANCE_TRANSITION_2026-10.md`.
- `docs/03_OPERATIONS/MAINTENANCE_RUNBOOK.md`.
- `docs/03_OPERATIONS/QA/MAINTENANCE_VALIDATION_2026-10-02.md`.
- `README.md`, `docs/README.md`, `docs/00_START/PROJECT_BRIEF.md`,
  `docs/02_TECHNICAL/ARCHITECTURE.md` y `SECURITY_AND_PRIVACY.md`, sólo estado
  vigente y referencias de publicación.
- Vercel: proyecto existente `mvp-nen`, despliegue de `main`, hook de esa rama
  y variable secreta sólo de Production, comprobación de plan/uso disponible.
- Vercel/Supabase Marketplace: instalación existente `supabase-nensgo-db`,
  cambio de Pro a Free sin desinstalar ni borrar el recurso. Retirar el complemento
  de pago `auth.nensgo.com`; conservar el dominio público `nensgo.com`. Actualizar
  `VITE_SUPABASE_URL` a la URL estándar del mismo proyecto en sus entornos actuales
  y recompilar antes del downgrade. Comprobar el callback Google estándar.
- Supabase: sustituir únicamente el origen de las imágenes propias en
  `activities.image_url` y `activity_drafts.reviewed_payload_json.activity.image_url`
  cuando empiecen por `https://auth.nensgo.com/storage/v1/object/public/activities/`.
  Los mismos objetos se sirven por la URL estándar; no mover ni borrar Storage.
  Conservar el payload original parseado y el resto de los campos históricos,
  fechas, contactos, permisos y estados. Comprobar conteos y URLs antes del downgrade.
- Supabase: preflight de dependencias, migración versionada de mantenimiento,
  provisión explícita de las dos cuentas y retirada de altas públicas, sólo
  cuando haya acceso autorizado real al SQL y configuración.

## Fuera de alcance

No nuevas funcionalidades, pérdida de historial, eliminación de datos históricos,
servicios de pago, tareas periódicas ni modificación del dominio. No publicar
secretos en Git, clientes, capturas o salidas. No activar flujos antiguos de centros.

## Riesgos y supuestos evitados

El panel falla de forma cerrada si falta `is_maintenance_operator`; publicar la
web no instala SQL. La API manual necesita el hook y los permisos reales. No
asumir que un token de datos permite DDL ni que una sesión CLI está ausente sin
comprobar su ubicación estándar. No confundir lectura de plan con coste cero
verificado ni snapshot de build con ciclo manual confirmado. La migración sólo
se aplicará tras comprobar las dependencias instaladas y no adivinar identidad.

## Secuencia

1. Revisar contexto, actualizar refs y comprobar ancestros; revisión paralela
   sólo lectura del merge y de accesos externos.
2. Preparar y confirmar este plan; comprobar preflight externo y configurar lo
   accesible según el runbook, conservando las dos cuentas.
3. Cambiar a `main`, incorporar la rama mediante merge con commit; comprobar
   árbol/resultados y subir `main` sin force con autorización del usuario.
4. Esperar READY del commit exacto, confirmar alias de producción y comprobar
   catálogo, copia coherente/imágenes y APIs; navegador en ES/CA/EN y móvil.
5. Completar hook y configuración accesible, validar permisos/ciclo manual si
   las sesiones reales están disponibles. Registrar lo que no se pueda comprobar.
6. Actualizar documentación con resultados reales, commit/push de seguimiento
   en `main`; terminar con Git limpio y sincronizado.

## Validación y cierre

No repetir la suite completa si el merge conserva exactamente el código ya
validado y sólo se editan docs; sí ejecutarla ante un cambio de runtime o conflicto.
Comprobar diff de integración, `git diff --check`, HTTP del destino explícito,
manifiesto/catálogo/imágenes y navegador de producción. Rechazar anónimos y
terceros, confirmar ambos admins y el nuevo respaldo únicamente con evidencia
real. El cierre separará **Done** (Git y publicación comprobados) de **Partial**
o **Planned** para cualquier configuración externa sin acceso o validación.

## Avance confirmado y continuación del 3 de octubre

Merge y push **Done**: `733140b` en `main`, despliegue de producción
`dpl_2BsNvLyGxN1N6MXnf6cix4UtU4Jv` READY y alias `nensgo.com` confirmado.
El check HTTP pasa: seis actividades, ocho contactos, seis imágenes copiadas,
estadísticas 410 y respaldo sin sesión 401.

Migración y provisión **Done**: aplicada atómicamente la revisión versionada
`2026-10-02_maintenance_admin.sql` con hash
`136876c2eb4dec8f06acc48d7b28a423ace56839f0d2cb7b0be93f6231ae7ee9`.
La allowlist contiene exactamente las dos cuentas confirmadas; los conteos
históricos de perfiles/favoritos/borradores/actividades/centros/contactos/eventos
no cambiaron. La conexión usa CA oficial y verificación TLS, sin desactivarla.
El hook de `main` y su variable sensible sólo de Production están configurados.

Cuotas medidas: DB 27036819 bytes; Storage 9733979 bytes, 27 objetos.
Vercel Hobby activo. En el preflight Supabase mantenía Pro (25 USD/mes) y Custom
Domain (10 USD/mes): el cambio a Free estaba **In progress**. La oferta oficial Free está
habilitada, advierte un reinicio breve y retirada de complementos. La copia pública
ya publicada protege el catálogo durante ese cambio. El callback estándar de
Google llega a su pantalla de acceso, sin `redirect_uri_mismatch`; esto no
sustituye la sesión real de cada administradora.

El usuario elige cerrar las altas personalmente en Supabase Auth. Esta acción
sigue pendiente de confirmación; no se desactivan Email ni Google de las cuentas
existentes. El panel oficial requiere su sesión, sin compartir contraseña.

`VITE_SUPABASE_URL` ya apunta a la URL estándar del mismo proyecto en Production,
Preview y Development, conservando sus ámbitos. La inspección real encontró cero
URLs absolutas del dominio de pago en imágenes de actividades y payloads revisados:
se guardan rutas relativas. No fue necesario modificar registros ni Storage.
Se publicará una nueva copia con esta configuración antes de pasar a Free.

Permisos reales **Done** mediante transacciones de sólo lectura y contexto RLS:
las dos cuentas autorizadas acceden a los ocho borradores y once instituciones;
los otros diecisiete usuarios existentes no pueden leer borradores/permisos ni
importar o crear centros. El anónimo ve cero borradores y no ejecuta RPCs privadas.
Se comprobaron la revocación de escrituras históricas y las tres políticas
restrictivas de Storage. Esto no sustituye un inicio de sesión interactivo ni
el ciclo manual del botón desde una sesión de administradora.

## Resultado de la continuación del 3 de octubre

Infraestructura **Done**: CLI oficial actualizó la instalación existente a Free,
sin desinstalar recursos. La API confirma `billingPlan` y `vendorBillingPlan`
`free`, 0 USD/mes y sin complementos. Vercel Hobby activo. `auth.nensgo.com` dejó
de servir el complemento, mientras `nensgo.com` conserva el servicio.
Antes del cambio se publicó `1431ff5` READY con una copia generada desde la URL
estándar, que también aparece en los assets públicos sin el origen anterior.
Los conteos históricos siguen intactos tras el downgrade; DB 27135123 bytes,
Storage 9733979 bytes y 27 objetos, dentro de Free.

Respaldo real **Done para el mecanismo**: una solicitud directa al hook de
`main`, 201, produjo `dpl_9RJ1bdceRJR1qXSwHinWtPe77KuC` READY y una generación
nueva publicada `36278b5f-dc2c-4a4a-879f-11299e68e3a9`, fecha UTC
`2026-10-03T08:54:21.552Z`, con seis actividades, ocho contactos y seis imágenes.
Producción supera el check HTTP. El navegador propio comprobó ES/CA/EN,
categorías, detalle, nombre temporal y selector móvil de contactos con Supabase
bloqueado sólo en la prueba: seis imágenes locales cargadas, ancho 390, sin
excepciones JS, sesión Supabase ni recogida de estadísticas.

Estado general **Partial**: altas Auth pendientes a cargo del usuario y sesiones
interactivas de ambas cuentas/botón pendientes de evidencia real. El callback
Google estándar está comprobado, pero no se simula un login completado.
La [guía operativa](./MAINTENANCE_RUNBOOK.md) deja el interruptor exacto y el flujo
mensual **importar → revisar → publicar/retirar → crear respaldo**.

Costes previos no anulados: última factura pagada 13/09/2026, 42,58 USD; no se
confirmó aún factura de cierre. Egress actual no accesible y métricas de Vercel
requieren un plan adicional que no se activó; se conserva este límite de evidencia.
No se añadieron cambios de runtime ni nuevas funcionalidades durante el release.
El seguimiento documental se confirma y envía a `main`; el cierre verifica su
despliegue exacto y Git limpio/sin divergencia.
