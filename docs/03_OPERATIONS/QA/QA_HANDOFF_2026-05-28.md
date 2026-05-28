# QA Handoff — Public Polish, Profile, Contact Options and Form Recovery

## Summary

Status: Confirmed for repository integration. Pending QA for manual product smoke.

`main` now includes the critical form local recovery hotfix, public polish fixes, auth/profile/onboarding fixes, contact option labels with Web/Form separation, the single primary contact rule, and final price copy fixes.

Manual QA is not claimed as passed in this document. Items that require browser or live Supabase validation are marked `Pending QA`.

## Scope included

### Pack 1 — Public polish

Status: Confirmed in merged code. Pending QA in browser.

- Google Form access removed.
- "Sobre NensGo" visible label changed to "Conócenos" in ES, "Coneix-nos" in CA, and "About us" in EN.
- `/sobre-nensgo` route preserved.
- Contact chooser helper copy removed.
- Contactar CTA centered/polished.

### Pack 2 — Auth/Profile/Onboarding

Status: Confirmed in merged code. Pending QA in browser/live auth.

- Required onboarding no longer asks for last name.
- Required onboarding cannot be dismissed accidentally by overlay click.
- Profile email is visible but read-only.
- Profile name can be edited.
- Profile municipality/locality can be edited.
- `last_name` DB compatibility preserved silently.

### Pack 3 — Contact options

Status: Confirmed in merged code and SQL files. Pending QA/live data validation.

- Custom contact labels are preserved and shown publicly.
- Website and Formulario are separate contact types.
- Legacy `web` still maps to `website`.
- Public chooser shows custom label first, fallback type label if empty.
- Raw URL is not used as the primary button title.
- Only one contact can be Principal.
- Price field copy says Precio.
- Options are Gratis / De pago.
- Removed Gratuidad / De pago o sin confirmar / Texto de precio.

### Main hotfix — Local recovery

Status: Confirmed in merged code. Pending QA in browser.

- `/perfil/publicaciones/nueva` recovers unsaved data after reload/tab switch.
- `/perfil/publicaciones/:draftId/corregir` recovers unsaved data.
- `/perfil/publicaciones/actividad/:activityId/editar` recovers unsaved data.
- `/internal/drafts/new` recovery preserved.
- File objects, auth/session data and passwords are not persisted.

## What QA should retest

### Public navigation

- [ ] Navbar shows Conócenos.
- [ ] Conócenos opens `/sobre-nensgo`.
- [ ] `/para-centros` has no Google Form link.
- [ ] Contact email remains visible where expected.

### Login / onboarding / profile

- [ ] Required onboarding shows only name and municipality.
- [ ] Required onboarding does not close on outside click.
- [ ] `/perfil` shows email as read-only.
- [ ] `/perfil` allows editing name.
- [ ] `/perfil` allows editing municipality.
- [ ] Saved profile changes persist after reload.

### Publication forms

- [ ] `/perfil/publicaciones/nueva` restores unsaved data after reload/tab switch.
- [ ] Local draft recovery can be discarded.
- [ ] Successful submit clears local recovery.
- [ ] Internal draft creation still recovers unsaved data.

### Contact options

- [ ] Web and Formulario appear as separate types.
- [ ] Custom label "Web del centro" appears as button title.
- [ ] Custom label "Inscripción" appears as button title.
- [ ] URL is not shown as primary title.
- [ ] Only one Principal contact can be selected.
- [ ] One contact opens directly.
- [ ] Multiple contacts open chooser.
- [ ] WhatsApp, phone, email, website, form and Instagram work.

### Activity form copy

- [ ] Price label says Precio.
- [ ] Options are Gratis / De pago.
- [ ] No Gratuidad.
- [ ] No De pago o sin confirmar.
- [ ] No Texto de precio.
- [ ] Precio orientativo appears only when De pago is selected.

## Known deferred QA items

Status: Deferred.

- Organizador / request-to-publish flow.
- Day/date/schedule model.
- Full Conócenos content.
- FAQ section.
- Report problem form.
- Full copy audit.
- Broader mobile visual polish.

## Technical notes for QA

Status: Confirmed for integration notes.

- Some SQL migrations for contact labels and single-primary were already applied manually before this merge.
- No SQL was applied during this merge itself.
- Branches were merged with arbolito history: no squash, no rebase, and explicit merge commits.
- Known Vite warnings about `vendor-markdown` circular chunks and a vendor chunk over 500 kB remain existing warnings when the build exits 0.

## Commit / branch references

Status: Confirmed.

- Recovery hotfix commit: `1853290 Preserve critical form state locally`.
- Pack 1 merge commit: `eb385d7 Merge branch 'fix/qa-public-polish' into main`.
- Pack 2 merge commit: `98bc531 Merge branch 'fix/auth-profile-onboarding-qa' into main`.
- Pack 3 merge commit: `406f39f Merge branch 'feat/contact-options-labels-and-form-type' into main`.
- Final main HEAD after QA pack merges: `406f39f`.

## Validation run

Status: Confirmed.

- `npm.cmd run check`: passed.
- `npm.cmd run build`: passed.
- `git diff --check`: passed.
- `git diff --cached --check`: passed.
- Static search for removed copy and Google Form links: passed with no matches in `src` or `public`.
- Static search for contact labels, primary contact flags, Web/Form paths: passed with expected code and SQL matches.
- Static search for local recovery paths: passed with expected user publication and internal draft recovery matches.
