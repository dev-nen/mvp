# NensGo: integración y publicación en main, 2 de octubre de 2026

## Contexto y estado actual

Tamaño **L** por publicación de cambios de acceso/datos y configuración externa.
Estado inicial: **In progress**. El usuario autoriza expresamente merge a `main`,
commit y push para terminar la transición. `main` es ahora el destino solicitado,
no una referencia supuesta. Fuente de implementación: la rama validada
`feat/publisher-request-flow-phase4`, commit `4494ff6`.

Tras actualizar las referencias, `origin/main` sigue en `582b635` y es ancestro
de la rama fuente. Su vista previa está READY y validada; las nueve revisiones
se integran sin divergencia. Las pruebas completas y revisión independiente de
implementación ya constan en QA. Supabase SQL/Auth, hook y costes reales todavía
no están confirmados. Ambas cuentas administradoras anteriores se conservan.

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
