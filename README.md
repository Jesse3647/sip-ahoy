# SipAhoy 🍹

An offline-first cruise drink journal built with React and TypeScript. Track drinks quickly, travel with different groups across sailings, compare the value of optional drink packages, and collect a personal drink passport.

## GitHub Pages deployment

[`.github/workflows/pages.yml`](.github/workflows/pages.yml) follows the hexagon-display deployment pattern: pull requests install locked dependencies, run unit tests, and build/type-check the app. Pushes to `main` and manual runs on `main` also publish `dist` through the official GitHub Pages actions.

In the repository's **Settings → Pages → Build and deployment**, select **GitHub Actions** as the source. After this workflow is pushed to `main`, the site will be available at <https://jesse3647.github.io/sip-ahoy/>. Later pushes to `main` deploy automatically; a manual run is also available under **Actions → Deploy GitHub Pages → Run workflow**. No personal access token or custom secret is required.

The workflow builds with `npm run build -- --base=/sip-ahoy/` (using the repository name dynamically). Artwork uses Vite's base URL so it loads correctly beneath the repository path, and the PWA service worker stays scoped to that path. Local development continues to use `/`.

To preview the Pages build locally:

```sh
npm ci
npm run build -- --base=/sip-ahoy/
npm run preview -- --base=/sip-ahoy/
```

Open the preview server's `/sip-ahoy/` URL. Journal data stays in the browser; publishing does not transfer local preview data to the hosted site. Use a JSON backup and restore to move a journal between origins.

## Saved sailings and leaving the demo

Each sailing is a saved session on this device, with its own travelers, packages, and drink history. To leave the sample trip, open the menu and choose **New sailing**. Create your trip, then add its travelers; the sample history stays in its own sailing.

Choose **Your sailings** in the menu (or tap the current sailing picker) to reopen any previous trip or plan another one. Each saved trip has a **Delete sailing** action with confirmation. Deletion removes that trip's travelers and logs; other sailings stay intact, including shared ship menus. Deleting the active trip opens another saved trip, and deleting the final trip returns to onboarding. Export a JSON backup before deleting anything you may want to recover.

## License and image credits

SipAhoy's original software is available under the [MIT License](LICENSE), also linked from the app footer as **Open source · MIT License**. Third-party dependencies retain their own licenses.

Official ship photography and renderings are © Royal Caribbean International and are **not covered by the MIT License**. See [third-party notices and individual image sources](public/THIRD_PARTY_NOTICES.txt) and [ship artwork documentation](docs/ship-artwork.md). The illustrated pool-deck scene and sailor characters are original generated artwork, not official Royal Caribbean imagery. SipAhoy is an independent project, not affiliated with or endorsed by Royal Caribbean.

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
- More currencies, accessible filtering, and improved onboarding.
- [x] Device-specific install guidance and browser-native installation when available.
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

- Use GitHub Pages for the PWA's stable HTTPS origin; deployment automation is configured, with the first hosted deployment pending.
- Evaluate native distribution separately from PWA distribution.
- Consider opt-in backend sync/shared catalogs only if file backups and nearby sharing prove insufficient. Local-only usage must remain available.

## Progress log

### 2026-11-14 — Random scenes after an hour since the last change

- Scene selection is now random, including the first visit. Navigation between screens/sailings, relaunch, or foreground resume chooses a different scene once an hour has elapsed since the last actual change. Quick navigation/reopening preserves the timestamp rather than postponing rotation indefinitely. The current scene remains still until a navigation/open/resume check.
- Stored last-opened preferences migrate to the last-change timer. Unit coverage exercises all five non-repeating alternatives for every scene, frequent navigation before the hourly boundary, corrupted preferences, and backwards clock changes.
- Validation: 51 unit tests passed. Twelve focused browser scenarios passed for random navigation/relaunch/resume changes, timer preservation, offline scenes, sailor deletion/cancellation/failed writes, persisted selections, live reactions, and three/four-person midpoint alignment. The updated forms, filters, backups, pricing, and journal workflows also passed their browser checks. Reviewed the 390px three/four-sailor groups and the edit/delete form.


### 2026-11-14 — Consistent sailor terminology, deletion, and centered rear portraits

