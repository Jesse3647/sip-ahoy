# SipAhoy 🍹

An offline-first cruise drink journal built with React and TypeScript. Track drinks quickly, travel with different groups across sailings, compare the value of optional drink packages, and collect a personal drink passport.

## Project direction

- The web app is a complete product: no account, backend, or paid Apple Developer Program required for the MVP.
- Multiple sailings, each with its own travelers. Packages support daily or whole-trip prices, explicit billed days, gratuities included/percentage/exact/unknown, other fees, and per-traveler deductions for bundled non-drink extras. Unknown costs stay unknown.
- A bundled community catalog with hundreds of drinks grouped by product, ship/venue references for 30 ships, source links, and editable prices. Starter prices and community reports must be checked against onboard menus. No published source guarantees complete live onboard inventory.
- Quick logging records a drink, traveler, venue, date, menu price, covered value, and an optional note; the timestamp is captured automatically when Save is pressed. Historical price and venue snapshots preserve a log when menus change.
- IndexedDB holds the journal locally. A production service worker caches the app shell; JSON backups restore the complete journal and CSV supports analysis elsewhere.
- Start with USD. Currency conversion, real-time cruise-line data, and automatic package-rule interpretation are outside this first release.

## Roadmap and progress

This README is the project ledger. Update the milestone checkboxes and progress notes as work is verified. Items listed as ideas are not promised features.

### Milestone 0 — Foundation · complete

- [x] Recover the prior conversation and preserve the agreed direction.
- [x] Locate the empty local Git checkout and verify its GitHub remote: `Jesse3647/sipahoy`.
- [x] Agree on a lean MVP and keep this roadmap in the repository.
- [x] Choose React + TypeScript + Vite, IndexedDB, and a static PWA architecture.
- [x] Complete project setup, meaningful tests, and a local preview.

### Milestone 1 — Useful offline MVP · implemented; local validation complete

- [x] Create and switch sailings; set the ship and edit dates/sailing name. A sailing’s ship stays fixed to preserve its menu links.
- [x] Add/edit a variable number of travelers and optional package settings.
- [x] Log drinks quickly, repeat a previous drink, edit or delete mistakes.
- [x] Manage ship-specific venues and drink catalogs with per-venue prices.
- [x] Show counts, retail value, out-of-pocket value, and package break-even comparisons.
- [x] Show daily and traveler breakdowns and a drink passport of tried drinks.
- [x] Persist to IndexedDB and cache the production app for offline reloads.
- [x] Export JSON/CSV; validate and preview JSON restore before replacement.
- [x] Verify persistence, calculations, restore validation, responsive layouts, and offline reloads.

### Milestone 2 — Better journal and richer insights · in progress

- [x] Searchable community drink catalog and recent drink shortcuts by traveler, with the last traveler/venue preselected.
- Favorites, ratings, photos, and a wish list remain planned.
- Rich daily/time/venue/category charts, cross-sailing history, and cruise recap cards.
- Optional package scenarios for travelers without a package and more detailed venue-specific coverage rules. Billed days, gratuity settings, other fees, bundled-extra allocations, and a simple per-drink cap are implemented.
- More currencies, accessible filtering, improved onboarding, and install guidance.
- [x] Source-linked, dated community catalog snapshots with local price precedence.
- [x] Editable drink descriptions with reviewed ingredient references, offline display, and ingredient search.
- Expand menu coverage and add a community correction/import workflow; investigate menu photo/OCR feasibility.
- Backup reminders and friendlier file sharing to Files/iCloud Drive without native iCloud integration.
- Data migrations, larger-data performance, and broader device testing before calling the app cruise-ready.

### Milestone 3 — Native feasibility experiments · ideas, not started

- Wrap the working web app in Capacitor; retain the web app as a fully functional option.
- Prototype iOS BLE scanning and user-labeled venue fingerprints. Assess permissions, radio variability, background limitations, battery impact, and whether ships expose useful signals. Venue detection remains a suggestion that a traveler can correct.
- Prototype nearby peer-to-peer offline sharing/sync with native APIs. Establish device pairing, explicit sharing scope, stable IDs, conflict resolution, deletion tombstones, and multi-device tests before enabling it for real journals.
- Test on a Mac/iPhone using free development signing where supported; do not require a paid Apple program to start. Revisit distribution only after native features justify it.
- Do not assume access to a cruise line's beacon identifiers, APIs, Wi-Fi services, or passenger systems.

