# Municipality Onboarding, Catalog Areas, and I18n

Status: Done for the MVP foundation on `feat/i18n-municipality-onboarding`.

Onboarding city selection now uses official DIR3-coded municipality rows from `cities`, exposed through `municipality_choices_read`. It no longer depends on activity cities currently visible in the public catalog or on legacy `cities` rows without official codes.

The frontend prefers `municipality_choices_read`, but keeps a transitional fallback to `cities` so onboarding does not hard-fail while the migration is being applied or Supabase refreshes its schema cache. The full all-Spain municipality catalog still requires applying the migration and generated seed.

Les Roquetes / Roquetas is a temporary curated exception. It is shown as `Les Roquetes (Sant Pere de Ribes)` in onboarding, but selecting it saves the official Sant Pere de Ribes `city_id`. This must move to a real `known_localities` or `areas` model before locality-level persistence is needed.

Catalog area filters are intentionally limited for the MVP to Vilanova i la Geltrú, Sitges, Sant Pere de Ribes, and Les Roquetes. This allowlist controls filter exposure only; it is not a catalog visibility gate. Activities from other cities can still appear in the grid and text search if Supabase returns them.

Les Roquetes catalog detection is heuristic until the area model exists. The frontend derives it from available activity text such as city, title, venue, address, description, and center. It does not invent or persist missing locality data.

The i18n layer translates static UI copy only for Spanish, Catalan, and English. Dynamic activity content, activity titles, center names, city names, user names, addresses, emails, URLs, and contact values remain in their original source language. `NensGo` is brand-locked and must never be translated.
