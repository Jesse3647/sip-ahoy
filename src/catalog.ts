/** Builds a ship-specific view over bundled observations and saved user edits. */
import raw from "./data/community-catalog.json";
import venueRegistry from "./data/ship-venues.json";
import type { Data, Drink, Entry } from "./model";
import { descriptionForDrink } from "./drinkDescriptions";
import {
  normalizeDrinkName,
  drinkIdentity,
  drinkKey,
  deduplicateDrinks,
  preferredDrinkName,
} from "./drinkIdentity";
export { normalizeDrinkName, drinkIdentity, drinkKey } from "./drinkIdentity";
/** Source evidence for ship venues that may be missing from transcribed drink menus. */
type ShipVenueSource = {
  /** Date the official venue list was checked, YYYY-MM-DD. */
  checkedAt: string;
  /** Official ship page supporting the venue names. */
  sourceUrl: string;
  /** Physical venue labels to supplement the selected ship’s menu data. */
  venues: string[];
};

/** Official venue supplements, independent of whether a drink menu was transcribed. */
export const shipVenueInfo = venueRegistry as Record<string, ShipVenueSource>;
type Observation = {
  /** Original factual menu name. */
  name: string;
  /** Normalized app category. */
  category: Drink["category"];
  /** Observed USD cents, or null when no price was supplied. */
  priceCents: number | null;
  /** Source venue label; Fleetwide Bar Menu is a generic menu, not a physical bar. */
  venue: string;
  /** Original menu section used when categorizing the observation. */
  section: string;
  /** Optional item-specific source overriding the ship profile. */
  sourceUrl?: string;
  /** Optional date overriding the overall snapshot date. */
  retrievedAt?: string;
};
type Profile = {
  /** Source page for this ship’s menu compilation. */
  sourceUrl: string;
  /** Keys into the shared observations table. */
  itemIds: string[];
  /** Venue label to source-record key for provenance. */
  venueSources: Record<string, string>;
};
/** On-disk community snapshot format, produced by the manual catalog refresh script. */
type CatalogLibrary = {
  /** Snapshot format version, separate from the user-backup version. */
  version: number;
  /** Overall source-check date, unless a row supplies its own date. */
  retrievedAt: string;
  /** Source IDs mapped to the supporting HTTPS pages. */
  sources: Record<string, { url: string }>;
  /** Ship display names mapped to their observation IDs and sources. */
  shipProfiles: Record<string, Profile>;
  /** Shared factual observations; one product may have several venue/price observations. */
  observations: Record<string, Observation>;
};
const library = raw as CatalogLibrary;

/** In-memory menu view; only records used or edited by the user need to be saved. */
export type CatalogView = {
  /** Saved items plus bundled references, retaining saved IDs and price overrides. */
  drinks: Drink[];
  /** Saved venues plus this ship’s sourced additions and Other. */
  venues: Data["venues"];
  /** Whether this ship has its own community profile, even if the user has local items. */
  hasShipMenu: boolean;
  /** Ship-profile source, or null when no profile exists. */
  sourceUrl: string | null;
  /** Distinct product identities reported for this ship before local overrides. */
  reportedCount: number;
};
const sourceForDrink = new Map<string, string>();
for (const profile of Object.values(library.shipProfiles))
  for (const id of profile.itemIds) {
    const key = drinkIdentity(
      library.observations[id].name,
      library.observations[id].category,
    );
    if (!sourceForDrink.has(key)) sourceForDrink.set(key, profile.sourceUrl);
  }
