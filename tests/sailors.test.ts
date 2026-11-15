import { describe, it, expect } from "vitest";
import { demoData, dataSchema, removeSailor } from "../src/model";
describe("sailor deletion", () => {
  it("removes only the selected sailor and their logs without mutating the journal", () => {
    const data = demoData();
    const removed = data.travelers[0];
    const other = data.travelers[1];
    const result = removeSailor(data, removed.id);
    expect(result.travelers.map((sailor) => sailor.id)).toEqual([other.id]);
    expect(result.entries).toEqual(
      data.entries.filter((entry) => entry.travelerId === other.id),
    );
    expect(result.drinks).toBe(data.drinks);
    expect(result.venues).toBe(data.venues);
    expect(result.sailings).toBe(data.sailings);
    expect(result.activeSailingId).toBe(data.activeSailingId);
    expect(data.travelers).toHaveLength(2);
    expect(data.entries).toHaveLength(18);
    expect(dataSchema.safeParse(result).success).toBe(true);
  });
  it("supports deleting the final sailor and treats missing IDs as a no-op", () => {
    const data = demoData();
    expect(removeSailor(data, "missing")).toBe(data);
    const result = data.travelers.reduce(
      (next, sailor) => removeSailor(next, sailor.id),
      data,
    );
    expect(result.travelers).toEqual([]);
    expect(result.entries).toEqual([]);
    expect(result.sailings).toEqual(data.sailings);
    expect(result.drinks).toEqual(data.drinks);
    expect(dataSchema.safeParse(result).success).toBe(true);
  });
});
