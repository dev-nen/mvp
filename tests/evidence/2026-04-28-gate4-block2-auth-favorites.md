# Gate 4 Block 2 Auth, Profile, Favorites Evidence

## Context

- Date: 2026-04-28
- Branch: `codex/gate2-gate3-prep`
- Environment: Vercel preview
- Tester state: authenticated app users

## Human Result

```txt
1. Accion protegida abre gate de acceso: Pass
2. Login vuelve al host correcto: Pass
3. Usuario ready puede usar la app: Pass
4. Ya autenticado, detail id 2 abre sin errores: Pass
5. Ya autenticado, contacto id 2 funciona: Pass
6. Favorito se agrega y persiste tras reload: Pass
7. Favorito se quita y persiste tras reload: Pass
8. Perfil no muestra copy tecnica vieja: Pass
```

## Evidence Notes

- Profile surface was checked for two authenticated users.
- The internal Draft Inbox entry appears only for the authorized internal user.
- The non-internal user profile has no Draft Inbox entry.
- No old technical auth/profile copy was reported.

## Gate Reading

Gate 4 Block 2 is `Done` for the tested preview environment.
