# Public card v2 data mapping

This document maps the public catalog teaser card only. The current frontend
runtime shape is used without backend, hook, service, or data-file changes.

| UI block | Backend source field | Mapping type | Visual priority | Status | Observations |
| --- | --- | --- | --- | --- | --- |
| Image | `activities.image_url` | Simple | 1 | Required | Runtime field exists as `activity.image_url`; UI uses the existing placeholder only when the runtime image is missing. |
| Free badge | `activities.is_free` | Conditional | 2 | Conditional | Show `Gratis` only when `activity.is_free === true`. Current runtime shape does not expose `is_free`, so the badge does not render; this is a contract gap. |
| Main category | `categories.name` | Simple | 3 | Required | Runtime exposes `activity.category_label` instead of `categories.name`; the public card uses that alias and treats it as a contract alias/gap. Do not show `type_activity`. |
| Title | `activities.title` | Simple | 4 | Required | Runtime field exists as `activity.title`. |
| Age | `activities.age_rule_type` + `activities.age_min` + `activities.age_max` | Composed | 5 | Required when supported | Allowed outputs only: `range` -> `{age_min} a {age_max} años`, `from` -> `Desde {age_min} años`, `until` -> `Hasta {age_max} años`, `all` -> `Para todas las edades`. Unsupported or incomplete runtime values render no raw age text. Current runtime includes `open`, which is unsupported by the closed UX contract. |
| Center | `centers.name` | Simple | 6 | Required | Runtime exposes `activity.center_name`; the public card uses that alias and does not show venue or address fields. |
| City | `cities.name` | Simple | 7 | Required | Runtime exposes `activity.city_name`; the public card uses that alias and does not compose it with venue or address fields. |
| View more button | Fixed UI element | UI-fixed | 8 | Required | Renders fixed text `Ver más` and calls the existing `onViewMore(activity)` interaction; it is not backend-driven. |
