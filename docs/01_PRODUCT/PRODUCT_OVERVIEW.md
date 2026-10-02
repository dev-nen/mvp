# Product Overview

## Producto vigente: mantenimiento gratuito

Estado: **Partial**. La adaptación de octubre de 2026 está implementada en
`feat/publisher-request-flow-phase4` y pendiente de configuración/despliegue
externos. NensGo permanece como prueba de concepto y portfolio, con actividades
cargadas ocasionalmente y un horizonte máximo de un año más.

La familia navega sin cuenta: Actividades, Conócenos y ES/CA/EN. El catálogo
conserva las categorías disponibles y tarjetas con imagen, categoría, título,
edad, centro y Ver más. El detalle y los contactos no requieren login. Un canal
abre directamente; varios muestran selector. El nombre para preparar WhatsApp
o correo es opcional y temporal.

No hay buscador, filtros adicionales, registro, favoritos, perfiles públicos,
estadísticas ni publicación por centros. Conócenos describe el proyecto; no
añade promesas de servicio ni datos de un equipo inventado.

Ambas administradoras anteriores trabajan desde `/usuario`: importan JSON,
revisan, completan sólo datos confirmados, seleccionan/crean centros, publican o
retiran y solicitan respaldo público manual. Los datos históricos se conservan.
La copia de catálogo/contactos/imágenes permite servir la última versión
confirmada ante un fallo o pausa de Supabase; no convierte la operación en
automática ni garantiza disponibilidad ilimitada.

La rutina y los pasos externos están en el
[runbook](../03_OPERATIONS/MAINTENANCE_RUNBOOK.md). El alcance MVP que sigue es
**referencia histórica** y no una lista de funciones a mantener o reactivar.

## Referencia anterior (histórica)

## Concepto


NensGo es una plataforma web para descubrir actividades infantiles y familiares cerca de la familia usuaria.

La propuesta inicial es ordenar un mercado fragmentado: actividades dispersas entre webs, redes sociales, buscadores, carteles, ayuntamientos y recomendaciones informales.

## Usuarios objetivo

| Usuario | Objetivo |
| --- | --- |
| Familias | Encontrar actividades relevantes por ubicación, tipo, edad, precio y contacto. |
| Centros y responsables | Ganar visibilidad ante familias interesadas. |
| Equipo interno | Revisar, mejorar y publicar contenido fiable. |

## Valor para familias

- Explorar actividades en una superficie clara.
- Filtrar por zona y categoría.
- Guardar actividades favoritas.
- Ver información básica antes de contactar.
- Contactar con la actividad cuando hay opciones configuradas.

## Valor para centros

- Aparecer en un catálogo orientado a familias.
- Presentar actividades con contexto útil.
- Recibir contactos desde opciones controladas por actividad.
- Participar inicialmente mediante el flujo público de `/para-centros`.

## Alcance MVP actual

| Área | Estado | Lectura |
| --- | --- | --- |
| Catálogo público | Partial | Implementado contra Supabase, pendiente de validación live completa. |
| Auth | Partial | Google y email/password implementados; configuración externa pendiente. |
| Onboarding | Partial | Municipio obligatorio con datos DIR3; requiere SQL/seed live. |
| Favoritos | Partial | Persistencia remota implementada; smoke live pendiente. |
| Contacto | Partial | Opciones por actividad implementadas; depende de datos reales. |
| i18n | Partial | UI estática ES/CA/EN; contenido dinámico no traducido. |
| Legal/trust pages | Partial | Rutas existen; no implica cumplimiento legal completo. |
| Draft Inbox | Partial | Interno y parcialmente validado; no productizado para uso amplio. |

## Fuera de alcance actual

- Marketplace completo de centros.
- Alta autoservicio completa para centros.
- Facturación, pagos o suscripciones.
- App móvil.
- Traducción automática de actividades.
- Motor avanzado de recomendaciones.
- Búsqueda por fechas como feature cerrada.
- Expiración automática completa de actividades.
- Legal/compliance final sin revisión externa.

## Criterio de verdad

El estado real debe leerse desde el código actual, los contratos Supabase versionados y los docs técnicos nuevos. Los SDD antiguos ayudan a entender decisiones, pero no sustituyen al estado actual del branch activo.