### Milestone 4 — Distribution and optional connected features · ideas

- Choose static hosting and a stable HTTPS origin for the PWA.
- Evaluate native distribution separately from PWA distribution.
- Consider opt-in backend sync/shared catalogs only if file backups and nearby sharing prove insufficient. Local-only usage must remain available.

## Progress log

### 2026-11-14 — Initial build

- Recovered the project context and found the repository empty on `main`.
- Verified Git remote access. The separate GitHub CLI account check was inconclusive under restricted networking; Git itself reached the empty remote successfully.
- Recorded the roadmap before continuing the implementation, as requested.
- Implemented the React/TypeScript journal, sailing/crew setup, menu editing, venue prices, quick logging/edit/repeat/delete, package summaries, daily chart, and passport.
- Added transactional IndexedDB saves with stale-write protection, full JSON backup/restore validation and preview, CSV export, and production PWA caching.
- Validation: production build passed; eight domain/storage tests and two Chrome acceptance tests passed. Browser coverage includes venue pricing, package caps, editing, backup round-trip, offline reload/logging, multiple sailings, shared ship menus, and responsive views.
- Reviewed desktop and phone layouts. Real iPhone/Safari and home-screen installation testing remain next steps.
- Dependency check: no known production vulnerabilities. Four low-severity build-tool audit findings remain in the Workbox/deepmerge dependency chain; revisit when upstream patches are available. Moderate/critical tool findings were resolved.
- Built in a staging checkout and transferred the tested source to the original local repository. Changes are uncommitted; nothing has been pushed or deployed.

### 2026-11-14 — Royal Caribbean ship picker

