# Detail View MVP 2.0 Data Mapping

This document maps the two accepted detail surfaces to the current frontend
runtime shape.

## Detail surfaces covered

- `src/components/catalog/ActivityDetailModal.jsx`
- `src/pages/FavoriteActivityDetailPage.jsx`

## Shared detail view model

Both surfaces consume the same normalized detail contract built from the
runtime activity shape:

- `imageSrc`
- `title`
- `categoryLabel`
- `description`
- `showFreeBadge`
- `evaluationItems`
- `locationItems`

## UI to runtime field mapping

| UI block | Runtime source field | Mapping type | Status | Notes |
| --- | --- | --- | --- | --- |
| Main image | `activity.image_url` | Simple with fallback | Required | Uses standard placeholder when missing or broken |
| Category | `activity.category_label` | Simple | Optional visible | Hidden when empty |
| Free badge | `activity.is_free` | Conditional | Optional visible | Show only when `is_free === true` |
| Title | `activity.title` | Simple | Required | Rendered as the main heading |
| Description | `activity.short_description` | Simple | Optional visible | Primary descriptive block in MVP 2.0 |
| Age | `activity.age_rule_type`, `activity.age_min`, `activity.age_max` | Composed | Optional visible | Uses shared age formatting helper |
| Schedule | `activity.schedule_label` | Simple | Optional visible | Hidden when empty |
| Price | `activity.price_label` | Simple with condition | Optional visible | Hidden when `is_free === true` or when empty |
| Venue | `activity.venue_name` | Conditional | Optional visible | Hidden when empty or when it duplicates `center_name` |
| Address | `activity.venue_address_1` | Simple | Optional visible | Hidden when empty |
| Center | `activity.center_name` | Simple | Optional visible | Hidden when empty |
| City | `activity.city_name` | Simple | Optional visible | Hidden when empty |
| Favorite heart | UI state + `useFavorites()` | UI + local state | Required | Modal toggles in place, favorites detail removes and exits |
| Contact CTA | Current WhatsApp builder | UI + helper | Required | Uses existing WhatsApp flow |

## Ordered output contract

### `evaluationItems`

Order:

1. age
2. schedule
3. price

Rules:

- include age only when the formatted age label is valid
- include schedule only when `schedule_label` is non-empty
- include price only when `is_free !== true` and `price_label` is non-empty

### `locationItems`

Order:

1. useful `venue_name`
2. `venue_address_1`
3. `center_name`
4. `city_name`

Rules:

- do not render `venue_name` when it matches `center_name`
- do not infer address, center, or city from other fields

## Current runtime note

The current fallback runtime still does not provide `is_free`, so the `Gratis`
badge is implemented but normally remains hidden until that field becomes
available in the activity shape.
