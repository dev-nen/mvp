# Card Public v2 Fallback Rules

This document defines the public catalog card MVP 2.0 behavior implemented in
the frontend runtime without backend, service, hook, or data-file changes.

## Activity validity for catalog render

An activity can render in the public catalog only when all of these are true:

- `title` is a non-empty string after `trim()`
- `city_name` is a non-empty string after `trim()`
- `image_url` is a non-empty string after `trim()` or the standard placeholder
  asset is available
- At least one additional useful signal is present:
  - valid public age label
  - valid category label
  - valid center label

An activity does not render when:

- `title` is missing or invalid
- `city_name` is missing or invalid
- no useful signal exists beyond title, city, and placeholder image

## Image fallback

- Use `activity.image_url` only when it remains non-empty after `trim()`
- Otherwise use `/placeholders/activity-card-placeholder.svg`
- If the runtime image fails to load, swap once to the SVG placeholder
- If the placeholder is already applied, do not reassign again
- Do not render broken media and do not inject text inside the visual block

## Title fallback

- `title` is required
- Missing or invalid title means the activity is filtered out before render

## Age fallback

- Show age only when the public age combination is valid
- Allowed outputs:
  - `range` -> `{age_min} a {age_max} anos`
  - `from` -> `Desde {age_min} anos`
  - `until` -> `Hasta {age_max} anos`
  - `all` -> `Para todas las edades`
- Unsupported or incomplete age data hides the age block
- Do not infer age from title, description, or other fields

## Category fallback

- Show category only when `category_label` is valid after `trim()`
- Hide the category block when it is missing
- Do not substitute `type_activity`

## Center fallback

- Show center only when `center_name` is valid after `trim()`
- Hide the center block when it is missing

## City fallback

- `city_name` is structurally required
- Missing or invalid city means the activity is filtered out before render

## Combined place fallback

- If `center_name` and `city_name` both exist, show both
- If only `city_name` exists, show only city
- If `city_name` is missing, do not render the activity

## Free badge fallback

- Show `Gratis` only when `activity.is_free === true`
- If `is_free` is `false`, missing, or not trustworthy, show nothing
- Do not show "de pago" and do not show textual price on the public card

## Current runtime gaps

- `is_free` is still absent in the current runtime-enriched shape, so the badge
  normally remains hidden
- `center_name`, `city_name`, and `city_slug` are runtime aliases added later
  and are not base fallback truth
- The public catalog previously relied on `/placeholder.jpg`, but that asset
  does not exist in the app
- Public validity filtering now happens in `HomePage.jsx` before catalog render