- Replaced traveler wording throughout the interface, accessible labels, package forms, backup summaries, and CSV column headers with sailor/sailors. Existing saved data and JSON backup field names remain compatible. Removed the six-hour reaction disclaimer from the Sailors section of Sailing & crew.
- Added Delete sailor to the edit dialog with a named confirmation and drink-log count. Successful deletion removes only that sailor and their logs, resets a deleted selection/filter, and leaves the sailing, menus, and other sailors intact. Cancelling or a failed write preserves the sailor and dialog. Deleting the final sailor leaves one clear Add sailor action on the Sailors screen.
- Tied the rear-left portrait to the mathematical midpoint of the foreground pair in both three- and four-person mobile groups. The rear-right sailor remains to the right of the front-right sailor. Bounds, depth order, and the 48px baseline difference remain intact.


### 2026-11-14 — Grounded mobile sailor group

- Replaced the separated two-by-two rows with a compact, staggered deck grouping. Rear sailors are slightly smaller and centered between the foreground pair, with their baseline only 48px higher and explicit depth layering. Three-person groups use one centered rear sailor. One/two-person and desktop arrangements are unchanged.
- Validation: production build and the character scene browser scenario passed across 320px, 390px, tablet, and desktop sizes. Verified all silhouettes stay in bounds, rear centers sit between foreground sailors, the baseline separation stays below 80px, and the front layer paints above the rear. Reviewed the 390px group against the clear pool-deck backdrop.


### 2026-11-14 — First-visit offline images and four-sailor banners

- Reproduced a first-install offline failure: the complete image list was precached, but the already-open page had no service-worker controller, so an unvisited image failed offline until navigation. Enabled Workbox clientsClaim so activation controls the current page immediately, and registered the worker without waiting for page load. App updates still require the existing explicit update action.
- Added a menu-only offline setup status so the installed app can confirm that files are ready. The install manifest remains for application identity/icons; offline images are managed by the service worker's precache list. Confirmed the deployed worker includes all six scenes.
- Increased the banner to four sailors, always including the selected one. Three/four sailors use two rows on phones; desktop retains an overlapping row. Single and paired portraits keep their larger layout.
- Validation: production build and 15 browser scenarios passed. The new regression starts with a fresh, never-reloaded page, disconnects the network after worker activation, and successfully requests every image, including previously unvisited scenes and ship art. Four-sailor bounds, expressions, selection of additional crew, responsive layouts, reduced motion, live reaction expiry, and existing menu gestures also passed. Reviewed the four-sailor banner at 390px.


### 2026-11-14 — Six opening backdrops and welcome character fades

- Added five original illustrated backdrops alongside the pool deck: piano lounge, sunset deck, island beach, ship promenade, and moonlit deck. All six ship locally and are cached offline. The background advances one scene when reopening/resuming the app after at least an hour since the previous opening; quick reopens keep it, and it never rotates just from leaving the app visible.
- The no-sailings welcome screen cycles through all six characters about every three seconds with a gentle 250ms fade out/in. Cycling pauses when offscreen, when the app is hidden, and with reduced motion. The mascot remains one stable, tappable control.
- Without a sailing, journal navigation destinations are hidden and the app stays on Welcome aboard. New sailing, backup restore, and installation help remain available. Existing navigation returns once a sailing is created or restored.
- Validation: production build, 49 unit tests, and 17 browser scenarios passed. Coverage includes the opening-time boundary, quick reopen and resume behavior, six offline scenes, full character rotation, reduced motion, setup-only navigation, sailor layouts/expressions, save feedback, and mobile menu gestures.


### 2026-11-14 — Saved sailing management and leaving sample data

- Added New sailing and Your sailings menu shortcuts, making fresh journals and saved trip switching accessible outside the top picker. The picker explains that each trip is its own saved session. Creating a new trip keeps the demo and other trips available.
- Added a separate Delete sailing action per card with a named confirmation and record counts. Deletion removes only that trip's travelers/logs, retains menus shared by another trip, selects a remaining trip when necessary, and returns to onboarding after the last deletion. Failed writes preserve the existing state and surface the error.
- Validation: 45 unit tests passed, including active/inactive/final trip deletion, unrelated-record preservation, shared catalogs, and schema validity. Browser coverage exercises leaving/reopening the demo, cancellation, persistence, every deletion case, failed writes, and responsive menu/picker behavior.


### 2026-11-14 — MIT footer and ship image credits