- Replaced the free-text ship field in sailing setup with an alphabetical Royal Caribbean International dropdown and a required “Select your ship” prompt.
- Bundled the ship list locally for offline setup, verified against [Royal Caribbean’s fleet list](https://www.royalcaribbean.com/faq/questions/how-many-ships-are-in-royal-caribbeans-fleet). Hero of the Seas is labeled as arriving September 2027.
- Existing sailing ship selections remain fixed, including older saved names, so editing sailing dates does not disturb shared menus.

### 2026-11-14 — Flexible package and Beach Club bundle pricing

- Added daily/whole-trip prices, editable billed days, included/percentage/exact/unknown gratuities, and other whole-trip fees.
- Added named bundled-extra deductions with a Beach Club admission shortcut, estimated or receipt values, and an unknown-value option.
- Show the original bundle total and adjusted drink-only cost separately in the traveler form and expandable dashboard breakdown. Unknown inputs pause break-even; estimated allocations stay labeled.
- Existing stored journals and version-one backups retain their original totals. New backups use version two so older app versions cannot silently discard the new pricing fields.
- Validation: production build, 16 domain/storage tests, and three Chrome acceptance tests passed, including daily/trip bundles, gratuity calculations, unknown deductions, saved comparisons, backups, and offline logging.
- Royal Caribbean confirms [beverage-package/Beach Club bundles](https://www.royalcaribbean.com/gbr/en/faq/questions/do-i-get-discount-for-royal-beach-club-paradise-island-day-pass-with-deluxe-beverage-package), [separate pass/drink inclusions](https://www.royalcaribbean.com/faq/questions/are-beverages-included-with-day-pass-and-can-i-use-my-beverage-package), and its [gratuity policy](https://www.royalcaribbean.com/faq/questions/beverage-package-gratuities-policy). Enter the applicable receipt values; no live package pricing is fetched by the app.

### 2026-11-14 — Community catalog and faster drink selection

- Added a bundled snapshot with 801 normalized drink names: factual names, reference prices, and menu/venue groupings, covering published community menus for 30 Royal Caribbean ships. Café drinks include size-specific entries; grouped soft drinks/juices are separated into individual choices.
- Added search by drink/brand/bar, category and venue filters, an optional other-ships view, and source/retrieval-date attribution. Hero of the Seas has no verified ship-specific snapshot and is not silently assigned another ship’s menu.
- Added six deduplicated recent choices per traveler, remembering the last traveler and venue. Creation timestamps keep newly logged choices ahead of legacy entries with future drink times.
- Added inline missing-drink creation, saved atomically with the log. Menu browsing/passports now search and paginate the larger catalog. Extra coverage/note fields are optional to open.
- Only locally saved, edited, or used drinks are stored in IndexedDB; the bundled library is browsed without writing hundreds of entries into every sailing. Source metadata and drink values used in logs survive backup/restore.
- New backups use version three for the expanded categories and source metadata. Versions one and two remain readable.
- Validation: production build, 23 domain/catalog/storage tests, and four Chrome acceptance tests passed. Verified per-ship references and stable IDs, recent ordering, source links, local price precedence, inline missing drinks, phone layout, backup preservation, and full offline library access.

## Community catalog sources and maintenance

The offline snapshot is based on factual menu listings compiled by [CruiserHacks](https://cruiserhacks.com/ships/royal-caribbean/wonder-of-the-seas/bar-menus-prices/), with additional coffee references from [Candid Cruise and Travel](https://candidcruisetravel.com/cafe-promenade-menu-on-royal-caribbean/) and juice/smoothie references from [CruisePrism](https://cruiseprism.com/royal-caribbean-vitality-cafe-menu/). Original menu references are retained in the snapshot where the compilation links them. No recipes, authored descriptions, reviews, photographs, ratings, or personal data are republished.

This is a **community reference catalog**, not a live cruise-line inventory or a live SipAhoy user-submission service. Menus vary by sailing, venue, and market; reports can be incomplete or based on related ships' menus. A retrieval date is the date the reference was collected, not proof the drink was served on that date. Equivalent source labels are grouped by product; original labels remain searchable aliases. Default prices use the most commonly reported price for a drink within the selected ship profile, preferring its fleetwide-menu entry; per-venue reference prices apply when available. Wine reference prices from the structured source represent the first listed offer (generally a glass); no second bottle price is inferred. Package eligibility and caps remain user-editable, rather than importing a community site's coverage tags as cruise-line rules.

Your saved prices, drink names, and venue overrides take precedence. If a community drink is missing, search other ships or add it within logging. Adding/editing a drink stays on this device and is included in your JSON backup; it does not publish a community contribution. Community-source refreshes are version-controlled changes that can be reviewed in this repository. A shared correction/import workflow remains on the roadmap.

To refresh the source snapshot deliberately:

```sh
python3 scripts/update-community-catalog.py
# To rebuild using existing downloaded pages while retaining their check date:
python3 scripts/update-community-catalog.py --cached
npm test
npm run build
```

The updater validates ship identity and fails before replacing the snapshot if a supported source cannot be parsed. Downloaded pages stay under ignored `work/catalog/`. Hand-reviewed café references are maintained in `src/data/supplemental-menus.json` with their own source and retrieval date. Review new sources, coverage, classifications, and price assumptions before committing any refresh. The running app makes no requests to the community sites; the production service worker precaches the full library for use offline.

### 2026-11-14 — Other venue and plain interface copy

- Added a stable “Other” venue to existing and new ship catalogs, reusing a saved Other venue if one already exists. Logging under Other saves a normal venue reference that survives reloads and backups.
- Replaced decorative subtitles, taglines, and promotional headings with direct page/action labels and useful descriptions. Keep future interface copy plain and task-focused.

### 2026-11-14 — Menu deduplication and explicit drink selection

- Grouped equivalent menu labels using punctuation/accent normalization, wine brand/product word order, and reviewed Chandon shorthand. Chandon Brut Classic and Garden Spritz now each appear once; Moët Brut, Rosé, and Ice remain separate. Explicit vintages, reserve labels, sizes, and bottle/glass labels stay distinct.
- Retained original names as searchable aliases and combined venue reference prices. User-edited prices retain precedence. Duplicate saved records remain available to historical logs and backups while menu/search results and recents show one product.
- Fresh log forms start with no drink selected and an empty price, even when recent drinks exist. The last traveler and venue remain convenient defaults. Selecting a recent drink is explicit; opening an existing log or choosing Repeat retains that requested drink.
- New backups use version four to preserve aliases; earlier backup versions remain readable.
- Validation: production build, 27 domain/catalog/storage tests, and five Chrome acceptance tests passed, including Chandon menu/search deduplication, empty fresh logs, explicit recent/repeat selections, offline logging, and historical record preservation.

### 2026-11-14 — Producer-checked product identity

- Confirmed from [CHANDON’s product page](https://www.chandon.com/en-int/chandon-garden-spritz) that Garden Spritz is a distinct sparkling aperitif cocktail. It was already separate from Brut Classic and remains separate.
- Audited the merge rules and removed unverified expansion of incomplete labels, including Chandon Brut → Brut Classic and Moët Brut → Brut Impérial. Unverified extra qualifiers also remain separate.
- Recorded the producer sources and future merge requirements in [the drink identity review](docs/drink-identity.md). Preserve product words unless evidence confirms an alias; similarity and equal prices are insufficient.

### 2026-11-14 — Ship venues and automatic log times

- The venue list is derived for the selected ship. It now combines saved/custom venues, community menu venues, and an independent source-backed ship-venue registry, so a venue does not require a published drink menu to appear.
- Added Bionic Bar, Solarium Bar, and additional verified dining locations for Wonder of the Seas from [Royal Caribbean’s ship page](https://www.royalcaribbean.com/cruise-ships/wonder-of-the-seas/restaurants-bars). The independent registry currently supplements Wonder; other ships continue using their community menu and saved venue data. Ship-specific additions are not copied to unrelated ships, including when browsing other ships’ drinks.
- Removed the time picker. A new log or explicit repeat records the device time when Save is pressed, not when the form opens. Date-only selection remains for daily analytics and after-the-fact entries; the selected date must fall within the sailing. Editing an existing log preserves its original timestamp.
- Existing venue IDs, custom locations, log times, and backups remain intact. The Other option is retained. CSV now exports the chosen drink date separately from its timestamp.
- Validation: production build, 31 domain/catalog/storage tests, and six Chrome acceptance tests passed, including ship-specific venue gaps, Bionic Bar persistence, capture at Save after the form has been open, backdated dates, and timestamp preservation during edits.

### 2026-11-14 — Simpler log and sailor setup

- Removed the search field from the drink log while retaining traveler filtering and the drink count. Catalog search remains available while selecting a drink.
- Adding a traveler now starts with the most recently added traveler’s package settings from the same sailing: package status, daily/trip pricing, billed days, gratuities, other fees, bundled extras, and per-drink coverage cap. The name stays blank and a new identity is created.
- The copied values are independently editable. Editing an existing traveler uses that traveler’s own values; the first traveler on a different sailing starts fresh.

### 2026-11-14 — Search layout across pages

- Restored drink-log search, combined with traveler filtering, for drink names, venues, and notes.
- Fixed shared search styles so the input fills the available space instead of being squeezed by the category dropdown. Search icons and browse controls keep their size, while the text field has a single border and a comfortable height.
- Search occupies its own full-width row on phones, with larger text. The same fix applies to the log, ship menu, passport, and drink picker.
- Validation: production build and eight Chrome acceptance tests passed, including search layout checks at 320, 390, 900, and 1440 pixels and combined log search/traveler filtering.

### 2026-11-14 — Source organization and documentation

- Moved the five editors into `src/forms/` and shared UI/summary components into `src/components/`. The main app file now focuses on journal coordination and page views, reducing it from 2,174 to about 1,200 lines.
- Added function documentation, named/documented component prop types, persisted-field comments, and documented return types for package calculations, traveler statistics, and catalog views.
- Replaced compressed declaration chains and ambiguous names in the pricing, storage, and logging flows. Extracted gratuity handling into a documented helper with explicit cases.
- Added [a developer guide](docs/development.md) covering file responsibilities, save flow, cents/basis-point conventions, unknown values, historical snapshots, ship scope, product identity, backups, and offline checks.
- Preserved app behavior, stored record shapes, catalog snapshots, and backup versions. Validation: production build, strict unused-symbol checks, 31 domain/catalog/storage tests, and all eight Chrome acceptance tests passed.

### 2026-11-14 — Drink descriptions

- Added short ingredient/style notes to menu cards, picker results, the selected drink, and the passport. Search includes descriptions as well as names, categories, and venues.
- Added [a reviewed starter set](docs/drink-descriptions.md) using Royal Caribbean guides/menus, photographed menu evidence, producer references, and general coffee definitions. Exact product/category matching preserves distinctions such as Chandon Garden Spritz versus Brut Classic. Unverified specialties stay blank.
- Menu descriptions are editable up to 500 characters. A local description takes precedence; clearing it hides the reference. An unchanged reference remains linked to the bundled source rather than becoming a saved override.
- Descriptions work offline and persist with menu records. Backups now use version 5; versions 1–4 remain readable without changing their records.
- Fixed navigation’s search reset to run before input can be entered, preventing a page change from clearing the first search.
- Validation: production build, strict unused-symbol checks, 35 data/catalog/storage tests, and all nine Chrome acceptance tests passed, including description overrides, ingredient search, legacy backups, mobile display, and offline persistence.

## Development

See [the developer guide](docs/development.md) for the source-file map, data flow, field conventions, and rules to preserve when changing the app. Functions and component properties also have documentation beside their implementations.

```sh
npm install
npm run dev
npm test
npm run build
npm run preview
# With the preview running in another terminal (defaults to port 4173):
npm run test:browser
```

Use Node 22.18+ or a newer supported LTS version; this setup was validated on Node 26.8. Browser acceptance tests use an installed Google Chrome via Playwright. `npm run dev` is for development; test offline behavior with the production build served by `npm run preview`. The app must load online once to cache its files. Before relying on it offline, wait for “Ready for offline”, reload once, then test logging and reloading with networking disabled. HTTPS (or localhost for development) is required for service workers.

## Data and package calculations

Amounts are integer cents and each sailing uses USD. Package prices are entered **per traveler**, as a daily price multiplied by explicitly billed days, or as a single whole-trip amount. New daily entries suggest the number of nights (at least one); check the actual days charged on the booking confirmation. Existing daily-only records retain their original inclusive-calendar-day calculation and fee-inclusive interpretation until edited, preserving previous totals.

Gratuities can be included, added as a percentage of the full entered price, added as an exact whole-trip amount, or left unknown. Percentage fees round once to the nearest cent. If a bundle applies gratuities to only part of its price, use the exact fee amount from the receipt. Add other whole-trip taxes/fees only if they are not already included.

The breakdown keeps the **full amount paid** separately from the **drink-only comparison cost**: entered price + added gratuities + other fees − allocated non-drink extras. Add Beach Club admission or any other named extra as a whole-trip deduction for this traveler, marked as itemized on a receipt or estimated. These allocations are not refunds or verified admission prices. A bundled open-bar pass also includes drinks; do not deduct its full standalone price while counting those drinks in the same comparison. Allocate only the non-drink portion, or leave it unknown. Unknown price, gratuity, or extra values withhold break-even results; deductions greater than the full total are rejected. A real zero drink-only cost is supported.

Each drink log stores its menu value and covered value at logging time. A package can have an optional per-drink coverage cap; drinks can be marked ineligible. Covered value is capped at the drink's price. Out-of-pocket value is menu value minus covered value. Package net value is covered drink value minus the adjusted drink-only comparison cost. Package gratuities count as a cost; menu-value savings do not assume any extra per-drink gratuity benefit. Estimated extra allocations label comparisons as estimates. Unknown package cost stays unknown. This is a journal estimate, not a cruise-line bill; special exclusions and charges need manual price/coverage adjustment.

Browser storage belongs to the current origin and browser profile. Clearing site data removes the journal; another device or hostname does not share it. Keep JSON backups, especially before changing devices or hosting addresses. CSV is an analysis export, not a restorable backup. No analytics, tracking, external fonts, or backend are needed.

## Architecture

- `src/model.ts`: schemas, money arithmetic, package summaries, backups, starter catalogs.
- `src/DrinkPicker.tsx`: recent choices, searchable/filtered catalog, and missing-drink entry.
- `src/catalog.ts`: deterministic ship catalogs, source metadata, local precedence, search, and recency ordering.
- `src/data/`: bundled factual community menus and an independent, source-backed ship-venue registry (`ship-venues.json`).
- `scripts/update-community-catalog.py`: explicit, reviewable source refresh.
- `src/PackagePricing.tsx`: guided per-traveler pricing, gratuities, bundled extras, and live cost breakdown.
- `src/storage.ts`: IndexedDB transactions with revision checks to prevent silent overwrites between tabs.
- `src/App.tsx`: responsive journal, setup, logging, catalog, analytics, and backup flows.
- `vite.config.ts`: React build and production app-shell precaching.
- `tests/`: domain/storage checks and browser acceptance coverage.

Native integration should sit behind capability adapters when introduced; the UI and data model must continue working without native plugins. A single transactional snapshot keeps the MVP small; move to indexed entity stores and a versioned operation log before peer sync or large photo libraries.

## Implementation references

[Vite setup](https://vite.dev/guide/), [PWA precaching](https://vite-pwa-org.netlify.app/guide/service-worker-precache), and [IndexedDB transactions](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB).
