# ADR-0003 - Controlled I18n

## Status

Accepted

## Context

NensGo needs basic ES/CA/EN support for public UI, but the catalog content comes from source data and is not ready for dynamic translation workflows.

## Decision

Use controlled static dictionaries for UI copy in ES, CA and EN. Keep dynamic content in its source language.

## Consequences

- Public UI can switch language.
- `NensGo` remains brand-locked and untranslated.
- Activities, centers, cities, people, addresses, URLs and contact values are not translated.
- No `hreflang` until language is URL-based.
- New UI copy must be added to all supported dictionaries.
