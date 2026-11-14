import type { Drink } from "./model";
/** Normalizes accents, punctuation, and case for searching; does not establish product equivalence. */
export function normalizeDrinkName(s: string) {
  return s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[®™℠]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
const aliases: Record<string, string> = {
  "chandon brut classic": "Chandon Brut Classic",
  "chandon garden spritz": "Chandon Garden Spritz",
  "moet chandon imperial brut": "Moët & Chandon Impérial Brut",
  "moet chandon imperial brut rose": "Moët & Chandon Impérial Brut Rosé",
  "moet chandon ice imperial": "Moët & Chandon Ice Impérial",
};
// Reviewed against producer product pages on 2026-11-14:
// https://www.chandon.com/en-int/chandon-garden-spritz
// https://www.moet.com/en-us/our-champagnes-moet-chandon
// Never infer a missing product qualifier (Classic, Impérial, etc.).
// Ambiguous short labels stay separate until source evidence confirms identity.
/**
 * Produces a conservative matching key, applying only reviewed product equivalences.
 * Wine token order may vary; missing qualifiers such as Classic or Impérial are never inferred.
 * See docs/drink-identity.md before adding an alias.
 */
export function drinkIdentity(
  name: string,
  category?: Drink["category"],
): string {
  const normalized = normalizeDrinkName(name);
  const tokens = normalized.split(" ").filter((t) => t !== "and");
  const has = (t: string) => tokens.includes(t);
  const only = (allowed: string[]) => tokens.every((t) => allowed.includes(t));
  if (has("chandon") && !has("moet")) {
    if (has("brut") && has("classic") && only(["chandon", "brut", "classic"]))
      return "chandon brut classic";
    if (has("garden") && has("spritz") && only(["chandon", "garden", "spritz"]))
      return "chandon garden spritz";
  }
  if (has("moet") && has("chandon")) {
    if (
      has("ice") &&
      has("imperial") &&
      only(["moet", "chandon", "ice", "imperial"])
    )
      return "moet chandon ice imperial";
    if (
      only(["moet", "chandon", "brut", "imperial", "rose"]) &&
      has("imperial") &&
      (has("brut") || has("rose"))
    )
      return has("rose")
        ? "moet chandon imperial brut rose"
        : "moet chandon imperial brut";
  }
  return category === "Wine"
    ? tokens.sort().join(" ")
    : normalized.replace(/^the /, "");
}
/** Uses preserved community identity when available, so local display-name edits stay linked. */
export function drinkKey(d: Drink) {
  return drinkIdentity(d.community?.key ?? d.name, d.category);
}
/** Chooses a reviewed canonical label or keeps the first observed source name. */
export function preferredDrinkName(key: string, names: string[]) {
  return aliases[key] ?? names[0];
}
/**
 * Returns one display item per product identity, keeping all original names searchable.
 * User-edited records win over local examples, then community items; input history/IDs are untouched.
 */
export function deduplicateDrinks(drinks: Drink[]): Drink[] {
  const grouped = new Map<string, Drink[]>();
  for (const d of drinks) {
    const key = drinkKey(d);
    const group = grouped.get(key) ?? [];
    group.push(d);
    grouped.set(key, group);
  }
  const rank = (d: Drink) =>
    d.priceSource === "user" ? 3 : !d.community ? 2 : 1;
  return [...grouped.values()].map((group) => {
    const chosen = group.reduce((a, b) => (rank(b) > rank(a) ? b : a));
    const names = [
      ...new Set(group.flatMap((d) => [d.name, ...(d.aliases ?? [])])),
    ];
    return names.length === 1
      ? chosen
      : { ...chosen, aliases: names.filter((n) => n !== chosen.name) };
  });
}
