# NensGo MVP

Frontend MVP para descubrir actividades infantiles y planes en familia,
filtrarlos rapido y contactar directamente con cada centro organizador.

## Resumen

NensGo es una aplicacion web enfocada en familias que quieren encontrar
opciones cerca de ellas sin perder tiempo saltando entre webs, redes y
mensajes.

El estado actual del repo cubre:

- catalogo de actividades activas
- busqueda y filtros por ciudad y categoria
- quick-access editorial en Home
- favoritos persistidos en `localStorage`
- detalle modal desde Home
- detalle completo desde Favoritos
- CTA de contacto por WhatsApp
- panel interno `/pvi` para revisar interacciones cuando Supabase esta configurado

## Current Scope

- frontend con React + Vite
- estilos en CSS plano
- catalogo servido desde la capa local actual del proyecto
- tracking de eventos hacia Supabase cuando las credenciales estan disponibles
- fallback seguro cuando Supabase no esta configurado

## Tech Stack

- React 18
- Vite
- React Router
- CSS
- Supabase JS para eventos de interaccion

## Local Setup

Instalar dependencias:

```bash
npm install
```

Levantar entorno local:

```bash
npm run dev
```

Build de produccion:

```bash
npm run build
```

## Env Vars

El proyecto lee estas variables de entorno:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Si no estan configuradas, la aplicacion sigue funcionando como frontend MVP y
simplemente omite el tracking remoto de eventos.

## Notes

- Los favoritos se guardan localmente en el navegador.
- El detalle desde Home abre en modal y el detalle desde Favoritos usa ruta dedicada.
- El CTA de WhatsApp abre contacto directo con el centro usando la informacion de la actividad.
- El panel `/pvi` depende de `activity_events` en Supabase para mostrar datos reales.

## Disclaimer

NensGo es un prototipo MVP. Algunas actividades mostradas en la interfaz son
ejemplos de prueba usados para diseno, validacion y desarrollo.
