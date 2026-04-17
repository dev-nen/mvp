# Public Card v2 Data Mapping

This document maps the public catalog teaser card only. The current frontend
runtime shape is used without backend schema changes.

| UI block | Backend source field | Mapping type | Visual priority | Status | Observations |
| --- | --- | --- | --- | --- | --- |
| Image | `activities.image_url` | Simple | 1 | Required | Runtime field exists as `activity.image_url`; UI uses the standard placeholder when the runtime image is missing or fails. The teaser media box keeps a fixed ratio and crops with `object-fit: cover` so portrait or landscape source images do not change the card height. |
| Favorite heart | UI state + `useFavorites()` | UI + protected interaction | 2 | Visible, operable by access state | Public teaser card renders a top-right heart. When access is ready it toggles local favorites. When the user is anonymous or missing city, it starts the protected access flow and resumes the pending favorite action after access is ready. |
| Free badge | `activities.is_free` | Conditional | 3 | Conditional | Show `Gratis` only when `activity.is_free === true`. Current runtime shape does not expose `is_free` for most fallback records, so the badge normally remains hidden unless the activity explicitly provides it. |
| Main category | `categories.name` | Simple | 4 | Required | Runtime exposes `activity.category_label` instead of `categories.name`; the public card uses that alias and does not show `type_activity`. |
| Title | `activities.title` | Simple | 5 | Required | Runtime field exists as `activity.title`. |
| Age | `activities.age_rule_type` + `activities.age_min` + `activities.age_max` | Composed | 6 | Required when supported | Allowed outputs only: `range` -> `{age_min} a {age_max} anos`, `from` -> `Desde {age_min} anos`, `until` -> `Hasta {age_max} anos`, `all` -> `Para todas las edades`. Unsupported or incomplete runtime values render no raw age text. |
| Center | `centers.name` | Simple | 7 | Required | Runtime exposes `activity.center_name`; the public card uses that alias and does not show venue or address fields. |
| City | `cities.name` | Simple | 8 | Required | Runtime exposes `activity.city_name`; the public card uses that alias and does not compose it with venue or address fields. |
| View more button | Fixed UI element | UI-fixed | 9 | Required | Renders fixed text `Ver mas` and calls the existing `onViewMore(activity)` interaction; it is not backend-driven. |
