# Supabase Manual Operations

Esta carpeta contiene los bloques SQL que requieren intervencion humana en
Supabase SQL Editor durante el cierre del runtime real.

Reglas:

- copiar desde archivos de esta carpeta, no desde scripts ni chat
- no ejecutar bloques con placeholders sin reemplazarlos primero
- todo bloque escribible debe usar `begin;` y `commit;`
- si un bloque falla dentro de la transaccion, no avanzar al siguiente gate
- guardar captura o resultado JSON cuando el gate lo pida

Los scripts de `scripts/` pueden auditar o leer datos automaticamente, pero no
son la fuente para copiar SQL manual.

## Orden recomendado

1. `gate1a_verify_base_runtime.sql`
2. `gate1b_verify_draft_inbox.sql`
3. `gate1c_verify_approved_lifecycle.sql`
4. `gate2a_inspect_auth_user_triggers.sql`
5. `../sql/2026-04-28_disable_legacy_auth_profile_trigger.sql` si aparece el
   trigger legacy `on_auth_user_created`
6. `gate3a_find_user_profile.sql`
7. `gate3b_authorize_internal_user_and_seed_drafts.sql`
8. `gate3c_verify_internal_access_and_seed.sql`
9. `gate3d_public_catalog_contact_coverage.sql`
