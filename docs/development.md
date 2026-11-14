# Working on SipAhoy

SipAhoy is a browser-only React/TypeScript journal. The saved journal lives in IndexedDB; the community menu is a bundled reference dataset. There is no server or account layer.

## Where to make changes

| Area                           | File or folder                         | Responsibility                                                                                                                           |
| ------------------------------ | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| App coordination and pages     | `src/App.tsx`                          | Loads the journal, selects the active sailing, owns navigation/dialogs, and saves whole-journal updates.                                 |
| Forms                          | `src/forms/`                           | Separate sailing, traveler, drink-log, menu-item, and backup forms. They return results to the app rather than writing storage directly. |
| Shared UI                      | `src/components/ui.tsx`                | Dialog, labeled field, metric, section title, and empty-state components.                                                                |
| Journal summaries              | `src/components/JournalSummary.tsx`    | Historical log rows and traveler package comparisons.                                                                                    |
| Drink selection                | `src/DrinkPicker.tsx`                  | Recent choices, search/filter controls, explicit selection, and custom-drink requests.                                                   |
| Package editor                 | `src/PackagePricing.tsx`               | Editable text drafts, conversion to stored pricing, and cost-breakdown presentation.                                                     |
| Data contract and calculations | `src/model.ts`                         | Runtime schemas, inferred record types, integer-cent calculations, backups/CSV, and example data.                                        |
| Persistence                    | `src/storage.ts`                       | Validated, transactional journal reads and writes with revision checks.                                                                  |
| Community menus                | `src/catalog.ts`                       | Builds the selected ship’s menu from source observations and saved overrides.                                                            |
| Drink identity                 | `src/drinkIdentity.ts`                 | Search normalization, reviewed product equivalences, and display deduplication.                                                          |
| Drink descriptions             | `src/drinkDescriptions.ts`             | Reviewed ingredient summaries, exact matching, and user description precedence.                                                          |
| Small browser helpers          | `src/formatting.ts`, `src/download.ts` | Calendar-date display and generated-file downloads.                                                                                      |
| Bundled data                   | `src/data/`, `src/ships.ts`            | Offline source snapshots, venue supplements, and ship choices.                                                                           |
| Styling and offline shell      | `src/style.css`, `vite.config.ts`      | Responsive shared styles and production service-worker caching.                                                                          |

Function and component documentation sits beside the implementation. Component prop types describe the caller’s responsibilities. Persisted fields are documented beside their Zod schema, which remains the single source of truth for record shapes.

## How an edit reaches storage

1. `App` reads a `Snapshot`: the complete journal plus its save revision.
2. It scopes travelers/logs to the active sailing and saved drinks/venues to that sailing’s ship namespace.
3. `catalogForShip` combines saved menu records with bundled references. Browsing does not copy the whole community library into the journal.
4. A form maintains its own draft. Its callback gives the app the edited record or serving.
5. The app constructs the next complete journal. Logging a community or custom item saves its required drink/venue records in the same update as the serving.
6. `write` validates the complete journal and checks the expected revision inside the same transaction that writes it. A stale tab cannot silently overwrite a newer save.
7. Only a successful commit updates the app snapshot, closes the editor, and notifies other tabs to reload their saved state.

The `busy` state controls the interface; the `saving` ref also blocks duplicate submissions before React renders that state. Failed saves leave the editor open.

## Rules to preserve

### Money and package inputs

- Stored monetary amounts are integer USD cents. UI drafts are decimal strings. Parse them at the form boundary with `parseMoney` or `parsePricingDraft`.
- `null` means unknown; `0` is a known zero. Avoid truthiness checks when deciding whether a cost is complete.
- Gratuity percentages are stored in basis points: `1800` means `18%`. Fixed gratuities, fees, and bundled-extra values are whole-trip amounts.
- `days` counts inclusive calendar days. New package drafts suggest sailing nights as billed days, but the user supplies the actual charged days.
- `pricingForTraveler` adapts legacy daily-only records without changing their inclusive-day, fee-inclusive totals.
- `packageBreakdown.total` is the full amount paid. `drinkCost` subtracts non-drink inclusions such as Beach Club admission for the drink-value comparison. Unknown inputs withhold the comparison; estimates remain labeled.

### Trips, menus, and history

- Travelers belong to one sailing. A new traveler can copy package defaults from the last traveler on that sailing, but gets a new ID and a blank name. Pricing drafts copy nested extras independently.
- Sailings on the same ship can share a `shipId` catalog namespace. Changing an existing sailing’s ship would invalidate linked menus and venues, so the form keeps it fixed.
- Each `Entry` snapshots drink name, category, venue name, price, and actual coverage. Editing a menu or package must not rewrite those historical fields.
- `sailingDate` is the user’s calendar date for analytics. `time` is captured when a serving is saved. A fresh serving or repeat gets a new timestamp; editing preserves its original one.
- A fresh drink form starts with no selected drink. Recent selections are shortcuts that require an explicit click.

### Community data and product identity

- `catalogForShip` expects already ship-scoped local records. It preserves saved IDs and price overrides; other-ship browsing does not add other-ship venues.
- Catalog IDs are deterministic so unsaved bundled items can be found again. Save an item and its referenced venues when it is used or edited.
- Search normalization removes accents and punctuation. Product equivalence is stricter: retain meaningful qualifiers, sizes, vintages, and serving types. Follow [the identity review](drink-identity.md) before adding equivalences.
- Deduplication controls displayed choices. It does not delete stored records referenced by old logs.
- Menu references and recommendations do not establish live onboard availability. Keep provenance and checked dates attached to sourced data.

### Backups and offline behavior

- `dataSchema` validates both record shapes and cross-record references. Keep schema and backup-version changes together when the stored format changes.
- JSON restores the full journal after validation and preview; CSV is for analysis and cannot be restored.
- Test offline behavior with the production build. The service worker must first cache the app online; development-server behavior is not an offline test.
- Source refresh is a manual maintenance task in `scripts/update-community-catalog.py`. The app uses bundled facts and does not fetch source websites while cruising. Preserve the snapshot’s dates and source links when updating it.

## Checking a change

```sh
# Pure calculations, product identity, catalog precedence, backup validation, and storage conflicts:
npm test

# Type checking and production app/service-worker output:
npm run build

# In one terminal, serve the production build:
npm run preview -- --port 4173 --strictPort

# In another, use installed Chrome for end-to-end flows:
npm run test:browser
```

Browser checks cover setup, logging/editing/repeating, package bundles, traveler defaults, community search, responsive search widths, backup restoration, and offline persistence. Use existing tests for a behavior-preserving refactor; add focused coverage when a new behavior or a missing regression case warrants it.

To check unused symbols during a refactor, run `npx tsc --noEmit --noUnusedLocals --noUnusedParameters`. Format only the source files being changed; avoid reformatting generated catalog snapshots. Record verified changes in the README progress log.
