# User Flows

## Navegación anónima

1. La familia entra en `/`.
2. Ve landing y catálogo público.
3. Busca por texto, zona o categoría.
4. Abre intención de detalle o favorito.
5. Si la acción requiere cuenta, aparece el gate de acceso.

Estado: `Partial`. El catálogo está implementado contra Supabase, pero depende de SQL y datos live.

## Login

1. El usuario intenta una acción protegida o entra en `/perfil` o `/favoritos`.
2. El gate permite Google o email/password.
3. Supabase Auth gestiona sesión, OAuth y verificación.
4. La app resuelve si el usuario está verificado y si tiene perfil de aplicación.

Estado: `Partial`. Implementado en frontend; configuración externa de Supabase/OAuth pendiente de validación completa.

## Onboarding por municipio

1. Tras autenticación y verificación, la app pide nombre y municipio si falta perfil mínimo.
2. El selector busca municipios en `municipality_choices_read` y cae a `cities` durante rollout.
3. El usuario selecciona un municipio.
4. La app llama `ensure_my_profile(...)`.
5. El perfil queda en `user_profiles`.

Notas:

- El alcance municipal es España mediante fuente DIR3.
- Les Roquetes/Roquetas es una excepción temporal: se muestra como Les Roquetes, pero persiste Sant Pere de Ribes.
- El usuario no ve UUIDs de Supabase.

Estado: `Partial`, pendiente de smoke live sobre SQL/seed.

## Detalle de actividad

1. En Home, el detalle se abre como modal.
2. En Favoritos, el detalle existe como ruta protegida `/favoritos/:activityId`.
3. Ambas superficies comparten view-model y contacto por actividad.

Estado: `Partial`. La división modal/ruta es deuda conocida e intencional en esta fase.

## Favoritos

1. El usuario autenticado pulsa favorito.
2. Si no está listo para usar la app, se conserva la intención protegida en `sessionStorage`.
3. Cuando el usuario queda `ready`, la app ejecuta la intención.
4. La persistencia se hace en `user_favorite_activities`.

Estado: `Partial`, implementado como remoto; pendiente de validación live completa.

## Contacto

1. El usuario abre detalle.
2. La app lee `activity_contact_options_read` para la actividad.
3. Con una opción activa, abre acción directa.
4. Con varias opciones, muestra selector.
5. Sin opciones, no muestra CTA operativo.
6. Los contactos WhatsApp/email pueden incluir el nombre corto del usuario autenticado.

Estado: `Partial`, porque depende de datos reales y smoke live.

## Cambio de idioma

1. El usuario elige ES, CA o EN.
2. La preferencia se guarda en `localStorage` bajo `nensgo.language`.
3. La app actualiza `<html lang>`.
4. Sólo se traduce copy estático.

Estado: `Partial`. Base implementada; no hay URLs por idioma ni traducción de contenido dinámico.

## Flujo para centros

1. El centro entra en `/para-centros`.
2. Lee propuesta y ve ejemplo de actividad.
3. Usa el CTA externo configurado en `src/constants/paraCentros.js`.
4. También aparece contacto por email en la página.

Estado: `Partial`. Es una superficie pública preparatoria, no un sistema completo de cuentas de centros.
