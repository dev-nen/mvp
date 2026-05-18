# Local Setup

## Prerequisites

- Node.js compatible with the current Vite setup.
- npm.
- Access to Supabase env vars for real data flows.
- PowerShell on Windows, or equivalent shell.

## Install

```powershell
npm install
```

## Environment variables

Create local env from `.env.example` and fill values outside git:

```txt
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
INTERNAL_PVI_API_TOKEN=
```

For normal frontend work, the required client variables are:

```txt
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Server-only variables are needed for `/api/internal/pvi` style flows:

```txt
SUPABASE_SERVICE_ROLE_KEY
INTERNAL_PVI_API_TOKEN
```

## Run local dev

```powershell
npm.cmd run dev
```

Windows note: `npm.cmd` works when PowerShell blocks plain `npm` because of execution policy.

## Build

```powershell
npm.cmd run build
```

## Validation commands

```powershell
npm.cmd run check
npm.cmd run build
git diff --check
git diff --cached --check
```

## Build chunking note

The current Vite build uses manual vendor chunking and should not warn that the main chunk is over 500 kB. If the warning returns after adding large dependencies, treat it as performance debt and inspect the chunk split instead of raising the warning limit first.

## What local setup cannot validate

- Google OAuth consent end to end.
- Email verification deliverability.
- Supabase RLS in the target live project.
- Vercel Web Analytics dashboard collection.
- Vercel server-only secrets.
- Production domain/canonical behavior.
