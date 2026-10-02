# NensGo: mantenimiento gratuito

Estado: **Partial**. La adaptación está implementada en la rama
`feat/publisher-request-flow-phase4`. El SQL, la configuración de Auth y el
despliegue de producción de esta transición siguen pendientes. Este documento
describe la implementación local y su vista previa validada; no confirma la
adaptación de `nensgo.com` ni
que la facturación real ya sea gratuita.

La decisión del 2 de octubre de 2026 es mantener el catálogo como prueba de
concepto y portfolio durante un máximo de un año más, con cargas ocasionales.
Se conserva el dominio y **ambas cuentas administradoras anteriores**:
`morfeoneon2@gmail.com` y `kairos.sitges@gmail.com`. Los datos históricos no se
borran y dejan de tener uso público. No hay registro, favoritos, estadísticas,
publicación por centros ni tareas diarias.

## Rutina mensual o después de cualquier cambio

1. Entrar directamente en `/usuario`, con una de las dos cuentas anteriores.
   No hay enlace público de acceso. Abrir **Importar** en la administración.
2. Preparar el JSON con las fuentes disponibles; pegarlo o cargar un archivo.
   El ejemplo y el prompt están también en `/internal/import`. Pulsar
   **Revisar importación** y después **Guardar como borradores**. Esto no publica.
3. Abrir cada borrador y contrastar los datos con su fuente. Corregir las
   propuestas, confirmar la vigencia de las fechas, elegir categoría y tipo,
   confirmar edad y precio, revisar horario, imagen y contactos. Un dato ausente
   sigue pendiente; no se deduce un año, una edad, un precio ni un contacto.
4. Seleccionar un centro existente. Si realmente no existe, usar **Revisar y
   crear centro**: confirmar nombre, entidad organizadora existente o nueva,
   municipio seleccionado, dirección y código postal. Comprobar duplicados y
   marcar la confirmación antes de crear. La operación guarda el centro y lo
   vincula al borrador; no publica la actividad. Si faltan datos obligatorios,
   mantener el borrador pendiente.
5. Confirmar la revisión de los datos importados y aprobar/publicar. Los cambios
   posteriores se gestionan desde **Actividades**. Para retirar una actividad,
   despublicarla; no borrar su historia. Las modificaciones del borrador
   importado requieren confirmar de nuevo la revisión.
6. Después de terminar el lote, la modificación o la retirada, pulsar
   **Crear respaldo público**. Esperar el resultado confirmado y comprobar la
   fecha del último respaldo. Abrir el catálogo sin sesión y verificar el cambio.

La portada admite JPG, PNG o WebP de hasta 5 MB. El editor prepara las imágenes
nuevas con tamaño máximo de 1600 píxeles por lado y compresión antes de subirlas.
No admite SVG ni guarda imágenes base64 en los datos.

Si una importación no termina, reintentar el mismo lote: su clave se deriva del
contenido normalizado y el servidor devuelve los borradores ya creados para ese
contenido, incluso si reintenta la otra administradora. Cambiar los datos genera otro lote; revisar la lista antes de volver a
importar para evitar duplicados editoriales.

## Formato JSON de importación

Contrato: `src/helpers/maintenanceJsonImport.js`. Se admiten entre 1 y 100
actividades por lote y hasta 1 MB de JSON. Es el mismo formato para una actividad
y para varias. Las cadenas conservan el idioma y los nombres de la fuente.
No se necesitan identificadores internos.

```json
{
  "version": 1,
  "activities": [
    {
      "title": "Título que aparece en el cartel",
      "description": null,
      "category": null,
      "type": null,
      "center": {
        "name": "Nombre real del centro",
        "city": null,
        "institution_name": null,
        "address_line_1": null,
        "postal_code": null
      },
      "age": { "rule": null, "min": null, "max": null },
      "price": { "is_free": null, "label": null },
      "date": null,
      "schedule": null,
      "venue": { "name": null, "address_line_1": null, "postal_code": null },
      "image_url": null,
      "contacts": [],
      "source_url": null,
      "notes": "Indica los datos que faltan o requieren confirmación."
    }
  ]
}
```

