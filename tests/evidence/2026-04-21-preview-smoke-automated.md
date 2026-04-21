# Automated Evidence - Preview Smoke

## Scope

- Date: `2026-04-21`
- Branch context: `feat/real-db-auth-migration`
- Environment: Vercel preview for the active branch
- Verification mode: automated browser smoke for anonymous/public surfaces only

## Notes

- The branch preview is protected by Vercel authentication for generic agents.
- Verification used a temporary Vercel share URL to access the protected preview
  without relying on a personal browser session.
- This run did not use a personal Google account or email inbox.

## Verified

### 1. Anonymous catalog loads from real Supabase data

Evidence:

- final URL resolved to the active branch preview host
- 2 public catalog cards rendered
- rendered titles:
  - `Kumon (Matematicas-Lectura-English)`
  - `Teatro para ninos y preadolescentes`

Status: `Done`

### 2. Protected action gate opens for favorites

Evidence:

- clicking `Anadir a favoritos` opened the protected access gate
- gate title:
  - `Accede con Google para guardar esta actividad`
- the modal exposed:
  - Google sign-in
  - email/password copy
  - `Entrar`
  - `Crear cuenta`

Status: `Done`

### 3. Protected action gate opens for detail intent

Evidence:

- clicking `Ver mas` while anonymous opened the same protected access gate
- gate title:
  - `Accede con Google para ver el detalle`

Status: `Done`

### 4. Public PVI route is a placeholder only

Evidence:

- `/pvi` rendered correctly on the branch preview host
- rendered title:
  - `PVI interno no operativo`
- rendered private route reference:
  - `/api/internal/pvi`
- placeholder copy confirmed:
  - `Este panel ya no consulta metricas desde el browser`

Status: `Done`

### 5. Private internal PVI API is not publicly readable

Evidence:

- anonymous GET to `/api/internal/pvi` returned:
  - HTTP `401`
  - body `{ "error": "Unauthorized." }`

Status: `Done`

### 6. Browser runtime stability during the anonymous smoke

Evidence:

- no console errors captured
- no page errors captured
- no request failures captured

Status: `Done`

## Not Verified In This Automated Run

These still require human validation or a dedicated test account plus test inbox:

- Google consent with a real user account
- email/password sign-up end-to-end
- email verification
- onboarding completion with a real authenticated user
- favorites persistence after authenticated writes
- post-auth detail flow
- contact CTA behavior once `activity_contact_options` has real rows

## Result

Automated anonymous/public smoke for the active branch preview: `Partial`

The public preview, protected-intent gate, and public/private PVI split behaved
as expected. The remaining authenticated flows still need human validation.