- Added the MIT license with the software copyright notice, plus a public LICENSE.txt linked as “Open source · MIT License” in the footer, matching hexagon-display. Added a footer copyright callout for Royal Caribbean International and retained the image-level source credits.
- Published third-party notices with all 31 ship image source URLs and a clear exclusion of third-party material from the MIT grant. The notices distinguish official ship photography/renderings from the app's original generated scene/character artwork. Both text documents are precached for offline reading.
- Validation: GitHub Pages production build passed; footer layouts were checked at 320, 390, and 1280px. License and attribution links returned the correct text online and offline.

### 2026-11-14 — Live six-hour character reactions

- Replaced selected-day reactions with a rolling six-hour window of saved timestamps per sailor and sailing, including across midnight. Removed the Character day selector; daily journal analytics remain unchanged. No recent drinks means ready; otherwise `max(0, alcoholic logs − waters)` yields smiling at 0–2, merry at 3–5, and the woozy water-break pose at 6+. Other nonalcoholic drinks do not subtract points.
- Schedule reaction refreshes when entries expire, on focus/visibility changes, and at least every minute. Saves, edits, deletes, and restores recalculate immediately. Water affects only the cosmetic score; no alcohol-level gauge or impairment estimate is included.
- Validation: 41 unit tests and all eight character/save-feedback browser scenarios passed. Coverage includes exact six-hour expiry, future timestamps, midnight/timezone boundaries, independent sailors/sailings, water expiry increasing the score, alcohol expiry returning to ready without another save, edits/deletes, offline use, and character layouts.

### 2026-11-14 — Caption-free banner with room for hats

- Removed visible names and mood labels beneath banner characters, preserving that information in accessible figure labels. Limited sprite size to the scene height with 12px of clearance so a solo sailor's hat cannot be pushed outside the frame. The crew selector retains its names and moods.
- Validation: production build and all four character browser scenarios passed. Bounds checks cover paired sailors at phone/tablet/desktop widths and a solo sailor at 320, 390, 640, 768, and 1440px. Reviewed the solo dolphin at 640px with its full hat visible.

### 2026-11-14 — Unclipped sailors and readable pool-deck scenery

- Removed each banner sailor's clipping boundary and sized complete square expression frames to overlap within the shared scene. The selected sailor layers in front; names stay aligned beneath their own character. The clearer background uses the original illustration without extra zoom, blur, or desaturation, retaining a light gradient for the captions.
- Restricted the save-notification text-height rule to the drink name. It previously also applied to the portrait's span, shrinking the character's sprite frame. The notification now uses a square, vertically centered portrait, with centering kept separate from the reaction animation.
- Validation: production build passed. Character coverage verifies overlapping frame bounds at 320px, 390px, 768px, and desktop sizes, all six sailors and daily expressions, reduced motion, blinking, and offline artwork. Mobile navigation/dialog checks passed. Updated phone and desktop banner screenshots were visually reviewed.

### 2026-11-14 — Installation sheet and explicit iOS icons

- Replaced the installation guide's decorative grip with the same pointer-driven sheet behavior as navigation. The guide supports expansion, native content scrolling, and drag dismissal while keeping the handle visible in landscape. Other editor dialogs retain their existing behavior.
- Removed Open Share and its installation-specific sharing logic. Native sharing does not expose Safari's Add to Home Screen action; the manual guide and browser-native install prompts on supported platforms remain.
- Verified the deployed Apple touch and manifest icon URLs return the correct glass PNGs with image content types, matching local files byte for byte. The reported scene in Safari's Add to Home Screen preview remains a device-specific fallback issue, not a scene asset configured as an icon. Added explicit standard iPhone/iPad icon sizes, iOS app metadata, fresh icon URLs, and RGB PNG encoding without an alpha channel to improve compatibility. The exact iOS cause and final preview still require physical-device verification.

### 2026-11-14 — Install icon selection, quiet handle focus, and native sharing

- Marked every manifest icon candidate as maskable, added a full-bleed 1024px candidate following Apple's Safari guidance, increased maskable foreground size, and versioned the Apple touch icon URL. This addresses browser padding/fallback and cached-icon selection; actual Home Screen rendering still needs iPhone verification.
- Removed the yellow outline specifically from the menu grip. Keyboard focus still changes the grip to cobalt; other controls retain their focus outlines.
- Added Open Share to the iOS invitation and installation guide when native sharing is available. The button opens the system share sheet with the app URL. The guide remains available if sharing fails or Add to Home Screen is absent. Cancellation is quiet, and successful sharing never marks the app installed. iOS still has no direct install prompt API; native-share actions are selected by the browser/OS.
- Validation: root and `/sip-ahoy/` production builds, 39 unit tests, and 14 targeted installation/menu browser scenarios passed. Checks cover native-share success/cancellation/errors and unsupported browsers, no false installed state, every icon's opaque corner pixels/masking metadata, and the grip's keyboard focus and touch gestures. Visually reviewed the banner at 320px. Native iOS share actions and final Home Screen icon rendering still require physical-device verification.