El ejemplo es una plantilla, no una actividad real. Sustituir sus textos por
datos de la fuente y mantener `null` cuando no consten.

| Campo | Regla |
| --- | --- |
| `title`, `description` | Texto de la actividad. La descripción admite Markdown seguro; no HTML. |
| `category`, `type` | Nombre exacto de una opción existente. El prompt de la pantalla incluye las opciones actuales; propuestas sin coincidencia quedan pendientes. |
| `center` | Nombre real y municipio cuando conste. Una coincidencia única con un centro existente se selecciona; una ambigua o nueva requiere revisión. |
| `age.rule` | `range`, `from`, `until`, `all` o `null`. Usar `all` sólo si la fuente indica todas las edades. |
| `age.min`, `age.max` | Enteros no negativos según la regla; `null` si falta el dato. |
| `price.is_free` | `true` si consta gratis, `false` si consta de pago, `null` si no consta. |
| `price.label` | Precio literal cuando se conoce; no completar ni calcular importes. |
| `date`, `schedule` | Texto literal. Se conserva junto en el horario editorial. Una fecha sin año genera un aviso; el importador no añade el año. |
| `venue` | Ubicación específica de la actividad, si difiere del centro y está documentada. |
| `image_url` | URL HTTP/HTTPS de una imagen conocida o `null`; puede subirse una portada en la revisión. |
| `contacts` | Lista de `{ "method": "email", "value": "valor real de la fuente", "label": null }`. Métodos: `whatsapp`, `phone`, `email`, `website`, `form`, `instagram`. |
| `source_url` | URL de procedencia, no convertida automáticamente en un contacto. |
| `notes` | Datos ausentes, procedencia y cualquier propuesta que deba confirmar el administrador. |

El JSON puede tener datos incompletos para guardarse como borrador. La publicación
requiere revisión y los campos obligatorios del editor. Los contactos incompletos
o las URLs inseguras se señalan para corregirlos. El respaldo sólo incluye los
datos públicos aprobados.

## Prompt para una herramienta externa

Copiar el prompt completo mostrado en **Prompt y ejemplo para preparar el JSON**;
incluye la plantilla y las categorías/tipos disponibles. Como instrucción base:

> Extrae las actividades del material proporcionado y devuelve sólo JSON válido
> con `version: 1` y `activities: []`, usando la plantilla anterior. No inventes
> datos: usa `null` si falta un dato y no completes el año de una fecha, la edad ni
> el precio. Conserva nombres, fechas y contactos como constan. `date` y
> `schedule` son textos literales. `all` sólo corresponde a todas las edades
> explícitas; `is_free` sólo es `true` si consta gratis. Identifica las propuestas
> de categoría o descripción en `notes`. Registra la procedencia en `source_url`
> y `notes`. No conviertas una URL de referencia en contacto. No incluyas
> identificadores internos, HTML, imágenes base64 ni datos de usuarios. Nunca
> publiques: el resultado se revisará como borrador.

NensGo no llama a servicios de IA, no extrae automáticamente de fuentes y no
añade servicios de pago. El administrador elige la herramienta externa y revisa
su resultado.

## Qué confirma el respaldo

El botón solicita un despliegue mediante la API protegida
`POST /api/internal/catalog-backup`. La API valida la sesión con Supabase y
`is_maintenance_operator`; el secreto del Deploy Hook sólo se usa en servidor.
El botón sólo opera en producción en `nensgo.com` o `www.nensgo.com`.

