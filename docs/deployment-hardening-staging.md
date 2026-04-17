# Deployment Hardening For Public Staging

## Purpose

This document records a narrow hardening pass for the current public staging environment while the project is still living on a temporary public host and before the dev host and production domain are finalized.

This was not a production SEO pass.
It was a staging safety pass.

## What Changed

### 1. Broken public branding asset path was fixed

`BrandLockup` was pointing to a non-existent public path:

- old: `/branding/nensgo-navbar-mark.png`

The real existing asset already lives at the root of `public/`, so the component now uses:

- new: `/nensgo-navbar-mark.png`

This change was intentionally limited to the asset path only.
No branding redesign or component rewrite was introduced in this pass.

### 2. The live `/placeholder.jpg` fallback was removed

A remaining live fallback still pointed to:

- `/placeholder.jpg`

That file does not exist in the current repo.

The active fallback in `CatalogActivityCard` was changed to the real standard placeholder asset already used in the public-card flow:

- `/placeholders/activity-card-placeholder.svg`

This pass did not change business logic or image-selection rules beyond replacing the dead fallback path with the existing real placeholder.

### 3. Global noindex/nofollow was added for staging

The base HTML now includes:

```html
<meta name="robots" content="noindex, nofollow">
```

This was added directly to `index.html`, not injected by JavaScript.

That choice is intentional for staging hygiene:

- the environment is public but temporary
- it should remain functional
- it should not behave like a production-indexable site

## Current Placeholder Standard

For the surfaces touched in this pass, the standard placeholder asset is:

- `/placeholders/activity-card-placeholder.svg`

If later surfaces still carry dead or inconsistent image fallbacks, they should be aligned to a real existing project placeholder instead of introducing new ad hoc fallback assets.

## Why Staging Uses Global Noindex/Nofollow

The current public deployment is still treated as staging, not production.

That means:

- it can be used for review and functional validation
- it should not send ambiguous SEO signals
- it should not be treated as the final public search surface

Until the hosting posture is stabilized, the safest temporary rule is global:

- `noindex`
- `nofollow`

This keeps the public staging environment accessible without presenting it as the final search-facing site.

## Deferred In This Pass

The following items were intentionally deferred and were not implemented in this hardening pass:

- `public/robots.txt`
- `public/sitemap.xml`
- production canonical logic
- final route-level SEO strategy
- production JSON-LD or social metadata strategy

These were deferred because the staging/dev host is not yet finalized and we do not want to publish either:

- a fake host
- or the temporary Vercel hostname inside those files

## What Must Be Revisited When The Dev Host Is Finalized

Once the dev host is stable, the next infrastructure/SEO hardening pass should revisit:

- creation of `robots.txt`
- creation of `sitemap.xml`
- whether staging should keep global `noindex,nofollow`
- whether route-level metadata should move out of component-local logic and into a clearer shared mechanism

That next pass should use the real dev host and stop relying on temporary assumptions.

## What Must Be Revisited Before Moving To `nensgo.com`

Before production moves to `nensgo.com`, the repo still needs a dedicated production-facing SEO pass that defines:

- production canonical rules
- final robots policy
- final sitemap contents
- final metadata by route
- any structured data that should exist in production
- the exact indexing posture for public routes versus internal or partial routes

This staging hardening pass does not solve those production concerns.
It only reduces visible breakage and ambiguous SEO behavior while the app remains on a temporary public staging host.
