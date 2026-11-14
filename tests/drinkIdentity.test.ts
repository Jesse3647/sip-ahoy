import { describe, it, expect } from "vitest";
import { drinkIdentity, drinkKey } from "../src/drinkIdentity";
import { catalogForShip, filterDrinks, recentDrinks } from "../src/catalog";
import { demoData, backup, importBackup, type Drink } from "../src/model";
describe("duplicate drink identity", () => {
  it("collapses punctuation, wine word order, and fully specified Chandon labels", () => {
    for (const names of [
      [
        'Brut, Chandon "Classic"',
        "Chandon Brut Classic",
        "Chandon, Brut, Classic",
      ],
      [
        '"Garden Spritz," Chandon',
        "Chandon Garden Spritz",
        'Chandon, "Garden Spritz"',
      ],
      ["Moët & Chandon Brut Impérial", "Moët & Chandon Impérial Brut"],
      [
        "Moët & Chandon Rosé Impérial",
        "Moët & Chandon Impérial Rosé Brut",
        'Brut Rosé, Moët & Chandon "Impérial"',
      ],
      ["Cabernet Sauvignon, Caymus", "Caymus, Cabernet Sauvignon"],
    ])
      expect(new Set(names.map((n) => drinkIdentity(n, "Wine"))).size).toBe(1);
  });
  it("preserves different producers, wines, vintages, reserve labels and serving sizes", () => {
    const names = [
      "Chandon Brut Classic",
      "Chandon Garden Spritz",
      "Moët & Chandon Impérial Brut",
      "Moët & Chandon Impérial Brut Rosé",
      "Moët & Chandon Ice Impérial",
      "Chandon Brut Classic (glass)",
      "Chandon Brut Classic (bottle)",
      "Chandon Brut Classic 2018",
      "Chandon Brut Classic 2019",
      "Caymus Cabernet Sauvignon",
      "Caymus Cabernet Sauvignon Special Selection",
      "Café Latte (small)",
      "Café Latte (large)",
    ];
    expect(new Set(names.map((n) => drinkIdentity(n, "Wine"))).size).toBe(
      names.length,
    );
  });
  it("shows one result for each Chandon product and keeps original aliases searchable", () => {
    const c = catalogForShip("Wonder of the Seas", "ship", [], [], true),
      hits = filterDrinks(c.drinks, "Chandon");
    expect(hits.map((d) => d.name).sort()).toEqual(
      [
        "Chandon Brut",
        "Chandon Brut Classic",
        'Cuvée, Chandon "Garden Spritz"',
        "Chandon Garden Spritz",
        "Moët & Chandon Brut",
        "Moët & Chandon Brut Rosé",
        "Moët & Chandon Impérial Brut",
        "Moët & Chandon Impérial Brut Rosé",
        "Moët & Chandon Ice Impérial",
      ].sort(),
    );
    expect(filterDrinks(c.drinks, "cuvee chandon")).toHaveLength(1);
  });
  it("keeps Garden Spritz and Brut Classic separate and refuses unverified abbreviated aliases", () => {
    expect(drinkIdentity("Chandon Garden Spritz", "Wine")).not.toBe(
      drinkIdentity("Chandon Brut Classic", "Wine"),
    );
    expect(drinkIdentity("Chandon Brut", "Wine")).not.toBe(
      drinkIdentity("Chandon Brut Classic", "Wine"),
    );
    expect(drinkIdentity("Moët & Chandon Brut", "Wine")).not.toBe(
      drinkIdentity("Moët & Chandon Brut Impérial", "Wine"),
    );
    expect(drinkIdentity("Moët & Chandon Brut Rosé", "Wine")).not.toBe(
      drinkIdentity("Moët & Chandon Brut Impérial Rosé", "Wine"),
    );
    expect(drinkIdentity('Cuvée, Chandon "Garden Spritz"', "Wine")).not.toBe(
      drinkIdentity("Chandon Garden Spritz", "Wine"),
    );
  });
  it("hides duplicate saved menu entries without deleting historical records or overriding an edited price", () => {
    const d = demoData(),
      s = d.sailings[0];
    const first: Drink = {
        ...d.drinks[0],
        name: 'Brut, Chandon "Classic"',
        category: "Wine",
      },
      edited: Drink = {
        ...first,
        id: "edited",
        name: "Chandon Brut Classic",
        priceCents: 1500,
        priceSource: "user",
      };
    d.drinks = [first, edited];
    d.entries = d.entries.slice(0, 1).map((e) => ({
      ...e,
      drinkId: first.id,
      name: first.name,
      category: first.category,
    }));
    const c = catalogForShip(s.ship, s.shipId, d.drinks, d.venues);
    const hits = filterDrinks(c.drinks, "Chandon").filter(
      (x) => drinkKey(x) === drinkIdentity(first.name, "Wine"),
    );
    expect(hits).toHaveLength(1);
    expect(hits[0].priceCents).toBe(1500);
    expect(c.drinks.some((x) => x.id === first.id)).toBe(true);
    expect(importBackup(backup(d))).toEqual(d);
    const shortcut = recentDrinks(
      d.entries,
      d.entries[0].travelerId,
      c.drinks,
    )[0];
    expect(shortcut.drinkId).toBe(edited.id);
    expect(d.entries[0].drinkId).toBe(first.id);
    const recent = recentDrinks(
      [
        ...d.entries,
        {
          ...d.entries[0],
          id: "second",
          drinkId: edited.id,
          name: edited.name,
          createdAt: "2030-01-01T00:00:00.000Z",
        },
      ],
      d.entries[0].travelerId,
      c.drinks,
    );
    expect(recent).toHaveLength(1);
    expect(recent[0].drinkId).toBe(edited.id);
  });
});
