# Restore free activity labels

Status: Done. Size: M (shared card and detail presentation).

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
- `git diff --check`: PASS.

## Browser verification

- Local compiled App: 12 cases PASS across ES/CA/EN at 1365×900 and 390×844. Six cases exercise a free activity without a price, a paid activity with literal `12 € / clase`, and an activity with an unknown price. Only the explicitly free activity gets the card and detail badges plus a free price row.
- Six local database-failure cases return 503 for catalog/contact reads and use the real generated snapshot: 7 activities, 3 free badges, 7 loaded copied images and a two-option contact selector. No database facts are fabricated.
- Protected Vercel preview: 6 real-browser cases PASS across the same languages/viewports, with 7 public activities and 3 free activities. Access uses the official temporary Vercel protection session; protection stays enabled.
- Production `https://nensgo.com/`: 6 real-browser cases PASS. All three free cards show the localized label; the Petits científics detail shows both the identity badge and the free price row with a loaded image.
- No JavaScript page errors or horizontal overflow were detected. Mobile screenshots were inspected. Test browsers and the isolated local server were closed.
- Reproducible temporary artifacts: `nensgo-free-badge-browser/verify.mjs`, `verify-remote.mjs`, `results.json`, `remote-preview-results.json`, `production-results.json`, and mobile card/detail screenshots in the host temporary directory. These contain no production writes or authentication session; preview protection cookies remain separate and are not committed.

## Release evidence

Runtime commit: `d398a997be81c09b0b80ce383f0f792fa685acf3`, pushed to `origin/main` after preview verification.

- Preview: `dpl_G9haXGGHK5a7usNXo4ovxH4vcTKR`, `https://mvp-1hbhgw7yf-dibrandons-projects.vercel.app`, READY. Built from a Git archive of the exact runtime commit, excluding user attachments.
- Preview HTTP verification: matching verified JS/CSS entry assets, public manifest/catalog, all 7 copied images, retired statistics API 410 and unauthenticated backup API 401: PASS.
- Production: `dpl_BjokjtUJQRehXn3bjtv1zUpysUw9`, `https://mvp-ibeugez0z-dibrandons-projects.vercel.app`, READY. Vercel metadata confirms target production, reference main and the exact runtime commit.
- `npm.cmd run check:preview -- --preview-url=https://nensgo.com`: PASS (home, 7 public activities, 9 contacts, 7 copied images and API permissions).

Release evidence is saved in a documentation-only follow-up; runtime code is identical to the validated preview and production. Final Git synchronization is verified after that follow-up. Existing user attachments remain untracked and untouched. No service, billing, auth or database change was required.