/** Date of the bundled community snapshot; not the date of a live availability check. */
export const catalogRetrievedAt = library.retrievedAt;
/** Count of distinct reviewed product identities across the bundled fleet snapshot. */
export const catalogDrinkCount = new Set(
  Object.values(library.observations).map((x) =>
    drinkIdentity(x.name, x.category),
  ),
).size;
/** Stable FNV-1a-derived suffix for deterministic catalog IDs; not a security hash. */
function hash(s: string) {
  let n = 2166136261;
  for (let i = 0; i < s.length; i++) {
    n ^= s.charCodeAt(i);
    n = Math.imul(n, 16777619);
  }
  return (n >>> 0).toString(36);
}
/** Returns the most frequent value; ties keep first-seen order. Requires a nonempty list. */
function mode<T extends string | number | null>(items: T[]) {
  const counts = new Map<T, number>();
  for (const item of items) counts.set(item, (counts.get(item) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1])[0][0];
}
/**
 * Combines saved items with the selected ship’s bundled menu and venue registry.
 * Saved IDs/prices win. Other-ship drinks are optional and never add other-ship venues.
 * Returned community items stay in memory until used or edited.
 * @param ship Ship display name used to find its source profile.
 * @param shipId Persistent catalog namespace shared by sailings on this ship.
 * @param localDrinks Saved items already scoped to shipId by the caller.
 * @param localVenues Saved venues already scoped to shipId by the caller.
 * @param includeOtherShips Whether to include clearly marked fleetwide drink references.
 */
export function catalogForShip(
  ship: string,
  shipId: string,
  localDrinks: Drink[],
  localVenues: Data["venues"],
  includeOtherShips = false,
): CatalogView {
  const profile = library.shipProfiles[ship];
  const rows = profile
    ? profile.itemIds.map((id) => library.observations[id])
    : [];
  const reported = new Set(rows.map((x) => drinkIdentity(x.name, x.category)));
  const shipGroups = new Map<string, Observation[]>();
  for (const row of rows) {
    const key = drinkIdentity(row.name, row.category);
    const group = shipGroups.get(key) ?? [];
    group.push(row);
    shipGroups.set(key, group);
  }
  const chosenRows = includeOtherShips
    ? Object.values(library.observations)
    : rows;
  const venues = [...localVenues];
  const venueIds = new Map(
    venues.map((v) => [normalizeDrinkName(v.name), v.id]),
  );
  // Venue presence is independent of whether a drink menu was transcribed.
  const reportedVenues = [
    ...rows.map((x) => x.venue),
    ...(shipVenueInfo[ship]?.venues ?? []),
  ];
  for (const venue of new Set(reportedVenues)) {
    if (
      venue === "Fleetwide Bar Menu" ||
      venueIds.has(normalizeDrinkName(venue))
    )
      continue;
    const id = `cv-${shipId}-${hash(venue)}`;
    venues.push({ id, shipId, name: venue });
    venueIds.set(normalizeDrinkName(venue), id);
  }
  // Keep a stable catch-all venue available for both existing and new sailings.
  if (!venueIds.has(normalizeDrinkName("Other"))) {
    venues.push({ id: `other-${shipId}`, shipId, name: "Other" });
  }
  // Match by product identity as well as saved provenance so renaming a drink does not duplicate it.
  const localNames = new Set(
    localDrinks.map((d) => drinkIdentity(d.name, d.category)),
  );
  const localKeys = new Set(
    localDrinks.filter((d) => d.community).map(drinkKey),
  );
  const grouped = new Map<string, Observation[]>();
  for (const row of chosenRows) {
    const name = drinkIdentity(row.name, row.category);
    if (localNames.has(name) || localKeys.has(name)) continue;
    const group = grouped.get(name) ?? [];
    group.push(row);
    grouped.set(name, group);
  }
  const drinks = localDrinks.map((d) => {
    const key = drinkKey(d);
    const known =
      shipGroups.get(key) ??
      (includeOtherShips
        ? chosenRows.filter((r) => drinkIdentity(r.name, r.category) === key)
        : []);
    const aliases = [
      ...new Set([...(d.aliases ?? []), ...known.map((r) => r.name)]),
    ];
    return aliases.length ? { ...d, aliases } : d;
  });
  for (const [key, group] of grouped) {
    const onShip = shipGroups.get(key) ?? [];
    const observations = onShip.length ? onShip : group;
    // Prefer the generic bar-menu price; otherwise use the most commonly observed price.
    const general = observations.filter(
      (r) => r.venue === "Fleetwide Bar Menu",
    );
    const prices = (general.length ? general : observations)
      .map((r) => r.priceCents)
      .filter((x): x is number => x !== null);
    const venuePrices: Record<string, number> = {};
    for (const venue of new Set(onShip.map((r) => r.venue))) {
      const id = venueIds.get(normalizeDrinkName(venue));
      const p = onShip
        .filter((r) => r.venue === venue)
        .map((r) => r.priceCents)
        .filter((x): x is number => x !== null);
      if (id && p.length) venuePrices[id] = mode(p);
    }
    drinks.push({
      id: `cd-${shipId}-${hash(key)}`,
      shipId,
      name: preferredDrinkName(key, [
        ...new Set(observations.map((x) => x.name)),
      ]),
      aliases: [...new Set(observations.map((x) => x.name))],
      category: mode(observations.map((x) => x.category)),
      priceCents: prices.length ? mode(prices) : null,
      eligible: !/\b(bottle|pitcher|souvenir|flight)\b/i.test(
        observations[0].name,
      ),
      venuePrices,
      community: {
        key,
        sourceUrl:
          observations.find((row) => row.sourceUrl)?.sourceUrl ??
          (profile && reported.has(key)
            ? profile.sourceUrl
            : sourceForDrink.get(key)!),
        retrievedAt:
          observations.find((row) => row.retrievedAt)?.retrievedAt ??
          library.retrievedAt,
        venueNames: [...new Set(observations.map((x) => x.venue))],
        reportedForShip: reported.has(key),
      },
      priceSource: "community",
    });
  }
  return {
    drinks,
    venues,
    hasShipMenu: !!profile,
    sourceUrl: profile?.sourceUrl ?? null,
    reportedCount: reported.size,
  };
}
/** Sorts newest first, preferring explicit creation times over legacy log-time fallbacks. */
export function compareRecency(a: Entry, b: Entry) {
  return (
    Number(!!b.createdAt) - Number(!!a.createdAt) ||
    (b.createdAt ?? b.time).localeCompare(a.createdAt ?? a.time)
  );
}
/**
 * Finds distinct recent products for a traveler within the supplied history.
 * Resolves old duplicate IDs to the preferred editable item without changing saved entries.
 * Callers must scope history to the active sailing.
 */
