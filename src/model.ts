/**
 * Journal data contract and pure calculations.
 * Zod schemas are the source of truth for TypeScript types, storage, and backups.
 * Money uses integer USD cents; null means unknown, while zero is a known value.
 */
import { z } from "zod";
import { characterIds } from "./characters";
const id = z.string().min(1).max(100);
const name = z.string().trim().min(1).max(100);
const cents = z.number().int().min(0).max(100000000);
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (v) =>
      !Number.isNaN(Date.parse(v)) &&
      new Date(v).toISOString().slice(0, 10) === v,
    "Invalid date",
  );
const sailingSchema = z
  .object({
    /** Stable identity of this trip. */
    id,
    /** User-entered sailing label. */
    name,
    /** Catalog namespace shared by sailings on the same ship. */
    shipId: id,
    /** Royal Caribbean ship name used to select bundled menu data. */
    ship: name,
    /** First sailing date, YYYY-MM-DD. */
    start: date,
    /** Last sailing date, inclusive, YYYY-MM-DD. */
    end: date,
    /** The MVP stores all monetary values in USD. */
    currency: z.literal("USD"),
  })
  .refine((s) => s.end >= s.start, "End date must follow start date");
/** Validates daily/trip pricing without treating missing values as zero. */
export const packagePricingSchema = z
  .object({
    /** Whether amountCents is a daily price or a whole-trip price. */
    basis: z.enum(["day", "trip"]),
    /** Entered base price; null when the traveler has not supplied it. */
    amountCents: cents.nullable(),
    /** Days actually charged; multiplies the base only for daily pricing. */
    billedDays: z.number().int().min(1).max(3650),
    /** How gratuities relate to the entered price; unknown prevents a final total. */
    gratuityMode: z.enum(["included", "percent", "fixed", "unknown"]),
    /** Percentage in basis points: 1800 means 18%. */
    gratuityRateBps: z.number().int().min(0).max(10000),
    /** Whole-trip gratuity when gratuityMode is fixed. */
    gratuityCents: cents.nullable(),
    /** Whole-trip taxes and fees added to the base. */
    otherFeesCents: cents,
    /** Non-drink parts of a bundle, deducted only for drink-value comparisons. */
    extras: z
      .array(
        z.object({
          /** Stable identity of this bundled extra. */
          id,
          /** User-facing description, such as Beach Club admission. */
          label: name,
          /** Whole-trip value of this extra; null keeps drink-only cost unknown. */
          amountCents: cents.nullable(),
          /** Whether this extra value comes from a receipt or an estimate. */
          source: z.enum(["receipt", "estimate"]),
        }),
      )
      .max(20),
  })
  .superRefine((p, ctx) => {
    if (new Set(p.extras.map((x) => x.id)).size !== p.extras.length)
      ctx.addIssue({ code: "custom", message: "Duplicate bundled extras" });
  });