### 2026-11-14 — iOS installation and pull-to-refresh fixes

- Rebuilt installation icons with opaque cobalt corners, added a dedicated 180px Apple touch icon, and separated the maskable icon with safe artwork padding. iOS now applies its own corner mask without white showing through. Existing installed icons may stay cached; export a JSON backup before removing/re-adding an installed app.
- Disabled vertical overscroll and added an iOS single-touch boundary guard because Safari can ignore the CSS-only setting. Downward pulls at the top are cancelled while ordinary document/dialog scrolling, sideways gestures, pinch zoom, and the menu's pointer-driven handle remain available. Explicit app updates are still available.
- Added a dismissible iPhone/iPad Home Screen invitation linking to the existing installation guide. Dismissal is remembered; the menu retains manual access. Installed app windows hide the invitation. iOS installation still requires the user's Share → Add to Home Screen action; a site cannot launch a native iOS installation prompt.
- Validation: both root and `/sip-ahoy/` production builds and all 39 unit tests passed. Eleven installation/menu/mobile browser scenarios passed, including simulated iOS offer dismissal, installed-state hiding, boundary touch cancellation, preserved scrolling, and pinch gestures. All four raster icons have verified opaque cobalt corner pixels, and the 390px banner was visually reviewed. Physical iPhone/Safari pull-to-refresh and OS installation remain to be verified.

### 2026-11-14 — GitHub Pages deployment automation

- Added a GitHub Actions workflow following hexagon-display: locked npm installation, unit tests, production build/type checks, Pages artifact upload, and a separate deployment job with limited publishing permissions. Pull requests validate without publishing; pushes and manual runs on `main` deploy.
- Made character, ship, scene, and install-guide artwork respect the deployment base path. The workflow derives its base path from the repository name (`/sip-ahoy/` after the repository rename); local development retains `/`.
- Validation: production Pages build and all 39 unit tests passed. A Chrome preview at `/sipahoy/` verified 10 displayed artwork resources, scoped installation metadata/service worker, zero page/request errors, and a successful offline reload with artwork intact. The workflow has not yet run on GitHub.

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

Use Node 22.18+ or a newer supported LTS version; this setup was validated on Node 26.8. Browser acceptance tests use an installed Google Chrome via Playwright. `npm run dev` is for development; test offline behavior with the production build served by `npm run preview`. The app must load online once to cache its files. Before relying on it offline, allow the first load to finish, reload once, then test logging and reloading with networking disabled. HTTPS (or localhost for development) is required for service workers.

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


### 2026-11-14 — Mobile experience and modern nautical styling

- Added navy, sea-glass, cream, and coral surfaces with a reusable ship illustration, an anchor identity, and subtle nautical trim. Ship/wave, navigation, sheet, and save-feedback animations are brief and disabled when reduced motion is preferred. Artwork remains available offline.
- Improved phone typography and contrast, shortened visible navigation labels while preserving accessible names, and added safe-area-aware bottom navigation with an always-reachable Log a drink action. Navigation returns each page to the top.
- Phone editors use bottom sheets, single-column fields with 16px input text, sticky headings/save actions, and larger touch targets. Opening a dialog focuses its heading and locks background scrolling; closing it restores the previous page position.
- Reflowed journal actions, crew cards, filters, and package breakdowns to avoid cramped controls and horizontal page overflow.
- Validation: production build and 35 domain/storage tests passed; nine existing browser scenarios plus two new mobile scenarios passed. New coverage checks 320px and 390px phones, a short 667px landscape view, dialog focus and scroll restoration, navigation touch targets, and reduced motion. Physical iPhone/Safari keyboard behavior and home-screen safe areas still need device verification.


### 2026-11-14 — Brighter brand, Skipper mascot, and save celebrations

