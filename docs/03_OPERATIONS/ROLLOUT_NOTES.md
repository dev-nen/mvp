# Rollout Notes

## Recommended deployment order

1. Supabase SQL/migrations/seeds.
2. Environment variables.
3. Supabase Auth/OAuth dashboard config.
4. Frontend deploy.
5. Vercel domain/canonical verification.
6. Sitemap/robots check.
7. RLS smoke tests.
8. Product smoke tests.

## Supabase SQL

Apply only against the intended project. Use repo-tracked files under:

- `supabase/sql`
- `supabase/seed`
- `supabase/manual`

Do not copy SQL from chat history.

## Env vars

Required names:

```txt
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
INTERNAL_PVI_API_TOKEN
```

`SUPABASE_SERVICE_ROLE_KEY` and `INTERNAL_PVI_API_TOKEN` must be server-only.

## OAuth dashboard

Confirm:

- production domain;
- preview/dev domains if used;
- redirect URLs;
- `/privacidad`;
- `/terminos`.

## Public route validation

Check:

- `/`
- `/sobre-nensgo`
- `/para-centros`
- `/privacidad`
- `/terminos`

## Internal validation

Do not treat internal routes as ready until:

- SQL is applied;
- internal user is granted in `internal_tool_access`;
- seed or real drafts exist;
- smoke tests pass against live Supabase.

## Known operational caveats

- Supabase schema cache may lag after applying views/functions.
- Contact read failures with `PGRST205` can indicate missing `activity_contact_options_read`.
- Vite chunk warning is known and should be monitored.
- Vercel Web Analytics requires dashboard/live verification.
