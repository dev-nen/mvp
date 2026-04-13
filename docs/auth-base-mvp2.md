# Auth Base MVP 2.0

## Objetivo

Esta fase conecta la base minima de autenticacion real para NensGo con
`Supabase Auth` y `Google` como unico provider inicial.

El resultado esperado de esta fase es:

- login con Google
- sesion persistente en navegador
- bootstrap de sesion al cargar la app
- escucha de cambios de autenticacion
- estado auth minimo disponible en frontend
- logout funcional

## Alcance implementado

- `AuthProvider` global con una unica fuente de verdad para auth
- `useAuth()` para exponer `isAuthenticated`, `user`, `session`,
  `isAuthLoading`, `signInWithGoogle`, `signOut` y `authError`
- bootstrap inicial con `supabase.auth.getSession()`
- suscripcion a `supabase.auth.onAuthStateChange()`
- login Google con `redirectTo: window.location.href`
- `Navbar` conectada a estado auth real sin flicker entre anonimo y autenticado
- `ProfilePage` convertida en superficie minima real de auth

## Metodo de login elegido

- proveedor: `google`
- infraestructura: `Supabase Auth`
- flujo: `signInWithOAuth`
- retorno tras login: misma ruta que lanzo el acceso, usando
  `redirectTo: window.location.href`

## Dependencias externas ya resueltas fuera del repo

Se asume como configurado fuera del codigo:

- Google OAuth client
- Google provider habilitado en Supabase
- callback URI de Supabase cargada en Google
- Authorized JavaScript origins cargados en Google
- Site URL y Redirect URLs configuradas en Supabase

## Scope diferido a fases siguientes

No forma parte de esta fase:

- perfil persistido propio en base de datos
- edicion y guardado real de perfil
- avatar persistido
- favoritos por usuaria
- migracion desde `localStorage`
- guards completos del detalle
- roles o RLS de negocio
- multiples providers
- email/password o magic link

## Nota de implementacion

Durante el bootstrap, `Navbar` y `ProfilePage` no renderizan estados
contradictorios. Mientras `isAuthLoading` sigue resolviendose, ambas superficies
mantienen un estado neutro para evitar flicker entre anonimo y autenticado.
