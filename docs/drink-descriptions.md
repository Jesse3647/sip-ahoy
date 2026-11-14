# Drink descriptions

Descriptions appear in menu cards, picker results, the selected drink, and the passport. Search includes them, allowing ingredient searches such as mint or pineapple.

## Sources and coverage

`src/drinkDescriptions.ts` contains original short ingredient summaries, separate from the community price snapshot. The starter set covers reviewed cocktails and basic coffee preparations; it does not claim complete coverage of every branded or specialty drink.

Reviewed on 2026-11-14:

- [Royal Caribbean’s Caribbean drink guide](https://www.royalcaribbean.com/guides/caribbean-drinks): classic Caribbean cocktails.
- [Royal Caribbean’s Lime & Coconut sample menu](https://www.royalcaribbean.com/content/dam/royal/resources/menus/the-lime-and-coconut-menu-sample.pdf): the namesake coconut/guava drink.
- [Royal Caribbean’s Icon bar infographic](https://www.royalcaribbeanincentives.com/content/uploads/IC-Bar-Nightlife-Infographic.pdf): specialty cocktails.
- [Royal Caribbean Blog’s photographed Schooner Bar menu](https://www.royalcaribbeanblog.com/2023/09/01/royal-caribbean-revamps-nautical-themed-bar-new-menu): ingredient lists. This report dates from 2023; it is reference evidence, not confirmation of a current sailing’s recipe.
- [CHANDON Garden Spritz](https://www.chandon.com/en-int/chandon-garden-spritz): producer evidence for this specific aperitif, without assigning it to other Chandon products.
- [Aperol’s recipe](https://www.aperol.com/en-us/aperol-spritz-cocktail/) and [IBA’s Margarita](https://iba-world.com/iba-cocktail/margarita/): standard definitions.

Coffee notes are general definitions, without a claim about a ship-specific recipe. The app does not republish source marketing prose or the community compiler’s authored descriptions. Reference source links and checked dates appear in the menu editor. No source-site request is needed at runtime.

## Matching and overrides

- Match exact reviewed product identities and categories. Never fill an unfamiliar specialty drink using a similar generic name.
- Preserve qualifiers and serving types. Only explicit small/medium/large coffee sizes share their base drink definition.
- A saved community identity keeps a reference connected when the display name changes.
- `Drink.description` is an optional user override of up to 500 characters. Missing means use a bundled reference if known. An explicitly saved empty string hides that reference.
- Leaving a reference unchanged in the editor does not create a user override, allowing later reference corrections to apply.
- User text has no automatically inferred source attribution.
- Recipes and preparation can vary by ship and venue. Unknown descriptions remain blank and can be filled in by the traveler.

## Persistence

The optional user description travels with its drink through IndexedDB and JSON backup/import. Exports use backup version 5 so older apps reject the format rather than silently discard descriptions. Versions 1–4 remain readable without adding fields to their records. Reference summaries stay bundled with the offline app.
