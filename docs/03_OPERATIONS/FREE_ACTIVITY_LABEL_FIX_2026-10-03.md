# Restore free activity labels

Status: In progress. Size: M (shared card and detail presentation).

## Branch context

- Active branch: `main`, starting at `e2b2469`.
- `main` is the implementation branch for this task.
- Existing untracked `.codex-remote-attachments/` belongs to the user and stays outside the commit.

## Current state

- Maintenance commit `db49e55` removed the public card free badge and its CSS alongside retired controls.
- Catalog and public backup still preserve `is_free`; the three activities in the supplied screenshot retain `true` in the generated snapshot.
- Detail retains a small free badge, but omits free activities from its price summary.
- Existing translations provide ES/CA `Gratis` and EN `Free`.

## Goal

Restore the free badge on catalog cards and explicitly show the translated free price in detail. This is a presentation correction with no new services or costs.

## Touched files

- `src/components/catalog/CatalogActivityCard.jsx`
- `src/components/catalog/CatalogActivityCard.css`
- `src/components/catalog/ActivityDetailModal.jsx`
- `src/helpers/activityDetailViewModel.js`
- `docs/03_OPERATIONS/FREE_ACTIVITY_LABEL_FIX_2026-10-03.md`

## Out of scope

Auth, accounts, favorites, analytics, sharing, administration, database writes, migrations, contacts, route contracts and billing remain outside this correction. No change to the approved maintenance scope.

## Risks

- Accidentally marking paid or unknown-price activities as free.
- Leaving detail pricing in Spanish when English is selected.
- Badge readability on activity images and mobile layouts.

## Assumptions avoided

- Only the explicit boolean `is_free === true` indicates a free activity; empty prices, zeroes, titles and descriptions are not inferred.
- Existing paid price text remains literal. Unknown prices are not invented.
- Production readiness requires verification of the deployed revision.

## Implementation sequence

1. Restore card badge markup and styles using existing translations.
2. Include the translated free price in detail presentation while preserving the identity badge.
3. Verify free, paid and unknown-price cases in ES/CA/EN on desktop and mobile, including database-failure fallback.
4. Run repository checks and an independent read-only review.
5. Commit, validate a preview, push the authorized change and verify production; record evidence and final Git state.

## Validation

- `npm run check`.
- Browser: free-only labels, unchanged paid price, no fabricated unknown price, all three languages, desktop/mobile and public backup fallback.
- Preview and production: public catalog, detail, backup images and protected API posture.

## Pending after closure

No external configuration is required for this display correction. Existing maintenance follow-ups remain separately documented.

## Executed evidence

- `npm.cmd run check`: PASS (static, contracts, contact messages, publisher SQL, backup, maintenance permissions, center flow and production build).
- Fresh public build: 7 activities, 9 contacts and 7 local images. Counts reflect the current catalog rather than the previous release.
- Independent read-only review: PASS. Fourteen real detail-helper cases cover localized free prices, paid text, null/missing flags and non-boolean flags. Only boolean `true` is free.
- `git diff --check`: PASS. Browser verification and deployment verification are still in progress.
