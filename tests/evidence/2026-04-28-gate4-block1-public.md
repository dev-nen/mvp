# Gate 4 Block 1 Public Evidence

## Context

- Date: 2026-04-28
- Branch: `codex/gate2-gate3-prep`
- Environment: Vercel preview
- Tester state: anonymous, not logged in

## Human Result

```txt
1. Home carga catalogo real: Pass
2. Cards muestran imagen real o fallback correcto: Pass
3. Busqueda/filtro simple funciona: Pass
4. Detail modal abre actividad id 2: Fail
5. Contacto con 1 via en actividad id 2 funciona: Fail
6. Caso 0 contactos: Blocked por dataset
7. Caso multiples contactos: Blocked por dataset
8. No reaparece copy/debug publico viejo: Pass
```

## Reclassification

The reported failures for detail/contact while anonymous are not runtime bugs in
the current product contract. The current Home flow opens full detail through a
protected intent. Anonymous users should see the access gate before full detail
and contact actions.

The Gate 4 checklist was corrected so:

- Block 1 validates that anonymous detail intent opens the auth gate.
- Block 2 validates full detail/contact after the user is authenticated and
  ready.

## Remaining Blocked Cases

- Public activity with 0 active contacts: `Blocked` by dataset.
- Public activity with multiple active contacts: `Blocked` by dataset.
