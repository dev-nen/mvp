# Auth and Onboarding

## Auth model

Supabase Auth es la autoridad de identidad. La app soporta:

- Google OAuth.
- Email/password sign-in.
- Email/password sign-up.
- Mensajes de email verification.
- Reenvío de verificación.
- Logout.

Estado: `Partial`. El frontend está implementado, pero el entorno real requiere configuración de proveedores, redirects y email verification en Supabase.

## App profile vs auth user

- `auth.users` identifica al usuario.
- `user_profiles` define el perfil de aplicación.
- El usuario se considera usable cuando está autenticado, verificado y tiene perfil mínimo.
- El email viene de Supabase Auth y se trata como no editable en esta fase.
- La app no muestra UUIDs de Supabase al usuario.

## Access states

Estados usados por `AuthContext`:

- `anonymous`
- `loading_user`
- `verification_pending`
- `onboarding_required`
- `ready`
- `error`

## `ensure_my_profile`

El onboarding no inserta directamente en `user_profiles` desde el frontend. Llama `ensure_my_profile(...)`.

El SQL de hardening espera que `profile_city_id` apunte a un municipio:

- activo;
- `place_type = 'municipality'`;
- `country_code = 'ES'`;
- con `municipality_code`;
- con `dir3_code`.

## Municipality onboarding

El onboarding requiere:

- nombre;
- municipio;
- sesión autenticada;
- email verificado cuando aplica.

La búsqueda usa:

1. `municipality_choices_read`;
2. fallback transitorio a `cities` durante rollout/schema cache.

## Fuente DIR3

La fuente prevista es el catálogo oficial DIR3 de localidades, limitado a municipios de España. El seed está versionado en `supabase/seed`.

## Les Roquetes / Roquetas

Existe una excepción temporal:

- queries como `Les Roquetes`, `Roquetes` o `Roquetas` muestran `Les Roquetes (Sant Pere de Ribes)`;
- seleccionar esa opción persiste el `city_id` oficial de Sant Pere de Ribes;
- no se persiste una localidad separada.

Esto debe migrar a un modelo `known_localities` o `areas` antes de necesitar persistencia a nivel localidad.

## Protected intent

Las acciones protegidas pueden guardarse temporalmente en `sessionStorage` con key `nensgo.pending_protected_intent`.

Esto es UX para continuar una acción tras login/onboarding. No es frontera de seguridad.

## Pendiente de validación

- Google OAuth real.
- Email/password sign-up y verification.
- Redirect URLs.
- Onboarding con municipios DIR3 reales.
- RLS de `user_profiles`.
- Errores amigables sin exponer detalles técnicos.
