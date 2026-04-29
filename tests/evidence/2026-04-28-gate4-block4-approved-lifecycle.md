# Gate 4 Block 4 Approved Lifecycle Evidence

## Context

- Date: 2026-04-28
- Branch: `codex/gate2-gate3-prep`
- Environment: Vercel preview
- Tester state: authenticated internal user

## Human Result

```txt
1. Abrir draft id 9: Pass
2. Aprobar draft id 9: Pass
3. El draft queda approved y muestra approved_activity_id: Pass
4. Abrir la actividad aprobada desde el link interno: Pass
5. Editar un campo menor y guardar: Pass
6. El cambio persiste tras refresh: Pass
7. Despublicar la actividad: Pass
8. La actividad desaparece del catalogo real: Pass
9. Republicar la misma actividad: Pass
10. La actividad vuelve al catalogo real: Pass
```

## Approved Activity

- Draft id: `9`
- Approved activity id: `7`
- Title: `Taller ambiguo de prueba`
- Internal activity route: `/internal/activities/7`

## Clarification

The expected link from the approved draft is the internal management route
`/internal/activities/:activityId`, not the public catalog modal. Public catalog
visibility is validated separately by unpublish/republish behavior.

## Follow-Up Captured

After republishing, the catalog data was correct after refresh/reload, but an
already-open catalog component did not automatically re-render itself. This is
recorded as data freshness debt, not as a blocker for the approved lifecycle
contract.

## Automated Recheck After Block

After republish, `npm.cmd run gate3:audit` reported the temporary test
activity in the catalog:

```txt
PASS catalog_activities_read dataset - 3 row(s), 3 with image_url.
PASS contact zero-option case - Activity id(s): 7
PASS contact one-option case - Activity id(s): 2, 5
WARN contact multi-option case - No public catalog activity with multiple active contact options.
PASS activity_drafts count - 6 draft row(s).
```

## Post-Smoke Cleanup

The tester then unpublished activity `#7` again because it is seed/test data
and should not remain visible beside the small set of real catalog rows.

Final `npm.cmd run gate3:audit` after cleanup:

```txt
PASS catalog_activities_read dataset - 2 row(s), 2 with image_url.
PASS contact one-option case - Activity id(s): 2, 5
WARN contact zero-option case - No public catalog activity without active contact option.
WARN contact multi-option case - No public catalog activity with multiple active contact options.
PASS activity_drafts count - 6 draft row(s).
```

This preserves the lifecycle validation result while restoring the public
catalog to the intended real-data-only state.

## Gate Reading

Gate 4 Block 4 is `Done` for the tested preview environment.