/** Persisted package inputs; see packagePricingSchema for field units and meaning. */
export type PackagePricing = z.infer<typeof packagePricingSchema>;
const travelerSchema = z.object({
  /** Stable identity of this traveler on this sailing. */
  id,
  /** Trip this traveler belongs to; travelers are not shared across trips. */
  sailingId: id,
  /** Display name entered by the user. */
  name,
  /** Avatar color used to distinguish travelers. */
  color: z.string().max(30),
  /** Selected mascot; older journals use a stable display-only fallback until edited. */
  characterId: z.enum(characterIds).optional(),
  /** Whether package coverage and comparisons apply. */
  hasPackage: z.boolean(),
  /** Legacy fee-inclusive daily cost; retained for older journals. */
  dailyCostCents: cents.nullable(),
  /** Detailed pricing, preferred over legacy dailyCostCents when present. */
  packagePricing: packagePricingSchema.optional(),
  /** Maximum covered value per eligible drink; null means no configured cap. */
  limitCents: cents.nullable(),
});
/** A venue belongs to a ship catalog, not to a single sailing. */
const venueSchema = z.object({
  /** Stable venue identity referenced by logs and price overrides. */
  id,
  /** Ship catalog that owns this venue. */
  shipId: id,
  /** Editable venue label, including the catch-all Other. */
  name,
});
export const categories = [
  "Cocktail",
  "Beer",
  "Wine",
  "Coffee",
  "Soft drink",
  "Water",
  "Spirit",
  "Mocktail",
  "Tea",
  "Juice",
  "Smoothie",
  "Other",
] as const;
const drinkSchema = z.object({
  /** Stable catalog ID; historical entries keep referencing this value. */
  id,
  /** Ship catalog that owns this editable menu item. */
  shipId: id,
  /** Preferred display name; original source names remain in aliases. */
  name,
  /** Optional user description; an empty string intentionally hides the bundled reference note. */
  description: z.string().trim().max(500).optional(),
  /** Menu grouping used for filtering and icons. */
  category: z.enum(categories),
  /** Reviewed alternate names, retained for search. */
  aliases: z.array(name).max(100).optional(),
  /** Default menu price; null means the user must supply a price. */
  priceCents: cents.nullable(),
  /** Provenance of the current saved price, not a live availability claim. */
  priceSource: z.enum(["community", "user", "example"]).optional(),
  /** Optional evidence from the bundled community menu snapshot. */
  community: z
    .object({
      /** Stable product identity, retained even if the display name is edited. */
      key: z.string().min(1).max(200),
      /** HTTPS page supporting the menu observation. */
      sourceUrl: z.url().refine((s) => s.startsWith("https://")),
      /** Date this source was checked, YYYY-MM-DD. */
      retrievedAt: date,
      /** Source venue labels used for menu filtering. */
      venueNames: z.array(name).max(100),
      /** Whether this drink was reported for the selected ship. */
      reportedForShip: z.boolean(),
    })
    .optional(),
  /** Default package eligibility suggestion; logs preserve actual coverage. */
  eligible: z.boolean(),
  /** Venue ID to integer-cent price overrides; default price is the fallback. */
  venuePrices: z.record(z.string(), cents),
});
const entrySchema = z
  .object({
    /** Stable identity of this individual logged serving. */
    id,
    /** Trip this log belongs to. */
    sailingId: id,
    /** Traveler who had this drink. */
    travelerId: id,
    /** Catalog item referenced without rewriting historical values. */
    drinkId: id,
    /** Drink-name snapshot taken at logging time. */
    name,
    /** Category snapshot taken at logging time. */
    category: z.enum(categories),
    /** Selected venue identity in the sailing ship catalog. */
    venueId: id,
    /** Venue-name snapshot; later menu edits do not rewrite history. */
    venueName: name,
    /** User-selected sailing date for daily analytics, YYYY-MM-DD. */
    sailingDate: date,
    /** ISO timestamp captured on Save; editing preserves it. */
    time: z.string().datetime({ offset: true }),
    /** Creation timestamp used by recent shortcuts; absent in older backups. */
    createdAt: z.string().datetime({ offset: true }).optional(),
    /** Actual logged retail price; remains fixed after menu price changes. */
    priceCents: cents,
    /** Actual covered value; cannot exceed priceCents. */
    coveredCents: cents,
    /** Optional user-entered note, up to 500 characters. */
    notes: z.string().max(500),
  })
  .refine(
    (e) => e.coveredCents <= e.priceCents,
    "Coverage exceeds drink price",
  );
/** Validates record shapes and cross-record references before any save or restore. */
export const dataSchema = z
  .object({
    /** All saved trips. */
    sailings: z.array(sailingSchema).max(500),
    /** Per-sailing traveler records and optional package settings. */
    travelers: z.array(travelerSchema).max(10000),
    /** Saved ship venues; unused bundled venues need not be persisted. */
    venues: z.array(venueSchema).max(10000),
    /** Custom, edited, example, or logged items; the full library stays bundled. */
    drinks: z.array(drinkSchema).max(20000),
    /** Historical servings, including snapshots of names and prices. */
    entries: z.array(entrySchema).max(100000),
    /** Selected trip; null for a new journal. */
    activeSailingId: id.nullable(),
  })
  .superRefine((d, ctx) => {
    // Shape validation is not enough: every linked record must belong to the correct trip/ship.
    const bad = (message: string) => ctx.addIssue({ code: "custom", message });
    for (const key of [
      "sailings",
      "travelers",
      "venues",
      "drinks",
      "entries",
    ] as const)
      if (new Set(d[key].map((x) => x.id)).size !== d[key].length)
        bad(`Duplicate ${key} IDs`);
    const sailings = new Map(d.sailings.map((s) => [s.id, s]));
    const travelers = new Map(d.travelers.map((t) => [t.id, t]));
    const venues = new Map(d.venues.map((v) => [v.id, v]));
    const drinks = new Map(d.drinks.map((v) => [v.id, v]));
    if (d.activeSailingId && !sailings.has(d.activeSailingId))
      bad("Active sailing is missing");
    for (const t of d.travelers)
      if (!sailings.has(t.sailingId)) bad("Traveler sailing is missing");
    for (const t of d.travelers) {
      const sailing = sailings.get(t.sailingId);
      if (t.hasPackage && t.packagePricing && sailing) {
        const pricing = packageBreakdown(t.packagePricing);
        if (pricing.total !== null && pricing.knownDeductions > pricing.total)
          bad("Bundled extras cannot exceed the total package cost");
      }
    }
    for (const drink of d.drinks)
      for (const venueId of Object.keys(drink.venuePrices))
        if (venues.get(venueId)?.shipId !== drink.shipId)
          bad("Price references a venue on another ship");
    for (const e of d.entries) {
      const s = sailings.get(e.sailingId);
      if (
        !s ||
        travelers.get(e.travelerId)?.sailingId !== s.id ||
        venues.get(e.venueId)?.shipId !== s.shipId ||
        drinks.get(e.drinkId)?.shipId !== s.shipId
      )
        bad("Drink log has broken references");
      else if (e.sailingDate < s.start || e.sailingDate > s.end)
        bad("Drink date falls outside the sailing");
    }
  });