- Replaced the muted palette with cobalt, aqua, tangerine, lemon, and lilac; added a bolder rounded wordmark and a wave/drink logo, including refreshed favicon and install icons.
- Created Skipper, an original octopus captain mascot, with the built-in image-generation tool. The transparent, locally bundled artwork appears on onboarding and the sailing card, floats with the ocean accent, and responds to taps. [Brand assets and the exact generation prompt](docs/brand.md) are documented.
- New drinks and explicit repeats trigger a short mascot confirmation and bubble/confetti burst only after a successful save. Edits use a plain confirmation; failed writes retain the draft without celebrations. Feedback can be dismissed and clears automatically or when another editor opens.
- Added a persistent pause control for ambient motion. System reduced-motion preferences suppress motion while retaining readable save feedback.
- Validation: production build, 35 domain/storage tests, 11 existing browser scenarios, and three new celebration scenarios passed. Verified offline artwork, successful and failed writes, repeat/edit distinctions, dismiss/reopen behavior, persistent motion preferences, and reduced-motion feedback. Physical iPhone/Safari checks remain outstanding.

### 2026-11-14 — Individual sailor characters and daily reactions

- Removed the in-app animation pause control and its saved preference. System reduced-motion settings still suppress movement while preserving expressions and save feedback.
- Added six assignable sailor characters: Skipper, Sunny, Pip, Finn, Clawdia, and Pearl. Each has four illustrated expressions with brief, distinct reactions instead of continuous hovering. [Artwork and generation prompts](docs/character-art.md) are included.
- The overview and crew views show reactions for each sailor on the selected sailing day. Any log brings a smile; three alcohol-category logs show a merry expression; five show a woozy character taking a water break. These are playful daily reactions, not an intoxication estimate. Corrections and deletions recalculate immediately; other sailors and dates remain independent.
- Save feedback uses the logging sailor's character and current expression. Character assignments persist offline and in version 6 backups; older backups remain supported with stable default characters.
- Validation: production build, 39 unit tests, and 16 browser scenarios passed. New coverage checks independent assignments, all six offline assets, reload/backup restoration, date isolation, save reactions, and deletion recalculation. Mobile screenshots were inspected at 390px; existing 320px and landscape coverage also passed. Physical iPhone/Safari checks remain outstanding.

### 2026-11-14 — Hamburger navigation and contextual logging

- Replaced the sidebar/bottom navigation with a hamburger menu at every screen size. Home and Log a drink are prominent shortcuts, followed by the journal sections and backups. The sticky header keeps the menu and home wordmark available while scrolling.
- Removed the “Ready for offline” header label. The offline indicator still appears when disconnected; caching and local storage are unchanged.
- The standalone Log a drink button now appears only on Overview and Drink log. Passport, Menus, and Crew remain uncluttered, with logging available through the menu.
- The menu uses the native modal dialog, with phone bottom-sheet styling, Escape/backdrop dismissal, scroll locking/restoration, and explicit return of keyboard focus to the opener.
- Validation: production build and all 16 browser scenarios passed across the full run and focused rerun after the focus fix. Navigation checks cover 320px and 390px phones, 667px landscape, and 1280px desktop, including contextual buttons, home navigation, menu-to-log transitions, focus, scroll restoration, and reduced motion. Phone screenshots were visually reviewed. Physical iPhone/Safari checks remain outstanding.

### 2026-11-14 — Draggable mobile navigation sheet

- Replaced the menu’s decorative handle with a 44px interactive grip. Pull up to expand; pull down to collapse an expanded menu or dismiss a compact one. Movement follows the pointer, and small/cancelled drags snap back.
- Added tap and arrow-key alternatives, pointer capture, resize reset, and reduced-motion support. The grip remains separate from a scrollable menu-content area, keeping it reachable in short landscape views. Other editor dialogs retain their existing behavior.
- Validation: production build, two touch-gesture browser scenarios, and both existing mobile scenarios passed. Coverage includes live drag geometry, snapping, cancellation, dismissal, native touch scrolling in landscape, keyboard/tap controls, rotation, desktop handle hiding, and focus/scroll restoration. Tested in Chrome phone emulation; physical iPhone/Safari verification remains outstanding.

### 2026-11-14 — Cleaner navigation and PWA installation help

