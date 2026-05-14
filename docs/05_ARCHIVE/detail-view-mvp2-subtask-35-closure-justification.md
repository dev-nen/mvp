# Detail View MVP 2.0 Subtask 35 Closure Justification

## Scope Note

This note reflects the current implementation on `main` after the accepted
title-first identity adjustment for `NENSGO-35`.
It is a support document for closure and review. The current code remains the
source of truth.

## Decision Accepted

For the detail MVP 2.0 identity block, the accepted order is:

1. main image
2. title immediately after the image
3. category and optional `Gratis` badge before the descriptive block
4. favorite heart in the top-right area of the identity block

This replaces the earlier title-after-meta order that caused the mismatch with
the story acceptance criteria.

## What Changed

- `src/components/catalog/ActivityDetailModal.jsx` now renders the title before
  category and `Gratis`.
- `src/pages/FavoriteActivityDetailPage.jsx` now renders the title before
  category and `Gratis`.
- `docs/detail-view-mvp2-structure.md` was updated to match the new accepted
  order.

## Acceptance Mapping For NENSGO-35

| Story expectation | Current implementation status |
| --- | --- |
| Main image as the top visual element | Done |
| Title immediately after the image | Done |
| Category before the descriptive block | Done |
| Favorite action as a clickable heart in the top-right area | Done |
| Shared structural order across both accepted detail surfaces | Done |

## Out Of Scope

- Auth gating behavior from `NENSGO-39`
- Favorite persistence model beyond the current local implementation
- Contact channel redesign beyond the current WhatsApp handoff
- Manual QA closure of the free badge scenario introduced for broader card 6
  validation

## Validation Completed

- Static review of both accepted detail surfaces
- `npm.cmd run build`

## Pending After This Closure

- Manual UI walkthrough remains recommended for Jira evidence capture
- Broader card 6 subtasks outside structure remain governed by their own scope
