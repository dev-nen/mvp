# Detail View MVP 2.0 Structure

This document describes the MVP 2.0 detail-view structure adopted in the two
existing detail surfaces.

## Current detail surfaces

- `src/components/catalog/ActivityDetailModal.jsx`
- `src/pages/FavoriteActivityDetailPage.jsx`

## Adopted functional order

Both surfaces follow the same functional sequence:

1. Main identity
2. Main descriptive content
3. Evaluation block
4. Practical location block
5. Main action

## Block distribution

### 1. Main identity

- top image
- visible category
- main title
- top-right identity action area

### 2. Main descriptive content

- `short_description` as the primary descriptive text

### 3. Evaluation block

- age
- schedule
- price or `Gratis`

### 4. Practical location block

- `venue_name` when it adds value
- `venue_address_1`
- `center_name`
- `city_name`

### 5. Main action

- final `Contactar` CTA

## Intentional differences kept in this phase

- The modal keeps its existing topbar with back and close controls
- The favorites page keeps its existing page header and back navigation
- The favorites page uses the existing remove-favorite action in the identity
  action slot
- The modal keeps only a reserved top-right slot and does not invent a new
  secondary action

## Explicitly deferred to later subtasks

- auth and access gating
- final favorites behavior
- final `Contactar` behavior and copy policy
- full fallback and presentation rules for detail fields
- full `Gratis` vs `price_label` business rules
- backend, services, hooks, data files, or route changes
