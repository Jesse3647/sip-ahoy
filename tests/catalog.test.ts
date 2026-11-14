import { describe, it, expect } from "vitest";
import {
  catalogForShip,
  catalogDrinkCount,
  drinkPrice,
  filterDrinks,
  normalizeDrinkName,
  recentDrinks,
} from "../src/catalog";
import {
  dataSchema,
  demoData,
  importBackup,
  backup,
  type Drink,
} from "../src/model";
import data from "../src/data/community-catalog.json";
describe("community catalog and fast selection", () => {
  it("provides broad named coverage with real source links and valid references for each supported ship", () => {
    expect(catalogDrinkCount).toBeGreaterThan(650);
    expect(Object.keys(data.shipProfiles)).toHaveLength(30);
    for (const ship of Object.keys(data.shipProfiles)) {
      const d = demoData(),
        s = d.sailings[0];
      s.ship = ship;
      const c = catalogForShip(ship, s.shipId, [], []);
      d.drinks = c.drinks;
      d.venues = c.venues;
      d.entries = [];
      expect(c.drinks.length).toBeGreaterThan(200);
      expect(new Set(c.drinks.map((x) => x.id)).size).toBe(c.drinks.length);
      expect(dataSchema.safeParse(d).success).toBe(true);
      expect(
        c.drinks.every((x) => x.community?.sourceUrl.startsWith("https://")),
      ).toBe(true);
    }
  });
  it("preserves local edits and stable IDs when browsing or updating the library", () => {
    const d = demoData(),
      s = d.sailings[0],
      first = catalogForShip(s.ship, s.shipId, d.drinks, d.venues),
      chosen = first.drinks.find((x) => x.community)!;
    const edited: Drink = {
      ...chosen,
      name: "My renamed favorite",
      priceCents: 1999,
      priceSource: "user",
      venuePrices: {},
    };
    const c = catalogForShip(s.ship, s.shipId, [...d.drinks, edited], d.venues);
    expect(c.drinks.find((x) => x.id === edited.id)).toMatchObject(edited);
    expect(
      c.drinks.filter((x) => x.community?.key === edited.community?.key),
    ).toHaveLength(1);
    expect(
      catalogForShip(s.ship, s.shipId, d.drinks, d.venues).drinks.map(
        (x) => x.id,
      ),
    ).toEqual(first.drinks.map((x) => x.id));
  });
  it("does not assign another ship’s menu to an unsupported ship", () => {
    const c = catalogForShip("Hero of the Seas", "ship", [], []);
    expect(c.hasShipMenu).toBe(false);
    expect(c.drinks).toHaveLength(0);
    const expanded = catalogForShip("Hero of the Seas", "ship", [], [], true);
    expect(expanded.drinks.length).toBeGreaterThan(650);
    expect(expanded.venues.map((v) => v.name)).toEqual(["Other"]);
    expect(
      expanded.drinks.every((d) => d.community?.reportedForShip === false),
    ).toBe(true);
    expect(
      expanded.drinks.every((d) =>
        d.community?.sourceUrl.startsWith("https://"),
      ),
    ).toBe(true);
  });
  it("searches without accent or punctuation sensitivity and filters by category/venue", () => {
    const d = demoData(),
      s = d.sailings[0],
      c = catalogForShip(s.ship, s.shipId, d.drinks, d.venues);
    expect(normalizeDrinkName("Piña Colada®")).toBe("pina colada");
    expect(
      filterDrinks(c.drinks, "PINA colada").some(
        (d) => d.name === "Piña Colada",
      ),
    ).toBe(true);
    expect(
      filterDrinks(c.drinks, "", "Spirit").every(
        (d) => d.category === "Spirit",
      ),
    ).toBe(true);
    expect(filterDrinks(c.drinks, "Schooner").length).toBeGreaterThan(10);
  });
  it("prefers venue prices and leaves missing prices unknown", () => {
    const d = demoData().drinks[0];
    expect(drinkPrice({ ...d, priceCents: null }, "none")).toBeNull();
    expect(drinkPrice({ ...d, venuePrices: { bar: 1777 } }, "bar")).toBe(1777);
  });
  it("ranks deduplicated recent choices by creation time, scoped to the selected traveler", () => {
    const d = demoData(),
      t = d.travelers[0],
      a = d.entries.find((e) => e.travelerId === t.id)!;
    const newer = {
      ...a,
      id: "new",
      time: "2000-01-01T12:00:00.000Z",
      createdAt: "2001-01-01T12:00:00.000Z",
    };
    const recent = recentDrinks([...d.entries, newer], t.id, d.drinks, 6);
    expect(recent[0].id).toBe("new");
    expect(recent.every((e) => e.travelerId === t.id)).toBe(true);
    expect(new Set(recent.map((e) => e.drinkId)).size).toBe(recent.length);
  });
  it("keeps community provenance and new categories through backup restore", () => {
    const d = demoData(),
      s = d.sailings[0],
      c = catalogForShip(s.ship, s.shipId, [], []);
    d.entries = [];
    d.drinks = c.drinks;
    d.venues = c.venues;
    expect(importBackup(backup(d))).toEqual(d);
  });
});

describe("ship venue coverage independent of drink menus", () => {
  it("adds verified Wonder venues without adding them to unrelated ships", () => {
    const wonder = catalogForShip("Wonder of the Seas", "wonder", [], []);
    expect(wonder.venues.filter((v) => v.name === "Bionic Bar")).toHaveLength(
      1,
    );
    expect(wonder.venues.some((v) => v.name === "Solarium Bar")).toBe(true);
    const adventure = catalogForShip(
      "Adventure of the Seas",
      "adventure",
      [],
      [],
      true,
    );
    expect(adventure.venues.some((v) => v.name === "Bionic Bar")).toBe(false);
    expect(adventure.venues.every((v) => v.shipId === "adventure")).toBe(true);
  });
  it("reuses a saved venue ID and preserves custom locations when filling source gaps", () => {
    const saved = { id: "saved-bionic", shipId: "wonder", name: "Bionic Bar" },
      custom = { id: "custom", shipId: "wonder", name: "My location" };
    const c = catalogForShip(
      "Wonder of the Seas",
      "wonder",
      [],
      [saved, custom],
    );
    expect(c.venues.filter((v) => v.name === "Bionic Bar")).toEqual([saved]);
    expect(c.venues).toContainEqual(custom);
    expect(c.venues.find((v) => v.name === "Other")).toBeDefined();
  });
});