/** Complete persisted journal, inferred from the runtime validation contract. */
export type Data = z.infer<typeof dataSchema>;
/** A trip with inclusive date bounds and a shared ship-catalog namespace. */
export type Sailing = Data["sailings"][number];
/** A person on one sailing, including optional package settings. */
export type Traveler = Data["travelers"][number];
/** Editable catalog item with defaults and optional source evidence. */
export type Drink = Data["drinks"][number];
/** Historical serving; its snapshots are independent of future catalog edits. */
export type Entry = Data["entries"][number];
/** Creates an independent empty journal with no active sailing. */
export const emptyData = (): Data => ({
  sailings: [],
  travelers: [],
  venues: [],
  drinks: [],
  entries: [],
  activeSailingId: null,
});
/** Creates a new persistent record identity using the browser UUID generator. */
export const uid = () => crypto.randomUUID();
/** Formats integer USD cents as a display string; never use it for parsing. */
export const money = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(cents / 100);
/**
 * Parses a non-negative USD amount into integer cents.
 * @throws If the amount is malformed, has more than two decimals, or exceeds the limit.
 */
export function parseMoney(value: string): number {
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(value.trim()))
    throw new Error("Enter a valid amount with up to two decimals.");
  const amountCents = Math.round(Number(value) * 100);
  if (amountCents > 100000000) throw new Error("Amount is too large.");
  return amountCents;
}
/** Counts both the first and last sailing dates; this is not the billed-day count. */
export const days = (sailing: Sailing) =>
  Math.round((Date.parse(sailing.end) - Date.parse(sailing.start)) / 86400000) +
  1;
// Legacy daily prices already included fees and used inclusive calendar days.
// Preserve their totals until the traveler explicitly edits the pricing settings.
/** Returns detailed pricing or adapts a legacy fee-inclusive daily price without changing totals. */
export function pricingForTraveler(
  traveler: Traveler,
  sailing: Sailing,
): PackagePricing {
  return (
    traveler.packagePricing ?? {
      basis: "day",
      amountCents: traveler.dailyCostCents,
      billedDays: days(sailing),
      gratuityMode: "included",
      gratuityRateBps: 1800,
      gratuityCents: null,
      otherFeesCents: 0,
      extras: [],
    }
  );
}
/** Computed package amounts; every monetary field is integer USD cents. */
export type PackageBreakdown = {
  /** Entered daily price multiplied by billed days, or the entered trip price. */
  base: number | null;
  /** Gratuities added on top of the base; zero when already included. */
  gratuities: number | null;
  /** Whole-trip additional taxes and fees. */
  otherFees: number;
  /** Full amount paid, including non-drink bundle inclusions. */
  total: number | null;
  /** Sum of non-drink extras; null if any extra is unknown. */
  deductions: number | null;
  /** Sum of known extras, used to reject deductions exceeding the paid total. */
  knownDeductions: number;
  /** Total minus non-drink extras; null if incomplete or invalid. */
  drinkCost: number | null;
  /** User-facing explanation for an unavailable drink-only comparison. */
  incompleteReason: string | null;
  /** Whether any non-drink allocation was explicitly entered as an estimate. */
  estimated: boolean;
};