export function recentDrinks(
  entries: Entry[],
  travelerId: string,
  drinks: Drink[],
  limit = 6,
) {
  const available = new Map(drinks.map((d) => [d.id, d]));
  const preferred = new Map(
    deduplicateDrinks(drinks).map((d) => [drinkKey(d), d]),
  );
  const sorted = entries
    .filter((e) => e.travelerId === travelerId)
    .sort(compareRecency);
  const seen = new Set<string>();
  return sorted
    .filter((e) => {
      const d = available.get(e.drinkId);
      if (!d) return false;
      const key = drinkKey(d);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit)
    .map((entry) => {
      const chosen = preferred.get(drinkKey(available.get(entry.drinkId)!))!;
      return chosen.id === entry.drinkId
        ? entry
        : { ...entry, drinkId: chosen.id };
    });
}
/** Searches deduplicated names, aliases, categories, and venues; prefix matches sort first. */
export function filterDrinks(
  drinks: Drink[],
  query: string,
  category = "all",
  venueName?: string,
) {
  const words = normalizeDrinkName(query).split(" ").filter(Boolean);
  return deduplicateDrinks(drinks)
    .filter(
      (d) =>
        (category === "all" || d.category === category) &&
        (!venueName ||
          !d.community ||
          d.community.venueNames.includes("Fleetwide Bar Menu") ||
          d.community.venueNames.some(
            (v) => normalizeDrinkName(v) === normalizeDrinkName(venueName),
          )) &&
        words.every((word) =>
          normalizeDrinkName(
            `${d.name} ${(d.aliases ?? []).join(" ")} ${d.category} ${d.community?.venueNames.join(" ") ?? ""} ${descriptionForDrink(d)?.text ?? ""}`,
          ).includes(word),
        ),
    )
    .sort((a, b) => {
      const q = normalizeDrinkName(query);
      return (
        Number(normalizeDrinkName(b.name).startsWith(q)) -
          Number(normalizeDrinkName(a.name).startsWith(q)) ||
        a.name.localeCompare(b.name)
      );
    });
}
/** Returns a venue override or the default price, in cents; null means unknown. */
export function drinkPrice(drink: Drink, venueId: string) {
  return drink.venuePrices[venueId] ?? drink.priceCents;
}
