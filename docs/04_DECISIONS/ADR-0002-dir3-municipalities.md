# ADR-0002 - DIR3 Municipalities

## Status

Accepted

## Context

Onboarding needs a reliable municipality source. Activity cities visible in the catalog are not enough and would bias onboarding toward current catalog coverage.

## Decision

Use official DIR3-coded municipality rows in `cities`, exposed through `municipality_choices_read`, as the onboarding source for municipalities in Spain.

## Consequences

- Onboarding is not limited by current catalog inventory.
- Municipality name alone cannot be globally unique.
- SQL/seed rollout is required.
- Les Roquetes/Roquetas remains a temporary exception mapped to Sant Pere de Ribes until a locality/areas model exists.
