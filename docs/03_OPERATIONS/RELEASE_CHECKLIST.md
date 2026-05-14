# Release Checklist

## Pre-release

- [ ] Confirm branch and git status.
- [ ] Confirm target Supabase project.
- [ ] Confirm target Vercel project.
- [ ] Confirm canonical domain.
- [ ] Confirm env vars are configured.
- [ ] Confirm OAuth dashboard redirects.

## Supabase

- [ ] Apply required SQL in order.
- [ ] Apply seed data if required.
- [ ] Run manual verification SQL from `supabase/manual`.
- [ ] Validate RLS and grants.
- [ ] Validate public read views.
- [ ] Validate internal access rows.

## Frontend

- [ ] `npm.cmd run check`
- [ ] `npm.cmd run build`
- [ ] Deploy to Vercel.
- [ ] Confirm routes load.
- [ ] Confirm no debug/internal copy on public pages.

## OAuth and legal

- [ ] `/privacidad` loads on target domain.
- [ ] `/terminos` loads on target domain.
- [ ] Google OAuth app points to correct trust pages.
- [ ] Redirect URLs match target domain.

## SEO

- [ ] `robots.txt` reachable.
- [ ] `sitemap.xml` reachable.
- [ ] Canonical URLs use `https://nensgo.com`.
- [ ] Protected/internal routes are not presented as public SEO pages.

## Post-release smoke

- [ ] Anonymous catalog.
- [ ] Auth login.
- [ ] Email verification.
- [ ] Municipality onboarding.
- [ ] Favorites add/remove.
- [ ] Activity detail.
- [ ] Contact flow.
- [ ] Activity events.
- [ ] Draft Inbox internal route.
- [ ] Approved activity lifecycle.
- [ ] `/api/internal/pvi` with bearer token.

## Rollback notes

Do not roll back SQL casually without a migration plan. If frontend deploy fails but SQL is already applied, prefer forward-fix or redeploy previous compatible frontend after checking contract compatibility.
