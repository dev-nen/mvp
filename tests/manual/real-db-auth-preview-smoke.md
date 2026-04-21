# Checklist De Smoke Test - Preview Real DB + Auth

## Contexto

- Branch: `feat/real-db-auth-migration`
- Entorno: preview de Vercel del branch activo
- Objetivo: validar el flujo actual de catalogo real, auth y favoritos sin
  depender de memoria o chat

## Precondiciones

Marca cuando este listo:

- [ ] SQL `2026-04-21_real_db_auth_phase.sql` aplicado en Supabase
- [ ] Auth de Supabase configurado
- [ ] Redirect URLs de preview configuradas
- [ ] Variables de entorno de Vercel configuradas

## Limitacion Conocida

- `activity_contact_options` sigue sin filas reales en Supabase

Consecuencia:

- se puede validar el estado "sin contacto publicado"
- no se puede cerrar todavia el caso de una sola opcion
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

- [ ] `Pass`
- [ ] `Fail`

Comentarios:

```txt

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

- [ ] `Pass`
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

- [ ] `Pass`
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

- [ ] `Pass`
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

- [ ] `Pass`
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

- [ ] `Pass`
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

- [ ] `Pass`
- [ ] `Fail`

Comentarios:

```txt

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

- [ ] `Pass`
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

- [ ] `Pass`
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
