import { describe, expect, it } from "vitest";
import { dataSchema, demoData, removeSailing, shipCatalog } from "../src/model";

function trips(sharedShip = true) {
  const data = demoData();
  const first = data.sailings[0];
  data.sailings.push({
    ...first,
    id: "second",
    name: "Second trip",
    shipId: sharedShip ? first.shipId : "second-ship",
  });
  if (sharedShip) {
    data.travelers.push({
      ...data.travelers[0],
      id: "second-person",
      sailingId: "second",
    });
    data.entries.push({
      ...data.entries[0],
      id: "second-entry",
      travelerId: "second-person",
      sailingId: "second",
    });
  }
  if (!sharedShip) {
    const catalog = shipCatalog("second-ship");
    data.drinks.push(...catalog.drinks);
    data.venues.push(...catalog.venues);
  }
  return data;
}

describe("saved sailing sessions", () => {
  it("deletes the selected trip and private records while preserving shared menus", () => {
    const data = trips();
    const result = removeSailing(data, data.activeSailingId!);
    expect(result.activeSailingId).toBe("second");
    expect(result.sailings.map((trip) => trip.id)).toEqual(["second"]);
    expect(result.travelers.map((traveler) => traveler.id)).toEqual([
      "second-person",
    ]);
    expect(result.entries.map((entry) => entry.id)).toEqual(["second-entry"]);
    expect(result.drinks).toEqual(data.drinks);
    expect(result.venues).toEqual(data.venues);
    expect(data.entries).toHaveLength(19);
    expect(dataSchema.safeParse(result).success).toBe(true);
  });
  it("deletes an inactive trip without switching or altering the current journal", () => {
    const data = trips(false);
    const result = removeSailing(data, "second");
    expect(result.activeSailingId).toBe(data.activeSailingId);
    expect(result.entries).toEqual(data.entries);
    expect(result.travelers).toEqual(data.travelers);
    expect(result.drinks.some((drink) => drink.shipId === "second-ship")).toBe(
      false,
    );
    expect(result.venues.some((venue) => venue.shipId === "second-ship")).toBe(
      false,
    );
    expect(dataSchema.safeParse(result).success).toBe(true);
  });
  it("removes unused ship catalogs while keeping another ship's records", () => {
    const data = trips(false);
    const result = removeSailing(data, data.activeSailingId!);
    expect(result.drinks.every((drink) => drink.shipId === "second-ship")).toBe(
      true,
    );
    expect(result.venues.every((venue) => venue.shipId === "second-ship")).toBe(
      true,
    );
    expect(dataSchema.safeParse(result).success).toBe(true);
  });
  it("returns to a clean start after deleting the final trip and ignores unknown IDs", () => {
    const data = demoData();
    expect(removeSailing(data, "missing")).toBe(data);
    const result = removeSailing(data, data.activeSailingId!);
    expect(result).toEqual({
      sailings: [],
      travelers: [],
      entries: [],
      drinks: [],
      venues: [],
      activeSailingId: null,
    });
    expect(dataSchema.safeParse(result).success).toBe(true);
  });
});