/** Resolves only the gratuity added above the entered base price, preserving unknowns. */
function addedGratuityCents(pricing: PackagePricing, base: number | null) {
  switch (pricing.gratuityMode) {
    case "included":
      return 0;
    case "unknown":
      return null;
    case "fixed":
      return pricing.gratuityCents;
    case "percent":
      return base === null
        ? null
        : Math.round((base * pricing.gratuityRateBps) / 10000);
  }
}

/**
 * Calculates the full amount paid and the drink-only comparison cost, in cents.
 * Unknown inputs propagate as null; non-drink extras reduce comparison cost, not money paid.
 */
export function packageBreakdown(pricing: PackagePricing): PackageBreakdown {
  const base =
    pricing.amountCents === null
      ? null
      : pricing.amountCents *
        (pricing.basis === "day" ? pricing.billedDays : 1);
  const gratuities = addedGratuityCents(pricing, base);
  const total =
    base === null || gratuities === null
      ? null
      : base + gratuities + pricing.otherFeesCents;
  const knownDeductions = pricing.extras.reduce(
    (sum, x) => sum + (x.amountCents ?? 0),
    0,
  );
  const deductions = pricing.extras.some((x) => x.amountCents === null)
    ? null
    : knownDeductions;
  const invalid = total !== null && knownDeductions > total;
  const drinkCost =
    total === null || deductions === null || invalid
      ? null
      : total - deductions;
  const incompleteReason =
    base === null
      ? "Package price not entered"
      : gratuities === null
        ? "Gratuities not confirmed"
        : deductions === null
          ? "Bundled extra value not entered"
          : invalid
            ? "Extras exceed package cost"
            : null;
  return {
    base,
    gratuities,
    otherFees: pricing.otherFeesCents,
    total,
    deductions,
    knownDeductions,
    drinkCost,
    incompleteReason,
    estimated: pricing.extras.some((x) => x.source === "estimate"),
  };
}
/** Historical totals for one traveler; monetary amounts are integer USD cents. */
export type TravelerStats = {
  /** Number of logged servings on this sailing. */
  count: number;
  /** Sum of logged menu prices, before package coverage. */
  retail: number;
  /** Sum of actual coverage saved with each serving. */
  covered: number;
  /** Retail minus coverage, excluding the separate package purchase. */
  outOfPocket: number;
  /** Drink-only package cost; null if there is no package or inputs are incomplete. */
  cost: number | null;
  /** Covered value minus drink-only package cost; null when comparison is unavailable. */
  net: number | null;
  /** Complete cost breakdown, or null for a traveler without a package. */
  pricing: PackageBreakdown | null;
};

/** Summarizes one traveler on one sailing using historical logged values, not current menu prices. */
export function travelerStats(
  traveler: Traveler,
  sailing: Sailing,
  entries: Entry[],
): TravelerStats {
  const logs = entries.filter(
    (entry) =>
      entry.travelerId === traveler.id && entry.sailingId === sailing.id,
  );
  const retail = logs.reduce((total, entry) => total + entry.priceCents, 0);
  const covered = logs.reduce((total, entry) => total + entry.coveredCents, 0);
  const pricing = traveler.hasPackage
    ? packageBreakdown(pricingForTraveler(traveler, sailing))
    : null;
  const cost = pricing?.drinkCost ?? null;
  return {
    count: logs.length,
    retail,
    covered,
    outOfPocket: retail - covered,
    cost,
    net: cost === null ? null : covered - cost,
    pricing,
  };
}
/** Versioned interchange envelope; older supported journals retain their legacy fields. */
export const backupSchema = z.object({
  app: z.literal("SipAhoy"),
  version: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
    z.literal(6),
  ]),
  exportedAt: z.string(),
  data: dataSchema,
});
/** Parses and validates a JSON backup without mutating storage; throws on invalid input. */
export function importBackup(text: string): Data {
  if (text.length > 5_000_000)
    throw new Error("Backup is too large (maximum 5 MB).");
  const parsed = backupSchema.safeParse(JSON.parse(text));
  if (!parsed.success)
    throw new Error(
      "This backup is invalid or uses an unsupported version. No data was changed.",
    );
  return parsed.data.data;
}
/** Serializes the whole journal as a version-6 JSON backup with an export timestamp. */
export const backup = (data: Data) =>
  JSON.stringify(
    { app: "SipAhoy", version: 6, exportedAt: new Date().toISOString(), data },
    null,
    2,
  );
