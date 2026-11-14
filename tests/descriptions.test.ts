import { describe, expect, it } from "vitest";
import {
  descriptionForDrink,
  referenceDescription,
} from "../src/drinkDescriptions";
import { catalogForShip, filterDrinks } from "../src/catalog";
import {
  backup,
  dataSchema,
  demoData,
  importBackup,
  type Drink,
} from "../src/model";

function drink(name: string, category: Drink["category"] = "Cocktail"): Drink {
  return {
    id: "drink",
    shipId: "ship",
    name,
    category,
    priceCents: null,
    eligible: true,
    venuePrices: {},
  };
}

describe("drink descriptions and journal compatibility", () => {
  it("matches reviewed identities without guessing recipes for neighboring products", () => {
    expect(descriptionForDrink(drink("Pina Colada"))?.text).toContain(
      "pineapple",
    );
    expect(
      referenceDescription(drink("Chandon Garden Spritz", "Wine"))?.sourceUrl,
    ).toContain("chandon.com");
    for (const name of [
      "Chandon Brut Classic",
      "Chandon Brut",
      "Cuvée, Chandon Garden Spritz",
    ]) {
      expect(descriptionForDrink(drink(name, "Wine"))).toBeUndefined();
    }
    expect(descriptionForDrink(drink("Mystery Piña Colada"))).toBeUndefined();
    expect(
      descriptionForDrink(drink("Lavender Daiquiri", "Mocktail")),
    ).toBeUndefined();
    expect(
      descriptionForDrink(drink("Cappuccino (large)", "Coffee"))?.text,
    ).toContain("Espresso");
    expect(
      descriptionForDrink(drink("Cappuccino", "Cocktail")),
    ).toBeUndefined();
  });

  it("honors custom text and intentional blanks while retaining provenance for an unchanged reference", () => {
    const item = drink("Mojito");
    expect(descriptionForDrink(item)?.sourceUrl).toContain(
      "royalcaribbean.com",
    );
    expect(
      descriptionForDrink({ ...item, description: "My mint cooler" }),
    ).toEqual({ text: "My mint cooler" });
    expect(descriptionForDrink({ ...item, description: "" })).toBeUndefined();
    expect(
      referenceDescription({
        ...item,
        name: "Renamed",
        community: {
          key: "mojito",
          sourceUrl: "https://example.com/menu",
          retrievedAt: "2026-11-14",
          venueNames: [],
          reportedForShip: true,
        },
      })?.text,
    ).toContain("Mint");
  });

  it("searches ingredients and keeps a saved description through catalog resolution and backup restore", () => {
    const data = demoData();
    const item = data.drinks.find((d) => d.name === "Mojito")!;
    expect(
      filterDrinks(data.drinks, "mint").some((d) => d.id === item.id),
    ).toBe(true);
    item.description = "Fresh mint, lime and rum; less sweet.";
    const sailing = data.sailings[0];
    const menu = catalogForShip(
      sailing.ship,
      sailing.shipId,
      data.drinks,
      data.venues,
    );
    expect(menu.drinks.find((d) => d.id === item.id)?.description).toBe(
      item.description,
    );
    const exported = JSON.parse(backup(data));
    expect(exported.version).toBe(5);
    expect(importBackup(JSON.stringify(exported))).toEqual(data);
    item.description = "x".repeat(501);
    expect(dataSchema.safeParse(data).success).toBe(false);
  });

  it("continues reading all four older backup versions without adding description fields", () => {
    const data = demoData();
    for (const version of [1, 2, 3, 4]) {
      expect(
        importBackup(
          JSON.stringify({
            app: "SipAhoy",
            version,
            exportedAt: "2026-11-14",
            data,
          }),
        ),
      ).toEqual(data);
    }
  });
});
