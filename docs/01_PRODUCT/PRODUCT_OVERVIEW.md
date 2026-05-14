# Product Overview

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