- Removed the redundant header gear and the hamburger-menu tagline. Backups & exports remains in the menu.
- Added Install SipAhoy with selectable iPhone/iPad, Android, Chrome desktop, and Safari Mac instructions, linked to official browser documentation. Compatible browsers can offer an Install now action backed by their native installation prompt; other browsers retain manual instructions.
- Suppressed the menu entry in detected app display modes, iOS standalone mode, and after an appinstalled event. A normal browser tab cannot universally detect a separately installed app, so installation state is not permanently guessed or saved.
- Validation: production build and all 22 browser scenarios passed, including prompt acceptance/dismissal/error simulations, installed-state hiding, menu backup access, and 320px install-guide layouts. Phone screenshots were visually reviewed. Automated checks do not perform a real OS installation; physical-device installation remains to be verified.

### 2026-11-14 — Right-aligned wordmark

- Moved the SipAhoy home wordmark to the right side of the header and removed the glass icon from that wordmark. The hamburger remains on the left.
- Retained the glass icon assets for PWA installation, the install guide, and the favicon.
- Validation: production build and both existing mobile browser scenarios passed; the 390px header screenshot was visually reviewed.

### 2026-11-14 — Deliberate menu dismissal

- Disabled backdrop and sheet-padding tap dismissal for navigation, preventing accidental closes near the grip. X and keyboard Escape remain available.
- Downward dragging moves the whole menu. Releasing below one-third of its starting height snaps back; reaching that distance slides it fully off-screen before closing, from either compact or expanded size. Flick speed does not bypass the threshold, and cancelled gestures never dismiss.
- Exit completion uses the transform transition with a cleanup-safe fallback; reduced motion closes immediately. Other editor dialogs retain their existing dismissal behavior.
- Validation: production build, both gesture scenarios, and both existing mobile scenarios passed. Checked surrounding taps, fast pulls just below the threshold, cancellation, compact/expanded dismissal, animated exit, native content scrolling, focus/scroll restoration, and reduced motion in browser emulation.

The sailing picker now uses ship artwork cards with full trip dates and a clear current selection. All 31 supported ships have locally cached official photography or renderings, also shown in sailing setup and Sailing & crew. See [ship artwork sources and maintenance](docs/ship-artwork.md).

### 2026-11-14 — Animated shipboard sailing banner

- Replaced the single oversized hero mascot with a miniature Royal Caribbean inspired pool deck and Schooner Bar. Original locally bundled artwork includes the colorful Lime & Coconut style pool bar, striped loungers, ocean railings, and a nautical piano lounge with rigging and brass portholes. See [scene artwork and behavior](docs/shipboard-scenes.md).
- Up to four assigned sailors share the foreground, with additional crew accessible through “More sailors.” Each sailor independently strolls, bounces, dances, or takes a quiet water break using the existing selected-day reaction calculation. Tapping a sailor selects them and reveals a temporary mood-specific quip.
- Added ambient details and small interactive surprises. A lingering visit changes venues after 90 visible seconds; choosing a venue keeps that choice for the visit. Offscreen/background animations pause, and system reduced motion suppresses animations and automatic scene changes.
- Both scene backgrounds are precached for offline cruising. No saved data, package calculations, or reaction thresholds changed.
- Validation: production build, unused-symbol TypeScript checks, all 39 unit tests, and nine targeted browser scenarios passed (including the focused scene rerun after correcting an animation assertion). Reviewed desktop and 320/390px screenshots; verified individual moods, larger crews, taps, scene switching, reduced motion, and both backgrounds after an offline reload. Real-device iPhone verification remains outstanding.

### 2026-11-14 — Quiet close-up revision

- Simplified the sailing banner to a passive, tightly framed portrait of the selected sailor and one crewmate, with a softened and cropped poolside background. Removed all banner controls, venue switching, greetings, roaming, dancing, ambient effects, and tap interactions.
- Added brief staggered eyelid-only blinks, aligned for all six characters and all four expressions. The existing selected-day drink reactions still determine the static facial artwork; bodies and backgrounds remain still. Reduced motion disables blinking; background tabs and offscreen portraits pause it.
- Kept larger crews available through the existing sailor selector below the banner. Removed the unused Schooner Bar art from the shipped assets while retaining its source locally.
- Validation: production build, unused-symbol checks, and all eight targeted character/celebration/mobile browser scenarios passed. Reviewed desktop and 320/390px layouts plus closed-eyelid artwork for all 24 character/mood combinations. Confirmed the banner has no focusable controls and works after an offline reload.
