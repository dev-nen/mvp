# Detail View MVP 2.0 Structure

This document describes the final MVP 2.0 detail-view structure used by the
two accepted detail surfaces.

## Current detail surfaces

- `src/components/catalog/ActivityDetailModal.jsx`
- `src/pages/FavoriteActivityDetailPage.jsx`

## Accepted surface split

- Home keeps the gated modal detail surface
- Favorites keeps the routed detail page
- The detail story does not unify both surfaces into a single route or a
  single modal

## Adopted functional order

Both surfaces follow the same functional sequence:

1. Main image
2. Main identity
3. Main descriptive content
4. Evaluation block
5. Practical location block
6. Main action

## Block distribution

### 1. Main image

- top image
- standard placeholder when image is missing or fails to load

### 2. Main identity

- category when available
- visible `Gratis` badge when `is_free === true`
- main title
- top-right clickable favorite heart

### 3. Main descriptive content

- `short_description` as the primary descriptive text

### 4. Evaluation block

- age when valid
- schedule when present
- price only when `is_free !== true` and `price_label` exists

### 5. Practical location block

- `venue_name` only when it adds value beyond `center_name`
- `venue_address_1`
- `center_name`
- `city_name`

### 6. Main action

- final `Contactar` CTA

## Intentional differences kept in this phase

- The modal keeps its topbar with back and close controls
- The favorites page keeps its page header and back navigation
- The modal heart toggles favorite state in place
- The favorites detail heart removes the item and returns to `/favoritos`

## Dependencies outside this document

- Access gating is handled by the auth flow already implemented in the app
- Favorites persistence remains in `localStorage`
- Contact continues to use the current WhatsApp handoff
