# Activity Contact Options Readiness Note

## Scope Note

This note reflects the current checked environment on
`feat/real-db-auth-migration` as reviewed on April 22, 2026.
It documents the current readiness of `activity_contact_options` as a product
data source, what is already implemented in the branch, and what still needs to
exist before contact validation can be treated as fully exercised.

## Current Frontend State

The active branch already moved contact behavior to the real contract:

- Home detail modal reads `activity_contact_options`
- Favorites detail page reads `activity_contact_options`
- there is no fallback to center-level contact
- there is no hardcoded WhatsApp number
- one active option opens directly
- multiple active options open a chooser dialog
- zero active options leaves the activity without an operational CTA

This means the branch is already aligned to the intended runtime contract. The
remaining gap is not frontend structure. The remaining gap is backend data
coverage across all intended states.

## Observed Backend Data State

In the current checked environment:

- `activity_contact_options` exists
- public read policies and grants exist
- the checked branch preview still resolves to deployment commit
  `1985d3e9976b4a9925302f82c4aaee960765a1f2`
- the public Supabase client for this branch points to project ref
  `xgvsinjbvsohnreifxcj`
- the checked public catalog currently exposes these activities:
  - `id=2` `Teatro para ninos y preadolescentes`
  - `id=5` `Kumon (Matematicas-Lectura-English)`
  - `id=6` `Taller ambiguo de prueba`
- anon validation queries now return:
  - table-wide: `2` visible rows in `activity_contact_options`
  - `activity_id=2`: `1` visible row
  - `activity_id=5`: `1` visible row
  - `activity_id=6`: `0` visible rows
- current visible active rows:
  - `id=1`, `activity_id=2`, `contact_method=WhatsApp`,
    `contact_value=+34619873072`, `is_active=true`, `is_deleted=false`
  - `id=2`, `activity_id=5`, `contact_method=WhatsApp`,
    `contact_value=+34617174907`, `is_active=true`, `is_deleted=false`
- those reads returned `error = null`, so the browser-facing query path is
  succeeding and returning real activity-level contact data

Additional checked detail:

- activity `id=2` still has center-level contact data in `centers`:
  - `contact_email = info@elretirositges.cat`
  - `contact_phone = +34 93 894 01 37`
- that data remains intentionally ignored by the active branch because the
  accepted contract is `activity_contact_options` only

Practical reading:

- the schema contract exists
- the browser can read the table
- current activity data now supports:
  - honest `0 contactos`
  - direct single-option WhatsApp CTA
- current activity data still does not support:
  - multiple-option chooser behavior

## What This Blocks And What It Does Not Block

This does not block:

- applying the migration SQL
- reading the real catalog
- auth and profile provisioning work
- remote favorites
- zero-contact CTA behavior
- direct single-option CTA behavior

This does block full validation of:

- multiple-option chooser behavior
- realistic `activity_contact_events` writes triggered by a real selected
  contact option across more than one available path

## Deferred Resolution

This remains a data-readiness line, not a reason to reintroduce a mock or
fallback contact source in the branch.

Rejected for the current branch:

- fallback to center contact
- fallback to a fixed WhatsApp number
- frontend-only fake contact options

Reason:

The branch already chose the real product boundary. If some activity states are
still missing in data, the correct response is to fill the real table later, not
to reopen a temporary frontend path.

This is especially important for the current preview reading:

- the observed CTA state for activities `id=2` and `id=5` is now the expected
  direct-contact result for a single active option
- the observed no-contact state for activity `id=6` is the expected result when
  `activity_contact_options` has no active rows
- center-level contact being present or absent still does not change that
  result in this branch

## Future Validation Requirement

Before the contact CTA can be treated as fully validated, the checked Supabase
environment should contain at least:

1. one activity with exactly 1 active contact option
2. one activity with 2 or more active contact options
3. one activity with 0 active contact options

Current reading:

- item 1 is now available
- item 3 is now available
- item 2 is still missing

## Current Closure Reading

- contact runtime contract in branch: `Done`
- contact schema availability in Supabase: `Done`
- contact data readiness for full validation: `Partial`
- mock or fallback contact source: intentionally rejected
- current preview diagnosis for contact CTA behavior: `Done`
- current closure on the checked branch preview: no code bug demonstrated;
  direct single-option WhatsApp CTA is now backed by real rows for
  `activity_id=2` and `activity_id=5`