`npm.cmd run build` compila la web y ejecuta
`scripts/build-public-catalog-backup.mjs`: lee los campos permitidos de
`catalog_activities_read` y `activity_contact_options_read`, copia las imágenes
y genera `dist/catalog-backup/manifest.json`, `catalog.json` e `images/`.
No exporta cuentas, perfiles, favoritos, eventos, borradores, notas internas ni
secretos. Es una copia pública del catálogo, no un respaldo restaurable de la
base de datos privada.

Aceptar un trabajo de Vercel no significa que el respaldo esté listo. El panel
comprueba cada diez segundos el manifiesto publicado y sólo confirma una
generación distinta creada después de la solicitud. Tras diez minutos sin
confirmación muestra que no se ha confirmado; consultar el despliegue antes de
reintentar. Si falla la generación, el build falla y el despliegue anterior sigue
disponible. El estado del panel no representa un porcentaje global de Vercel.

Si falla la consulta pública a Supabase, la web usa el catálogo, los contactos y
las imágenes de la última copia válida publicada. Esa copia queda tan actual
como el último respaldo confirmado: omitir el paso después de despublicar puede
dejar una actividad antigua en el fallback. No hay cron ni mantenimiento diario.

Si Supabase se pausa, el catálogo puede seguir visible desde la copia. Para
administrar, reactivar el proyecto desde el dashboard, comprobar acceso y repetir
el flujo editorial. No intentar un respaldo nuevo mientras la fuente no pueda
consultarse.

## Preparación externa y primer despliegue

La comprobación técnica de la vista previa está **Done**. La revisión por el
usuario y el resto de pasos están **Planned**; no se ejecutan por abrir esta
documentación.

