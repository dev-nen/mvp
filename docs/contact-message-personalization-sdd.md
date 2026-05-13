# Contact Message Personalization SDD

## Branch Context

- Active branch: `main`.
- This SDD describes a self-contained implementation change in the current branch.
- No comparison against another branch is required.

## Current State

- Activity contact actions are opened from the shared activity detail modal.
- The modal can be reached from Home and Favorites detail.
- Contact options come from `activity_contact_options`.
- WhatsApp and email URLs are built in `src/helpers/buildActivityContactAction.js`.
- The generated message currently includes the activity title and city when available.
- The generated message does not include the signed-in user's name.

## Goal

When a signed-in user clicks a contact option, the generated WhatsApp or email
message should include the user's display name when a reliable display name is
available.

Success means:

- WhatsApp message includes the user name.
- Email body includes the user name.
- Phone, web, and form contact URLs keep their current behavior.
- Activity titles, center names, city names, URLs, and contact values remain
  dynamic content and are not translated.
- The message remains usable when no requester name is available.

## Touched Files

- `src/helpers/buildActivityContactAction.js`
- `src/components/catalog/ActivityDetailModal.jsx`
- `src/pages/HomePage.jsx`
- `src/pages/FavoriteActivityDetailPage.jsx`
- `scripts/contact-message-personalization-check.mjs`
- `package.json`
- `docs/DOCS_INDEX.md`
- `docs/ARCHITECTURE.md`
- `docs/FEATURE_STATUS.md`

## Out Of Scope

- Changing the contact data model.
- Translating dynamic activity/contact content.
- Changing the login or onboarding flow.
- Adding company-user forms.
- Adding activity expiry rules.
- Changing how contact click analytics are recorded.

## Risks

- Passing a fallback label such as `Usuario` would make weak messages. The
  caller should pass a requester name only when there is an authenticated user
  or app profile context.
- The detail modal is shared by Home and Favorites; both entry points need the
  same requester-name behavior.
- The contact helper must stay browser-safe and testable without opening a
  real external URL.

## Implementation

1. Extend the contact URL builder with an optional requester context.
2. Include `Hola, soy {name}.` only when a trimmed requester name exists.
3. Pass the requester name from Home and Favorites detail using the existing
   display-name helper.
4. Add a small Node validation script that decodes generated WhatsApp and email
   URLs and checks the resulting message.

## Validation

- Run the focused contact-message check.
- Run the repo check pipeline.
- Confirm the implementation does not require live Supabase data to validate
  the URL/message contract.

## Pending After Closure

- Manual production smoke with a real authenticated account can confirm the
  exact external WhatsApp/email handoff after deploy.
