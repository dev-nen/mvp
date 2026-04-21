# Activity Contact Options Readiness Note

## Scope Note

This note reflects the current checked environment on
`feat/real-db-auth-migration` as reviewed on April 21, 2026.
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
remaining gap is not frontend structure. The remaining gap is data readiness.

## Observed Backend Data State

In the current checked environment:

- `activity_contact_options` exists
- public read policies and grants exist
- the validation query returned no rows

Practical reading:

- the schema contract exists
- the browser can read the table
- current activity data does not yet provide real contact options to exercise
  the CTA path

## What This Blocks And What It Does Not Block

This does not block:

- applying the migration SQL
- reading the real catalog
- auth and profile provisioning work
- remote favorites
- zero-contact CTA behavior

This does block full validation of:

- single-option direct contact behavior
- multiple-option chooser behavior
- realistic `activity_contact_events` writes triggered by a real selected
  contact option

## Deferred Resolution

This is a readiness gap to resolve later, not a reason to reintroduce a mock or
fallback contact source in the branch.

Rejected for the current branch:

- fallback to center contact
- fallback to a fixed WhatsApp number
- frontend-only fake contact options

Reason:

The branch already chose the real product boundary. If data is not ready yet,
the correct response is to document that readiness gap and fill the real table
later, not to reopen a temporary frontend path.

## Future Validation Requirement

Before the contact CTA can be treated as fully validated, the checked Supabase
environment should contain at least:

1. one activity with exactly 1 active contact option
2. one activity with 2 or more active contact options
3. one activity with 0 active contact options

That data set is enough to validate all three intended UI states in the current
branch.

## Current Closure Reading

- contact runtime contract in branch: `Done`
- contact schema availability in Supabase: `Done`
- contact data readiness for full validation: `Partial`
- mock or fallback contact source: intentionally rejected