1. Revisar la [vista previa de Vercel](https://mvp-ldjrjg3su-dibrandons-projects.vercel.app/)
   del commit `db49e55`, ya compilada y validada técnicamente después del envío
   autorizado de la rama. La protección de Vercel sigue activa: usar una sesión
   autorizada o el acceso temporal facilitado por el conector, sin desactivarla.
   Véase [la evidencia](./QA/MAINTENANCE_VALIDATION_2026-10-02.md).
   El build de publicación necesita las dos variables públicas de
   Supabase y acceso a las vistas. `build:local` sólo compila la interfaz y no
   genera una copia; no usarlo como build de producción.
2. En Supabase, contrastar qué migraciones previas de Draft Inbox, lifecycle y
   contactos ya están instaladas. No reaplicar todo por fecha ni activar los
   flujos antiguos de centros. Aplicar la migración aditiva revisada
   `supabase/sql/2026-10-02_maintenance_admin.sql` después de sus dependencias.
   Conserva los registros y restringe las escrituras retiradas.
3. Provisionar ambas cuentas existentes en `maintenance_operator`. Este SQL
   exige identidades confirmadas, perfil existente y permiso `draft_inbox`;
   aborta si no encuentra las dos. Ejecutarlo únicamente en el SQL Editor
   autorizado, después de comprobar los emails. No crea usuarios ni perfiles.

   ```sql
   begin;
   do $$
   declare eligible integer;
   begin
     select count(distinct u.id) into eligible
     from auth.users u
     join public.user_profiles p on p.id = u.id
     where lower(u.email) in ('morfeoneon2@gmail.com', 'kairos.sitges@gmail.com')
       and u.email_confirmed_at is not null
       and exists (
         select 1 from public.internal_tool_access a
         where a.user_id = u.id and a.tool_name = 'draft_inbox'
       );
     if eligible <> 2 then
       raise exception 'Se requieren las dos cuentas previas verificadas con permiso draft_inbox';
     end if;
   end;
   $$;
   insert into public.maintenance_operator(user_id)
   select u.id
   from auth.users u
   join public.user_profiles p on p.id = u.id
   where lower(u.email) in ('morfeoneon2@gmail.com', 'kairos.sitges@gmail.com')
     and u.email_confirmed_at is not null
     and exists (
       select 1 from public.internal_tool_access a
       where a.user_id = u.id and a.tool_name = 'draft_inbox'
     )
   on conflict (user_id) do nothing;
   select lower(u.email) as administrator
   from public.maintenance_operator m join auth.users u on u.id = m.user_id
   order by administrator;
   commit;
   ```

4. En Supabase Auth, deshabilitar nuevas altas. Conservar los proveedores de las
   dos cuentas previas y autorizar el retorno a `https://nensgo.com/usuario` y el
   origen de la vista previa que se pruebe. Validar ambas sesiones y que otro
   usuario existente no puede administrar ni escribir.
5. En el proyecto Vercel existente, comprobar el repositorio conectado y la rama
   aprobada para producción. Crear en **Settings → Git → Deploy Hooks** un hook
   para esa misma rama, que ya debe contener esta transición. Configurar
   `PUBLIC_CATALOG_DEPLOY_HOOK` sólo en Production, sin prefijo `VITE_`, y las
   variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. Nunca copiar el hook al
   frontend, al repositorio o a capturas. Vercel vincula el hook al repositorio y
   a la rama elegida; la URL permite solicitar despliegues y se trata como un
   secreto. [Deploy Hooks de Vercel](https://vercel.com/docs/deploy-hooks).
6. Desplegar el commit aprobado, conservar el dominio y verificar que se publicó
   la copia inicial. Probar catálogo, idiomas, móvil, contactos, ambas cuentas y
   denegaciones. Solicitar un respaldo manual y esperar su nueva generación
   confirmada. La vista previa nunca debe disparar el hook de producción.

La rama se envió para preview con autorización del usuario. Producción continúa
en su despliegue anterior; SQL, Auth, hook y facturación siguen pendientes.
Las claves de servicio anteriores no son
necesarias para la API de respaldo ni para su build; no exponerlas ni eliminarlas
sin comprobar otros usos externos.

La comprobación HTTP del despliegue exige un destino explícito, sin asumir una
vista previa de `main`:

```powershell
npm.cmd run check:preview -- --preview-url=https://URL-DE-LA-VISTA-PREVIA
```

Para Vite local, usar `--preview-url=http://127.0.0.1:4173 --local`. Ese modo
comprueba la copia servida y sus imágenes, pero no las funciones API de Vercel.
Si la vista previa requiere autenticación de Vercel, la comprobación lo indica
y debe revisarse con sesión en el navegador. Las pruebas del despliegue no
solicitan respaldos ni consultan estadísticas antiguas.

Las [evidencias de validación local](./QA/MAINTENANCE_VALIDATION_2026-10-02.md)
separan pruebas completadas y comprobaciones externas pendientes.

## Costes y horizonte

El único coste aceptado es el dominio. Revisar en los dashboards reales de
Supabase y Vercel el plan, facturas, extras habilitados y consumo antes de
considerar la operación gratuita. La identificación del proyecto o un build
correcto no demuestra el plan contratado. No se han cancelado servicios ni
confirmado cuotas reales en esta tarea.

Supabase publica para Free 500 MB de base de datos, 1 GB de Storage y 5 GB de
egress; puede pausar proyectos tras una semana de inactividad. Las cuotas y las
condiciones deben comprobarse al hacer el cambio. [Precio y límites de
Supabase](https://supabase.com/pricing). Vercel Hobby es para uso personal no
comercial; revisar que el uso como portfolio/prueba de concepto y sus límites
corresponden al proyecto. [Plan Hobby de
Vercel](https://vercel.com/docs/plans/hobby).

En cada carga comprobar el crecimiento de imágenes y almacenamiento, retirar
del catálogo los contenidos que ya no sean vigentes y generar una sola copia al
terminar el lote. No añadir servicios de analítica, IA, extracción ni trabajos
programados para mantener actividad artificial en Supabase.

El horizonte máximo llega a octubre de 2027. El cierre del servicio, el dominio y
la disposición final de datos históricos requieren una decisión posterior; no
hay apagado ni borrado automático en esta implementación.
