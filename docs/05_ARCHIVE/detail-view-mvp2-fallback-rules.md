# Detail View MVP 2.0 Fallback Rules

This document defines the rendering and hiding rules for the two accepted
detail surfaces in MVP 2.0.

## Image fallback

- Use `activity.image_url` only when it remains non-empty after `trim()`
- Otherwise use `/placeholders/activity-card-placeholder.svg`
- If the runtime image fails to load, swap once to the placeholder
- Do not render a broken image block

## Identity rules

- `title` is required for the detail to make sense
- Show category only when `category_label` is non-empty after `trim()`
- Show the `Gratis` badge only when `activity.is_free === true`
- Do not show a fake or inferred free badge from `price_label`

## Description rules

- Use `short_description` as the primary descriptive text in MVP 2.0
- Hide the description block when `short_description` is empty after `trim()`
- Do not fall back to `description` in this story

## Evaluation rules

### Age

- Show age only when the shared formatter returns a valid label
- Hide age when the result is `Consulta la edad`

### Schedule

- Show schedule only when `schedule_label` is non-empty after `trim()`

### Price

- If `is_free === true`, do not render the price item
- If `is_free !== true`, show price only when `price_label` is non-empty after
  `trim()`
- Do not render both a `Gratis` badge and a redundant textual price row

## Location rules

### Venue name

- Show `venue_name` only when it is non-empty after `trim()`
- Hide `venue_name` when it duplicates `center_name`

### Address

- Show `venue_address_1` only when it is non-empty after `trim()`

### Center

- Show `center_name` only when it is non-empty after `trim()`

### City

- Show `city_name` only when it is non-empty after `trim()`

## Empty-block rules

- Hide the evaluation section when it has no visible items
- Hide the location section when it has no visible items
- Do not render empty wrappers or placeholder copy for missing optional fields

## Favorite behavior rules

- The detail heart is always rendered in the identity action area
- In the modal surface, the heart toggles favorite state in place
- In the favorites detail surface, clicking the active heart removes the item
  and returns to `/favoritos`

## Contact rules

- `Contactar` remains the final CTA of the detail
- It continues to use the current WhatsApp handoff
- This story does not redefine the message template or the channel behavior
