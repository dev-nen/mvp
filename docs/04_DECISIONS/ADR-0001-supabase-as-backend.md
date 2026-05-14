# ADR-0001 - Supabase as Backend

## Status

Accepted

## Context

NensGo needs auth, database, read models, user profiles, favorites, contact options, events and internal tooling without building a custom backend too early.

## Decision

Use Supabase Auth and Supabase Postgres as the main backend for the MVP. Use Vercel for hosting, serverless API seams and analytics, but not as the product database.

## Consequences

- Faster MVP implementation.
- RLS/grants/RPC checks become security-critical.
- SQL migrations and live Supabase validation are mandatory.
- `service_role` must stay server-only.
- Frontend code must depend on stable views/RPCs instead of raw broad table access.
