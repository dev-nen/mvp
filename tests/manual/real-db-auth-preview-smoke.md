# Checklist De Smoke Test - Preview Real DB + Auth

## Contexto

- Branch: `feat/real-db-auth-migration`
- Entorno: preview de Vercel del branch activo
- Objetivo: validar el flujo actual de catalogo real, auth y favoritos sin
  depender de memoria o chat

## Precondiciones

Marca cuando este listo:

- [x ] SQL `2026-04-21_real_db_auth_phase.sql` aplicado en Supabase
- [ x] Auth de Supabase configurado
- [x ] Redirect URLs de preview configuradas
- [ x] Variables de entorno de Vercel configuradas

## Limitacion Conocida

- `activity_contact_options` ya tiene filas reales para algunos casos, pero
  todavia no cubre el estado de multiples opciones

Consecuencia:

- ya se puede validar el estado "sin contacto publicado"
- ya se puede validar el caso de una sola opcion
- no se puede cerrar todavia el caso de multiples opciones

## Resultado General

- [ ] Smoke completo `Pass`
- [ ] Smoke completo `Fail`

Comentarios generales:

```txt

```

## 1. Catalogo anonimo carga desde DB real

Que hacer:

1. Abre la preview del branch.
2. Espera a que cargue la Home.
3. Comprueba que ves las actividades reales de Supabase.

Esperado:

- se renderizan las cards reales
- no aparece el catalogo viejo de mocks
- el host sigue siendo la preview correcta

Checklist:

- [ x] `Pass`
- [ ] `Fail`

Comentarios:

```txt
Las card de actividades (reales) traen el placeholder, desde devtools se ve q las trae pero no se muestran
```

## 2. Accion protegida abre la compuerta de acceso

Que hacer:

1. Desde anonimo, intenta guardar una actividad en favoritos.

Esperado:

- se abre el modal de acceso
- ofrece Google
- ofrece email/password
- permite entrar o crear cuenta

Checklist:

- [ x] `Pass`
- [ ] `Fail`

Comentarios:

```txt

```

## 3. Google vuelve al mismo host de preview

Que hacer:

1. Inicia login con Google desde la preview.
2. Completa el login.

Esperado:

- el login funciona
- vuelves al mismo host de preview
- no caes en `main`
- no caes en el host estable por error

Checklist:

- [ x] `Pass`
- [ ] `Fail`

Comentarios:

```txt

```

## 4. Usuario sin perfil completo cae en onboarding

Que hacer:

1. Usa un usuario sin `user_profiles` completo.
2. Observa el estado despues del login.

Esperado:

- la app detecta onboarding obligatorio
- no deja pasar al flujo normal sin completar perfil

Checklist:

- [ x] `Pass`
- [ ] `Fail`

Comentarios:

```txt

```

## 5. Completar onboarding con ciudad real

Que hacer:

1. Completa nombre y ciudad.
2. Envialo.

Esperado:

- el onboarding se guarda bien
- vuelves al flujo normal de la app
- la sesion queda en estado `ready`

Checklist:

- [ x] `Pass`
- [ ] `Fail`

Comentarios:

```txt

```

## 6. Catalogo autenticado sigue mostrando DB real

Que hacer:

1. Ya autenticado y con onboarding completo, vuelve a revisar la Home.

Esperado:

- siguen viendose las actividades reales
- no hay fallback silencioso a mocks

Checklist:

- [ x] `Pass`
- [ ] `Fail`

Comentarios:

```txt

```

## 7. Favoritos remotos persisten

Que hacer:

1. Anade una actividad a favoritos.
2. Ve a favoritos o verifica el estado visual.
3. Recarga la pagina.
4. Comprueba que sigue.
5. Quita el favorito.
6. Recarga otra vez.

Esperado:

- anadir funciona
- persiste tras recarga
- quitar funciona
- desaparece tras recarga

Checklist:

- [ x] `Pass`
- [ ] `Fail`

Comentarios:

```txt
incluso deslogie y borre cache y sigue funcionando, todo ok. PERO la imagen de la card desde la seccion de favoritos no carga y tampoco entra el placeholder, lo que si mantiene el tamaño la card al menos.
```

## 8. Detalle maneja correctamente el estado actual sin contacto

Que hacer:

1. Abre el detalle de una actividad ya autenticado.

Esperado hoy:

- el detalle carga
- no crashea
- no aparece fallback falso de WhatsApp
- si no hay contactos publicados, la UI lo comunica con claridad

Checklist:

- [x ] `Pass`
- [ ] `Fail`

Comentarios:

```txt

```

## 9. `/pvi` es solo placeholder publico

Que hacer:

1. Abre `/pvi` en la misma preview.

Esperado:

- la ruta carga
- no muestra metricas reales en browser
- deja claro que el path real es interno

Checklist:

- [x ] `Pass`
- [ ] `Fail`

Comentarios:

```txt

```

## Evidencia Recomendada

- URL final tras login Google
- captura del catalogo autenticado
- captura del onboarding si aparece
- captura del estado de favoritos
- captura de `/pvi`

## Resumen Rapido

```md
Fecha:
Entorno:
Preview URL:

1. Catalogo anonimo real: Pass / Fail
2. Gate de acceso: Pass / Fail
3. Redirect al mismo host: Pass / Fail
4. Onboarding obligatorio: Pass / Fail
5. Completar onboarding: Pass / Fail
6. Catalogo autenticado real: Pass / Fail
7. Favoritos persisten: Pass / Fail
8. Detalle sin contacto: Pass / Fail
9. PVI placeholder: Pass / Fail

Comentarios:
```

-cada vez q recargo la pagina aparece un cartel de "etamos recargando", ese comportamiento nunca lo pedi tal cual. solo en su momento pedi q los placeholder aparecieran en las cards como mucho.
-al hacer logout te deja en /perfil y te logea de nuevo google, se debe apretar x para que te deje ir a /perfil sin logearte y de ahi manualmente ir a home usando el logo.

- cuando se esta logeado no deberia ya de aparecer "esion

Cuenta autenticada en Supabase Auth
El email se muestra solo como referencia. No existe flujo de cambio de email en esta fase.

Proveedor
Google
Usuario Auth
abb3ed10-0ce1-4636-9437-cf487a5be0ce
Usuario app
abb3ed10-0ce1-4636-9437-cf487a5be0ce
Estado de sesion
Activa"
eso pertenecia al primer mvp y es imperativo que deje de exister.

- en perfil "Perfil

Tu cuenta
Esta pantalla solo refleja el estado real de autenticacion base para MVP 2.0.

Cuenta autenticada
Emmanuel Brandon
Esta pantalla refleja el estado real de autenticacion y el perfil de app respaldado por `user_profiles`.

"

- en: Perfil

Tu cuenta
Esta pantalla solo refleja el estado real de autenticacion base para MVP 2.0.

Cuenta autenticada
Emmanuel Brandon
Esta pantalla refleja el estado real de autenticacion y el perfil de app respaldado por `user_profiles`.

"
no debe decir "Esta pantalla refleja el estado real de autenticacion y el perfil de app respaldado por `user_profiles`."
