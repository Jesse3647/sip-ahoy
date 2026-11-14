import { describe, expect, it } from "vitest";
import { characterFor, characterIds, sailorReaction } from "../src/characters";
import {
  backup,
  dataSchema,
  demoData,
  importBackup,
  type Entry,
} from "../src/model";

describe("sailor characters and cosmetic daily reactions", () => {
  it("counts only this sailor, sailing, and selected day", () => {
    const data = demoData(),
      sailor = data.travelers[0],
      day = data.sailings[0].start;
    const base = {
      ...data.entries[0],
      travelerId: sailor.id,
      sailingId: sailor.sailingId,
      sailingDate: day,
      category: "Cocktail" as const,
    };
    expect(sailorReaction(sailor, [], day).mood).toBe("ready");
    expect(sailorReaction(sailor, [base], day)).toEqual({
      mood: "cheerful",
      total: 1,
      alcohol: 1,
    });
    const mixed = [
      base,
      { ...base, travelerId: "someone-else" },
      { ...base, sailingId: "another-trip" },
      { ...base, sailingDate: "1999-01-01" },
    ];
    expect(sailorReaction(sailor, mixed, day)).toEqual({
      mood: "cheerful",
      total: 1,
      alcohol: 1,
    });
  });
  it("changes expressions at cosmetic thresholds and never treats nonalcoholic categories as alcohol", () => {
    const data = demoData(),
      sailor = data.travelers[0],
      day = data.sailings[0].start;
    const entry = {
      ...data.entries[0],
      travelerId: sailor.id,
      sailingId: sailor.sailingId,
      sailingDate: day,
    };
    const alcohol = ["Cocktail", "Beer", "Wine", "Spirit", "Cocktail"].map(
      (category, i) => ({
        ...entry,
        id: String(i),
        category: category as Entry["category"],
      }),
    );
    expect(sailorReaction(sailor, alcohol.slice(0, 2), day).mood).toBe(
      "cheerful",
    );
    expect(sailorReaction(sailor, alcohol.slice(0, 3), day).mood).toBe("merry");
    expect(sailorReaction(sailor, alcohol.slice(0, 4), day).mood).toBe("merry");
    expect(sailorReaction(sailor, alcohol, day).mood).toBe("water");
    const nonAlcohol = [
      "Coffee",
      "Water",
      "Mocktail",
      "Soft drink",
      "Tea",
      "Juice",
      "Smoothie",
      "Other",
    ].map((category) => ({
      ...entry,
      category: category as Entry["category"],
    }));
    expect(sailorReaction(sailor, nonAlcohol, day)).toEqual({
      mood: "cheerful",
      total: 8,
      alcohol: 0,
    });
    expect(sailorReaction(sailor, [...alcohol, ...nonAlcohol], day).mood).toBe(
      "water",
    );
    // Removing or editing a log recalculates immediately; no cached mood or lifetime counter.
    expect(sailorReaction(sailor, alcohol.slice(0, 2), day).mood).toBe(
      "cheerful",
    );
    expect(sailorReaction(sailor, alcohol, "1999-01-01").mood).toBe("ready");
  });
  it("preserves every assignment in version-six backups and accepts earlier journals", () => {
    for (const characterId of characterIds) {
      const data = demoData();
      data.travelers[0].characterId = characterId;
      const text = backup(data);
      expect(JSON.parse(text).version).toBe(6);
      expect(importBackup(text).travelers[0].characterId).toBe(characterId);
    }
    const old = demoData();
    old.travelers.forEach((t) => delete t.characterId);
    for (const version of [1, 2, 3, 4, 5]) {
      const restored = importBackup(
        JSON.stringify({ app: "SipAhoy", version, exportedAt: "", data: old }),
      );
      expect(restored.travelers[0].characterId).toBeUndefined();
      expect(characterFor(restored.travelers[0])).toBe(
        characterFor(old.travelers[0]),
      );
    }
    expect(characterIds).toContain(characterFor(old.travelers[0]));
    expect(old.travelers[0].characterId).toBeUndefined();
  });
  it("rejects unknown character IDs instead of silently losing an assignment", () => {
    const data = demoData();
    const invalid = {
      ...data,
      travelers: data.travelers.map((t) => ({ ...t, characterId: "unknown" })),
    };
    expect(dataSchema.safeParse(invalid).success).toBe(false);
  });
});
