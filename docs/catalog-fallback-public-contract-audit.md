# Catalog fallback public contract audit

This audit covers only the base fallback file used by the public catalog MVP
2.0 path and the runtime-enriched shape currently added later by
`catalogService`. It does not redefine backend truth, UI behavior, or service
contracts.

## 1. Initial state found

- Base fallback file audited: `src/data/catalogFallback.js`
- Activities in fallback: 7 total, 6 active
- `age_rule_type` values found before normalization:
  - `range`: 6
  - `open`: 1
- `is_free`: absent in all 7 activities
- `image_url`: present in all 7 activities
- `category_label`: present in all 7 activities
- Legacy age case detected:
  - `id: 5`, `Yoga en familia`, `age_rule_type: "open"`, `age_min: null`,
    `age_max: null`

## 2. Normalization changes applied

- Normalized `Yoga en familia` (`id: 5`) from `age_rule_type: "open"` to
  `age_rule_type: "all"`
- No other `age_rule_type` values required normalization
- No other fields were changed

## 3. Rules used to normalize age

- If `age_rule_type === "open"` and `age_min === null` and `age_max === null`,
  normalize to `all`
- If an unsupported type had both `age_min` and `age_max`, it would normalize
  to `range`
- If an unsupported type had only `age_min`, it would normalize to `from`
- If an unsupported type had only `age_max`, it would normalize to `until`
- No age was inferred from title, description, price, or any other copy field

## 4. Fields present in the base fallback file itself

The base fallback activity shape currently provides these public-contract
relevant fields directly in `src/data/catalogFallback.js`:

- `title`
- `image_url`
- `age_rule_type`
- `age_min`
- `age_max`
- `category_label`
- `center_id`
- `city_id`

Related non-contract fields also present in the base fallback include
`price_label`, `schedule_label`, `venue_name`, and `venue_address_1`.

## 5. Fields only available later in the runtime-enriched shape via `catalogService`

These fields are not stored in the base fallback activity objects. They are
added later when `catalogService` enriches the runtime shape:

- `center_name`
- `city_name`
- `city_slug`

This separation is important:

- Base fallback truth remains `center_id` and `city_id`
- Frontend runtime aliases are added after enrichment and should not be confused
  with the raw fallback source

## 6. Remaining gaps

- `is_free` remains absent in the base fallback file
- `is_free` also remains absent in the runtime-enriched shape produced by
  `catalogService`
- The public contract source of truth for taxonomy is still represented in the
  frontend fallback as `category_label`, not `categories.name`
- The base fallback does not natively expose `center_name` or `city_name`; those
  remain runtime aliases only

## 7. Fields not changed due to missing business truth

- `is_free` was not added as `true` or `false`
- No image paths were changed
- No taxonomy fields were renamed or restructured
- No center or city aliases were backfilled into the base fallback
- No price, schedule, or venue fields were removed even though the public teaser
  card does not use them

## 8. Risks and debt deferred to another phase

- `/placeholder.jpg` does not exist in the current app. This does not break the
  current fallback because every activity already has `image_url`, but it
  remains a latent risk if a future fallback entry ships without an image
- The runtime still depends on frontend aliases added by `catalogService`; this
  audit documents that boundary but does not migrate it
- `manualCatalog.js` is outside this story's scope and was not touched