/** Exports historical logs as spreadsheet-safe CSV; CSV is for analysis, not journal restoration. */
export function csv(data: Data) {
  // Quoting handles CSV syntax; the leading apostrophe prevents spreadsheet formula execution.
  const cell = (s: string) =>
    '"' + (/^[=+\-@\t\r]/.test(s) ? "'" + s : s).replaceAll('"', '""') + '"';
  return [
    [
      "Sailing",
      "Traveler",
      "Drink",
      "Category",
      "Venue",
      "Drink date",
      "Time (UTC)",
      "Menu price (USD)",
      "Covered value (USD)",
      "Notes",
    ]
      .map(cell)
      .join(","),
    ...data.entries.map((e) =>
      [
        data.sailings.find((s) => s.id === e.sailingId)?.name ?? "",
        data.travelers.find((t) => t.id === e.travelerId)?.name ?? "",
        e.name,
        e.category,
        e.venueName,
        e.sailingDate,
        e.time,
        (e.priceCents / 100).toFixed(2),
        (e.coveredCents / 100).toFixed(2),
        e.notes,
      ]
        .map(cell)
        .join(","),
    ),
  ].join("\r\n");
}
/** Creates the small editable example menu used for setup and demos, not verified onboard prices. */
export function shipCatalog(shipId: string) {
  return {
    venues: [
      "Pool Bar",
      "Schooner Bar",
      "Main Dining Room",
      "Café Promenade",
    ].map((name) => ({ id: uid(), shipId, name })),
    drinks: [
      ["Piña Colada", "Cocktail", 1400],
      ["Mojito", "Cocktail", 1400],
      ["Aperol Spritz", "Cocktail", 1400],
      ["Margarita", "Cocktail", 1400],
      ["Draft beer", "Beer", 850],
      ["Glass of wine", "Wine", 1200],
      ["Cappuccino", "Coffee", 450],
      ["Sparkling water", "Water", 350],
      ["Soda", "Soft drink", 350],
    ].map(([name, category, priceCents]) => ({
      id: uid(),
      shipId,
      name: String(name),
      category: category as Drink["category"],
      priceCents: Number(priceCents),
      eligible: true,
      venuePrices: {},
    })),
  };
}
/** Creates a fresh sample sailing and history with randomized IDs, without writing to storage. */
export function demoData(): Data {
  const d = emptyData();
  const now = new Date();
  const start = new Date(now.getTime() - 2 * 86400000)
    .toISOString()
    .slice(0, 10);
  const end = new Date(now.getTime() + 4 * 86400000).toISOString().slice(0, 10);
  const s: Sailing = {
    id: uid(),
    name: "A little Caribbean escape",
    shipId: uid(),
    ship: "Wonder of the Seas",
    start,
    end,
    currency: "USD",
  };
  d.sailings = [s];
  d.activeSailingId = s.id;
  const catalog = shipCatalog(s.shipId);
  d.venues = catalog.venues;
  d.drinks = catalog.drinks;
  d.travelers = [
    {
      id: uid(),
      sailingId: s.id,
      name: "Alex",
      characterId: "skipper",
      color: "#dba18e",
      hasPackage: true,
      dailyCostCents: 6500,
      limitCents: 1400,
    },
    {
      id: uid(),
      sailingId: s.id,
      name: "Sam",
      characterId: "pip",
      color: "#8ab3ad",
      hasPackage: false,
      dailyCostCents: null,
      limitCents: null,
    },
  ];
  for (let i = 0; i < 18; i++) {
    const drink = d.drinks[(i * 7) % d.drinks.length];
    const t = d.travelers[i % 2];
    const v = d.venues[i % 4];
    const time = new Date(
      Date.parse(start) +
        Math.floor(i / 6) * 86400000 +
        (12 + (i % 6)) * 3600000,
    ).toISOString();
    d.entries.push({
      id: uid(),
      sailingId: s.id,
      travelerId: t.id,
      drinkId: drink.id,
      name: drink.name,
      category: drink.category,
      venueId: v.id,
      venueName: v.name,
      sailingDate: time.slice(0, 10),
      time,
      priceCents: drink.priceCents ?? 0,
      coveredCents: t.hasPackage ? (drink.priceCents ?? 0) : 0,
      notes: "",
    });
  }
  return d;
}
